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
  skippable: boolean; // skipped on wedding days
  critical: boolean; // e.g. heart meds — visually urgent
}

export interface HabitStatus {
  habit: Habit;
  completed: boolean;
  skipped: boolean; // wedding day override
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

// Days where skippable habits are auto-skipped (YYYY-MM-DD format)
const WEDDING_DAYS: string[] = [
  "2026-02-07", "2026-03-21", "2026-03-28", "2026-04-24", "2026-05-02",
  "2026-05-09", "2026-05-15", "2026-05-16", "2026-05-23", "2026-05-30",
  "2026-06-06", "2026-06-12", "2026-06-20", "2026-06-26", "2026-07-03",
  "2026-07-14", "2026-07-31", "2026-08-02", "2026-08-15", "2026-09-05",
  "2026-09-06", "2026-09-12", "2026-09-13", "2026-09-19", "2026-10-03",
  "2026-10-16", "2026-12-05", "2027-02-27", "2027-07-10", "2027-08-28",
  "2027-10-31",
];

const SHOW_DAYS: string[] = [
  "2026-02-21", "2026-02-22", "2026-03-08", "2026-04-26",
  "2026-10-02", "2026-10-03", "2026-10-04",
];

function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function isSkipDay(): boolean {
  const today = getTodayDateString();
  return WEDDING_DAYS.includes(today) || SHOW_DAYS.includes(today);
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
  const skipDay = isSkipDay();

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
    const skipped = skipDay && habit.skippable;
    const completed = completedKeys.has(habit.key);

    return { habit, completed, skipped, applicable };
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
