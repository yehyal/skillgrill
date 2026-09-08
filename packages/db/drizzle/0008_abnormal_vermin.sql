ALTER TABLE "skills" ADD COLUMN "installs_count" integer;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "installs_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "github_stars_count" integer;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "github_stars_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "catalog_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "catalog_updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_installs_count_check" CHECK ("skills"."installs_count" is null or "skills"."installs_count" >= 0);--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_github_stars_count_check" CHECK ("skills"."github_stars_count" is null or "skills"."github_stars_count" >= 0);--> statement-breakpoint

create or replace function public.set_skill_catalog_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.catalog_updated_at = now();
  return new;
end;
$$;--> statement-breakpoint

create trigger skills_set_catalog_updated_at
before update of
  id,
  source,
  slug,
  name,
  description,
  source_url,
  install_command,
  docs_url,
  compatibility_note,
  skill_md,
  estimated_tokens,
  tags,
  supported_agents,
  status
on public.skills
for each row
when (
  old.id is distinct from new.id
  or old.source is distinct from new.source
  or old.slug is distinct from new.slug
  or old.name is distinct from new.name
  or old.description is distinct from new.description
  or old.source_url is distinct from new.source_url
  or old.install_command is distinct from new.install_command
  or old.docs_url is distinct from new.docs_url
  or old.compatibility_note is distinct from new.compatibility_note
  or old.skill_md is distinct from new.skill_md
  or old.estimated_tokens is distinct from new.estimated_tokens
  or old.tags is distinct from new.tags
  or old.supported_agents is distinct from new.supported_agents
  or old.status is distinct from new.status
)
execute function public.set_skill_catalog_updated_at();
