'use client';

import { useState, useEffect } from 'react';
import {
    Purchase,
    Priority,
    BuyCategory,
    getPurchases,
    createPurchase,
    updatePurchaseCompletion,
    deletePurchase,
} from '@/actions/purchases';

const BUY_CATEGORIES: BuyCategory[] = ['SIGS', 'Personal', 'Dream'];

export default function BuyTab() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [input, setInput] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [category, setCategory] = useState<BuyCategory | ''>('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCompleted, setShowCompleted] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

    useEffect(() => {
        loadPurchases();
    }, []);

    const loadPurchases = async () => {
        const { data, error } = await getPurchases();
        if (error) console.error(error);
        setPurchases(data || []);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!input.trim()) return;
        const { data, error } = await createPurchase(
            input,
            priority,
            category || null,
            dueDate || null
        );
        if (error) {
            console.error(error);
            return;
        }
        if (data) {
            setPurchases([data, ...purchases]);
            setInput('');
            setPriority('medium');
            setCategory('');
            setDueDate('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAdd();
    };

    const toggleComplete = async (id: number) => {
        const purchase = purchases.find(p => p.id === id);
        if (!purchase) return;
        const { error } = await updatePurchaseCompletion(id, !purchase.completed);
        if (error) {
            console.error(error);
            return;
        }
        setPurchases(purchases.map(p =>
            p.id === id ? { ...p, completed: !p.completed } : p
        ));
    };

    const handleDelete = async (id: number) => {
        const purchase = purchases.find(p => p.id === id);
        if (!purchase) return;
        if (window.confirm(`Remove "${purchase.title}" from buy list?`)) {
            const { error } = await deletePurchase(id);
            if (error) {
                console.error(error);
                return;
            }
            setPurchases(purchases.filter(p => p.id !== id));
        }
    };

    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const sortPurchases = (a: Purchase, b: Purchase) => {
        const priDiff = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
        if (priDiff !== 0) return priDiff;
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        return 0;
    };

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
    const activePurchases = purchases.filter(p => !p.completed).sort(sortPurchases);
    const completedPurchases = purchases.filter(p => p.completed).sort(sortPurchases);

    const formatDueDate = (date: string) => {
        const d = new Date(date + 'T12:00:00');
        return 'Need by ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const isOverdue = (date: string) => date < todayStr;

    const getPriorityColor = (p: Priority) => {
        if (p === 'high') return 'border-l-red-500';
        if (p === 'medium') return 'border-l-yellow-500';
        return 'border-l-gray-400';
    };

    if (loading) {
        return <p className="text-center text-gray-400">Loading purchases...</p>;
    }

    return (
        <>
            {/* Stats */}
            <div className="flex justify-center gap-6 mb-8 text-sm">
                <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">{activePurchases.length}</div>
                    <div className="text-gray-500">To Buy</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{completedPurchases.length}</div>
                    <div className="text-gray-500">Purchased</div>
                </div>
            </div>

            {/* Input */}
            <div className="mb-8">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="What do you need to buy?"
                        className="flex-1 bg-white text-gray-800 text-lg px-6 py-4 rounded-lg border border-stone-200 focus:border-orange-500 focus:outline-none shadow-sm"
                    />
                    <button
                        onClick={handleAdd}
                        className="px-6 py-4 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg"
                    >
                        Add
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Priority)}
                        className="bg-white text-gray-800 text-sm px-3 py-2 rounded-lg border border-stone-200 focus:border-orange-500 focus:outline-none"
                    >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as BuyCategory | '')}
                        className="bg-white text-gray-800 text-sm px-3 py-2 rounded-lg border border-stone-200 focus:border-orange-500 focus:outline-none"
                    >
                        <option value="">No category</option>
                        {BUY_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="bg-white text-gray-800 text-sm px-3 py-2 rounded-lg border border-stone-200 focus:border-orange-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Active Purchases */}
            <h2 className="text-lg font-bold mb-4 text-gray-500">To Buy</h2>
            {activePurchases.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nothing to buy!</p>
            ) : (
                <div className="space-y-3 mb-8">
                    {activePurchases.map(purchase => (
                        <div
                            key={purchase.id}
                            className={`bg-white rounded-lg p-4 border-l-4 border border-stone-200 shadow-sm ${getPriorityColor(purchase.priority)}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div
                                    className="flex-1 cursor-pointer hover:opacity-80"
                                    onClick={() => setSelectedPurchase(purchase)}
                                >
                                    <p className="text-gray-800 font-medium line-clamp-2">{purchase.title}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {purchase.category && (
                                            <span className="text-xs px-2 py-1 bg-stone-100 rounded text-gray-500">
                        {purchase.category}
                      </span>
                                        )}
                                        {purchase.due_date && (
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                isOverdue(purchase.due_date)
                                                    ? 'bg-red-50 text-red-600'
                                                    : 'bg-stone-100 text-gray-500'
                                            }`}>
                        {formatDueDate(purchase.due_date)}
                      </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleComplete(purchase.id)}
                                        className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm font-bold"
                                    >
                                        Bought
                                    </button>
                                    <button
                                        onClick={() => handleDelete(purchase.id)}
                                        className="px-3 py-2 bg-red-100 hover:bg-red-200 rounded text-red-700 text-sm font-bold"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Completed Purchases */}
            {completedPurchases.length > 0 && (
                <>
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="text-gray-400 hover:text-gray-600 text-sm mb-4"
                    >
                        {showCompleted ? '▼' : '▶'} Purchased ({completedPurchases.length})
                    </button>
                    {showCompleted && (
                        <div className="space-y-3 opacity-60">
                            {completedPurchases.map(purchase => (
                                <div
                                    key={purchase.id}
                                    className="bg-white rounded-lg p-4 border-l-4 border-l-green-500 border border-stone-200 shadow-sm"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-gray-400 line-through">{purchase.title}</p>
                                        <button
                                            onClick={() => toggleComplete(purchase.id)}
                                            className="px-3 py-2 bg-stone-200 hover:bg-stone-300 rounded text-gray-700 text-sm"
                                        >
                                            Undo
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Detail Modal */}
            {selectedPurchase && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedPurchase(null)}
                >
                    <div
                        className="bg-white rounded-lg p-6 max-w-lg w-full border border-stone-200 shadow-lg relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedPurchase(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl"
                        >
                            ×
                        </button>
                        <p className="text-gray-800 text-lg mb-4">{selectedPurchase.title}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedPurchase.category && (
                                <span className="text-xs px-2 py-1 bg-stone-100 rounded text-gray-500">
                  {selectedPurchase.category}
                </span>
                            )}
                            {selectedPurchase.due_date && (
                                <span className="text-xs px-2 py-1 bg-stone-100 rounded text-gray-500">
                  {formatDueDate(selectedPurchase.due_date)}
                </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded ${
                                selectedPurchase.priority === 'high' ? 'bg-red-50 text-red-600' :
                                    selectedPurchase.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                                        'bg-stone-100 text-gray-500'
                            }`}>
                {selectedPurchase.priority}
              </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    toggleComplete(selectedPurchase.id);
                                    setSelectedPurchase(null);
                                }}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-bold"
                            >
                                Bought
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete(selectedPurchase.id);
                                    setSelectedPurchase(null);
                                }}
                                className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 rounded text-red-700 font-bold"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
