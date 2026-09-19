-- Fix MVP content drift, align profile ages with grade routing, and make gift purchases transactional.
-- Profile age mapping: 4-6 -> grade 1, 7-8 -> grade 2, 9-10 -> grade 3.
alter table profiles drop constraint if exists profiles_age_check;
alter table profiles add constraint profiles_age_check check (age between 4 and 10);
-- This migration is safe to run once on the existing production database.

update activities
set
  type = 'matching',
  content = '{"pairs":[["Север","North"],["Юг","South"],["Восток","East"],["Запад","West"]]}'
where id = 'w2b';

update activities
set
  type = 'matching',
  content = '{"pairs":[["Верблюд","Пустыня"],["Дельфин","Море"],["Лев","Саванна"]]}'
where id = 'a2b';

-- Re-evaluate historical attempts for the two activities whose stored activity
-- definition was inconsistent with the React content.
update activity_attempts
set is_correct = exists (
  select 1
  from jsonb_array_elements((select content->'pairs' from activities where id = activity_attempts.activity_id)) pair
  where jsonb_array_length(pair) = 2
    and (
      ((answer->>'first') = (pair->>0) and (answer->>'second') = (pair->>1))
      or
      ((answer->>'first') = (pair->>1) and (answer->>'second') = (pair->>0))
    )
)
where activity_id in ('w2b','a2b')
  and jsonb_typeof(answer) = 'object';

create table if not exists gift_purchases (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  gift_id text not null check (gift_id in ('sticker','avatar','treasure')),
  cost int not null check (cost > 0),
  created_at timestamptz not null default now(),
  unique(profile_id, gift_id)
);

create index if not exists idx_gift_purchases_profile
  on gift_purchases(profile_id, created_at desc);

alter table gift_purchases enable row level security;

-- Preserve existing purchases recorded in analytics_events.
insert into gift_purchases(profile_id, gift_id, cost, created_at)
select
  e.profile_id,
  e.payload->>'giftId',
  case e.payload->>'giftId'
    when 'sticker' then 5
    when 'avatar' then 10
    when 'treasure' then 15
  end,
  e.created_at
from analytics_events e
where e.event_name = 'gift_purchased'
  and e.payload->>'giftId' in ('sticker','avatar','treasure')
on conflict (profile_id, gift_id) do nothing;

create or replace function purchase_gift_atomic(
  p_profile_id uuid,
  p_gift_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost int;
  v_earned int;
  v_spent int;
  v_stars int;
  v_already boolean;
  v_purchases jsonb;
begin
  v_cost := case p_gift_id
    when 'sticker' then 5
    when 'avatar' then 10
    when 'treasure' then 15
    else null
  end;

  if v_cost is null then
    return jsonb_build_object('error','unknown_gift');
  end if;

  -- Serialize purchases for the same child.
  perform 1 from profiles where id = p_profile_id for update;

  select exists(
    select 1 from gift_purchases
    where profile_id = p_profile_id and gift_id = p_gift_id
  ) into v_already;

  select coalesce(sum(stars),0)
    into v_earned
    from lesson_progress
    where profile_id = p_profile_id;

  select coalesce(sum(cost),0)
    into v_spent
    from gift_purchases
    where profile_id = p_profile_id;

  v_stars := greatest(0, v_earned - v_spent);

  if v_already then
    select coalesce(jsonb_agg(gift_id order by created_at), '[]'::jsonb)
      into v_purchases
      from gift_purchases
      where profile_id = p_profile_id;
    return jsonb_build_object(
      'ok', true,
      'alreadyPurchased', true,
      'stars', v_stars,
      'purchasedGifts', v_purchases
    );
  end if;

  if v_stars < v_cost then
    return jsonb_build_object(
      'error','not_enough_stars',
      'stars', v_stars
    );
  end if;

  insert into gift_purchases(profile_id, gift_id, cost)
  values (p_profile_id, p_gift_id, v_cost);

  v_stars := v_stars - v_cost;

  select coalesce(jsonb_agg(gift_id order by created_at), '[]'::jsonb)
    into v_purchases
    from gift_purchases
    where profile_id = p_profile_id;

  return jsonb_build_object(
    'ok', true,
    'stars', v_stars,
    'purchasedGifts', v_purchases
  );
end;
$$;

revoke all on function purchase_gift_atomic(uuid,text) from public;
grant execute on function purchase_gift_atomic(uuid,text) to service_role;
