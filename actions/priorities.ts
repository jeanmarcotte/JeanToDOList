"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Priority {
    id: number;
    title: string;
    sort_order: number;
    status: 'active' | 'completed' | 'dismissed';
    created_at: string;
    completed_at: string | null;
}

export async function getPriorities() {
    const { data, error } = await supabase
        .from("priorities")
        .select("*")
        .eq("status", "active")
        .order("sort_order", { ascending: true });
    return { data: data as Priority[] | null, error: error?.message };
}

export async function addPriority(title: string) {
    // Shift all existing items down by 1 to make room at top
    await supabase.rpc('increment_priority_sort_orders');

    const { data, error } = await supabase
        .from("priorities")
        .insert([{ title, sort_order: 0, status: 'active' }])
        .select()
        .single();
    return { data: data as Priority | null, error: error?.message };
}

export async function completePriority(id: number) {
    const { error } = await supabase
        .from("priorities")
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq("id", id);
    return { error: error?.message };
}

export async function dismissPriority(id: number) {
    const { error } = await supabase
        .from("priorities")
        .update({ status: 'dismissed', completed_at: new Date().toISOString() })
        .eq("id", id);
    return { error: error?.message };
}

export async function reorderPriorities(orderedIds: number[]) {
    const updates = orderedIds.map((id, index) =>
        supabase
            .from("priorities")
            .update({ sort_order: index })
            .eq("id", id)
    );
    const results = await Promise.all(updates);
    const firstError = results.find(r => r.error);
    return { error: firstError?.error?.message };
}

export async function moveToBottom(id: number) {
    const { data: existing } = await supabase
        .from("priorities")
        .select("sort_order")
        .eq("status", "active")
        .order("sort_order", { ascending: false })
        .limit(1);

    const maxOrder = existing && existing.length > 0 ? existing[0].sort_order : 0;

    const { error } = await supabase
        .from("priorities")
        .update({ sort_order: maxOrder + 1 })
        .eq("id", id);
    return { error: error?.message };
}

export async function getActivePriorityCount() {
    const { count, error } = await supabase
        .from("priorities")
        .select("*", { count: 'exact', head: true })
        .eq("status", "active");
    return { count: count ?? 0, error: error?.message };
}
