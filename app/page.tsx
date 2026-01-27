'use client';

import { useState, useEffect } from 'react';
import {
    Task,
    getTasks,
    createTask,
    updateTaskCompletion,
    deleteTask,
} from '@/actions/tasks';

export default function Home() {
    const [taskInput, setTaskInput] = useState('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [deletedTasks, setDeletedTasks] = useState<string[]>([]);
    const [showShameLog, setShowShameLog] = useState(false);
    const [loading, setLoading] = useState(true);

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

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && taskInput.trim()) {
            try {
                const { data, error } = await createTask(taskInput);
                if (error) throw new Error(error);
                if (data) {
                    setTasks([data, ...tasks]);
                    setTaskInput('');
                }
            } catch (error) {
                console.error('Error adding task:', error);
            }
        }
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

    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

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
                <h1 className="text-6xl font-bold mb-4 text-center">JeanToDoList</h1>
                <p className="text-xl text-gray-400 mb-8 text-center">
                    The app that makes sure it gets done.
                </p>

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

                <input
                    type="text"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What needs to get done?"
                    className="w-full bg-gray-900 text-white text-lg px-6 py-4 rounded-lg border-2 border-gray-700 focus:border-blue-500 focus:outline-none mb-8"
                />

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
                                    className="bg-gray-900 px-6 py-4 rounded-lg border-2 border-gray-700 flex items-center justify-between"
                                >
                                    <p className="text-lg flex-1">{task.title}</p>
                                    <div className="flex gap-2">
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

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 text-gray-300">Completed Tasks</h2>
                        <div className="space-y-3">
                            {completedTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="bg-gray-900 px-6 py-4 rounded-lg border-2 border-green-900 flex items-center justify-between opacity-60"
                                >
                                    <p className="text-lg flex-1 line-through text-gray-500">{task.title}</p>
                                    <div className="flex gap-2">
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
            </div>
        </div>
    );
}
