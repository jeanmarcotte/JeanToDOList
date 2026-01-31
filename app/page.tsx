'use client';

import { useState, useEffect } from 'react';
import {
    Task,
    Priority,
    Category,
    CATEGORIES,
    getTasks,
    createTask,
    updateTaskCompletion,
    deleteTask,
    getCompletedCount,
} from '@/actions/tasks';
import Link from 'next/link';
import Celebration from "./components/Celebration";
import StakesTab from "./components/StakesTab";
import HabitsTab from "./components/HabitsTab";

type Tab = 'tasks' | 'stakes' | 'habits';

export default function Home() {
    const [activeTab, setActiveTab] = useState<Tab>('tasks');
    const [taskInput, setTaskInput] = useState('');
    const [newPriority, setNewPriority] = useState<Priority>('medium');
    const [newCategory, setNewCategory] = useState<Category | ''>('');
    const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
    const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [deletedTasks, setDeletedTasks] = useState<string[]>([]);
    const [showShameLog, setShowShameLog] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);
    const [milestone, setMilestone] = useState(0);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const { data, error } = await getTasks();
            if (error) throw new Error(error);
            setTasks(data || []);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async () => {
        if (!taskInput.trim()) return;
        try {
            const { data, error } = await createTask(
                taskInput,
                newPriority,
                newCategory || null
            );
            if (error) throw new Error(error);
            if (data) {
                setTasks([data, ...tasks]);
                setTaskInput('');
                setNewPriority('medium');
                setNewCategory('');
            }
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAddTask();
    };

    const toggleComplete = async (id: number) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        try {
            const { error } = await updateTaskCompletion(id, !task.completed);
            if (error) throw new Error(error);

            setTasks(tasks.map(t =>
                t.id === id ? { ...t, completed: !t.completed } : t
            ));

            // Check for milestone celebration (only when completing a task)
            if (!task.completed) {
                const { count } = await getCompletedCount();
                if (count > 0 && count % 50 === 0) {
                    setMilestone(count);
                    setShowCelebration(true);
                    setTimeout(() => setShowCelebration(false), 5000);
                }
            }

        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleDeleteTask = async (id: number) => {
        const taskToDelete = tasks.find(t => t.id === id);
        if (!taskToDelete) return;

        if (window.confirm(`Really give up on: "${taskToDelete.title}"?`)) {
            try {
                const { error } = await deleteTask(id);
                if (error) throw new Error(error);

                setDeletedTasks([...deletedTasks, taskToDelete.title]);
                setTasks(tasks.filter(task => task.id !== id));
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    };

    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const sortByPriority = (a: Task, b: Task) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);

    const filterTasks = (list: Task[]) => {
        let filtered = list;
        if (filterPriority !== 'all') filtered = filtered.filter(t => t.priority === filterPriority);
        if (filterCategory !== 'all') filtered = filtered.filter(t => t.category === filterCategory);
        return filtered;
    };

    const activeTasks = filterTasks(tasks.filter(t => !t.completed)).sort(sortByPriority);
    const completedTasks = filterTasks(tasks.filter(t => t.completed)).sort(sortByPriority);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="text-xl">Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4">
            <div className="max-w-2xl mx-auto py-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <h1 className="text-6xl font-bold text-center">JeanToDoList</h1>
                    <Link href="/settings" className="text-gray-500 hover:text-white transition-colors" title="Settings">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </Link>
                </div>
                <p className="text-xl text-gray-400 mb-6 text-center">
                    The app that makes sure it gets done.
                </p>

                {/* Tab Bar */}
                <div className="flex justify-center gap-1 mb-8 bg-gray-900 rounded-lg p-1 max-w-sm mx-auto">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                            activeTab === 'tasks'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('stakes')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                            activeTab === 'stakes'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Stakes
                    </button>
                    <button
                        onClick={() => setActiveTab('habits')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                            activeTab === 'habits'
                                ? 'bg-green-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Habits
                    </button>
                </div>

                {activeTab === 'stakes' && <StakesTab />}
                {activeTab === 'habits' && <HabitsTab />}

                {activeTab === 'tasks' && <>
                {/* Stats */}
                <div className="flex justify-center gap-6 mb-8 text-sm">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">{activeTasks.length}</div>
                        <div className="text-gray-500">Active</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">{completedTasks.length}</div>
                        <div className="text-gray-500">Completed</div>
                    </div>
                    {deletedTasks.length > 0 && (
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-500">{deletedTasks.length}</div>
                            <div className="text-gray-500">Deleted</div>
                        </div>
                    )}
                </div>

                <div className="mb-8">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={taskInput}
                            onChange={(e) => setTaskInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="What needs to get done?"
                            className="flex-1 bg-gray-900 text-white text-lg px-6 py-4 rounded-lg border-2 border-gray-700 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                            onClick={handleAddTask}
                            className="px-6 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <select
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value as Priority)}
                            className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                        <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value as Category | '')}
                            className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">No category</option>
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <div className="flex gap-1">
                        {(['all', 'high', 'medium', 'low'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setFilterPriority(p)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                    filterPriority === p
                                        ? p === 'high' ? 'bg-red-600 text-white'
                                            : p === 'medium' ? 'bg-yellow-600 text-white'
                                            : p === 'low' ? 'bg-gray-600 text-white'
                                            : 'bg-blue-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                            >
                                {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
                        className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full border-none focus:outline-none"
                    >
                        <option value="all">All categories</option>
                        {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {/* Celebration Message */}
                {tasks.length > 0 && activeTasks.length === 0 && (
                    <div className="mb-8 p-6 bg-green-900/20 border-2 border-green-600 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-400">🎉 All tasks complete!</p>
                        <p className="text-green-300 mt-2">You crushed it today.</p>
                    </div>
                )}

                {/* Active Tasks */}
                {activeTasks.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 text-gray-300">Active Tasks</h2>
                        <div className="space-y-3">
                            {activeTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className={`bg-gray-900 px-6 py-4 rounded-lg border-2 border-gray-700 flex items-center justify-between ${
                                        task.priority === 'high' ? 'border-l-4 border-l-red-500'
                                        : task.priority === 'medium' ? 'border-l-4 border-l-yellow-500'
                                        : ''
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-lg">{task.title}</p>
                                            {task.category && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">{task.category}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-2 shrink-0">
                                        <button
                                            onClick={() => toggleComplete(task.id)}
                                            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
                                        >
                                            Complete
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="px-4 py-2 rounded bg-red-900 hover:bg-red-800 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed Tasks (collapsible) */}
                {completedTasks.length > 0 && (
                    <div className="mb-8">
                        <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="text-gray-400 hover:text-gray-300 text-sm font-bold mb-4"
                        >
                            {showCompleted ? 'Hide' : 'Show'} completed ({completedTasks.length})
                        </button>
                        {showCompleted && (
                            <div className="space-y-3 mt-4">
                                {completedTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="bg-gray-900 px-6 py-4 rounded-lg border-2 border-green-900 flex items-center justify-between opacity-60"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-lg line-through text-gray-500">{task.title}</p>
                                                {task.category && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-500">{task.category}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-2 shrink-0">
                                            <button
                                                onClick={() => toggleComplete(task.id)}
                                                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700"
                                            >
                                                ✓ Done
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="px-4 py-2 rounded bg-red-900 hover:bg-red-800 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Shame Log Toggle */}
                {deletedTasks.length > 0 && (
                    <div className="mt-6">
                        <button
                            onClick={() => setShowShameLog(!showShameLog)}
                            className="text-gray-500 text-sm hover:text-gray-400"
                        >
                            {showShameLog ? 'Hide' : 'Show'} Shame Log ({deletedTasks.length})
                        </button>
                        {showShameLog && (
                            <div className="mt-3 p-4 bg-red-900/20 border-2 border-red-900 rounded-lg">
                                <p className="text-red-400 font-bold mb-2">Tasks you gave up on:</p>
                                {deletedTasks.map((task, index) => (
                                    <p key={index} className="text-red-300 text-sm">• {task}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                </>}
            </div>
            {showCelebration && (
                <Celebration
                    milestone={milestone}
                    onClose={() => setShowCelebration(false)}
                />
            )}
        </div>
);
}