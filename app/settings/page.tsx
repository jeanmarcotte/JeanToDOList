'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SkipDay, getSkipDays, addSkipDay, deleteSkipDay } from '@/actions/skip-days';
import { Habit, getHabits, createHabit, updateHabit, deleteHabit } from '@/actions/habits';

const REASON_OPTIONS = ['Wedding', 'Bridal Show', 'Birthday', 'Recovery', 'Vacation', 'Other'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
}

export default function SettingsPage() {
    // Skip days state
    const [skipDays, setSkipDays] = useState<SkipDay[]>([]);
    const [skipLoading, setSkipLoading] = useState(true);
    const [skipMonth, setSkipMonth] = useState(new Date().getMonth() + 1);
    const [skipDay, setSkipDay] = useState(new Date().getDate());
    const [skipYear, setSkipYear] = useState(new Date().getFullYear());
    const [reason, setReason] = useState('Wedding');
    const [autoRecovery, setAutoRecovery] = useState(false);
    const [submittingSkip, setSubmittingSkip] = useState(false);

    // Habits state
    const [habits, setHabits] = useState<Habit[]>([]);
    const [habitsLoading, setHabitsLoading] = useState(true);
    const [newLabel, setNewLabel] = useState('');
    const [newFrequency, setNewFrequency] = useState<'daily' | 'specific_days'>('daily');
    const [newDays, setNewDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
    const [newSkippable, setNewSkippable] = useState(true);
    const [newCritical, setNewCritical] = useState(false);
    const [submittingHabit, setSubmittingHabit] = useState(false);

    useEffect(() => {
        loadSkipDays();
        loadHabits();
    }, []);

    // Skip days
    const loadSkipDays = async () => {
        try {
            const { data, error } = await getSkipDays();
            if (error) throw new Error(error);
            setSkipDays(data || []);
        } catch (error) {
            console.error('Error loading skip days:', error);
        } finally {
            setSkipLoading(false);
        }
    };

    const handleAddSkip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) return;
        const date = `${skipYear}-${String(skipMonth).padStart(2, '0')}-${String(skipDay).padStart(2, '0')}`;
        setSubmittingSkip(true);
        try {
            const { error } = await addSkipDay(date, reason, autoRecovery);
            if (error) throw new Error(error);
            setAutoRecovery(false);
            await loadSkipDays();
        } catch (error) {
            console.error('Error adding skip day:', error);
            alert(String(error));
        } finally {
            setSubmittingSkip(false);
        }
    };

    const handleDeleteSkip = async (id: number) => {
        try {
            const { error } = await deleteSkipDay(id);
            if (error) throw new Error(error);
            setSkipDays(skipDays.filter(d => d.id !== id));
        } catch (error) {
            console.error('Error deleting skip day:', error);
        }
    };

    // Habits
    const loadHabits = async () => {
        try {
            const { data, error } = await getHabits();
            if (error) throw new Error(error);
            setHabits(data || []);
        } catch (error) {
            console.error('Error loading habits:', error);
        } finally {
            setHabitsLoading(false);
        }
    };

    const handleAddHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLabel.trim()) return;
        setSubmittingHabit(true);
        try {
            const { error } = await createHabit({
                label: newLabel.trim(),
                frequency: newFrequency,
                specific_days: newFrequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : newDays,
                skippable: newSkippable,
                critical: newCritical,
            });
            if (error) throw new Error(error);
            setNewLabel('');
            setNewFrequency('daily');
            setNewDays([0, 1, 2, 3, 4, 5, 6]);
            setNewSkippable(true);
            setNewCritical(false);
            await loadHabits();
        } catch (error) {
            console.error('Error adding habit:', error);
            alert(String(error));
        } finally {
            setSubmittingHabit(false);
        }
    };

    const handleToggleActive = async (habit: Habit) => {
        try {
            const { error } = await updateHabit(habit.id, { active: !habit.active });
            if (error) throw new Error(error);
            setHabits(habits.map(h => h.id === habit.id ? { ...h, active: !h.active } : h));
        } catch (error) {
            console.error('Error updating habit:', error);
        }
    };

    const handleToggleSkippable = async (habit: Habit) => {
        try {
            const { error } = await updateHabit(habit.id, { skippable: !habit.skippable });
            if (error) throw new Error(error);
            setHabits(habits.map(h => h.id === habit.id ? { ...h, skippable: !h.skippable } : h));
        } catch (error) {
            console.error('Error updating habit:', error);
        }
    };

    const handleToggleCritical = async (habit: Habit) => {
        try {
            const { error } = await updateHabit(habit.id, { critical: !habit.critical });
            if (error) throw new Error(error);
            setHabits(habits.map(h => h.id === habit.id ? { ...h, critical: !h.critical } : h));
        } catch (error) {
            console.error('Error updating habit:', error);
        }
    };

    const handleDeleteHabit = async (id: number) => {
        try {
            const { error } = await deleteHabit(id);
            if (error) throw new Error(error);
            setHabits(habits.map(h => h.id === id ? { ...h, active: false } : h));
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    };

    const toggleDay = (day: number) => {
        setNewDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-black text-white p-4">
            <div className="max-w-2xl mx-auto py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="text-gray-400 hover:text-white text-sm">&larr; Back</Link>
                    <h1 className="text-3xl font-bold">Settings</h1>
                </div>

                {/* Manage Habits Section */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-200 mb-4">Manage Habits</h2>

                    {/* Add Habit Form */}
                    <form onSubmit={handleAddHabit} className="mb-6 p-4 bg-gray-900 rounded-lg border-2 border-gray-700 space-y-4">
                        <h3 className="text-lg font-bold text-gray-300">Add Habit</h3>
                        <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="Habit name..."
                            required
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                        <div className="flex gap-4 items-center">
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input
                                    type="radio"
                                    name="frequency"
                                    checked={newFrequency === 'daily'}
                                    onChange={() => setNewFrequency('daily')}
                                    className="accent-blue-500"
                                />
                                Daily
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input
                                    type="radio"
                                    name="frequency"
                                    checked={newFrequency === 'specific_days'}
                                    onChange={() => setNewFrequency('specific_days')}
                                    className="accent-blue-500"
                                />
                                Specific Days
                            </label>
                        </div>
                        {newFrequency === 'specific_days' && (
                            <div className="flex gap-2 flex-wrap">
                                {DAY_LABELS.map((label, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => toggleDay(i)}
                                        className={`px-3 py-1 rounded text-sm ${
                                            newDays.includes(i)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-400'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-400">
                                <input
                                    type="checkbox"
                                    checked={newSkippable}
                                    onChange={(e) => setNewSkippable(e.target.checked)}
                                    className="accent-blue-500"
                                />
                                Skippable on skip days
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-400">
                                <input
                                    type="checkbox"
                                    checked={newCritical}
                                    onChange={(e) => setNewCritical(e.target.checked)}
                                    className="accent-red-500"
                                />
                                Critical (urgent UI)
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={submittingHabit}
                            className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                        >
                            {submittingHabit ? 'Adding...' : 'Add Habit'}
                        </button>
                    </form>

                    {/* Habits List */}
                    {habitsLoading ? (
                        <p className="text-center text-gray-400">Loading habits...</p>
                    ) : habits.length === 0 ? (
                        <p className="text-center text-gray-400">No habits configured.</p>
                    ) : (
                        <div className="space-y-2">
                            {habits.map((habit) => (
                                <div
                                    key={habit.id}
                                    className={`bg-gray-900 px-4 py-3 rounded-lg border flex items-center justify-between gap-3 ${
                                        habit.active ? 'border-gray-700' : 'border-gray-800 opacity-50'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-white font-medium">{habit.label}</span>
                                            {habit.critical && (
                                                <span className="text-xs bg-red-800 text-red-300 px-1.5 py-0.5 rounded">critical</span>
                                            )}
                                            {!habit.skippable && (
                                                <span className="text-xs bg-yellow-800 text-yellow-300 px-1.5 py-0.5 rounded">no-skip</span>
                                            )}
                                            {!habit.active && (
                                                <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">inactive</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {habit.frequency === 'daily'
                                                ? 'Every day'
                                                : habit.specific_days.map(d => DAY_LABELS[d]).join(', ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleToggleSkippable(habit)}
                                            className={`text-xs px-2 py-1 rounded ${
                                                habit.skippable ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                                            }`}
                                            title={habit.skippable ? 'Skippable' : 'Not skippable'}
                                        >
                                            Skip
                                        </button>
                                        <button
                                            onClick={() => handleToggleCritical(habit)}
                                            className={`text-xs px-2 py-1 rounded ${
                                                habit.critical ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-400'
                                            }`}
                                            title={habit.critical ? 'Critical' : 'Not critical'}
                                        >
                                            Crit
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(habit)}
                                            className={`text-xs px-2 py-1 rounded ${
                                                habit.active ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'
                                            }`}
                                        >
                                            {habit.active ? 'Active' : 'Off'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteHabit(habit.id)}
                                            className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Skip Days Section */}
                <div>
                    <h2 className="text-xl font-bold text-gray-200 mb-4">Skip Days</h2>

                    {/* Add Form */}
                    <form onSubmit={handleAddSkip} className="mb-6 p-4 bg-gray-900 rounded-lg border-2 border-gray-700 space-y-4">
                        <h3 className="text-lg font-bold text-gray-300">Add Skip Day</h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                                <select
                                    value={skipMonth}
                                    onChange={(e) => {
                                        const m = Number(e.target.value);
                                        setSkipMonth(m);
                                        const maxDay = daysInMonth(m, skipYear);
                                        if (skipDay > maxDay) setSkipDay(maxDay);
                                    }}
                                    className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none flex-1"
                                >
                                    {MONTH_NAMES.map((name, i) => (
                                        <option key={i} value={i + 1}>{name}</option>
                                    ))}
                                </select>
                                <select
                                    value={skipDay}
                                    onChange={(e) => setSkipDay(Number(e.target.value))}
                                    className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none w-20"
                                >
                                    {Array.from({ length: daysInMonth(skipMonth, skipYear) }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                                    ))}
                                </select>
                                <select
                                    value={skipYear}
                                    onChange={(e) => {
                                        const y = Number(e.target.value);
                                        setSkipYear(y);
                                        const maxDay = daysInMonth(skipMonth, y);
                                        if (skipDay > maxDay) setSkipDay(maxDay);
                                    }}
                                    className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none w-24"
                                >
                                    {[skipYear - 1, skipYear, skipYear + 1, skipYear + 2].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none flex-1"
                                >
                                    {REASON_OPTIONS.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    disabled={submittingSkip}
                                    className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                                >
                                    {submittingSkip ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-400">
                            <input
                                type="checkbox"
                                checked={autoRecovery}
                                onChange={(e) => setAutoRecovery(e.target.checked)}
                                className="accent-blue-500"
                            />
                            Also add next day as recovery day
                        </label>
                    </form>

                    {/* Skip Days List */}
                    {skipLoading ? (
                        <p className="text-center text-gray-400">Loading skip days...</p>
                    ) : skipDays.length === 0 ? (
                        <p className="text-center text-gray-400">No skip days configured.</p>
                    ) : (
                        <div className="space-y-2">
                            {skipDays.map((day) => (
                                <div
                                    key={day.id}
                                    className="bg-gray-900 px-4 py-3 rounded-lg border border-gray-700 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-300 font-mono">{day.date}</span>
                                        <span className="text-white">{formatDate(day.date)}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            day.reason === 'Wedding' ? 'bg-yellow-800 text-yellow-300' :
                                            day.reason === 'Bridal Show' ? 'bg-purple-800 text-purple-300' :
                                            day.reason === 'Recovery' ? 'bg-blue-800 text-blue-300' :
                                            'bg-gray-700 text-gray-300'
                                        }`}>
                                            {day.reason}
                                        </span>
                                        {day.auto_recovery && (
                                            <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">
                                                +recovery
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSkip(day.id)}
                                        className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
