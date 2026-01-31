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


const SHAME_MESSAGES = [
  "You had ONE job today. Well, several jobs. And you missed some. Do better tomorrow.",
  "Tomorrow is a new day. But today? Today you left things on the table.",
  "Your future self is disappointed. Make it up to them tomorrow.",
  "Incomplete habits don't build character. They build regret.",
  "The only person you're cheating is yourself. Sleep on that.",
];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" }); // YYYY-MM-DD
  const dayOfWeek = new Date(today + "T12:00:00").getDay();
  const dateDisplay = new Date(today + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Check skip day
  const { data: skipDay } = await supabase
    .from("skip_days")
    .select("reason")
    .eq("date", today)
    .maybeSingle();

  // Get today's habit completions
  const { data: habitLogs } = await supabase
    .from("habit_logs")
    .select("habit_key")
    .eq("completed_date", today);

  const completedKeys = new Set((habitLogs || []).map((l) => l.habit_key));

  // Fetch habits from DB
  const { data: allHabits } = await supabase
    .from("habits")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const todayHabits = (allHabits || []).filter((h: { specific_days: number[] }) => h.specific_days.includes(dayOfWeek));
  const habitResults = todayHabits.map((h: { habit_key: string; label: string; skippable: boolean; critical: boolean }) => {
    const isSkipped = skipDay && h.skippable;
    const completed = completedKeys.has(h.habit_key);
    return {
      label: h.label,
      completed: completed || !!isSkipped,
      skipped: !!isSkipped,
      critical: h.critical,
      reason: isSkipped ? skipDay.reason : null,
    };
  });

  // Get tasks
  const { data: allTasks } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  const completedTasks = (allTasks || []).filter((t) => t.completed);
  const incompleteTasks = (allTasks || []).filter((t) => !t.completed);

  // Calculate scores
  const habitsCompleted = habitResults.filter((h) => h.completed).length;
  const habitsMissed = habitResults.filter((h) => !h.completed).length;
  const anythingMissed = habitsMissed > 0 || incompleteTasks.length > 0;

  // Build habits HTML
  const habitsHtml = habitResults
    .map((h) => {
      if (h.skipped) {
        return `<li style="color:#9ca3af;">⏭️ ${h.label} (skipped - ${h.reason})</li>`;
      }
      if (h.completed) {
        return `<li style="color:#22c55e;">✅ ${h.label}</li>`;
      }
      const critical = h.critical ? ' <span style="color:#ef4444;font-weight:bold;">[CRITICAL]</span>' : "";
      return `<li style="color:#ef4444;">❌ ${h.label}${critical}</li>`;
    })
    .join("");

  // Build tasks HTML
  const catBadge = (t: { category?: string | null }) => t.category ? ` <span style="color:#9ca3af;font-size:12px;">[${t.category}]</span>` : '';
  const fmtDue = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dueBadge = (t: { due_date?: string | null }) => {
    if (!t.due_date) return '';
    const overdue = t.due_date < today;
    return ` <span style="color:${overdue ? '#ef4444' : '#9ca3af'};font-size:12px;">${overdue ? '⚠️ OVERDUE' : 'Due'} ${fmtDue(t.due_date)}</span>`;
  };

  const completedTasksHtml = completedTasks.length > 0
    ? completedTasks.map((t) => `<li style="color:#22c55e;">✅ ${t.title}${catBadge(t)}${dueBadge(t)}</li>`).join("")
    : '<li style="color:#9ca3af;">No tasks completed</li>';

  const incompleteTasksHtml = incompleteTasks.length > 0
    ? incompleteTasks.map((t) => `<li style="color:#ef4444;">❌ ${t.title}${catBadge(t)}${dueBadge(t)}</li>`).join("")
    : "";

  // Score summary
  const habitScore = todayHabits.length > 0
    ? Math.round((habitsCompleted / todayHabits.length) * 100)
    : 100;

  const scoreColor = habitScore === 100 ? "#22c55e" : habitScore >= 50 ? "#eab308" : "#ef4444";

  // Shame or praise
  let messageHtml = "";
  if (anythingMissed) {
    const shame = SHAME_MESSAGES[Math.floor(Math.random() * SHAME_MESSAGES.length)];
    messageHtml = `<div style="background:#7f1d1d;color:#fecaca;padding:16px;border-radius:6px;margin:24px 0;font-style:italic;">${shame}</div>`;
  } else {
    messageHtml = `<div style="background:#14532d;color:#bbf7d0;padding:16px;border-radius:6px;margin:24px 0;">Perfect day! Every habit done, every task handled. You earned this rest.</div>`;
  }

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#e5e5e5;padding:24px;border-radius:8px;">
      <h1 style="font-size:24px;margin:0 0 4px 0;">End of Day Report</h1>
      <p style="color:#9ca3af;margin:0 0 24px 0;">${dateDisplay}</p>

      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:48px;font-weight:bold;color:${scoreColor};">${habitScore}%</span>
        <p style="color:#9ca3af;margin:4px 0 0 0;">Habit Score</p>
      </div>

      ${messageHtml}

      <h2 style="font-size:18px;border-bottom:1px solid #333;padding-bottom:8px;">Habits (${habitsCompleted}/${todayHabits.length})</h2>
      <ul style="padding-left:20px;list-style:none;">${habitsHtml}</ul>

      <h2 style="font-size:18px;border-bottom:1px solid #333;padding-bottom:8px;margin-top:24px;">Tasks</h2>
      ${completedTasks.length > 0 ? `<h3 style="font-size:14px;color:#22c55e;margin-bottom:4px;">Completed (${completedTasks.length})</h3>` : ""}
      <ul style="padding-left:20px;list-style:none;">${completedTasksHtml}</ul>
      ${incompleteTasks.length > 0 ? `
        <h3 style="font-size:14px;color:#ef4444;margin-bottom:4px;margin-top:12px;">Still Pending (${incompleteTasks.length})</h3>
        <ul style="padding-left:20px;list-style:none;">${incompleteTasksHtml}</ul>
      ` : ""}

      <hr style="border:none;border-top:1px solid #333;margin:24px 0;" />
      <p style="color:#6b7280;font-size:12px;text-align:center;">JeanToDoList - End of Day Report</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: "JeanToDoList <onboarding@resend.dev>",
    to: "jeanmarcotte@gmail.com",
    subject: `🌙 JeanToDoList - ${dateDisplay} End of Day Report`,
    html,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
