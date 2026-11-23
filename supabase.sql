-- 서트방 미션 빙고 — Supabase 초기 설정
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run 한 번.

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
  reject_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (player_id, cell)
);

create table if not exists public.bingo_settings (
  key text primary key,
  value text not null
);

alter table public.bingo_players enable row level security;
alter table public.bingo_submissions enable row level security;
alter table public.bingo_settings enable row level security;

-- 누구나 읽기만 가능. 비밀번호 해시 열은 읽기 권한에서 뺌. 쓰기는 아래 함수로만.
revoke all on public.bingo_players, public.bingo_submissions, public.bingo_settings from anon, authenticated;
grant select (id, nickname, created_at) on public.bingo_players to anon, authenticated;
grant select on public.bingo_submissions to anon, authenticated;

drop policy if exists "bingo players read" on public.bingo_players;
create policy "bingo players read" on public.bingo_players for select using (true);
drop policy if exists "bingo submissions read" on public.bingo_submissions;
create policy "bingo submissions read" on public.bingo_submissions for select using (true);

-- 2) 내부 확인 함수 (외부 호출 불가) ---------------------------------
create or replace function public.bingo__player_ok(p_player uuid, p_pass text)
returns boolean language sql security definer set search_path = public, extensions as $$
  select exists (
    select 1 from bingo_players
    where id = p_player and pass_hash = crypt(p_pass, pass_hash)
  );
$$;

create or replace function public.bingo__admin_ok(p_pass text)
returns boolean language sql security definer set search_path = public, extensions as $$
  select exists (
    select 1 from bingo_settings
    where key = 'admin_hash' and value = crypt(p_pass, value)
  );
$$;

revoke execute on function public.bingo__player_ok(uuid, text) from public, anon, authenticated;
revoke execute on function public.bingo__admin_ok(text) from public, anon, authenticated;

-- 3) 참가자용 함수 ----------------------------------------------------
create or replace function public.bingo_join(p_nickname text, p_pass text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_nick text := btrim(p_nickname);
begin
  if char_length(v_nick) < 1 or char_length(v_nick) > 12 then
    raise exception '닉네임은 1~12자로 정해 주세요.';
  end if;
  if char_length(p_pass) < 4 then
    raise exception '비밀번호는 4자 이상으로 정해 주세요.';
  end if;
  if exists (select 1 from bingo_players where nickname = v_nick) then
    raise exception '이미 있는 닉네임이에요. 본인이면 "이어서 하기"로 들어오세요.';
  end if;
  insert into bingo_players (nickname, pass_hash)
  values (v_nick, crypt(p_pass, gen_salt('bf')))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.bingo_login(p_nickname text, p_pass text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  select id into v_id from bingo_players
  where nickname = btrim(p_nickname) and pass_hash = crypt(p_pass, pass_hash);
  if v_id is null then
    raise exception '닉네임이나 비밀번호가 맞지 않아요.';
  end if;
  return v_id;
end $$;

create or replace function public.bingo_submit(p_player uuid, p_pass text, p_cell int, p_path text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not bingo__player_ok(p_player, p_pass) then
    raise exception '로그인이 풀렸어요. 다시 들어와 주세요.';
  end if;
  if p_cell < 0 or p_cell > 24 then raise exception '없는 칸이에요.'; end if;
  if p_path not like p_player::text || '/%' then raise exception '사진 경로가 맞지 않아요.'; end if;
  if exists (select 1 from bingo_submissions
             where player_id = p_player and cell = p_cell and status = 'approved') then
    raise exception '이미 승인된 칸이에요.';
  end if;
  insert into bingo_submissions (player_id, cell, photo_path)
  values (p_player, p_cell, p_path)
  on conflict (player_id, cell) do update
    set photo_path = excluded.photo_path, status = 'pending',
        reject_reason = null, created_at = now(), reviewed_at = null;
end $$;

create or replace function public.bingo_cancel(p_player uuid, p_pass text, p_cell int)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not bingo__player_ok(p_player, p_pass) then
    raise exception '로그인이 풀렸어요. 다시 들어와 주세요.';
  end if;
  delete from bingo_submissions
  where player_id = p_player and cell = p_cell and status <> 'approved';
end $$;

-- 4) 운영진용 함수 ----------------------------------------------------
create or replace function public.bingo_admin_is_set()
returns boolean language sql security definer set search_path = public, extensions as $$
  select exists (select 1 from bingo_settings where key = 'admin_hash');
$$;

-- 운영진 비밀번호는 맨 처음 한 번만 정할 수 있음
create or replace function public.bingo_admin_init(p_pass text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if char_length(p_pass) < 6 then raise exception '운영진 비밀번호는 6자 이상으로 정해 주세요.'; end if;
  if exists (select 1 from bingo_settings where key = 'admin_hash') then
    raise exception '운영진 비밀번호가 이미 정해져 있어요.';
  end if;
  insert into bingo_settings (key, value) values ('admin_hash', crypt(p_pass, gen_salt('bf')));
end $$;

create or replace function public.bingo_admin_check(p_pass text)
returns boolean language sql security definer set search_path = public, extensions as $$
  select bingo__admin_ok(p_pass);
$$;

create or replace function public.bingo_review(p_admin_pass text, p_submission uuid, p_status text, p_reason text default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not bingo__admin_ok(p_admin_pass) then raise exception '운영진 비밀번호가 맞지 않아요.'; end if;
  if p_status not in ('pending','approved','rejected') then raise exception '없는 상태예요.'; end if;
  update bingo_submissions
  set status = p_status,
      reject_reason = case when p_status = 'rejected' then nullif(btrim(coalesce(p_reason,'')), '') end,
      reviewed_at = case when p_status = 'pending' then null else now() end
  where id = p_submission;
end $$;

grant execute on function
  public.bingo_join(text, text),
  public.bingo_login(text, text),
  public.bingo_submit(uuid, text, int, text),
  public.bingo_cancel(uuid, text, int),
  public.bingo_admin_is_set(),
  public.bingo_admin_init(text),
  public.bingo_admin_check(text),
  public.bingo_review(text, uuid, text, text)
to anon, authenticated;

-- 5) 인증샷 저장소 (공개 읽기, 5MB 이하 이미지만 올리기) ---------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bingo-proofs', 'bingo-proofs', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "bingo proofs upload" on storage.objects;
create policy "bingo proofs upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'bingo-proofs');
