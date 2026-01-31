import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PRIVATE_SUPABASE_KEY!
  );
}

const HABITS = [
  { key: "heart_meds", label: "Take heart meds", days: [0, 1, 2, 3, 4, 5, 6], skippable: false, critical: true },
  { key: "post_meta", label: "Post on Meta", days: [0, 1, 2, 3, 4, 5, 6], skippable: true, critical: false },
  { key: "google_business", label: "Post on Google Business", days: [2, 5], skippable: true, critical: false },
  { key: "check_weight", label: "Check weight", days: [0, 1, 2, 3, 4, 5, 6], skippable: true, critical: false },
  { key: "drink_water", label: "Drink 1 litre of water", days: [0, 1, 2, 3, 4, 5, 6], skippable: true, critical: false },
];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/Toronto" }); // YYYY-MM-DD
  const dayOfWeek = new Date(today + "T12:00:00").getDay();
  const dateDisplay = new Date(today + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch incomplete tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("completed", false)
    .order("created_at", { ascending: false });

  // Check skip day
  const { data: skipDay } = await supabase
    .from("skip_days")
    .select("reason")
    .eq("date", today)
    .maybeSingle();

  // Today's applicable habits
  const todayHabits = HABITS.filter((h) => h.days.includes(dayOfWeek));
  const habitSection = todayHabits.map((h) => {
    const isSkipped = skipDay && h.skippable;
    const tag = h.critical ? ' <span style="color:#ef4444;font-weight:bold;">[CRITICAL]</span>' : "";
    if (isSkipped) {
      return `<li style="color:#9ca3af;text-decoration:line-through;">~${h.label}~ (skipped - ${skipDay.reason})${tag}</li>`;
    }
    return `<li>${h.label}${tag}</li>`;
  });

  // Active stakes
  const { data: stakes } = await supabase
    .from("stakes")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  let stakesHtml = "<p style='color:#9ca3af;'>No active stakes.</p>";
  if (stakes && stakes.length > 0) {
    const stakeIds = stakes.map((s) => s.id);
    const { data: entries } = await supabase
      .from("stake_entries")
      .select("stake_id, amount")
      .in("stake_id", stakeIds);

    const sumMap: Record<number, number> = {};
    for (const e of entries || []) {
      sumMap[e.stake_id] = (sumMap[e.stake_id] || 0) + (e.amount ?? 0);
    }

    stakesHtml = stakes
      .map((s) => {
        const current = sumMap[s.id] || 0;
        const pct = Math.min(100, Math.round((current / s.target_count) * 100));
        const deadline = s.deadline
          ? ` (due ${new Date(s.deadline + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
          : "";
        return `
          <div style="margin-bottom:12px;">
            <strong>${s.title}</strong>${deadline}
            ${s.reward ? `<br/><span style="color:#22c55e;">Reward: ${s.reward}</span>` : ""}
            ${s.consequence ? `<br/><span style="color:#ef4444;">Consequence: ${s.consequence}</span>` : ""}
            <div style="background:#333;border-radius:4px;height:20px;margin-top:4px;overflow:hidden;">
              <div style="background:#3b82f6;height:100%;width:${pct}%;border-radius:4px;text-align:center;color:white;font-size:12px;line-height:20px;">${current}/${s.target_count}</div>
            </div>
          </div>`;
      })
      .join("");
  }

  const priorityIcon = (p: string) => p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '⚪';

  const tasksHtml =
    tasks && tasks.length > 0
      ? `<ul style="padding-left:20px;">${tasks.map((t) => {
          const cat = t.category ? ` <span style="color:#9ca3af;font-size:12px;">[${t.category}]</span>` : '';
          return `<li>${priorityIcon(t.priority)} ${t.title}${cat}</li>`;
        }).join("")}</ul>`
      : '<p style="color:#22c55e;">All tasks completed! Nothing pending.</p>';

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#e5e5e5;padding:24px;border-radius:8px;">
      <h1 style="font-size:24px;margin:0 0 4px 0;">Good Morning, Jean!</h1>
      <p style="color:#9ca3af;margin:0 0 24px 0;">${dateDisplay}</p>

      ${skipDay ? `<div style="background:#854d0e;color:#fef3c7;padding:12px;border-radius:6px;margin-bottom:24px;">Skip Day: ${skipDay.reason}</div>` : ""}

      <h2 style="font-size:18px;border-bottom:1px solid #333;padding-bottom:8px;">Pending Tasks (${tasks?.length || 0})</h2>
      ${tasksHtml}

      <h2 style="font-size:18px;border-bottom:1px solid #333;padding-bottom:8px;margin-top:24px;">Today's Habits</h2>
      <ul style="padding-left:20px;">${habitSection.join("")}</ul>

      <h2 style="font-size:18px;border-bottom:1px solid #333;padding-bottom:8px;margin-top:24px;">Active Stakes</h2>
      ${stakesHtml}

      <hr style="border:none;border-top:1px solid #333;margin:24px 0;" />
      <p style="color:#6b7280;font-size:12px;text-align:center;">JeanToDoList - Morning Briefing</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: "JeanToDoList <onboarding@resend.dev>",
    to: "jeanmarcotte@gmail.com",
    subject: `☀️ JeanToDoList - ${dateDisplay} Morning Briefing`,
    html,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
