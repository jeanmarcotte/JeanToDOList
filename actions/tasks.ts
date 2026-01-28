"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PRIVATE_SUPABASE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

export async function getTasks(): Promise<{ data: Task[] | null; error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function createTask(
  title: string
): Promise<{ data: Task | null; error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("tasks")
    .insert([{ title, completed: false }])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateTaskCompletion(
  id: number,
  completed: boolean
): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("tasks")
    .update({ completed })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function deleteTask(id: number): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// Get total count of ALL completed tasks (including deleted ones for all-time tracking)
export async function getCompletedCount(): Promise<{ count: number; error: string | null }> {
  const supabase = getSupabaseAdmin();

  const { count, error } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("completed", true);

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: count || 0, error: null };
}