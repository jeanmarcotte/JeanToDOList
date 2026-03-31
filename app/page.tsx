'use client';

import { useState, useEffect } from 'react';
import {
    Task,
    Priority,
    Category,
    getTasks,
    createTask,
    updateTask,
    updateTaskCompletion,
    deleteTask,
    getCompletedCount,
} from '@/actions/tasks';
import { CATEGORIES } from '@/lib/constants';
import { getTodaySkipDay } from '@/actions/skip-days';
import { getActivePriorityCount } from '@/actions/priorities';
import { getActiveGoalCount } from '@/actions/goals';
import { getAllPrintData, PrintData } from '@/actions/print-data';
import BuyTab from "./components/BuyTab";
import PrintView from "./components/PrintView";
import Link from 'next/link';
import { Printer } from 'lucide-react';
import Celebration from "./components/Celebration";
import StakesTab from "./components/StakesTab";
import HabitsTab from "./components/HabitsTab";
import PrioritiesTab from "./components/PrioritiesTab";
import GoalsTab from "./components/GoalsTab";

type Tab = 'tasks' | 'buy' | 'stakes' | 'habits' | 'priorities' | 'goals';

export default function Home() {
    const [activeTab, setActiveTab] = useState<Tab>('tasks');
    const [taskInput, setTaskInput] = useState('');
    const [newPriority, setNewPriority] = useState<Priority>('medium');
    const [newCategory, setNewCategory] = useState<Category | ''>('');
    const [newDueDate, setNewDueDate] = useState('');
    const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
    const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [deletedTasks, setDeletedTasks] = useState<string[]>([]);
    const [showShameLog, setShowShameLog] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);
    const [milestone, setMilestone] = useState(0);
    const [skipDayReason, setSkipDayReason] = useState<string | null>(null);
    const [torontoTime, setTorontoTime] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editPriority, setEditPriority] = useState<Priority>('medium');
    const [editCategory, setEditCategory] = useState<Category | ''>('');
    const [editDueDate, setEditDueDate] = useState('');
    const [priorityCount, setPriorityCount] = useState(0);
    const [goalCount, setGoalCount] = useState(0);
    const [printData, setPrintData] = useState<PrintData | null>(null);

    useEffect(() => {
        loadTasks();
        getTodaySkipDay().then(({ data }) => {
            if (data) setSkipDayReason(data.reason);
        });
        loadBadgeCounts();
    }, []);

    // Refresh badge counts when switching away from priorities/goals tabs
    useEffect(() => {
        if (activeTab !== 'priorities' && activeTab !== 'goals') {
            loadBadgeCounts();
        }
    }, [activeTab]);

    const loadBadgeCounts = async () => {
        const [priResult, goalResult] = await Promise.all([
            getActivePriorityCount(),
            getActiveGoalCount(),
        ]);
        setPriorityCount(priResult.count);
        setGoalCount(goalResult.count);
    };

    const handlePrint = async () => {
        const { data } = await getAllPrintData();
        if (data) {
            setPrintData(data);
            const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
            const originalTitle = document.title;
            document.title = `Jeans Master List — ${dateStr}`;
            setTimeout(() => {
                window.print();
                document.title = originalTitle;
            }, 100);
        }
    };

    // Live clock in Toronto timezone
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTorontoTime(
                now.toLocaleString('en-US', {
                    timeZone: 'America/Toronto',
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                })
            );
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
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
                newCategory || null,
                newDueDate || null
            );
            if (error) throw new Error(error);
            if (data) {
                setTasks([data, ...tasks]);
                setTaskInput('');
                setNewPriority('medium');
                setNewCategory('');
                setNewDueDate('');
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
    const sortTasks = (a: Task, b: Task) => {
        const priDiff = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
        if (priDiff !== 0) return priDiff;
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        return 0;
    };

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });

    const filterTasks = (list: Task[]) => {
        let filtered = list;
        if (filterPriority !== 'all') filtered = filtered.filter(t => t.priority === filterPriority);
        if (filterCategory !== 'all') filtered = filtered.filter(t => t.category === filterCategory);
        return filtered;
    };

    const activeTasks = filterTasks(tasks.filter(t => !t.completed)).sort(sortTasks);
    const completedTasks = filterTasks(tasks.filter(t => t.completed)).sort(sortTasks);

    const formatDueDate = (date: string) => {
        const d = new Date(date + 'T12:00:00');
        return 'Due ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const isOverdue = (date: string) => date < todayStr;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1a1a1a] text-[#ededed] flex items-center justify-center">
                <p className="text-xl">Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-[#ededed] p-4">
            <div className="max-w-2xl mx-auto py-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <h1 className="text-5xl font-bold text-center">JeanToDoList</h1>
                    <button
                        onClick={handlePrint}
                        className="text-gray-500 hover:text-white transition-colors"
                        title="Print Master List"
                    >
                        <Printer size={24} />
                    </button>
                    <Link href="/settings" className="text-gray-500 hover:text-white transition-colors" title="Settings">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </Link>
                </div>
                {/* Toronto time — hidden on mobile */}
                <p className="hidden sm:block text-lg text-gray-400 mb-6 text-center">
                    {torontoTime ? `${torontoTime} Toronto Time` : '\u00A0'}
                    {skipDayReason === 'Wedding' && (
                        <span className="ml-2 text-yellow-300 font-bold">Wedding Day!</span>
                    )}
                </p>
                {skipDayReason === 'Wedding' && (
                    <p className="sm:hidden text-center text-yellow-300 font-bold mb-4">Wedding Day!</p>
                )}

                {/* Priorities & Goals Row */}
                <div className="flex justify-center gap-2 mb-2 max-w-sm mx-auto">
                    <button
                        onClick={() => setActiveTab('priorities')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-colors relative ${
                            activeTab === 'priorities'
                                ? 'bg-red-600 text-white'
                                : 'bg-[#242424] text-gray-400 hover:text-white border border-[#333]'
                        }`}
                    >
                        Priorities
                        {priorityCount > 0 && (
                            <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full ${
                                activeTab === 'priorities' ? 'bg-red-800 text-red-200' : 'bg-[#333] text-gray-300'
                            }`}>
                                {priorityCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('goals')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                            activeTab === 'goals'
                                ? 'bg-teal-600 text-white'
                                : 'bg-[#242424] text-gray-400 hover:text-white border border-[#333]'
                        }`}
                    >
                        Goals
                        {goalCount > 0 && (
                            <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full ${
                                activeTab === 'goals' ? 'bg-teal-800 text-teal-200' : 'bg-[#333] text-gray-300'
                            }`}>
                                {goalCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Active / Complete Stats Row (only for tasks view) */}
                {(activeTab === 'tasks') && (
                    <div className="flex justify-center gap-6 mb-2 text-sm">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-teal-400">{activeTasks.length}</div>
                            <div className="text-gray-500">Active</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{completedTasks.length}</div>
                            <div className="text-gray-500">Completed</div>
                        </div>
                        {deletedTasks.length > 0 && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-400">{deletedTasks.length}</div>
                                <div className="text-gray-500">Deleted</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Bar */}
                <div className="flex justify-center gap-1 mb-8 bg-[#242424] rounded-lg p-1 max-w-sm mx-auto border border-[#333]">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                            activeTab === 'tasks'
                                ? 'bg-teal-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('buy')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                            activeTab === 'buy'
                                ? 'bg-orange-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Buy
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

                {activeTab === 'buy' && <BuyTab />}
                {activeTab === 'stakes' && <StakesTab />}
                {activeTab === 'habits' && <HabitsTab />}
                {activeTab === 'priorities' && <PrioritiesTab />}
                {activeTab === 'goals' && <GoalsTab />}

                {activeTab === 'tasks' && <>
                    <div className="mb-8">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={taskInput}
                                onChange={(e) => setTaskInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="What needs to get done?"
                                className="flex-1 bg-[#242424] text-[#ededed] text-lg px-6 py-4 rounded-lg border border-[#333] focus:border-teal-500 focus:outline-none"
                            />
                            <button
                                onClick={handleAddTask}
                                className="px-6 py-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <select
                                value={newPriority}
                                onChange={(e) => setNewPriority(e.target.value as Priority)}
                                className="bg-[#242424] text-[#ededed] text-sm px-3 py-2 rounded-lg border border-[#333] focus:border-teal-500 focus:outline-none"
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                            <select
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value as Category | '')}
                                className="bg-[#242424] text-[#ededed] text-sm px-3 py-2 rounded-lg border border-[#333] focus:border-teal-500 focus:outline-none"
                            >
                                <option value="">No category</option>
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={newDueDate}
                                onChange={(e) => setNewDueDate(e.target.value)}
                                className="bg-[#242424] text-[#ededed] text-sm px-3 py-2 rounded-lg border border-[#333] focus:border-teal-500 focus:outline-none"
                                style={{ colorScheme: 'dark' }}
                                placeholder="Due date"
                            />
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
                                                        : 'bg-teal-600 text-white'
                                            : 'bg-[#242424] text-gray-400 hover:text-white border border-[#333]'
                                    }`}
                                >
                                    {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
                            className="bg-[#242424] text-gray-400 text-xs px-3 py-1 rounded-full border border-[#333] focus:outline-none"
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
                            <p className="text-2xl font-bold text-green-400">All tasks complete!</p>
                            <p className="text-green-300 mt-2">You crushed it today.</p>
                        </div>
                    )}

                    {/* Active Tasks */}
                    {activeTasks.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-4 text-gray-400">Active Tasks</h2>
                            <div className="space-y-3">
                                {activeTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={`bg-[#242424] px-6 py-4 rounded-lg border border-[#333] flex items-center justify-between ${
                                            task.priority === 'high' ? 'border-l-4 border-l-red-500'
                                                : task.priority === 'medium' ? 'border-l-4 border-l-yellow-500'
                                                    : ''
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p
                                                    className="text-lg break-words line-clamp-2 cursor-pointer hover:text-teal-400 transition-colors"
                                                    onClick={() => setSelectedTask(task)}
                                                >
                                                    {task.title}
                                                </p>
                                                {task.category && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#333] text-gray-400">{task.category}</span>
                                                )}
                                                {task.due_date && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                        isOverdue(task.due_date) ? 'bg-red-900/40 text-red-400' : 'bg-[#333] text-gray-400'
                                                    }`}>{formatDueDate(task.due_date)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-2 shrink-0">
                                            <button
                                                onClick={() => toggleComplete(task.id)}
                                                className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white"
                                            >
                                                Complete
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="px-4 py-2 rounded bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm"
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
                                            className="bg-[#242424] px-6 py-4 rounded-lg border border-green-900/50 flex items-center justify-between opacity-60"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p
                                                        className="text-lg line-through text-gray-500 break-words line-clamp-2 cursor-pointer hover:text-gray-400 transition-colors"
                                                        onClick={() => setSelectedTask(task)}
                                                    >
                                                        {task.title}
                                                    </p>
                                                    {task.category && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#333] text-gray-500">{task.category}</span>
                                                    )}
                                                    {task.due_date && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#333] text-gray-500">{formatDueDate(task.due_date)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-2 shrink-0">
                                                <button
                                                    onClick={() => toggleComplete(task.id)}
                                                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    Done
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="px-4 py-2 rounded bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm"
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
                                <div className="mt-3 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                                    <p className="text-red-400 font-bold mb-2">Tasks you gave up on:</p>
                                    {deletedTasks.map((task, index) => (
                                        <p key={index} className="text-red-300 text-sm">{task}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>}
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
                    onClick={() => { setSelectedTask(null); setIsEditing(false); }}
                >
                    <div
                        className="bg-[#242424] rounded-lg border border-[#333] max-w-lg w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {!isEditing && (
                                        <>
                                            {selectedTask.priority === 'high' && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white">High</span>
                                            )}
                                            {selectedTask.priority === 'medium' && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-600 text-white">Medium</span>
                                            )}
                                            {selectedTask.category && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#333] text-gray-400">{selectedTask.category}</span>
                                            )}
                                            {selectedTask.due_date && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    selectedTask.due_date < todayStr ? 'bg-red-900/40 text-red-400' : 'bg-[#333] text-gray-400'
                                                }`}>{formatDueDate(selectedTask.due_date)}</span>
                                            )}
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setSelectedTask(null); setIsEditing(false); }}
                                    className="text-gray-500 hover:text-white text-2xl leading-none"
                                >
                                    ×
                                </button>
                            </div>

                            {isEditing ? (
                                <>
                                    <textarea
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full bg-[#1a1a1a] text-[#ededed] text-lg px-4 py-3 rounded-lg border-2 border-teal-500 focus:outline-none mb-4 resize-none"
                                        rows={3}
                                        autoFocus
                                    />
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <select
                                            value={editPriority}
                                            onChange={(e) => setEditPriority(e.target.value as Priority)}
                                            className="bg-[#1a1a1a] text-[#ededed] text-sm px-3 py-2 rounded-lg border border-[#333] focus:border-teal-500 focus:outline-none"
                                        >
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                        <select
                                            value={editCategory}
                                            onChange={(e) => setEditCategory(e.target.value as Category | '')}
                                            className="bg-[#1a1a1a] text-[#ededed] text-sm px-3 py-2 rounded-lg border border-[#333] focus:border-teal-500 focus:outline-none"
                                        >
                                            <option value="">No category</option>
                                            {CATEGORIES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="date"
                                            value={editDueDate}
                                            onChange={(e) => setEditDueDate(e.target.value)}
                                            className="bg-[#1a1a1a] text-[#ededed] text-sm px-3 py-2 rounded-lg border border-[#333] focus:border-teal-500 focus:outline-none"
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                if (!editTitle.trim()) return;
                                                const { data, error } = await updateTask(selectedTask.id, {
                                                    title: editTitle.trim(),
                                                    priority: editPriority,
                                                    category: editCategory || null,
                                                    due_date: editDueDate || null,
                                                });
                                                if (!error && data) {
                                                    setTasks(tasks.map(t => t.id === data.id ? data : t));
                                                    setSelectedTask(data);
                                                    setIsEditing(false);
                                                }
                                            }}
                                            className="flex-1 px-4 py-3 rounded font-bold bg-teal-600 hover:bg-teal-700 text-white"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-3 rounded bg-[#333] hover:bg-[#444] text-gray-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-xl text-[#ededed] leading-relaxed mb-6">{selectedTask.title}</p>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditTitle(selectedTask.title);
                                                setEditPriority(selectedTask.priority);
                                                setEditCategory(selectedTask.category || '');
                                                setEditDueDate(selectedTask.due_date || '');
                                                setIsEditing(true);
                                            }}
                                            className="flex-1 px-4 py-3 rounded font-bold bg-yellow-600 hover:bg-yellow-700 text-white"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                toggleComplete(selectedTask.id);
                                                setSelectedTask(null);
                                            }}
                                            className={`flex-1 px-4 py-3 rounded font-bold text-white ${
                                                selectedTask.completed
                                                    ? 'bg-green-600 hover:bg-green-700'
                                                    : 'bg-teal-600 hover:bg-teal-700'
                                            }`}
                                        >
                                            {selectedTask.completed ? 'Done' : 'Complete'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleDeleteTask(selectedTask.id);
                                                setSelectedTask(null);
                                            }}
                                            className="px-4 py-3 rounded bg-red-900/40 hover:bg-red-900/60 text-red-400"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showCelebration && (
                <Celebration
                    milestone={milestone}
                    onClose={() => setShowCelebration(false)}
                />
            )}

            {printData && (
                <PrintView
                    data={printData}
                    dateStr={new Date().toLocaleDateString('en-US', {
                        timeZone: 'America/Toronto',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                />
            )}
        </div>
    );
}
