-- POCHEMUЧКА: normalize quiz answer order for the current curriculum.
-- The version marker makes this safe to re-run from the Management API workflow.
do $$
declare
  r record;
  v_shift int;
  v_answers jsonb;
  v_new_answers jsonb;
begin
  for r in
    select id, content, config
    from activities
    where type = 'quiz'
      and lesson_id in ('nature-1','nature-2','nature-3','animals-1','animals-2','animals-3','language-1','language-2','language-3','math-1','math-2','math-3')
      and coalesce(config->>'answerOrderVersion', '') <> '1'
  loop
    select coalesce(sum(ascii(substr(r.id, i, 1))), 0) % 3 into v_shift
    from generate_series(1, length(r.id)) as g(i);

    v_answers := r.content->'answers';
    if jsonb_typeof(v_answers) = 'array' and jsonb_array_length(v_answers) = 3 then
      v_new_answers := jsonb_build_array(
        jsonb_build_object('id','0','text',v_answers->((0 + v_shift) % 3)->>'text'),
        jsonb_build_object('id','1','text',v_answers->((1 + v_shift) % 3)->>'text'),
        jsonb_build_object('id','2','text',v_answers->((2 + v_shift) % 3)->>'text')
      );

      update activities
      set content = jsonb_set(
          jsonb_set(r.content, '{answers}', v_new_answers, true),
          '{correctAnswerId}',
          to_jsonb(((3 - v_shift) % 3)::text),
          true
        ),
        config = jsonb_set(coalesce(r.config, '{}'::jsonb), '{answerOrderVersion}', '1'::jsonb, true)
      where id = r.id;
    end if;
  end loop;
end $$;

do $$
declare v_bad int; v_total int; v_versioned int;
begin
  select count(*) into v_total
  from activities a join lessons l on l.id=a.lesson_id
  where l.is_active and a.type='quiz';

  select count(*) into v_versioned
  from activities a join lessons l on l.id=a.lesson_id
  where l.is_active and a.type='quiz' and a.config->>'answerOrderVersion'='1';

  select count(*) into v_bad
  from activities a join lessons l on l.id=a.lesson_id
  where l.is_active and a.type='quiz'
    and (
      jsonb_array_length(coalesce(a.content->'answers','[]'::jsonb)) <> 3
      or a.content->>'correctAnswerId' not in ('0','1','2')
      or a.content->'answers'->(a.content->>'correctAnswerId')::int->>'text' is null
    );

  if v_total <> 200 or v_versioned <> 200 or v_bad <> 0 then
    raise exception 'POCHEMUCHKA quiz answer order failed: total=%, versioned=%, bad=%', v_total, v_versioned, v_bad;
  end if;
end $$;
