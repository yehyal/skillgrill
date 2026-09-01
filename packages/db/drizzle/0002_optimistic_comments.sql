create or replace function public.create_skill_comment(
  p_comment_id uuid,
  p_skill_slug text,
  p_user_id uuid,
  p_body text
)
returns table (
  comment_id uuid,
  skill_id text,
  user_id uuid,
  body text,
  created_at timestamptz,
  comments_count integer,
  author_username text,
  author_display_name text,
  author_avatar_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  author_profile public.profiles%rowtype;
  target_skill public.skills%rowtype;
  existing_comment public.comments%rowtype;
  inserted_comment public.comments%rowtype;
  authoritative_comments_count integer;
begin
  p_body := btrim(coalesce(p_body, ''));

  if char_length(p_body) not between 2 and 2000 then
    raise exception using message = 'comment_body_invalid';
  end if;

  select * into author_profile
  from public.profiles as candidate_profile
  where candidate_profile.id = p_user_id
  for key share;

  if not found then
    raise exception using message = 'comment_profile_missing';
  end if;

  select * into target_skill
  from public.skills as candidate_skill
  where candidate_skill.slug = p_skill_slug
    and candidate_skill.status = 'active'
  for update;

  if not found then
    return;
  end if;

  select * into existing_comment
  from public.comments as candidate_comment
  where candidate_comment.id = p_comment_id
  for update;

  if found then
    if existing_comment.skill_id is distinct from target_skill.id
      or existing_comment.user_id is distinct from p_user_id
      or existing_comment.body is distinct from p_body then
      raise exception using message = 'comment_id_conflict';
    end if;

    return query
    select
      existing_comment.id,
      existing_comment.skill_id,
      existing_comment.user_id,
      existing_comment.body,
      existing_comment.created_at,
      target_skill.comments_count,
      author_profile.username,
      author_profile.display_name,
      author_profile.avatar_url;
    return;
  end if;

  insert into public.comments (id, skill_id, user_id, parent_id, body, status)
  values (p_comment_id, target_skill.id, p_user_id, null, p_body, 'visible')
  returning * into inserted_comment;

  update public.skills as updated_skill
  set comments_count = updated_skill.comments_count + 1,
      updated_at = now()
  where updated_skill.id = target_skill.id
  returning updated_skill.comments_count into authoritative_comments_count;

  return query
  select
    inserted_comment.id,
    inserted_comment.skill_id,
    inserted_comment.user_id,
    inserted_comment.body,
    inserted_comment.created_at,
    authoritative_comments_count,
    author_profile.username,
    author_profile.display_name,
    author_profile.avatar_url;
end;
$$;
--> statement-breakpoint
revoke all on function public.create_skill_comment(uuid, text, uuid, text) from public, anon, authenticated;
--> statement-breakpoint
grant execute on function public.create_skill_comment(uuid, text, uuid, text) to service_role;
