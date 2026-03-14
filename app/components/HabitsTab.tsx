'use client';

import { useState, useEffect } from 'react';
import { HabitStatus, getTodayHabits, toggleHabit } from '@/actions/habits';
import Celebration from './Celebration';

export default function HabitsTab() {
    const [habits, setHabits] = useState<HabitStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);
    const [streakToast, setStreakToast] = useState<{ habitLabel: string; days: number } | null>(null);
    const [celebration, setCelebration] = useState<{ milestone: number; legendary: boolean } | null>(null);

    useEffect(() => { loadHabits(); }, []);

    useEffect(() => {
        if (streakToast) {
            const timer = setTimeout(() => setStreakToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [streakToast]);

    const loadHabits = async () => {
        try {
            const { data, error } = await getTodayHabits();
            if (error) throw new Error(error);
            setHabits(data || []);
        } catch (error) {
            console.error('Error loading habits:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (habitKey: string) => {
        setToggling(habitKey);
        try {
            const { completed, milestone, error } = await toggleHabit(habitKey);
            if (error) throw new Error(error);
            setHabits(habits.map(h => h.habit.habit_key === habitKey ? { ...h, completed } : h));
            if (milestone) {
                const habit = habits.find(h => h.habit.habit_key === habitKey);
                if (milestone === 7) {
                    setStreakToast({ habitLabel: habit?.habit.label || '', days: 7 });
                } else {
                    setCelebration({ milestone, legendary: milestone >= 100 });
                }
            }
        } catch (error) {
            console.error('Error toggling habit:', error);
        } finally {
            setToggling(null);
        }
    };

    const visibleHabits = habits.filter(h => h.applicable);
    const completedCount = visibleHabits.filter(h => h.completed || h.skipped).length;
    const totalCount = visibleHabits.length;
    const allDone = totalCount > 0 && completedCount === totalCount;

    if (loading) return <p className="text-center text-gray-400">Loading habits...</p>;
    if (visibleHabits.length === 0) return <p className="text-center text-gray-400">No habits scheduled for today.</p>;

    return (
        <div>
            {streakToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-green-800 text-green-100 px-6 py-3 rounded-lg shadow-lg animate-bounce">
                    🔥 {streakToast.days}-day streak on &quot;{streakToast.habitLabel}&quot;!
                </div>
            )}

            {celebration && (
                <Celebration
                    milestone={celebration.milestone}
                    onClose={() => setCelebration(null)}
                    title="STREAK!"
                    subtitle={`${celebration.milestone} Days!`}
                    message={celebration.legendary ? `LEGENDARY! ${celebration.milestone} days in a row! You are unstoppable!` : `${celebration.milestone} days straight! Amazing consistency!`}
                    emoji={celebration.legendary ? "👑🔥👑" : "🔥🎉🔥"}
                    buttonText="Keep the streak alive!"
                />
            )}

            <div className="flex items-center justify-center mb-6">
                <div className="text-center">
                    <span className="text-3xl font-bold text-green-400">{completedCount} / {totalCount}</span>
                    <p className="text-gray-500 text-sm mt-1">habits completed today</p>
                </div>
            </div>

            {allDone && (
                <div className="mb-6 p-4 bg-green-900/20 border-2 border-green-600 rounded-lg text-center">
                    <p className="text-xl font-bold text-green-400">All habits done for today!</p>
                </div>
            )}

            <div className="space-y-3">
                {visibleHabits.map(({ habit, completed, skipped, skipReason, streak, missedDays }) => {
                    const isCriticalIncomplete = habit.critical && !completed && !skipped;
                    const isCriticalMissed = habit.critical && missedDays >= 1 && !completed;

                    return (
                        <div
                            key={habit.habit_key}
                            className={`bg-[#242424] px-6 py-4 rounded-lg border flex items-center gap-4 ${
                                isCriticalIncomplete ? 'border-red-500' : completed ? 'border-green-900/50 opacity-60' : 'border-[#333]'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={completed || skipped}
                                disabled={skipped || toggling === habit.habit_key}
                                onChange={() => handleToggle(habit.habit_key)}
                                className="w-5 h-5 accent-green-500 cursor-pointer disabled:cursor-default"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-lg ${completed || skipped ? 'line-through text-gray-500' : 'text-[#ededed]'}`}>{habit.label}</span>
                                    {streak > 0 && <span className="text-xs bg-orange-900/40 text-orange-400 px-2 py-0.5 rounded">🔥 {streak} {streak === 1 ? 'day' : 'days'}</span>}
                                    {skipped && <span className="text-xs bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded">{skipReason || 'Skip day'} — skipped</span>}
                                </div>
                                {!completed && !skipped && missedDays === 1 && <span className="text-xs text-red-400 mt-1 block">Missed yesterday</span>}
                                {!completed && !skipped && missedDays >= 2 && <span className="text-xs text-red-400 mt-1 block">Missed {missedDays} days straight</span>}
                            </div>
                            {isCriticalMissed && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-bold animate-pulse">TAKE YOUR MEDS!</span>}
                            {isCriticalIncomplete && !isCriticalMissed && <span className="text-xs bg-red-900/40 text-red-400 px-2 py-1 rounded font-bold">CRITICAL</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
