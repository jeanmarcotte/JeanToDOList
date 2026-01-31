"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PRIVATE_SUPABASE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface SkipDay {
  id: number;
  date: string;
  reason: string;
  auto_recovery: boolean;
  created_at: string;
}

export async function getSkipDays(): Promise<{
  data: SkipDay[] | null;
  error: string | null;
}> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("skip_days")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function addSkipDay(
  date: string,
  reason: string,
  autoRecovery: boolean
): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("skip_days")
    .insert({ date, reason, auto_recovery: autoRecovery });

  if (error) {
    return { error: error.message };
  }

  // If auto-recovery is enabled, also insert the next day as a Recovery entry
  if (autoRecovery) {
    const nextDay = new Date(date + "T00:00:00");
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDateStr = nextDay.toISOString().split("T")[0];

    const { error: recoveryError } = await supabase
      .from("skip_days")
      .insert({ date: nextDateStr, reason: "Recovery", auto_recovery: false });

    if (recoveryError) {
      return { error: `Skip day added but recovery day failed: ${recoveryError.message}` };
    }
  }

  return { error: null };
}

export async function deleteSkipDay(
  id: number
): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("skip_days").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}
