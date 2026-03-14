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

    useEffect(() => { loadPurchases(); }, []);

    const loadPurchases = async () => {
        const { data, error } = await getPurchases();
        if (error) console.error(error);
        setPurchases(data || []);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!input.trim()) return;
        const { data, error } = await createPurchase(input, priority, category || null, dueDate || null);
        if (error) { console.error(error); return; }
        if (data) { setPurchases([data, ...purchases]); setInput(''); setPriority('medium'); setCategory(''); setDueDate(''); }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAdd(); };

    const toggleComplete = async (id: number) => {
        const purchase = purchases.find(p => p.id === id);
        if (!purchase) return;
        const { error } = await updatePurchaseCompletion(id, !purchase.completed);
        if (error) { console.error(error); return; }
        setPurchases(purchases.map(p => p.id === id ? { ...p, completed: !p.completed } : p));
    };

    const handleDelete = async (id: number) => {
        const purchase = purchases.find(p => p.id === id);
        if (!purchase) return;
        if (window.confirm(`Remove "${purchase.title}" from buy list?`)) {
            const { error } = await deletePurchase(id);
            if (error) { console.error(error); return; }
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
        return 'border-l-gray-500';
    };

    if (loading) return <p className="text-center text-gray-500">Loading purchases...</p>;

    return (
        <>
            <div className="flex justify-center gap-6 mb-8 text-sm">
                <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{activePurchases.length}</div>
                    <div className="text-gray-500">To Buy</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{completedPurchases.length}</div>
                    <div className="text-gray-500">Purchased</div>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="What do you need to buy?" className="flex-1 bg-[#242424] text-[#ededed] text-lg px-6 py-4 rounded-lg border border-[#333] focus:border-orange-500 focus:outline-none" />
                    <button onClick={handleAdd} className="px-6 py-4 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="bg-[#242424] text-[#ededed] text-sm px-3 py-2 rounded-lg border border-[#333] focus:border-orange-500 focus:outline-none">
                        <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                    </select>
                    <select value={category} onChange={(e) => setCategory(e.target.value as BuyCategory | '')} className="bg-[#242424] text-[#ededed] text-sm px-3 py-2 rounded-lg border border-[#333] focus:border-orange-500 focus:outline-none">
                        <option value="">No category</option>
                        {BUY_CATEGORIES.map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-[#242424] text-[#ededed] text-sm px-3 py-2 rounded-lg border border-[#333] focus:border-orange-500 focus:outline-none" style={{ colorScheme: 'dark' }} />
                </div>
            </div>

            <h2 className="text-lg font-bold mb-4 text-gray-400">To Buy</h2>
            {activePurchases.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nothing to buy!</p>
            ) : (
                <div className="space-y-3 mb-8">
                    {activePurchases.map(purchase => (
                        <div key={purchase.id} className={`bg-[#242424] rounded-lg p-4 border-l-4 border border-[#333] ${getPriorityColor(purchase.priority)}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 cursor-pointer hover:opacity-80" onClick={() => setSelectedPurchase(purchase)}>
                                    <p className="text-[#ededed] font-medium line-clamp-2">{purchase.title}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {purchase.category && <span className="text-xs px-2 py-1 bg-[#333] rounded text-gray-400">{purchase.category}</span>}
                                        {purchase.due_date && <span className={`text-xs px-2 py-1 rounded ${isOverdue(purchase.due_date) ? 'bg-red-900/40 text-red-400' : 'bg-[#333] text-gray-400'}`}>{formatDueDate(purchase.due_date)}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleComplete(purchase.id)} className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm font-bold">Bought</button>
                                    <button onClick={() => handleDelete(purchase.id)} className="px-3 py-2 bg-red-900/40 hover:bg-red-900/60 rounded text-red-400 text-sm font-bold">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {completedPurchases.length > 0 && (
                <>
                    <button onClick={() => setShowCompleted(!showCompleted)} className="text-gray-500 hover:text-gray-300 text-sm mb-4">
                        {showCompleted ? '▼' : '▶'} Purchased ({completedPurchases.length})
                    </button>
                    {showCompleted && (
                        <div className="space-y-3 opacity-60">
                            {completedPurchases.map(purchase => (
                                <div key={purchase.id} className="bg-[#242424] rounded-lg p-4 border-l-4 border-l-green-500 border border-[#333]">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-gray-500 line-through">{purchase.title}</p>
                                        <button onClick={() => toggleComplete(purchase.id)} className="px-3 py-2 bg-[#333] hover:bg-[#444] rounded text-gray-300 text-sm">Undo</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {selectedPurchase && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setSelectedPurchase(null)}>
                    <div className="bg-[#242424] rounded-lg p-6 max-w-lg w-full border border-[#333] relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedPurchase(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl">×</button>
                        <p className="text-[#ededed] text-lg mb-4">{selectedPurchase.title}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedPurchase.category && <span className="text-xs px-2 py-1 bg-[#333] rounded text-gray-400">{selectedPurchase.category}</span>}
                            {selectedPurchase.due_date && <span className="text-xs px-2 py-1 bg-[#333] rounded text-gray-400">{formatDueDate(selectedPurchase.due_date)}</span>}
                            <span className={`text-xs px-2 py-1 rounded ${selectedPurchase.priority === 'high' ? 'bg-red-900/40 text-red-400' : selectedPurchase.priority === 'medium' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-[#333] text-gray-400'}`}>{selectedPurchase.priority}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { toggleComplete(selectedPurchase.id); setSelectedPurchase(null); }} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-bold">Bought</button>
                            <button onClick={() => { handleDelete(selectedPurchase.id); setSelectedPurchase(null); }} className="flex-1 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 rounded text-red-400 font-bold">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
