-- Recebi+ — executar somente em projeto Supabase EXCLUSIVO do Recebi+.
create table if not exists public.recebiplus_clients (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 100),
 phone text not null check (phone ~ '^[0-9]{10,13}$'),
 created_at timestamptz not null default now(),
 unique(owner_id,phone),
 unique(id,owner_id)
);
create table if not exists public.recebiplus_charges (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 client_id uuid not null,
 description text not null check (char_length(trim(description)) between 1 and 150),
 cents bigint not null check (cents between 1 and 10000000000),
 due_date date not null,
 paid boolean not null default false,
 paid_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key(client_id,owner_id) references public.recebiplus_clients(id,owner_id) on delete restrict
);
create table if not exists public.recebiplus_audit (
 id bigint generated always as identity primary key,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 charge_id uuid,
 event text not null check (event in ('created','updated','paid','unpaid','deleted')),
 at timestamptz not null default now(),
 previous jsonb,
 current jsonb
);
create or replace function public.recebiplus_track_charge() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if tg_op='INSERT' then
   insert into public.recebiplus_audit(owner_id,charge_id,event,current) values(new.owner_id,new.id,'created',to_jsonb(new));
   return new;
 elsif tg_op='UPDATE' then
   insert into public.recebiplus_audit(owner_id,charge_id,event,previous,current) values(new.owner_id,new.id,case when new.paid is distinct from old.paid then case when new.paid then 'paid' else 'unpaid' end else 'updated' end,to_jsonb(old),to_jsonb(new));
   return new;
 else
   insert into public.recebiplus_audit(owner_id,charge_id,event,previous) values(old.owner_id,old.id,'deleted',to_jsonb(old));
   return old;
 end if;
end $$;
drop trigger if exists recebiplus_charge_audit on public.recebiplus_charges;
create trigger recebiplus_charge_audit after insert or update or delete on public.recebiplus_charges for each row execute function public.recebiplus_track_charge();
alter table public.recebiplus_clients enable row level security;
alter table public.recebiplus_charges enable row level security;
alter table public.recebiplus_audit enable row level security;
create policy "own clients select" on public.recebiplus_clients for select to authenticated using(owner_id=(select auth.uid()));
create policy "own clients insert" on public.recebiplus_clients for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "own clients update" on public.recebiplus_clients for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "own clients delete" on public.recebiplus_clients for delete to authenticated using(owner_id=(select auth.uid()));
create policy "own charges select" on public.recebiplus_charges for select to authenticated using(owner_id=(select auth.uid()));
create policy "own charges insert" on public.recebiplus_charges for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "own charges update" on public.recebiplus_charges for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "own charges delete" on public.recebiplus_charges for delete to authenticated using(owner_id=(select auth.uid()));
create policy "own audit select" on public.recebiplus_audit for select to authenticated using(owner_id=(select auth.uid()));
revoke insert,update,delete on public.recebiplus_audit from anon,authenticated;
revoke all on function public.recebiplus_track_charge() from public,anon,authenticated;
