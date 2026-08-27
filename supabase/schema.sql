-- 의견(코멘트) 스키마
-- Supabase Project → SQL Editor 에서 그대로 실행하세요.

create table if not exists public.comments (
  id          bigserial primary key,
  page_id     text        not null,
  author      text,
  body        text        not null check (char_length(body) between 1 and 1000),
  created_at  timestamptz not null default now()
);

create index if not exists comments_page_created_idx
  on public.comments (page_id, created_at desc);

-- Row Level Security: 익명 사용자가 조회/작성 가능하도록 허용
alter table public.comments enable row level security;

drop policy if exists "anyone can read comments"  on public.comments;
drop policy if exists "anyone can write comments" on public.comments;

create policy "anyone can read comments"
  on public.comments for select
  to anon, authenticated
  using (true);

create policy "anyone can write comments"
  on public.comments for insert
  to anon, authenticated
  with check (
    char_length(body) between 1 and 1000
    and (author is null or char_length(author) <= 40)
    and char_length(page_id) between 1 and 40
  );
