-- ============================================================================
--  Seed manager profiles: names, role, and assigned branches.
--  STEP 1: In Supabase, Authentication -> Users -> Add user, create each person
--          below with their email and a temporary password (tick 'Auto confirm').
--  STEP 2: Run this script. It matches on email and fills in name/role/branches.
--  STEP 3: Decide who is ADMIN (can delete + upload data). By default the first
--          person is set to admin -- change the email in the admin UPDATE below.
-- ============================================================================

-- Make everyone a manager with their branch(es):
update public.profiles set full_name='Nana Yaw Affram', role='manager', branches='{"Accra Main"}' where email='nyaffram@donewellinsurance.com';
update public.profiles set full_name='Ernest Kwasi Hammond', role='manager', branches='{"Accra Main"}' where email='ekhammond@donewellinsurance.com';
update public.profiles set full_name='Yvette Selinam Xetsa Ampofo', role='manager', branches='{"Tema"}' where email='ysxampofo@donewellinsurance.com';
update public.profiles set full_name='Samuel Lartey', role='manager', branches='{"Kumasi","Obuasi"}' where email='slartey@donewellinsurance.com';
update public.profiles set full_name='Anthony Borlu', role='manager', branches='{"Takoradi","Tarkwa"}' where email='aborlu@donewellinsurance.com';
update public.profiles set full_name='John Blankson', role='manager', branches='{"Cape Coast"}' where email='jblankson@donewellinsurance.com';
update public.profiles set full_name='Cyril Tetteh', role='manager', branches='{"Koforidua"}' where email='ctetteh@donewellinsurance.com';
update public.profiles set full_name='Patrick Donkoh', role='manager', branches='{"Sunyani","Techiman"}' where email='pdonkoh@donewellinsurance.com';
update public.profiles set full_name='Benjamin Lorwont Ninlabsiba', role='manager', branches='{"Tamale","Wa"}' where email='blninlabsiba@donewellinsurance.com';
update public.profiles set full_name='Korleki Setor Akpey', role='manager', branches='{"Ho"}' where email='ksakpey@donewellinsurance.com';
update public.profiles set full_name='Janet Ampaabeng', role='manager', branches='{"Dansoman"}' where email='jampaabeng@donewellinsurance.com';
update public.profiles set full_name='Patience Semiheva', role='manager', branches='{"Spintex"}' where email='psemiheva@donewellinsurance.com';
update public.profiles set full_name='Noel Kuffour', role='manager', branches='{"Tafo"}' where email='nkuffour@donewellinsurance.com';


-- Designate the ADMIN (change this email to whoever should be admin):
update public.profiles set role='admin' where email='nyaffram@donewellinsurance.com';
update public.profiles set role='admin' where email='cbruce@donewellinsurance.com';

-- Tip: to add a NEW admin later who isn't a branch manager, create the user in
-- Authentication, then:  update public.profiles set role='admin' where email='...';
