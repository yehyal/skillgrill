CREATE TABLE "skill_vote_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"previous_vote" smallint,
	"next_vote" smallint,
	"net_vote_delta" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_vote_events_previous_vote_check" CHECK ("skill_vote_events"."previous_vote" is null or "skill_vote_events"."previous_vote" in (-1, 1)),
	CONSTRAINT "skill_vote_events_next_vote_check" CHECK ("skill_vote_events"."next_vote" is null or "skill_vote_events"."next_vote" in (-1, 1)),
	CONSTRAINT "skill_vote_events_delta_check" CHECK ("skill_vote_events"."net_vote_delta" between -2 and 2 and "skill_vote_events"."net_vote_delta" <> 0)
);
--> statement-breakpoint
ALTER TABLE "skill_vote_events" ADD CONSTRAINT "skill_vote_events_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_vote_events" ADD CONSTRAINT "skill_vote_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skill_vote_events_skill_created_at_idx" ON "skill_vote_events" USING btree ("skill_id","created_at");--> statement-breakpoint
CREATE INDEX "skill_vote_events_created_at_idx" ON "skill_vote_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "skill_vote_events_user_created_at_idx" ON "skill_vote_events" USING btree ("user_id","created_at");
--> statement-breakpoint
alter table public.skill_vote_events enable row level security;
--> statement-breakpoint
revoke all on table public.skill_vote_events from anon, authenticated;
--> statement-breakpoint
create or replace function public.set_skill_vote(
  p_skill_slug text,
  p_user_id uuid,
  p_value smallint
)
returns table (
  skill_id text,
  my_vote smallint,
  upvotes_count integer,
  downvotes_count integer,
  comments_count integer,
  score integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_skill public.skills%rowtype;
  previous_value smallint;
  upvote_delta integer := 0;
  downvote_delta integer := 0;
  event_delta integer;
begin
  if p_value is not null and p_value not in (-1, 1) then
    raise exception 'invalid vote value';
  end if;

  select * into target_skill
  from public.skills as candidate_skill
  where candidate_skill.slug = p_skill_slug
    and candidate_skill.status = 'active'
  for update;

  if not found then
    return;
  end if;

  select votes.value into previous_value
  from public.skill_votes as votes
  where votes.skill_id = target_skill.id
    and votes.user_id = p_user_id
  for update;

  if previous_value is distinct from p_value then
    event_delta := coalesce(p_value, 0) - coalesce(previous_value, 0);

    if previous_value = 1 then
      upvote_delta := upvote_delta - 1;
    elsif previous_value = -1 then
      downvote_delta := downvote_delta - 1;
    end if;

    if p_value = 1 then
      upvote_delta := upvote_delta + 1;
    elsif p_value = -1 then
      downvote_delta := downvote_delta + 1;
    end if;

    if p_value is null then
      delete from public.skill_votes as votes
      where votes.skill_id = target_skill.id
        and votes.user_id = p_user_id;
    elsif previous_value is null then
      insert into public.skill_votes (skill_id, user_id, value)
      values (target_skill.id, p_user_id, p_value);
    else
      update public.skill_votes as votes
      set value = p_value,
          updated_at = now()
      where votes.skill_id = target_skill.id
        and votes.user_id = p_user_id;
    end if;

    update public.skills as updated_skill
    set upvotes_count = updated_skill.upvotes_count + upvote_delta,
        downvotes_count = updated_skill.downvotes_count + downvote_delta,
        updated_at = now()
    where updated_skill.id = target_skill.id;

    insert into public.skill_vote_events (
      skill_id,
      user_id,
      previous_vote,
      next_vote,
      net_vote_delta
    ) values (
      target_skill.id,
      p_user_id,
      previous_value,
      p_value,
      event_delta
    );
  end if;

  return query
  select
    current_skill.id,
    p_value,
    current_skill.upvotes_count,
    current_skill.downvotes_count,
    current_skill.comments_count,
    current_skill.score
  from public.skills as current_skill
  where current_skill.id = target_skill.id;
end;
$$;
--> statement-breakpoint
revoke all on function public.set_skill_vote(text, uuid, smallint) from public, anon, authenticated;
--> statement-breakpoint
grant execute on function public.set_skill_vote(text, uuid, smallint) to service_role;
