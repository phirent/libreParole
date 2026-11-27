-- 1. Extensions
create extension if not exists "pgcrypto";

-- 2. Table des profils anonymes
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  pseudo text unique not null,
  vecus text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Table des paroles déposées
create table public.paroles (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  theme text not null,
  content text not null check (char_length(content) >= 20 and char_length(content) <= 1000),
  status text not null default 'open' check (status in ('open', 'healed', 'closed')),
  is_public_scar boolean not null default false,
  golden_advice text,
  expires_at timestamptz not null default (now() + interval '48 hours'),
  created_at timestamptz not null default now()
);

-- 4. Membres des Cercles de Résonance
create table public.circle_members (
  id uuid default gen_random_uuid() primary key,
  parole_id uuid references public.paroles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('author', 'listener')),
  is_banned boolean not null default false,
  joined_at timestamptz not null default now(),
  unique(parole_id, user_id)
);

-- 5. Messages temps réel dans un Cercle
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  parole_id uuid references public.paroles(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) >= 1 and char_length(content) <= 1500),
  created_at timestamptz not null default now()
);

-- 6. Signalements communautaires
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  parole_id uuid references public.paroles(id) on delete cascade not null,
  reported_user_id uuid references public.profiles(id) on delete cascade not null,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(parole_id, reported_user_id, reporter_id)
);

-- 7. Trigger : Exclusion automatique à 2 signalements dans un même cercle
create or replace function public.handle_report_ban()
returns trigger as $$
declare
  report_count int;
begin
  select count(*) into report_count
  from public.reports
  where parole_id = new.parole_id
    and reported_user_id = new.reported_user_id;

  if report_count >= 2 then
    update public.circle_members
    set is_banned = true
    where parole_id = new.parole_id
      and user_id = new.reported_user_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_report_created
  after insert on public.reports
  for each row execute function public.handle_report_ban();

-- 8. Fonction RPC : Créer une parole et matcher 3 à 5 écoutants
create or replace function public.create_parole_and_match(
  p_theme text,
  p_content text
)
returns uuid as $$
declare
  new_parole_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Non authentifié';
  end if;

  -- Créer la parole
  insert into public.paroles (author_id, theme, content)
  values (current_user_id, p_theme, p_content)
  returning id into new_parole_id;

  -- Ajouter l'auteur au cercle
  insert into public.circle_members (parole_id, user_id, role)
  values (new_parole_id, current_user_id, 'author');

  -- Sélectionner jusqu'à 5 écoutants ayant ce vécu et moins de 2 cercles actifs
  insert into public.circle_members (parole_id, user_id, role)
  select new_parole_id, p.id, 'listener'
  from public.profiles p
  where p.id != current_user_id
    and p.is_available = true
    and p_theme = any(p.vecus)
    and (
      select count(*)
      from public.circle_members cm
      join public.paroles par on par.id = cm.parole_id
      where cm.user_id = p.id
        and cm.role = 'listener'
        and cm.is_banned = false
        and par.status = 'open'
        and par.expires_at > now()
    ) < 2
  order by random()
  limit 5;

  return new_parole_id;
end;
$$ language plpgsql security definer;

-- 9. Sécurité RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.paroles enable row level security;
alter table public.circle_members enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

-- Profiles : lecture des pseudos pour les membres authentifiés, modification uniquement du sien
create policy "Profiles visibles par utilisateurs connectés"
  on public.profiles for select to authenticated using (true);
create policy "Création de son propre profil"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Modification de son propre profil"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Paroles : visible par les membres actifs du cercle OU si publié sur les Cicatrices Dorées
create policy "Lecture paroles autorisées"
  on public.paroles for select to authenticated using (
    is_public_scar = true
    or exists (
      select 1 from public.circle_members cm
      where cm.parole_id = id and cm.user_id = auth.uid() and cm.is_banned = false
    )
  );
create policy "Modification parole par auteur"
  on public.paroles for update to authenticated using (auth.uid() = author_id);

-- Circle Members : visible uniquement par les membres non bannis du même cercle
create policy "Lecture membres du cercle"
  on public.circle_members for select to authenticated using (
    exists (
      select 1 from public.circle_members cm
      where cm.parole_id = parole_id and cm.user_id = auth.uid() and cm.is_banned = false
    )
  );

-- Messages : lecture et écriture uniquement pour les membres actifs d'un cercle ouvert
create policy "Lecture messages du cercle"
  on public.messages for select to authenticated using (
    exists (
      select 1 from public.circle_members cm
      where cm.parole_id = parole_id and cm.user_id = auth.uid() and cm.is_banned = false
    )
  );
create policy "Envoi messages dans le cercle"
  on public.messages for insert to authenticated with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.circle_members cm
      join public.paroles p on p.id = cm.parole_id
      where cm.parole_id = parole_id
        and cm.user_id = auth.uid()
        and cm.is_banned = false
        and p.status = 'open'
        and p.expires_at > now()
    )
  );

-- Reports : un membre du cercle peut signaler un autre membre
create policy "Création signalement"
  on public.reports for insert to authenticated with check (
    auth.uid() = reporter_id
    and exists (
      select 1 from public.circle_members cm
      where cm.parole_id = parole_id and cm.user_id = auth.uid() and cm.is_banned = false
    )
  );

-- 10. Activer Supabase Realtime sur les messages
alter publication supabase_realtime add table public.messages;
