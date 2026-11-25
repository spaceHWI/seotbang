-- 서트방 미션 빙고 — Supabase 초기 설정
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run 한 번.
-- 비밀번호는 이 파일에 적지 않는다. 운영진 비밀번호는 사이트의 운영진 화면에서 처음 한 번 정한다.

create extension if not exists pgcrypto with schema extensions;

-- 1) 표 --------------------------------------------------------------
create table if not exists public.bingo_players (
  id uuid primary key default gen_random_uuid(),
  nickname text not null unique check (char_length(nickname) between 1 and 12),
  pass_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bingo_submissions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.bingo_players(id) on delete cascade,
  cell smallint not null check (cell between 0 and 24),
  photo_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reject_reason text check (char_length(reject_reason) <= 200),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (player_id, cell)
);

create table if not exists public.bingo_settings (
  key text primary key,
  value text not null
);

-- 로그인 토큰(해시만 저장). player_id 가 비어 있으면 운영진 세션.
create table if not exists public.bingo_sessions (
  token_hash text primary key,
  player_id uuid references public.bingo_players(id) on delete cascade,
  expires_at timestamptz not null
);

-- 비밀번호 시도 기록(시도 횟수 제한용)
create table if not exists public.bingo_attempts (
  id bigint generated always as identity primary key,
  kind text not null,
  subject text not null,
  at timestamptz not null default now()
);
create index if not exists bingo_attempts_lookup on public.bingo_attempts (kind, subject, at);

alter table public.bingo_players enable row level security;
alter table public.bingo_submissions enable row level security;
alter table public.bingo_settings enable row level security;
alter table public.bingo_sessions enable row level security;
alter table public.bingo_attempts enable row level security;

-- 누구나 읽기만 가능. 비밀번호 해시 열은 읽기 권한에서 뺌. 쓰기는 아래 함수로만.
revoke all on public.bingo_players, public.bingo_submissions, public.bingo_settings,
              public.bingo_sessions, public.bingo_attempts from anon, authenticated;
grant select (id, nickname, created_at) on public.bingo_players to anon, authenticated;
grant select on public.bingo_submissions to anon, authenticated;

drop policy if exists "bingo players read" on public.bingo_players;
create policy "bingo players read" on public.bingo_players for select using (true);
drop policy if exists "bingo submissions read" on public.bingo_submissions;
create policy "bingo submissions read" on public.bingo_submissions for select using (true);

-- 2) 내부 함수 (외부 호출 불가) ---------------------------------------
create or replace function public.bingo__ip()
returns text language sql stable set search_path = public as $$
  select coalesce(nullif(btrim(split_part(
    nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ',', 1)), ''), 'unknown');
$$;

create or replace function public.bingo__too_many(p_kind text, p_subject text, p_max int, p_minutes int)
returns boolean language sql security definer set search_path = public as $$
  select count(*) >= p_max from bingo_attempts
  where kind = p_kind and subject = p_subject and at > now() - make_interval(mins => p_minutes);
$$;

create or replace function public.bingo__note(p_kind text, p_subject text)
returns void language sql security definer set search_path = public as $$
  delete from bingo_attempts where at < now() - interval '1 day';
  insert into bingo_attempts (kind, subject) values (p_kind, p_subject);
$$;

create or replace function public.bingo__hash(p_token text)
returns text language sql immutable set search_path = public, extensions as $$
  select encode(digest(p_token, 'sha256'), 'hex');
$$;

create or replace function public.bingo__new_session(p_player uuid, p_ttl interval)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_token text := encode(gen_random_bytes(32), 'hex');
begin
  delete from bingo_sessions where expires_at < now();
  insert into bingo_sessions (token_hash, player_id, expires_at)
  values (bingo__hash(v_token), p_player, now() + p_ttl);
  return v_token;
end $$;

create or replace function public.bingo__player(p_token text)
returns uuid language sql security definer set search_path = public, extensions as $$
  select player_id from bingo_sessions
  where token_hash = bingo__hash(p_token) and player_id is not null and expires_at > now();
$$;

create or replace function public.bingo__is_admin(p_token text)
returns boolean language sql security definer set search_path = public, extensions as $$
  select exists (select 1 from bingo_sessions
    where token_hash = bingo__hash(p_token) and player_id is null and expires_at > now());
