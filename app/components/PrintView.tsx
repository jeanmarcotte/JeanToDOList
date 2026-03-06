import { PrintData } from '@/actions/print-data';

function formatDate(date: string) {
    const d = new Date(date + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(date: string) {
    const now = new Date();
    const target = new Date(date + 'T12:00:00');
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PrintView({ data, dateStr }: { data: PrintData; dateStr: string }) {
    const highTasks = data.tasks
        .filter(t => t.priority === 'high')
        .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'));
    const mediumTasks = data.tasks
        .filter(t => t.priority === 'medium')
        .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'));
    const lowTasks = data.tasks
        .filter(t => t.priority === 'low')
        .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'));

    return (
        <div id="print-view">
            <h1 className="print-title">Jean&apos;s Master List &mdash; {dateStr}</h1>

            {/* Priorities */}
            {data.priorities.length > 0 && (
                <section className="print-section">
                    <h2>Priorities</h2>
                    <ol>
                        {data.priorities.map((p) => (
                            <li key={p.id}>{p.title}</li>
                        ))}
                    </ol>
                </section>
            )}

            {/* Goals */}
            {data.goals.length > 0 && (
                <section className="print-section">
                    <h2>Goals</h2>
                    <ul>
                        {data.goals.map((g) => {
                            const days = daysUntil(g.target_date);
                            const label = days < 0
                                ? `OVERDUE by ${Math.abs(days)}d`
                                : days === 0
                                    ? 'Due today'
                                    : `${days}d left`;
                            return (
                                <li key={g.id}>
                                    {g.title}
                                    <span className="print-meta"> &mdash; {formatDate(g.target_date)} ({label})</span>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {/* Habits */}
            {data.habits.length > 0 && (
                <section className="print-section">
                    <h2>Habits</h2>
                    <ul>
                        {data.habits.map((h) => (
                            <li key={h.id}>
                                {h.critical && <span className="print-critical">!</span>}
                                {h.label}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Stakes */}
            {data.stakes.length > 0 && (
                <section className="print-section">
                    <h2>Stakes</h2>
                    <ul>
                        {data.stakes.map((s) => {
                            const pct = Math.round(Math.min(s.current_value / s.target_count, 1) * 100);
                            return (
                                <li key={s.id}>
                                    {s.title} &mdash; {s.current_value}/{s.target_count} ({pct}%)
                                    {s.deadline && <span className="print-meta"> &middot; Due {formatDate(s.deadline)}</span>}
                                    {s.reward && <span className="print-meta"> &middot; Reward: {s.reward}</span>}
                                    {s.consequence && <span className="print-meta"> &middot; Consequence: {s.consequence}</span>}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {/* Buy */}
            {data.purchases.length > 0 && (
                <section className="print-section">
                    <h2>Buy</h2>
                    <ul>
                        {data.purchases.map((p) => (
                            <li key={p.id}>
                                {p.title}
                                {p.category && <span className="print-meta"> [{p.category}]</span>}
                                {p.due_date && <span className="print-meta"> &middot; Need by {formatDate(p.due_date)}</span>}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Tasks */}
            <section className="print-section">
                <h2>Tasks</h2>

                {highTasks.length > 0 && (
                    <>
                        <h3>High Priority</h3>
                        <ul>
                            {highTasks.map((t) => (
                                <li key={t.id}>
                                    {t.title}
                                    {t.category && <span className="print-meta"> [{t.category}]</span>}
                                    {t.due_date && <span className="print-meta"> &middot; Due {formatDate(t.due_date)}</span>}
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {mediumTasks.length > 0 && (
                    <>
                        <h3>Medium Priority</h3>
                        <ul>
                            {mediumTasks.map((t) => (
                                <li key={t.id}>
                                    {t.title}
                                    {t.category && <span className="print-meta"> [{t.category}]</span>}
                                    {t.due_date && <span className="print-meta"> &middot; Due {formatDate(t.due_date)}</span>}
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {lowTasks.length > 0 && (
                    <>
                        <h3>Low Priority</h3>
                        <ul>
                            {lowTasks.map((t) => (
                                <li key={t.id}>
                                    {t.title}
                                    {t.category && <span className="print-meta"> [{t.category}]</span>}
                                    {t.due_date && <span className="print-meta"> &middot; Due {formatDate(t.due_date)}</span>}
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {highTasks.length === 0 && mediumTasks.length === 0 && lowTasks.length === 0 && (
                    <p>No active tasks.</p>
                )}
            </section>
        </div>
    );
}
