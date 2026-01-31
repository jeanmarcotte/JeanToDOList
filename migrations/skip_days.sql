-- Skip Days table: stores dates where skippable habits are auto-skipped
-- Run this in the Supabase SQL Editor

-- 1. Create table
create table skip_days (
  id bigint generated always as identity primary key,
  date date not null unique,
  reason text not null,
  auto_recovery boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Seed existing hardcoded dates

-- Wedding days (31 entries)
insert into skip_days (date, reason) values
  ('2026-02-07', 'Wedding'),
  ('2026-03-21', 'Wedding'),
  ('2026-03-28', 'Wedding'),
  ('2026-04-24', 'Wedding'),
  ('2026-05-02', 'Wedding'),
  ('2026-05-09', 'Wedding'),
  ('2026-05-15', 'Wedding'),
  ('2026-05-16', 'Wedding'),
  ('2026-05-23', 'Wedding'),
  ('2026-05-30', 'Wedding'),
  ('2026-06-06', 'Wedding'),
  ('2026-06-12', 'Wedding'),
  ('2026-06-20', 'Wedding'),
  ('2026-06-26', 'Wedding'),
  ('2026-07-03', 'Wedding'),
  ('2026-07-14', 'Wedding'),
  ('2026-07-31', 'Wedding'),
  ('2026-08-02', 'Wedding'),
  ('2026-08-15', 'Wedding'),
  ('2026-09-05', 'Wedding'),
  ('2026-09-06', 'Wedding'),
  ('2026-09-12', 'Wedding'),
  ('2026-09-13', 'Wedding'),
  ('2026-09-19', 'Wedding'),
  ('2026-10-03', 'Wedding'),
  ('2026-10-16', 'Wedding'),
  ('2026-12-05', 'Wedding'),
  ('2027-02-27', 'Wedding'),
  ('2027-07-10', 'Wedding'),
  ('2027-08-28', 'Wedding'),
  ('2027-10-31', 'Wedding');

-- Bridal Show days (7 entries)
insert into skip_days (date, reason) values
  ('2026-02-21', 'Bridal Show'),
  ('2026-02-22', 'Bridal Show'),
  ('2026-03-08', 'Bridal Show'),
  ('2026-04-26', 'Bridal Show'),
  ('2026-10-02', 'Bridal Show'),
  ('2026-10-03', 'Bridal Show'),
  ('2026-10-04', 'Bridal Show');
