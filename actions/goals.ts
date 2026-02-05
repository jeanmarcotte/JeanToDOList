"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Goal {
    id: number;
    title: string;
    target_date: string;
    status: 'active' | 'completed';
    created_at: string;
    completed_at: string | null;
}

export async function getGoals() {
    const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("status", "active")
        .order("target_date", { ascending: true });
    return { data: data as Goal[] | null, error: error?.message };
}

export async function addGoal(title: string, targetDate: string) {
    const { data, error } = await supabase
        .from("goals")
        .insert([{ title, target_date: targetDate, status: 'active' }])
        .select()
        .single();
    return { data: data as Goal | null, error: error?.message };
}

export async function completeGoal(id: number) {
    const { error } = await supabase
        .from("goals")
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq("id", id);
    return { error: error?.message };
}

export async function deleteGoal(id: number) {
    const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", id);
    return { error: error?.message };
}

export async function getActiveGoalCount() {
    const { count, error } = await supabase
        .from("goals")
        .select("*", { count: 'exact', head: true })
        .eq("status", "active");
    return { count: count ?? 0, error: error?.message };
}
