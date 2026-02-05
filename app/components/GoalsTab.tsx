'use client';

import { useState, useEffect } from 'react';
import {
    Goal,
    getGoals,
    addGoal,
    completeGoal,
    deleteGoal,
} from '@/actions/goals';
import GoalCelebration from './GoalCelebration';

type HeatLevel = 'cool' | 'warm' | 'hot' | 'overdue';

function getHeatLevel(targetDate: string): HeatLevel {
    const now = new Date();
    const target = new Date(targetDate + 'T12:00:00');
    const daysRemaining = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 7) return 'hot';
    if (daysRemaining <= 30) return 'warm';
    return 'cool';
}

export default function GoalsTab() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [titleInput, setTitleInput] = useState('');
    const [dateInput, setDateInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [celebratingGoal, setCelebratingGoal] = useState<string | null>(null);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        const { data, error } = await getGoals();
        if (error) console.error(error);
        setGoals(data || []);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!titleInput.trim() || !dateInput) return;
        const { data, error } = await addGoal(titleInput, dateInput);
        if (error) {
            console.error(error);
            return;
        }
        if (data) {
            setGoals([...goals, data].sort((a, b) => a.target_date.localeCompare(b.target_date)));
            setTitleInput('');
            setDateInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && titleInput.trim() && dateInput) handleAdd();
    };

    const handleComplete = async (id: number) => {
        const goal = goals.find(g => g.id === id);
        if (!goal) return;
        const { error } = await completeGoal(id);
        if (error) {
            console.error(error);
            return;
        }
        setCelebratingGoal(goal.title);
        setGoals(goals.filter(g => g.id !== id));
    };

    const handleDelete = async (id: number) => {
        const goal = goals.find(g => g.id === id);
        if (!goal) return;
        if (window.confirm(`Remove goal: "${goal.title}"?`)) {
            const { error } = await deleteGoal(id);
            if (error) {
                console.error(error);
                return;
            }
            setGoals(goals.filter(g => g.id !== id));
        }
    };

    const getDaysRemaining = (targetDate: string) => {
        const now = new Date();
        const target = new Date(targetDate + 'T12:00:00');
        return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    const getDaysLabel = (days: number) => {
        if (days < 0) return `${Math.abs(days)} days overdue`;
        if (days === 0) return 'Due today';
        if (days === 1) return '1 day left';
        return `${days} days left`;
    };

    const getHeatStyles = (heat: HeatLevel) => {
        switch (heat) {
            case 'cool':
                return {
                    border: 'border-l-green-500',
                    badge: 'bg-green-900 text-green-300',
                    dot: 'bg-green-500',
                };
            case 'warm':
                return {
                    border: 'border-l-yellow-500',
                    badge: 'bg-yellow-900 text-yellow-300',
                    dot: 'bg-yellow-500',
                };
            case 'hot':
                return {
                    border: 'border-l-orange-500',
                    badge: 'bg-orange-900 text-orange-300',
                    dot: 'bg-orange-500 animate-pulse',
                };
            case 'overdue':
                return {
                    border: 'border-l-red-500',
                    badge: 'bg-red-900 text-red-300',
                    dot: 'bg-red-500 animate-pulse',
                };
        }
    };

    const formatTargetDate = (date: string) => {
        const d = new Date(date + 'T12:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return <p className="text-center text-gray-500">Loading goals...</p>;
    }

    return (
        <>
            {/* Stats */}
            <div className="flex justify-center gap-6 mb-8 text-sm">
                <div className="text-center">
                    <div className="text-2xl font-bold text-teal-500">{goals.length}</div>
                    <div className="text-gray-500">Active Goals</div>
                </div>
            </div>

            {/* Input */}
            <div className="mb-8">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="What's the goal?"
                        className="flex-1 bg-gray-900 text-white text-lg px-6 py-4 rounded-lg border-2 border-gray-700 focus:border-teal-500 focus:outline-none"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!titleInput.trim() || !dateInput}
                        className={`px-6 py-4 rounded-lg font-bold text-lg transition-colors ${
                            titleInput.trim() && dateInput
                                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Add
                    </button>
                </div>
                <div className="flex gap-2 mt-2">
                    <input
                        type="date"
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                        className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none"
                        style={{ colorScheme: 'dark' }}
                        placeholder="Target date"
                    />
                    {!dateInput && (
                        <span className="text-gray-500 text-sm self-center">← Target date required</span>
                    )}
                </div>
            </div>

            {/* Goal List */}
            {goals.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No goals set. What are you working toward?</p>
            ) : (
                <div className="space-y-3 mb-8">
                    {goals.map((goal) => {
                        const heat = getHeatLevel(goal.target_date);
                        const days = getDaysRemaining(goal.target_date);
                        const styles = getHeatStyles(heat);

                        return (
                            <div
                                key={goal.id}
                                className={`bg-gray-900 rounded-lg p-4 border-l-4 ${styles.border}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium mb-2">{goal.title}</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded ${styles.badge}`}>
                                                <span className={`w-2 h-2 rounded-full ${styles.dot}`}></span>
                                                {getDaysLabel(days)}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatTargetDate(goal.target_date)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => handleComplete(goal.id)}
                                            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded text-white text-sm font-bold"
                                            title="Goal achieved!"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            onClick={() => handleDelete(goal.id)}
                                            className="px-3 py-2 bg-red-900 hover:bg-red-800 rounded text-white text-sm font-bold"
                                            title="Remove goal"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Goal Celebration */}
            {celebratingGoal && (
                <GoalCelebration
                    goalTitle={celebratingGoal}
                    onClose={() => setCelebratingGoal(null)}
                />
            )}
        </>
    );
}
