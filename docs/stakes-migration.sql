-- Module 6: Stakes
-- Run this in the Supabase SQL Editor

-- Stakes: a goal with a target count of entries
CREATE TABLE stakes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  target_count INTEGER NOT NULL,
  deadline TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stake entries: each check-in / progress tick toward a stake
CREATE TABLE stake_entries (
  id SERIAL PRIMARY KEY,
  stake_id INTEGER NOT NULL REFERENCES stakes(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups of entries by stake
CREATE INDEX idx_stake_entries_stake_id ON stake_entries(stake_id);
