begin;
create table if not exists public.wf_profiles (
 id uuid primary key references auth.users on delete cascade,
 username text not null unique check(username ~ '^[a-z0-9_]{3,32}$')
);
create or replace function public.wf_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.wf_profiles values(new.id,lower(trim(new.raw_user_meta_data->>'username')));
 return new;
end $$;
drop trigger if exists wf_new_user on auth.users;
create trigger wf_new_user after insert on auth.users for each row execute function public.wf_signup();
create table if not exists public.wf_progress (
 id uuid primary key references auth.users on delete cascade,
 events jsonb not null default '{}', settings jsonb, practice jsonb,
 revision bigint not null default 0, epoch bigint not null default 0
);
alter table public.wf_profiles enable row level security;
alter table public.wf_progress enable row level security;
drop policy if exists wf_profile_self on public.wf_profiles;
create policy wf_profile_self on public.wf_profiles for select to authenticated using(id=(select auth.uid()));
drop policy if exists wf_progress_self on public.wf_progress;
create policy wf_progress_self on public.wf_progress to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
revoke all on public.wf_profiles,public.wf_progress from public,anon,authenticated;
grant select on public.wf_profiles to authenticated;
grant select,insert,update on public.wf_progress to authenticated;
create or replace function public.wf_exchange(delta jsonb,base_revision bigint,base_epoch bigint,reset_cycle boolean,previous_settings jsonb,previous_practice jsonb,new_settings jsonb,new_practice jsonb,practice_changed boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.wf_progress;
begin
 insert into public.wf_progress(id) values(auth.uid()) on conflict do nothing;
 select * into strict r from public.wf_progress where id=auth.uid() for update;
 if base_epoch=r.epoch then
  if reset_cycle then r.epoch:=r.epoch+1; r.events:='{}'; end if;
  r.events:=delta || r.events;
  if new_settings is not null and (base_revision=r.revision or r.settings is not distinct from previous_settings) then r.settings:=new_settings; end if;
  if practice_changed and (base_revision=r.revision or r.practice is not distinct from previous_practice or reset_cycle) then
   r.practice:=new_practice;
  elsif practice_changed and r.practice->>'id'=new_practice->>'id' and (new_practice->>'index')::int>(r.practice->>'index')::int then
   r.practice:=new_practice;
  end if;
 end if;
 update public.wf_progress set events=r.events,epoch=r.epoch,settings=r.settings,practice=r.practice,
 revision=revision+case when (events,epoch,settings,practice) is distinct from (r.events,r.epoch,r.settings,r.practice) then 1 else 0 end where id=auth.uid() returning * into r;
 return to_jsonb(r);
end $$;
revoke all on function public.wf_exchange(jsonb,bigint,bigint,boolean,jsonb,jsonb,jsonb,jsonb,boolean) from public,anon;
grant execute on function public.wf_exchange(jsonb,bigint,bigint,boolean,jsonb,jsonb,jsonb,jsonb,boolean) to authenticated;
commit;
