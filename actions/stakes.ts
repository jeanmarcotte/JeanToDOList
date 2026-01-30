"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PRIVATE_SUPABASE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface Stake {
  id: number;
  title: string;
  target_count: number;
  deadline: string | null;
  active: boolean;
  abandoned: boolean;
  reward: string | null;
  consequence: string | null;
  created_at: string;
}

export interface StakeEntry {
  id: number;
  stake_id: number;
  note: string | null;
  amount: number | null;
  created_at: string;
}

export interface StakeWithProgress extends Stake {
  current_value: number;
  entry_count: number;
}

export async function getActiveStakes(): Promise<{
  data: StakeWithProgress[] | null;
  error: string | null;
}> {
  const supabase = getSupabaseAdmin();

  const { data: stakes, error: stakesError } = await supabase
    .from("stakes")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (stakesError) {
    return { data: null, error: stakesError.message };
  }

  if (!stakes || stakes.length === 0) {
    return { data: [], error: null };
  }

  // Get entry amounts for each stake
  const stakeIds = stakes.map((s) => s.id);
  const { data: entries, error: entriesError } = await supabase
    .from("stake_entries")
    .select("stake_id, amount")
    .in("stake_id", stakeIds);

  if (entriesError) {
    return { data: null, error: entriesError.message };
  }

  const sumMap: Record<number, number> = {};
  const countMap: Record<number, number> = {};
  for (const entry of entries || []) {
    sumMap[entry.stake_id] = (sumMap[entry.stake_id] || 0) + (entry.amount ?? 0);
    countMap[entry.stake_id] = (countMap[entry.stake_id] || 0) + 1;
  }

  const result: StakeWithProgress[] = stakes.map((s) => ({
    ...s,
    current_value: sumMap[s.id] || 0,
    entry_count: countMap[s.id] || 0,
  }));

  return { data: result, error: null };
}

export async function createStake(
  title: string,
  targetCount: number,
  deadline: string | null,
  reward: string | null,
  consequence: string | null
): Promise<{ data: StakeWithProgress | null; error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("stakes")
    .insert([{ title, target_count: targetCount, deadline, reward, consequence }])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { ...data, current_value: 0, entry_count: 0 }, error: null };
}

export async function addStakeEntry(
  stakeId: number,
  note: string | null,
  amount: number | null
): Promise<{ data: StakeEntry | null; error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("stake_entries")
    .insert([{ stake_id: stakeId, note, amount }])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getInactiveStakes(): Promise<{
  data: StakeWithProgress[] | null;
  error: string | null;
}> {
  const supabase = getSupabaseAdmin();

  const { data: stakes, error: stakesError } = await supabase
    .from("stakes")
    .select("*")
    .eq("active", false)
    .order("created_at", { ascending: false });

  if (stakesError) {
    return { data: null, error: stakesError.message };
  }

  if (!stakes || stakes.length === 0) {
    return { data: [], error: null };
  }

  const stakeIds = stakes.map((s) => s.id);
  const { data: entries, error: entriesError } = await supabase
    .from("stake_entries")
    .select("stake_id, amount")
    .in("stake_id", stakeIds);

  if (entriesError) {
    return { data: null, error: entriesError.message };
  }

  const sumMap: Record<number, number> = {};
  const countMap: Record<number, number> = {};
  for (const entry of entries || []) {
    sumMap[entry.stake_id] = (sumMap[entry.stake_id] || 0) + (entry.amount ?? 0);
    countMap[entry.stake_id] = (countMap[entry.stake_id] || 0) + 1;
  }

  const result: StakeWithProgress[] = stakes.map((s) => ({
    ...s,
    current_value: sumMap[s.id] || 0,
    entry_count: countMap[s.id] || 0,
  }));

  return { data: result, error: null };
}

export async function deactivateStake(
  stakeId: number
): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("stakes")
    .update({ active: false })
    .eq("id", stakeId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function abandonStake(
  stakeId: number
): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("stakes")
    .update({ active: false, abandoned: true })
    .eq("id", stakeId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function getStakeEntries(
  stakeId: number
): Promise<{ data: StakeEntry[] | null; error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("stake_entries")
    .select("*")
    .eq("stake_id", stakeId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data || [], error: null };
}
