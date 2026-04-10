"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
    return createClient(supabaseUrl, supabaseServiceKey);
}

export interface PrintData {
    priorities: { id: number; title: string; sort_order: number }[];
    goals: { id: number; title: string; target_date: string }[];
    habits: { id: number; label: string; critical: boolean }[];
    stakes: { id: number; title: string; target_count: number; current_value: number; deadline: string | null; reward: string | null; consequence: string | null }[];
    purchases: { id: number; title: string; priority: string; category: string | null; due_date: string | null }[];
    tasks: { id: number; title: string; priority: string; category: string | null; due_date: string | null }[];
}

export async function getAllPrintData(): Promise<{ data: PrintData | null; error: string | null }> {
    const supabase = getSupabaseAdmin();

    try {
        const [prioritiesRes, goalsRes, habitsRes, stakesRes, purchasesRes, tasksRes] = await Promise.all([
            supabase.from("todo_priorities").select("id, title, sort_order").eq("status", "active").order("sort_order", { ascending: true }),
            supabase.from("todo_goals").select("id, title, target_date").eq("status", "active").order("target_date", { ascending: true }),
            supabase.from("todo_habits").select("id, label, critical").eq("active", true).order("sort_order", { ascending: true }),
            supabase.from("todo_stakes").select("*").eq("active", true).order("created_at", { ascending: false }),
            supabase.from("todo_purchases").select("id, title, priority, category, due_date").eq("completed", false).order("created_at", { ascending: false }),
            supabase.from("todo_tasks").select("id, title, priority, category, due_date").eq("completed", false).order("created_at", { ascending: false }),
        ]);

        // Calculate stake progress
        let stakesWithProgress: PrintData["stakes"] = [];
        if (stakesRes.data && stakesRes.data.length > 0) {
            const stakeIds = stakesRes.data.map(s => s.id);
            const { data: entries } = await supabase
                .from("todo_stake_entries")
                .select("stake_id, amount")
                .in("stake_id", stakeIds);

            const sumMap: Record<number, number> = {};
            for (const entry of entries || []) {
                sumMap[entry.stake_id] = (sumMap[entry.stake_id] || 0) + (entry.amount ?? 0);
            }

            stakesWithProgress = stakesRes.data.map(s => ({
                id: s.id,
                title: s.title,
                target_count: s.target_count,
                current_value: sumMap[s.id] || 0,
                deadline: s.deadline,
                reward: s.reward,
                consequence: s.consequence,
            }));
        }

        return {
            data: {
                priorities: prioritiesRes.data || [],
                goals: goalsRes.data || [],
                habits: habitsRes.data || [],
                stakes: stakesWithProgress,
                purchases: purchasesRes.data || [],
                tasks: tasksRes.data || [],
            },
            error: null,
        };
    } catch (err) {
        return { data: null, error: String(err) };
    }
}
