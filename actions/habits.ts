"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PRIVATE_SUPABASE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface Habit {
  key: string;
  label: string;
  days: number[]; // 0=Sunday, 1=Monday, ... 6=Saturday
  skippable: boolean; // skipped on skip days
  critical: boolean; // e.g. heart meds — visually urgent
}

export interface HabitStatus {
  habit: Habit;
  completed: boolean;
  skipped: boolean; // skip day override
  skipReason: string | null; // e.g. "Wedding", "Bridal Show"
  applicable: boolean; // correct day of week
}

// Hardcoded habit definitions
const HABITS: Habit[] = [
  {
    key: "heart_meds",
    label: "Take heart meds",
    days: [0, 1, 2, 3, 4, 5, 6],
    skippable: false,
    critical: true,
  },
  {
    key: "post_meta",
    label: "Post on Meta",
    days: [0, 1, 2, 3, 4, 5, 6],
    skippable: true,
    critical: false,
  },
  {
    key: "google_business",
    label: "Post on Google Business",
    days: [2, 5], // Tuesday and Friday
    skippable: true,
    critical: false,
  },
  {
    key: "check_weight",
    label: "Check weight",
    days: [0, 1, 2, 3, 4, 5, 6],
    skippable: true,
    critical: false,
  },
  {
    key: "drink_water",
    label: "Drink 1 litre of water",
    days: [0, 1, 2, 3, 4, 5, 6],
    skippable: true,
    critical: false,
  },
];

function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function isDayApplicable(habit: Habit): boolean {
  const today = new Date().getDay(); // 0=Sunday
  return habit.days.includes(today);
}

export async function getTodayHabits(): Promise<{
  data: HabitStatus[] | null;
  error: string | null;
}> {
  const supabase = getSupabaseAdmin();
  const today = getTodayDateString();

  // Check if today is a skip day from the database
  const { data: skipDayRow, error: skipError } = await supabase
    .from("skip_days")
    .select("reason")
    .eq("date", today)
    .maybeSingle();

  if (skipError) {
    return { data: null, error: skipError.message };
  }

  const isSkip = !!skipDayRow;
  const skipReason = skipDayRow?.reason ?? null;

  const { data: logs, error } = await supabase
    .from("habit_logs")
    .select("habit_key")
    .eq("completed_date", today);

  if (error) {
    return { data: null, error: error.message };
  }

  const completedKeys = new Set((logs || []).map((l) => l.habit_key));

  const statuses: HabitStatus[] = HABITS.map((habit) => {
    const applicable = isDayApplicable(habit);
    const skipped = isSkip && habit.skippable;
    const completed = completedKeys.has(habit.key);

    return { habit, completed, skipped, skipReason: skipped ? skipReason : null, applicable };
  });

  return { data: statuses, error: null };
}

export async function toggleHabit(
  habitKey: string
): Promise<{ completed: boolean; error: string | null }> {
  const supabase = getSupabaseAdmin();
  const today = getTodayDateString();

  // Check if already logged today
  const { data: existing, error: fetchError } = await supabase
    .from("habit_logs")
    .select("id")
    .eq("habit_key", habitKey)
    .eq("completed_date", today)
    .maybeSingle();

  if (fetchError) {
    return { completed: false, error: fetchError.message };
  }

  if (existing) {
    // Delete the log (uncheck)
    const { error: deleteError } = await supabase
      .from("habit_logs")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      return { completed: false, error: deleteError.message };
    }
    return { completed: false, error: null };
  } else {
    // Insert new log (check)
    const { error: insertError } = await supabase
      .from("habit_logs")
      .insert({ habit_key: habitKey, completed_date: today });

    if (insertError) {
      return { completed: false, error: insertError.message };
    }
    return { completed: true, error: null };
  }
}
