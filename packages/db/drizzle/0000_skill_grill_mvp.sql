create extension if not exists pgcrypto;

create table if not exists "profiles" (
  "id" uuid primary key,
  "username" text not null,
  "display_name" text,
  "avatar_url" text,
  "github_username" text,
  "github_id" text,
  "role" text not null default 'user',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "profiles_role_check" check ("role" in ('user', 'moderator', 'admin')),
  constraint "profiles_id_auth_users_fkey" foreign key ("id") references auth.users("id") on delete cascade
);
--> statement-breakpoint
create unique index if not exists "profiles_github_id_unique" on "profiles" using btree ("github_id");
--> statement-breakpoint
create table if not exists "skills" (
  "id" text primary key,
  "source" text not null,
  "slug" text not null,
  "name" text not null,
  "description" text not null,
  "source_url" text,
  "install_command" text,
  "docs_url" text,
  "tags" text[] not null default '{}',
  "supported_agents" text[] not null default '{}',
  "upvotes_count" integer not null default 0,
  "downvotes_count" integer not null default 0,
  "comments_count" integer not null default 0,
  "score" integer generated always as ("upvotes_count" - "downvotes_count") stored,
  "status" text not null default 'active',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "skills_id_format_check" check ("id" = "source" || '/' || "slug"),
  constraint "skills_status_check" check ("status" in ('active', 'hidden', 'archived')),
  constraint "skills_vote_count_check" check ("upvotes_count" >= 0 and "downvotes_count" >= 0 and "comments_count" >= 0),
  constraint "skills_source_slug_unique" unique ("source", "slug")
);
--> statement-breakpoint
create unique index if not exists "skills_slug_unique" on "skills" using btree ("slug");
--> statement-breakpoint
create index if not exists "skills_status_created_at_idx" on "skills" using btree ("status", "created_at");
--> statement-breakpoint
create index if not exists "skills_status_score_idx" on "skills" using btree ("status", "score");
--> statement-breakpoint
create index if not exists "skills_tags_gin_idx" on "skills" using gin ("tags");
--> statement-breakpoint
create index if not exists "skills_supported_agents_gin_idx" on "skills" using gin ("supported_agents");
--> statement-breakpoint
create table if not exists "skill_votes" (
  "id" uuid primary key default gen_random_uuid(),
  "skill_id" text not null references "skills"("id") on delete cascade,
  "user_id" uuid not null references auth.users("id") on delete cascade,
  "value" smallint not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "skill_votes_value_check" check ("value" in (-1, 1)),
  constraint "skill_votes_skill_user_unique" unique ("skill_id", "user_id")
);
--> statement-breakpoint
create index if not exists "skill_votes_skill_idx" on "skill_votes" using btree ("skill_id");
--> statement-breakpoint
create index if not exists "skill_votes_user_idx" on "skill_votes" using btree ("user_id");
--> statement-breakpoint
create table if not exists "comments" (
  "id" uuid primary key default gen_random_uuid(),
  "skill_id" text not null references "skills"("id") on delete cascade,
  "user_id" uuid not null references auth.users("id") on delete cascade,
  "parent_id" uuid references "comments"("id") on delete cascade,
  "body" text not null,
  "status" text not null default 'visible',
  "reports_count" integer not null default 0,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "deleted_at" timestamptz,
  constraint "comments_status_check" check ("status" in ('visible', 'hidden', 'deleted', 'pending')),
  constraint "comments_body_length_check" check (char_length("body") between 2 and 2000),
  constraint "comments_reports_count_check" check ("reports_count" >= 0)
);
--> statement-breakpoint
create index if not exists "comments_skill_created_at_idx" on "comments" using btree ("skill_id", "created_at");
--> statement-breakpoint
create index if not exists "comments_user_idx" on "comments" using btree ("user_id");
--> statement-breakpoint
create table if not exists "comment_reports" (
  "id" uuid primary key default gen_random_uuid(),
  "comment_id" uuid not null references "comments"("id") on delete cascade,
  "user_id" uuid not null references auth.users("id") on delete cascade,
  "reason" text not null,
  "note" text,
  "created_at" timestamptz not null default now(),
  constraint "comment_reports_reason_check" check ("reason" in ('spam', 'abuse', 'unsafe', 'off_topic', 'other')),
  constraint "comment_reports_comment_user_unique" unique ("comment_id", "user_id")
);
--> statement-breakpoint
create index if not exists "comment_reports_comment_idx" on "comment_reports" using btree ("comment_id");
--> statement-breakpoint
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
--> statement-breakpoint
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
--> statement-breakpoint
create trigger skills_set_updated_at
before update on public.skills
for each row execute function public.set_updated_at();
--> statement-breakpoint
create trigger skill_votes_set_updated_at
before update on public.skill_votes
for each row execute function public.set_updated_at();
--> statement-breakpoint
create trigger comments_set_updated_at
before update on public.comments
for each row execute function public.set_updated_at();
--> statement-breakpoint
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  resolved_username text := coalesce(
    nullif(metadata ->> 'user_name', ''),
    nullif(metadata ->> 'preferred_username', ''),
    nullif(metadata ->> 'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user'
  );
begin
  insert into public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    github_username,
    github_id
  ) values (
    new.id,
    resolved_username,
    coalesce(nullif(metadata ->> 'full_name', ''), nullif(metadata ->> 'name', '')),
    nullif(metadata ->> 'avatar_url', ''),
    coalesce(nullif(metadata ->> 'user_name', ''), nullif(metadata ->> 'preferred_username', '')),
    coalesce(nullif(metadata ->> 'provider_id', ''), nullif(metadata ->> 'sub', ''))
  )
  on conflict (id) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    github_username = excluded.github_username,
    github_id = excluded.github_id,
    updated_at = now();

  return new;
end;
$$;
--> statement-breakpoint
drop trigger if exists on_auth_user_created on auth.users;
--> statement-breakpoint
create trigger on_auth_user_created
after insert or update of raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();
--> statement-breakpoint
alter table public.profiles enable row level security;
--> statement-breakpoint
alter table public.skills enable row level security;
--> statement-breakpoint
alter table public.skill_votes enable row level security;
--> statement-breakpoint
alter table public.comments enable row level security;
--> statement-breakpoint
alter table public.comment_reports enable row level security;
--> statement-breakpoint
revoke all on table public.profiles from anon, authenticated;
--> statement-breakpoint
revoke all on table public.skills from anon, authenticated;
--> statement-breakpoint
revoke all on table public.skill_votes from anon, authenticated;
--> statement-breakpoint
revoke all on table public.comments from anon, authenticated;
--> statement-breakpoint
revoke all on table public.comment_reports from anon, authenticated;
