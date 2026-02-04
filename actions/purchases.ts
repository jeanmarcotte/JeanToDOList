"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type BuyCategory = 'SIGS' | 'Personal' | 'Dream';
export type Priority = 'high' | 'medium' | 'low';

export interface Purchase {
    id: number;
    title: string;
    priority: Priority;
    category: BuyCategory | null;
    due_date: string | null;
    completed: boolean;
    created_at: string;
}

export async function getPurchases() {
    const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .order("created_at", { ascending: false });

    return { data: data as Purchase[] | null, error: error?.message };
}

export async function createPurchase(
    title: string,
    priority: Priority,
    category: BuyCategory | null,
    due_date: string | null
) {
    const { data, error } = await supabase
        .from("purchases")
        .insert([{ title, priority, category, due_date }])
        .select()
        .single();

    return { data: data as Purchase | null, error: error?.message };
}

export async function updatePurchaseCompletion(id: number, completed: boolean) {
    const { error } = await supabase
        .from("purchases")
        .update({ completed })
        .eq("id", id);

    return { error: error?.message };
}

export async function deletePurchase(id: number) {
    const { error } = await supabase
        .from("purchases")
        .delete()
        .eq("id", id);

    return { error: error?.message };
}