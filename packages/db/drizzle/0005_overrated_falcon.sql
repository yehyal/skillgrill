ALTER TABLE "skill_votes" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "skill_votes" ADD CONSTRAINT "skill_votes_reason_value_check" CHECK ("skill_votes"."reason" is null or (("skill_votes"."value" = 1 and "skill_votes"."reason" in ('works_reliably', 'triggers_well', 'lightweight')) or ("skill_votes"."value" = -1 and "skill_votes"."reason" in ('does_not_work', 'misses_triggers', 'triggers_too_often', 'too_heavy'))));--> statement-breakpoint
drop function if exists public.set_skill_vote(text, uuid, smallint);--> statement-breakpoint
create or replace function public.set_skill_vote(
  p_skill_slug text,
  p_user_id uuid,
  p_value smallint,
  p_reason text default null
)
returns table (
  skill_id text,
  my_vote smallint,
  my_reason text,
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
  previous_reason text;
  upvote_delta integer := 0;
  downvote_delta integer := 0;
  event_delta integer;
begin
  if p_value is not null and p_value not in (-1, 1) then
    raise exception 'invalid vote value';
  end if;

  if p_value is null and p_reason is not null then
    raise exception 'invalid vote reason';
  end if;

  if p_value = 1 and p_reason is not null and p_reason not in ('works_reliably', 'triggers_well', 'lightweight') then
    raise exception 'invalid vote reason';
  end if;

  if p_value = -1 and p_reason is not null and p_reason not in ('does_not_work', 'misses_triggers', 'triggers_too_often', 'too_heavy') then
    raise exception 'invalid vote reason';
  end if;

  select * into target_skill
  from public.skills as candidate_skill
  where candidate_skill.slug = p_skill_slug
    and candidate_skill.status = 'active'
  for update;

  if not found then
    return;
  end if;

  select votes.value, votes.reason into previous_value, previous_reason
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
      insert into public.skill_votes (skill_id, user_id, value, reason)
      values (target_skill.id, p_user_id, p_value, p_reason);
    else
      update public.skill_votes as votes
      set value = p_value,
          reason = p_reason,
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
  elsif previous_value is not null and previous_reason is distinct from p_reason then
    update public.skill_votes as votes
    set reason = p_reason,
        updated_at = now()
    where votes.skill_id = target_skill.id
      and votes.user_id = p_user_id;
  end if;

  return query
  select
    current_skill.id,
    current_vote.value,
    current_vote.reason,
    current_skill.upvotes_count,
    current_skill.downvotes_count,
    current_skill.comments_count,
    current_skill.score
  from public.skills as current_skill
  left join public.skill_votes as current_vote
    on current_vote.skill_id = current_skill.id
    and current_vote.user_id = p_user_id
  where current_skill.id = target_skill.id;
end;
$$;--> statement-breakpoint
revoke all on function public.set_skill_vote(text, uuid, smallint, text) from public, anon, authenticated;--> statement-breakpoint
grant execute on function public.set_skill_vote(text, uuid, smallint, text) to service_role;
