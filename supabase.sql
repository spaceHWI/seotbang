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
create or replace function public.bingo_join(p_nickname text, p_pass text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_nick text := btrim(p_nickname);
begin
  if char_length(v_nick) < 1 or char_length(v_nick) > 12 then
    raise exception '닉네임은 1~12자로 정해 주세요.';
  end if;
  if char_length(p_pass) < 4 or char_length(p_pass) > 72 then
    raise exception '비밀번호는 4자 이상으로 정해 주세요.';
  end if;
  if bingo__too_many('join', bingo__ip(), 10, 60) then
    raise exception '잠시 뒤에 다시 해 주세요.';
  end if;
  if exists (select 1 from bingo_players where nickname = v_nick) then
    raise exception '이미 있는 닉네임이에요. 본인이면 "이어서 하기"로 들어오세요.';
  end if;
  insert into bingo_players (nickname, pass_hash)
  values (v_nick, crypt(p_pass, gen_salt('bf', 10)))
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
  public.bingo_join(text, text),
  public.bingo_login(text, text),
  public.bingo_logout(text),
  public.bingo_submit(text, int, text),
  public.bingo_cancel(text, int),
  public.bingo_admin_is_set(),
  public.bingo_admin_init(text),
  public.bingo_admin_login(text),
  public.bingo_admin_check(text),
  public.bingo_review(text, uuid, text, text)
to anon, authenticated;

-- 5) 인증샷 저장소 (공개 읽기, 5MB 이하 JPEG만 올리기, 덮어쓰기·삭제 불가) ---
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bingo-proofs', 'bingo-proofs', true, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "bingo proofs upload" on storage.objects;
create policy "bingo proofs upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'bingo-proofs');
