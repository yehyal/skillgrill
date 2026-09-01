create or replace function public.report_comment(
  p_comment_id uuid,
  p_user_id uuid,
  p_reason text,
  p_note text default null
)
returns table (
  reports_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_comment public.comments%rowtype;
  inserted_report_count integer;
  authoritative_reports_count integer;
begin
  if p_reason is null or p_reason not in ('spam', 'abuse', 'unsafe', 'off_topic', 'other') then
    raise exception using message = 'report_reason_invalid';
  end if;

  p_note := nullif(btrim(coalesce(p_note, '')), '');

  if p_note is not null and char_length(p_note) > 500 then
    raise exception using message = 'report_note_invalid';
  end if;

  select * into target_comment
  from public.comments as candidate_comment
  where candidate_comment.id = p_comment_id
    and candidate_comment.status = 'visible'
  for update;

  if not found then
    return;
  end if;

  if target_comment.user_id = p_user_id then
    raise exception using message = 'report_self_forbidden';
  end if;

  insert into public.comment_reports (comment_id, user_id, reason, note)
  values (p_comment_id, p_user_id, p_reason, p_note)
  on conflict (comment_id, user_id) do nothing;

  get diagnostics inserted_report_count = row_count;

  if inserted_report_count = 1 then
    update public.comments as updated_comment
    set reports_count = updated_comment.reports_count + 1,
        updated_at = now()
    where updated_comment.id = p_comment_id;
  end if;

  select current_comment.reports_count into authoritative_reports_count
  from public.comments as current_comment
  where current_comment.id = p_comment_id;

  return query select authoritative_reports_count;
end;
$$;
--> statement-breakpoint
revoke all on function public.report_comment(uuid, uuid, text, text) from public, anon, authenticated;
--> statement-breakpoint
grant execute on function public.report_comment(uuid, uuid, text, text) to service_role;
