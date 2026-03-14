'use client';

import { useState, useEffect } from 'react';
import {
    Priority,
    getPriorities,
    addPriority,
    completePriority,
    dismissPriority,
    moveToBottom,
    reorderPriorities,
} from '@/actions/priorities';

export default function PrioritiesTab() {
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [reordering, setReordering] = useState(false);

    useEffect(() => { loadPriorities(); }, []);

    const loadPriorities = async () => {
        const { data, error } = await getPriorities();
        if (error) console.error(error);
        setPriorities(data || []);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!input.trim()) return;
        const { data, error } = await addPriority(input);
        if (error) { console.error(error); return; }
        if (data) { await loadPriorities(); setInput(''); }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAdd(); };

    const handleComplete = async (id: number) => {
        const { error } = await completePriority(id);
        if (error) { console.error(error); return; }
        setPriorities(priorities.filter(p => p.id !== id));
    };

    const handleDismiss = async (id: number) => {
        const { error } = await dismissPriority(id);
        if (error) { console.error(error); return; }
        setPriorities(priorities.filter(p => p.id !== id));
    };

    const handleMoveToBottom = async (id: number) => {
        const { error } = await moveToBottom(id);
        if (error) { console.error(error); return; }
        await loadPriorities();
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newOrder = [...priorities];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        setPriorities(newOrder);
        const { error } = await reorderPriorities(newOrder.map(p => p.id));
        if (error) console.error(error);
    };

    const handleMoveDown = async (index: number) => {
        if (index === priorities.length - 1) return;
        const newOrder = [...priorities];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        setPriorities(newOrder);
        const { error } = await reorderPriorities(newOrder.map(p => p.id));
        if (error) console.error(error);
    };

    if (loading) return <p className="text-center text-gray-500">Loading priorities...</p>;

    return (
        <>
            <div className="flex justify-center gap-6 mb-8 text-sm">
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{priorities.length}</div>
                    <div className="text-gray-500">Active</div>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="What's the priority right now?" className="flex-1 bg-[#242424] text-[#ededed] text-lg px-6 py-4 rounded-lg border border-[#333] focus:border-red-500 focus:outline-none" />
                    <button onClick={handleAdd} className="px-6 py-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-lg">Add</button>
                </div>
            </div>

            {priorities.length > 1 && (
                <div className="flex justify-end mb-4">
                    <button onClick={() => setReordering(!reordering)} className={`text-sm px-3 py-1 rounded-full transition-colors ${reordering ? 'bg-red-600 text-white' : 'bg-[#242424] text-gray-400 hover:text-white border border-[#333]'}`}>
                        {reordering ? 'Done Reordering' : 'Reorder'}
                    </button>
                </div>
            )}

            {priorities.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No priorities set. What matters right now?</p>
            ) : (
                <div className="space-y-3 mb-8">
                    {priorities.map((priority, index) => (
                        <div key={priority.id} className={`bg-[#242424] rounded-lg p-4 border-l-4 border border-[#333] ${index === 0 ? 'border-l-red-500' : 'border-l-[#444]'}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="text-gray-500 font-bold text-sm shrink-0">#{index + 1}</span>
                                    <p className="text-[#ededed] font-medium line-clamp-2">{priority.title}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    {reordering ? (
                                        <>
                                            <button onClick={() => handleMoveUp(index)} disabled={index === 0} className={`px-2 py-2 rounded text-sm ${index === 0 ? 'bg-[#242424] text-gray-600 cursor-not-allowed' : 'bg-[#333] hover:bg-[#444] text-gray-300'}`}>▲</button>
                                            <button onClick={() => handleMoveDown(index)} disabled={index === priorities.length - 1} className={`px-2 py-2 rounded text-sm ${index === priorities.length - 1 ? 'bg-[#242424] text-gray-600 cursor-not-allowed' : 'bg-[#333] hover:bg-[#444] text-gray-300'}`}>▼</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => handleComplete(priority.id)} className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm font-bold" title="Complete">✓</button>
                                            <button onClick={() => handleMoveToBottom(priority.id)} className="px-3 py-2 bg-[#333] hover:bg-[#444] rounded text-gray-300 text-sm font-bold" title="Move to bottom">⬇</button>
                                            <button onClick={() => handleDismiss(priority.id)} className="px-3 py-2 bg-red-900/40 hover:bg-red-900/60 rounded text-red-400 text-sm font-bold" title="Not relevant">✕</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
