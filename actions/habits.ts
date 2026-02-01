"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PRIVATE_SUPABASE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface Habit {
  id: number;
  habit_key: string;
  label: string;
  frequency: string;
  specific_days: number[];
  skippable: boolean;
  critical: boolean;
  active: boolean;
  sort_order: number;
}

export interface HabitStatus {
  habit: Habit;
  completed: boolean;
  skipped: boolean;
  skipReason: string | null;
  applicable: boolean;
  streak: number;
  missedDays: number;
  newMilestone: number | null;
}

const TZ = "America/Toronto";

function torontoDateString(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
}

function torontoDayOfWeek(date: Date = new Date()): number {
  // Return 0=Sunday..6=Saturday in Toronto time
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).formatToParts(date);
  const weekday = parts.find(p => p.type === "weekday")?.value || "";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}

function getTodayDateString(): string {
  return torontoDateString();
}

// Format a Date to YYYY-MM-DD in Toronto timezone
function getDateString(date: Date): string {
  return torontoDateString(date);
}

function isDayApplicable(habit: Habit, dayOfWeek: number): boolean {
  return habit.specific_days.includes(dayOfWeek);
}

// Fetch active habits from DB ordered by sort_order
export async function getActiveHabits(): Promise<Habit[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((h) => ({
    id: h.id,
    habit_key: h.habit_key,
    label: h.label,
    frequency: h.frequency,
    specific_days: h.specific_days,
    skippable: h.skippable,
    critical: h.critical,
    active: h.active,
    sort_order: h.sort_order,
  }));
}

// Calculate streaks and missed days for all habits
function calculateStreaksAndMissed(
  habits: Habit[],
  logs: { habit_key: string; completed_date: string }[],
  skipDays: { date: string; reason: string }[]
): Map<string, { streak: number; missedDays: number }> {
  const result = new Map<string, { streak: number; missedDays: number }>();

  // Index logs by habit_key -> Set of date strings
  const logsByHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!logsByHabit.has(log.habit_key)) {
      logsByHabit.set(log.habit_key, new Set());
    }
    logsByHabit.get(log.habit_key)!.add(log.completed_date);
  }

  // Index skip days by date
  const skipDayMap = new Map<string, string>();
  for (const sd of skipDays) {
    skipDayMap.set(sd.date, sd.reason);
  }

  for (const habit of habits) {
    let streak = 0;
    let missedDays = 0;
    const habitLogs = logsByHabit.get(habit.habit_key) || new Set<string>();

    // Walk backward from yesterday
    const now = new Date();
    const cursor = new Date(now);
    cursor.setDate(cursor.getDate() - 1); // start at yesterday

    // Calculate streak (consecutive completed days)
    let streakBroken = false;
    for (let i = 0; i < 365 && !streakBroken; i++) {
      const dateStr = getDateString(cursor);
      const dayOfWeek = torontoDayOfWeek(cursor);

      // Skip non-applicable days
      if (!isDayApplicable(habit, dayOfWeek)) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }

      // Skip days (for skippable habits) don't break or count
      if (habit.skippable && skipDayMap.has(dateStr)) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }

      if (habitLogs.has(dateStr)) {
        streak++;
      } else {
        streakBroken = true;
      }
      cursor.setDate(cursor.getDate() - 1);
    }

    // Calculate missed days (consecutive missed days from yesterday)
    const cursor2 = new Date(now);
    cursor2.setDate(cursor2.getDate() - 1);
    let missedBroken = false;
    for (let i = 0; i < 365 && !missedBroken; i++) {
      const dateStr = getDateString(cursor2);
      const dayOfWeek = torontoDayOfWeek(cursor2);

      if (!isDayApplicable(habit, dayOfWeek)) {
        cursor2.setDate(cursor2.getDate() - 1);
        continue;
      }

      if (habit.skippable && skipDayMap.has(dateStr)) {
        cursor2.setDate(cursor2.getDate() - 1);
        continue;
      }

      if (!habitLogs.has(dateStr)) {
        missedDays++;
      } else {
        missedBroken = true;
      }
      cursor2.setDate(cursor2.getDate() - 1);
    }

    result.set(habit.habit_key, { streak, missedDays });
  }

  return result;
}

