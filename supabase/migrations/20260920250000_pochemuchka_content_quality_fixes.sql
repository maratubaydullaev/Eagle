-- POCHEMUЧКА: content quality fixes for the current curriculum.
-- Safe to re-run. Keeps the frontend and database content aligned.
-- Deployed only after the curriculum answer-order migration.

update activities
set content = jsonb_set(
  jsonb_set(
    content,
    '{question}',
    to_jsonb('Какой знак ставят между числами, если первое число больше второго?'::text),
    true
  ),
  '{explanation}',
  to_jsonb('Знак > показывает, что число слева больше числа справа.'::text),
  true
)
where id = 'math-1-09';

update activities
set content = jsonb_set(
  content,
  '{explanation}',
  to_jsonb('Было 10 конфет. Если отдать 3, остаётся 10 − 3 = 7 конфет.'::text),
  true
)
where id = 'math-1-15';

do $$
declare
  v_bad int;
  v_total int;
begin
  select count(*) into v_total
  from activities a
  join lessons l on l.id = a.lesson_id
  where l.is_active and a.type = 'quiz';

  select count(*) into v_bad
  from activities
  where id in ('math-1-09','math-1-15')
    and (
      content->>'question' is null
      or content->>'explanation' is null
      or length(content->>'explanation') < 15
    );

  if v_total <> 200 or v_bad <> 0 then
    raise exception 'POCHEMUCHKA content quality migration failed: total=%, bad=%', v_total, v_bad;
  end if;
end $$;
