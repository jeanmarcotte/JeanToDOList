'use client';

import { useState, useEffect } from 'react';
import { HabitStatus, getTodayHabits, toggleHabit } from '@/actions/habits';

export default function HabitsTab() {
    const [habits, setHabits] = useState<HabitStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    useEffect(() => {
        loadHabits();
    }, []);

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
            const { completed, error } = await toggleHabit(habitKey);
            if (error) throw new Error(error);

            setHabits(habits.map(h =>
                h.habit.key === habitKey ? { ...h, completed } : h
            ));
        } catch (error) {
            console.error('Error toggling habit:', error);
        } finally {
            setToggling(null);
        }
    };

    // Only show applicable habits (correct day of week)
    const visibleHabits = habits.filter(h => h.applicable);
    const completedCount = visibleHabits.filter(h => h.completed || h.skipped).length;
    const totalCount = visibleHabits.length;
    const allDone = totalCount > 0 && completedCount === totalCount;

    if (loading) {
        return <p className="text-center text-gray-400">Loading habits...</p>;
    }

    if (visibleHabits.length === 0) {
        return <p className="text-center text-gray-400">No habits scheduled for today.</p>;
    }

    return (
        <div>
            {/* Progress counter */}
            <div className="text-center mb-6">
                <span className="text-3xl font-bold text-green-400">
                    {completedCount} / {totalCount}
                </span>
                <p className="text-gray-500 text-sm mt-1">habits completed today</p>
            </div>

            {/* All done banner */}
            {allDone && (
                <div className="mb-6 p-4 bg-green-900/20 border-2 border-green-600 rounded-lg text-center">
                    <p className="text-xl font-bold text-green-400">All habits done for today!</p>
                </div>
            )}

            {/* Habit list */}
            <div className="space-y-3">
                {visibleHabits.map(({ habit, completed, skipped }) => {
                    const isCriticalIncomplete = habit.critical && !completed && !skipped;

                    return (
                        <div
                            key={habit.key}
                            className={`bg-gray-900 px-6 py-4 rounded-lg border-2 flex items-center gap-4 ${
                                isCriticalIncomplete
                                    ? 'border-red-500'
                                    : completed
                                    ? 'border-green-900 opacity-60'
                                    : 'border-gray-700'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={completed || skipped}
                                disabled={skipped || toggling === habit.key}
                                onChange={() => handleToggle(habit.key)}
                                className="w-5 h-5 accent-green-500 cursor-pointer disabled:cursor-default"
                            />
                            <div className="flex-1">
                                <span className={`text-lg ${
                                    completed || skipped ? 'line-through text-gray-500' : 'text-white'
                                }`}>
                                    {habit.label}
                                </span>
                                {skipped && (
                                    <span className="ml-2 text-xs bg-yellow-800 text-yellow-300 px-2 py-0.5 rounded">
                                        Wedding/show day — skipped
                                    </span>
                                )}
                            </div>
                            {isCriticalIncomplete && (
                                <span className="text-xs bg-red-800 text-red-300 px-2 py-1 rounded font-bold">
                                    CRITICAL
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