export async function getTodayHabits(): Promise<{
  data: HabitStatus[] | null;
  error: string | null;
}> {
  const supabase = getSupabaseAdmin();
  const today = getTodayDateString();

  try {
    const habits = await getActiveHabits();

    // Check skip day
    const { data: skipDayRow, error: skipError } = await supabase
      .from("skip_days")
      .select("reason")
      .eq("date", today)
      .maybeSingle();

    if (skipError) return { data: null, error: skipError.message };

    const isSkip = !!skipDayRow;
    const skipReason = skipDayRow?.reason ?? null;

    // Fetch today's logs
    const { data: todayLogs, error: logError } = await supabase
      .from("habit_logs")
      .select("habit_key")
      .eq("completed_date", today);

    if (logError) return { data: null, error: logError.message };

    const completedKeys = new Set((todayLogs || []).map((l) => l.habit_key));

    // Batch fetch last 365 days of logs and all skip days for streak calc
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 365);
    const pastDateStr = getDateString(pastDate);

    const [logsResult, skipDaysResult] = await Promise.all([
      supabase
        .from("habit_logs")
        .select("habit_key, completed_date")
        .gte("completed_date", pastDateStr),
      supabase
        .from("skip_days")
        .select("date, reason")
        .gte("date", pastDateStr),
    ]);

    if (logsResult.error) return { data: null, error: logsResult.error.message };
    if (skipDaysResult.error) return { data: null, error: skipDaysResult.error.message };

    const streakData = calculateStreaksAndMissed(
      habits,
      logsResult.data || [],
      skipDaysResult.data || []
    );

    const dayOfWeek = torontoDayOfWeek();

    const statuses: HabitStatus[] = habits.map((habit) => {
      const applicable = isDayApplicable(habit, dayOfWeek);
      const skipped = isSkip && habit.skippable;
      const completed = completedKeys.has(habit.habit_key);
      const stats = streakData.get(habit.habit_key) || { streak: 0, missedDays: 0 };

      return {
        habit,
        completed,
        skipped,
        skipReason: skipped ? skipReason : null,
        applicable,
        streak: stats.streak,
        missedDays: stats.missedDays,
        newMilestone: null,
      };
    });

    return { data: statuses, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

const MILESTONES = [7, 30, 100];

export async function toggleHabit(
  habitKey: string
): Promise<{ completed: boolean; milestone: number | null; error: string | null }> {
  const supabase = getSupabaseAdmin();
  const today = getTodayDateString();

  const { data: existing, error: fetchError } = await supabase
    .from("habit_logs")
    .select("id")
    .eq("habit_key", habitKey)
    .eq("completed_date", today)
    .maybeSingle();

  if (fetchError) {
    return { completed: false, milestone: null, error: fetchError.message };
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("habit_logs")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      return { completed: false, milestone: null, error: deleteError.message };
    }
    return { completed: false, milestone: null, error: null };
  } else {
    const { error: insertError } = await supabase
      .from("habit_logs")
      .insert({ habit_key: habitKey, completed_date: today });

    if (insertError) {
      return { completed: false, milestone: null, error: insertError.message };
    }

    // Calculate streak to check for milestones
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 365);
    const pastDateStr = getDateString(pastDate);

    const [logsResult, skipDaysResult, habitResult] = await Promise.all([
      supabase
        .from("habit_logs")
        .select("habit_key, completed_date")
        .eq("habit_key", habitKey)
        .gte("completed_date", pastDateStr),
      supabase
        .from("skip_days")
        .select("date, reason")
        .gte("date", pastDateStr),
      supabase
        .from("habits")
        .select("*")
        .eq("habit_key", habitKey)
        .single(),
    ]);

    if (logsResult.error || skipDaysResult.error || habitResult.error) {
      return { completed: true, milestone: null, error: null };
    }

    const habit: Habit = habitResult.data;
    const streakData = calculateStreaksAndMissed(
      [habit],
      logsResult.data || [],
      skipDaysResult.data || []
    );

    // After toggling on today, the streak from yesterday + 1 (today) = new streak
    const yesterdayStreak = streakData.get(habitKey)?.streak || 0;
    const newStreak = yesterdayStreak + 1; // +1 for today's completion

    const milestone = MILESTONES.includes(newStreak) ? newStreak : null;

    return { completed: true, milestone, error: null };
  }
}

// CRUD operations

// Get all habits (including inactive) for settings page
export async function getHabits(): Promise<{
  data: Habit[] | null;
  error: string | null;
}> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data: data as Habit[], error: null };
}

export async function createHabit(params: {
  label: string;
  frequency: string;
  specific_days: number[];
  skippable: boolean;
  critical: boolean;
}): Promise<{ data: Habit | null; error: string | null }> {
  const supabase = getSupabaseAdmin();

  // Generate habit_key from label
  const habit_key = params.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  // Get max sort_order
  const { data: maxRow } = await supabase
    .from("habits")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const sort_order = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("habits")
    .insert({
      habit_key,
      label: params.label,
      frequency: params.frequency,
      specific_days: params.specific_days,
      skippable: params.skippable,
      critical: params.critical,
      sort_order,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Habit, error: null };
}

export async function updateHabit(
  id: number,
  params: Partial<{
    label: string;
    frequency: string;
    specific_days: number[];
    skippable: boolean;
    critical: boolean;
    active: boolean;
    sort_order: number;
  }>
): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("habits").update(params).eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

// Soft delete: set active=false
export async function deleteHabit(id: number): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("habits")
    .update({ active: false })
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}