$$;

revoke execute on function
  public.bingo__ip(),
  public.bingo__too_many(text, text, int, int),
  public.bingo__note(text, text),
  public.bingo__hash(text),
  public.bingo__new_session(uuid, interval),
  public.bingo__player(text),
  public.bingo__is_admin(text)
from public, anon, authenticated;

-- 3) 참가자용 함수 ----------------------------------------------------
-- 연락처는 공개 읽기 권한에 넣지 않는다(거래가 성사된 상대에게만 함수로 보여 줌).
alter table public.bingo_players add column if not exists contact text check (contact is null or char_length(contact) between 9 and 20);

create or replace function public.bingo__contact(p_contact text)
returns text language plpgsql immutable set search_path = public as $$
declare v text := btrim(coalesce(p_contact, ''));
begin
  if v = '' then return null; end if;
  if v !~ '^[0-9+ -]{9,20}$' or char_length(regexp_replace(v, '[^0-9]', '', 'g')) < 9 then
    raise exception '연락처를 다시 확인해 주세요. 예: 010-1234-5678';
  end if;
  return v;
end $$;
revoke execute on function public.bingo__contact(text) from public, anon, authenticated;

drop function if exists public.bingo_join(text, text);
create or replace function public.bingo_join(p_nickname text, p_pass text, p_contact text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_nick text := btrim(p_nickname); v_contact text := bingo__contact(p_contact);
begin
  if char_length(v_nick) < 1 or char_length(v_nick) > 12 then
    raise exception '닉네임은 1~12자로 정해 주세요.';
  end if;
  if char_length(p_pass) < 4 or char_length(p_pass) > 72 then
    raise exception '비밀번호는 4자 이상으로 정해 주세요.';
  end if;
  if bingo__too_many('join', bingo__ip(), 40, 60) then
    raise exception '잠시 뒤에 다시 해 주세요.';
  end if;
  if exists (select 1 from bingo_players where nickname = v_nick) then
    raise exception '이미 있는 닉네임이에요. 본인이면 "이어서 하기"로 들어오세요.';
  end if;
  insert into bingo_players (nickname, pass_hash, contact)
  values (v_nick, crypt(p_pass, gen_salt('bf', 10)), v_contact)
  returning id into v_id;
  perform bingo__note('join', bingo__ip());
  return json_build_object('id', v_id, 'token', bingo__new_session(v_id, interval '60 days'));
end $$;

-- 틀리면 null 을 돌려준다(시도 기록을 남기기 위해 예외를 던지지 않음)
create or replace function public.bingo_login(p_nickname text, p_pass text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_key text := btrim(p_nickname) || '|' || bingo__ip();
begin
  if bingo__too_many('login', v_key, 8, 15) then
    raise exception '여러 번 틀렸어요. 15분 뒤에 다시 해 주세요.';
  end if;
  select id into v_id from bingo_players
  where nickname = btrim(p_nickname) and pass_hash = crypt(p_pass, pass_hash);
  if v_id is null then
    perform bingo__note('login', v_key);
    return null;
  end if;
  return json_build_object('id', v_id, 'token', bingo__new_session(v_id, interval '60 days'));
end $$;

create or replace function public.bingo_my_contact(p_token text)
returns text language sql security definer set search_path = public, extensions as $$
  select contact from bingo_players where id = bingo__player(p_token);
$$;

create or replace function public.bingo_set_contact(p_token text, p_contact text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_player uuid := bingo__player(p_token); v_contact text := bingo__contact(p_contact);
begin
  if v_player is null then raise exception '로그인이 풀렸어요. 다시 들어와 주세요.'; end if;
  if v_contact is null then raise exception '연락처를 적어 주세요.'; end if;
  update bingo_players set contact = v_contact where id = v_player;
end $$;

create or replace function public.bingo_logout(p_token text)
returns void language sql security definer set search_path = public, extensions as $$
  delete from bingo_sessions where token_hash = bingo__hash(p_token);
$$;

create or replace function public.bingo_submit(p_token text, p_cell int, p_path text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_player uuid := bingo__player(p_token);
begin
  if v_player is null then raise exception '로그인이 풀렸어요. 다시 들어와 주세요.'; end if;
  if p_cell < 0 or p_cell > 24 then raise exception '없는 칸이에요.'; end if;
  if p_path !~ ('^' || v_player::text || '/[0-9]{1,2}-[0-9]{10,16}\.jpg$') then
    raise exception '사진 경로가 맞지 않아요.';
  end if;
  if exists (select 1 from bingo_submissions
             where player_id = v_player and cell = p_cell and status = 'approved') then
    raise exception '이미 승인된 칸이에요.';
  end if;
  insert into bingo_submissions (player_id, cell, photo_path)
  values (v_player, p_cell, p_path)
  on conflict (player_id, cell) do update
    set photo_path = excluded.photo_path, status = 'pending',
        reject_reason = null, created_at = now(), reviewed_at = null;
end $$;

create or replace function public.bingo_cancel(p_token text, p_cell int)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_player uuid := bingo__player(p_token);
begin
  if v_player is null then raise exception '로그인이 풀렸어요. 다시 들어와 주세요.'; end if;
  delete from bingo_submissions
  where player_id = v_player and cell = p_cell and status <> 'approved';
end $$;

-- 4) 운영진용 함수 ----------------------------------------------------
create or replace function public.bingo_admin_is_set()
returns boolean language sql security definer set search_path = public, extensions as $$
  select exists (select 1 from bingo_settings where key = 'admin_hash');
$$;

-- 운영진 비밀번호는 맨 처음 한 번만 정할 수 있음. 정하면 바로 운영진 세션 토큰을 돌려줌.
create or replace function public.bingo_admin_init(p_pass text)
returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  if char_length(p_pass) < 10 or char_length(p_pass) > 72 then
    raise exception '운영진 비밀번호는 10자 이상으로 정해 주세요.';
  end if;
  if exists (select 1 from bingo_settings where key = 'admin_hash') then
    raise exception '운영진 비밀번호가 이미 정해져 있어요.';
  end if;
  insert into bingo_settings (key, value) values ('admin_hash', crypt(p_pass, gen_salt('bf', 12)));
  return bingo__new_session(null, interval '12 hours');
end $$;

-- 틀리면 null. 같은 접속 주소에서 15분에 5번 틀리면 잠김.
create or replace function public.bingo_admin_login(p_pass text)
returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  if bingo__too_many('admin', bingo__ip(), 5, 15) then
    raise exception '여러 번 틀렸어요. 15분 뒤에 다시 해 주세요.';
  end if;
  if not exists (select 1 from bingo_settings
                 where key = 'admin_hash' and value = crypt(p_pass, value)) then
    perform bingo__note('admin', bingo__ip());
    return null;
  end if;
  return bingo__new_session(null, interval '12 hours');
end $$;

create or replace function public.bingo_admin_check(p_token text)
returns boolean language sql security definer set search_path = public, extensions as $$
  select bingo__is_admin(p_token);
$$;

-- 가입자 삭제·초기화: 운영진 로그인(토큰)에 더해 운영진 비밀번호를 한 번 더 확인한다.
-- 돌려주는 값: 'ok' 또는 'bad_pass'(비밀번호 틀림. 시도 기록을 남기려고 예외를 던지지 않음)
create or replace function public.bingo__admin_recheck(p_token text, p_pass text)
returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  if not bingo__is_admin(p_token) then raise exception '운영진 로그인이 풀렸어요. 다시 들어와 주세요.'; end if;
  if bingo__too_many('admin', bingo__ip(), 5, 15) then
    raise exception '여러 번 틀렸어요. 15분 뒤에 다시 해 주세요.';
  end if;
  if not exists (select 1 from bingo_settings where key = 'admin_hash' and value = crypt(p_pass, value)) then
    perform bingo__note('admin', bingo__ip());
    return 'bad_pass';
  end if;
  return 'ok';
end $$;
revoke execute on function public.bingo__admin_recheck(text, text) from public, anon, authenticated;

create or replace function public.bingo_admin_delete_player(p_token text, p_pass text, p_player uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v text := bingo__admin_recheck(p_token, p_pass);
begin
  if v <> 'ok' then return v; end if;
  delete from bingo_players where id = p_player;
  if not found then raise exception '없는 가입자예요.'; end if;
  return 'ok';
end $$;

-- p_scope: 'bingo' 인증샷 전체, 'dugeun' 두근 물건 전체, 'all' 가입자까지 전부
create or replace function public.bingo_admin_reset(p_token text, p_pass text, p_scope text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v text;
begin
  if p_scope not in ('bingo', 'dugeun', 'all') then raise exception '없는 초기화 범위예요.'; end if;
  v := bingo__admin_recheck(p_token, p_pass);
  if v <> 'ok' then return v; end if;
  if p_scope = 'bingo' then
    delete from bingo_submissions where true;
  elsif p_scope = 'dugeun' then
    delete from bingo_items where true;
  else
    delete from bingo_players where true;
    delete from bingo_attempts where kind <> 'admin';
  end if;
  return 'ok';
end $$;

create or replace function public.bingo_review(p_token text, p_submission uuid, p_status text, p_reason text default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not bingo__is_admin(p_token) then raise exception '운영진 로그인이 풀렸어요. 다시 들어와 주세요.'; end if;
  if p_status not in ('pending','approved','rejected') then raise exception '없는 상태예요.'; end if;
  update bingo_submissions
  set status = p_status,
      reject_reason = case when p_status = 'rejected'
                           then left(nullif(btrim(coalesce(p_reason, '')), ''), 200) end,
      reviewed_at = case when p_status = 'pending' then null else now() end
  where id = p_submission;
end $$;

grant execute on function
  public.bingo_join(text, text, text),
  public.bingo_my_contact(text),
  public.bingo_set_contact(text, text),
  public.bingo_login(text, text),
  public.bingo_logout(text),
  public.bingo_submit(text, int, text),
  public.bingo_cancel(text, int),
  public.bingo_admin_is_set(),
  public.bingo_admin_init(text),
  public.bingo_admin_login(text),
  public.bingo_admin_check(text),
  public.bingo_admin_delete_player(text, text, uuid),
  public.bingo_admin_reset(text, text, text),
  public.bingo_review(text, uuid, text, text)
to anon, authenticated;

-- 5) 인증샷 저장소 (공개 읽기, 5MB 이하 JPEG만, 덮어쓰기·삭제 불가) --------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bingo-proofs', 'bingo-proofs', true, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 로그인한 참가자만, 자기 폴더에만, 정해진 파일 이름으로, 한 사람당 120장까지 올릴 수 있음.
-- 로그인 토큰은 올리기 요청의 x-bingo-token 헤더로 받는다.
create or replace function public.bingo_upload_ok(p_name text)
returns boolean language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_token text := nullif(current_setting('request.headers', true), '')::json ->> 'x-bingo-token';
  v_player uuid;
begin
  if v_token is null then return false; end if;
  v_player := bingo__player(v_token);
  if v_player is null then return false; end if;
  if p_name !~ ('^' || v_player::text || '/[0-9]{1,2}-[0-9]{10,16}\.jpg$') then return false; end if;
  return (select count(*) from storage.objects
          where bucket_id = 'bingo-proofs' and name like v_player::text || '/%') < 120;
end $$;
grant execute on function public.bingo_upload_ok(text) to anon, authenticated;

drop policy if exists "bingo proofs upload" on storage.objects;
create policy "bingo proofs upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'bingo-proofs' and public.bingo_upload_ok(name));

-- 6) 두근 (장터) -------------------------------------------------------
create table if not exists public.bingo_items (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.bingo_players(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  category text not null check (category in ('운동화','운동복','가방·조끼','장비·용품','시계·전자기기','보급·영양','기타')),
  description text not null default '' check (char_length(description) <= 500),
  price integer not null check (price between 0 and 100000000),
  pickup text not null check (char_length(pickup) between 1 and 60),
  photo_path text not null,
  status text not null default 'open' check (status in ('open','reserved','done')),
  created_at timestamptz not null default now()
);

create table if not exists public.bingo_item_queue (
  item_id uuid not null references public.bingo_items(id) on delete cascade,
  player_id uuid not null references public.bingo_players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, player_id)
);

-- 카테고리 이름 변경(신발→운동화, 의류→운동복, 장비→장비·용품): 이미 있는 표와 물건에도 반영
alter table public.bingo_items drop constraint if exists bingo_items_category_check;
update public.bingo_items set category = case category when '신발' then '운동화' when '의류' then '운동복' when '장비' then '장비·용품' else category end
where category in ('신발', '의류', '장비');
alter table public.bingo_items add constraint bingo_items_category_check check (category in ('운동화','운동복','가방·조끼','장비·용품','시계·전자기기','보급·영양','기타'));

alter table public.bingo_items enable row level security;
alter table public.bingo_item_queue enable row level security;
revoke all on public.bingo_items, public.bingo_item_queue from anon, authenticated;
grant select on public.bingo_items, public.bingo_item_queue to anon, authenticated;

drop policy if exists "bingo items read" on public.bingo_items;
create policy "bingo items read" on public.bingo_items for select using (true);
drop policy if exists "bingo item queue read" on public.bingo_item_queue;
create policy "bingo item queue read" on public.bingo_item_queue for select using (true);

-- 파는 방식: queue 줄 세우기(먼저 선 순서) / auction 경매(시작 가격 이상으로 부른 가격)
alter table public.bingo_items add column if not exists mode text not null default 'queue' check (mode in ('queue', 'auction'));
drop function if exists public.bingo_item_post(text, text, text, text, int, text, text);
create or replace function public.bingo_item_post(
  p_token text, p_title text, p_category text, p_description text, p_price int, p_pickup text, p_path text, p_mode text default 'queue')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_player uuid := bingo__player(p_token); v_id uuid;
begin
  if v_player is null then raise exception '로그인이 풀렸어요. 다시 들어와 주세요.'; end if;
  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 40 then raise exception '물건 이름은 1~40자로 적어 주세요.'; end if;
  if p_category not in ('운동화','운동복','가방·조끼','장비·용품','시계·전자기기','보급·영양','기타') then raise exception '카테고리를 골라 주세요.'; end if;
  if coalesce(p_mode, 'queue') not in ('queue', 'auction') then raise exception '파는 방식을 골라 주세요.'; end if;
  if char_length(coalesce(p_description, '')) > 500 then raise exception '설명은 500자까지 적을 수 있어요.'; end if;
  if p_price is null or p_price < 0 then raise exception '가격을 다시 확인해 주세요.'; end if;
  if p_price > 100000000 then raise exception '가격은 1억 원까지 적을 수 있어요.'; end if;
  if char_length(btrim(coalesce(p_pickup, ''))) not between 1 and 60 then raise exception '수령처는 1~60자로 적어 주세요.'; end if;
  if p_path !~ ('^' || v_player::text || '/90-[0-9]{10,16}\.jpg$') then raise exception '사진 경로가 맞지 않아요.'; end if;
  if (select count(*) from bingo_items where player_id = v_player and status <> 'done') >= 20 then
    raise exception '거래 중인 물건은 20개까지 올릴 수 있어요.';
  end if;
  insert into bingo_items (player_id, title, category, description, price, pickup, photo_path, mode)
  values (v_player, btrim(p_title), p_category, btrim(coalesce(p_description, '')), p_price, btrim(p_pickup), p_path, coalesce(p_mode, 'queue'))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.bingo_item_status(p_token text, p_item uuid, p_status text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_player uuid := bingo__player(p_token);
begin
  if v_player is null then raise exception '로그인이 풀렸어요. 다시 들어와 주세요.'; end if;
  if p_status not in ('open','reserved','done') then raise exception '없는 상태예요.'; end if;
  update bingo_items set status = p_status,
         buyer_id = case when p_status = 'done' then buyer_id else null end
  where id = p_item and player_id = v_player;
  if not found then raise exception '내가 올린 물건만 바꿀 수 있어요.'; end if;
end $$;

-- 올린 사람이 줄 선 사람 가운데 한 명을 골라 판매 완료로 바꿈
alter table public.bingo_items add column if not exists buyer_id uuid references public.bingo_players(id) on delete set null;
create or replace function public.bingo_item_sell(p_token text, p_item uuid, p_buyer uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_player uuid := bingo__player(p_token);
begin
  if v_player is null then raise exception '로그인이 풀렸어요. 다시 들어와 주세요.'; end if;
  if not exists (select 1 from bingo_items where id = p_item and player_id = v_player) then
    raise exception '내가 올린 물건만 바꿀 수 있어요.';
  end if;
  if not exists (select 1 from bingo_item_queue where item_id = p_item and player_id = p_buyer) then
    raise exception '줄 선 사람 가운데에서 골라 주세요.';
  end if;
  update bingo_items set status = 'done', buyer_id = p_buyer where id = p_item;
end $$;

-- 판매 완료된 물건에서, 올린 사람은 구매자 연락처를, 구매자는 올린 사람 연락처를 본다. 그 밖에는 null.
create or replace function public.bingo_item_contact(p_token text, p_item uuid)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_player uuid := bingo__player(p_token); v_owner uuid; v_buyer uuid; v_status text; v_other uuid;
begin
  if v_player is null then return null; end if;
  select player_id, buyer_id, status into v_owner, v_buyer, v_status from bingo_items where id = p_item;
  if v_status is distinct from 'done' or v_buyer is null then return null; end if;
  if v_player = v_owner then v_other := v_buyer;
  elsif v_player = v_buyer then v_other := v_owner;
  else return null; end if;
  return (select json_build_object('nickname', nickname, 'contact', contact) from bingo_players where id = v_other);
end $$;

-- 올린 사람 또는 운영진이 지울 수 있음
create or replace function public.bingo_item_delete(p_token text, p_item uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_player uuid := bingo__player(p_token);
begin
  if bingo__is_admin(p_token) then
    delete from bingo_items where id = p_item;
    return;
  end if;
  if v_player is null then raise exception '로그인이 풀렸어요. 다시 들어와 주세요.'; end if;
  delete from bingo_items where id = p_item and player_id = v_player;
  if not found then raise exception '내가 올린 물건만 지울 수 있어요.'; end if;
end $$;

-- 줄 서기. p_offer 는 말풍선에 적는 제시 가격(없어도 됨). 이미 줄에 있으면 가격만 바뀌고 순서는 그대로.
alter table public.bingo_item_queue add column if not exists offer integer check (offer is null or offer between 0 and 100000000);
drop function if exists public.bingo_item_queue_join(text, uuid);
create or replace function public.bingo_item_queue_join(p_token text, p_item uuid, p_offer int default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_player uuid := bingo__player(p_token); v_owner uuid; v_status text; v_mode text; v_price int;
begin
  if v_player is null then raise exception '로그인이 풀렸어요. 다시 들어와 주세요.'; end if;
  select player_id, status, mode, price into v_owner, v_status, v_mode, v_price from bingo_items where id = p_item;
  if v_owner is null then raise exception '없는 물건이에요.'; end if;
  if v_owner = v_player then raise exception '내가 올린 물건에는 줄을 설 수 없어요.'; end if;
  if v_status = 'done' then raise exception '거래가 끝난 물건이에요.'; end if;
  if p_offer is not null and p_offer < 0 then raise exception '가격을 다시 확인해 주세요.'; end if;
  if p_offer is not null and p_offer > 100000000 then raise exception '가격은 1억 원까지 부를 수 있어요.'; end if;
  if v_mode = 'auction' then
    if p_offer is null then raise exception '부를 가격을 적어 주세요.'; end if;
    if p_offer < v_price then raise exception '시작 가격 이상으로 불러 주세요.'; end if;
  else
    p_offer := null;
  end if;
  if not exists (select 1 from bingo_item_queue where item_id = p_item and player_id = v_player)
     and (select count(*) from bingo_item_queue where item_id = p_item) >= 30 then raise exception '줄이 꽉 찼어요.'; end if;
  insert into bingo_item_queue (item_id, player_id, offer) values (p_item, v_player, p_offer)
  on conflict (item_id, player_id) do update set offer = excluded.offer;
end $$;

create or replace function public.bingo_item_queue_leave(p_token text, p_item uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_player uuid := bingo__player(p_token);
begin
  if v_player is null then raise exception '로그인이 풀렸어요. 다시 들어와 주세요.'; end if;
  delete from bingo_item_queue where item_id = p_item and player_id = v_player;
end $$;

grant execute on function
  public.bingo_item_post(text, text, text, text, int, text, text, text),
  public.bingo_item_status(text, uuid, text),
  public.bingo_item_sell(text, uuid, uuid),
  public.bingo_item_contact(text, uuid),
  public.bingo_item_delete(text, uuid),
  public.bingo_item_queue_join(text, uuid, int),
  public.bingo_item_queue_leave(text, uuid)
to anon, authenticated;
