'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SkipDay, getSkipDays, addSkipDay, deleteSkipDay } from '@/actions/skip-days';

const REASON_OPTIONS = ['Wedding', 'Bridal Show', 'Birthday', 'Recovery', 'Vacation', 'Other'];

export default function SettingsPage() {
    const [skipDays, setSkipDays] = useState<SkipDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('Wedding');
    const [autoRecovery, setAutoRecovery] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadSkipDays();
    }, []);

    const loadSkipDays = async () => {
        try {
            const { data, error } = await getSkipDays();
            if (error) throw new Error(error);
            setSkipDays(data || []);
        } catch (error) {
            console.error('Error loading skip days:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !reason) return;
        setSubmitting(true);
        try {
            const { error } = await addSkipDay(date, reason, autoRecovery);
            if (error) throw new Error(error);
            setDate('');
            setAutoRecovery(false);
            await loadSkipDays();
        } catch (error) {
            console.error('Error adding skip day:', error);
            alert(String(error));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const { error } = await deleteSkipDay(id);
            if (error) throw new Error(error);
            setSkipDays(skipDays.filter(d => d.id !== id));
        } catch (error) {
            console.error('Error deleting skip day:', error);
        }
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
                    <h1 className="text-3xl font-bold">Skip Days Settings</h1>
                </div>

                {/* Add Form */}
                <form onSubmit={handleAdd} className="mb-8 p-4 bg-gray-900 rounded-lg border-2 border-gray-700 space-y-4">
                    <h2 className="text-lg font-bold text-gray-300">Add Skip Day</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                            {REASON_OPTIONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                        >
                            {submitting ? 'Adding...' : 'Add'}
                        </button>
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
                {loading ? (
                    <p className="text-center text-gray-400">Loading skip days...</p>
                ) : skipDays.length === 0 ? (
                    <p className="text-center text-gray-400">No skip days configured.</p>
                ) : (
                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-300 mb-4">All Skip Days ({skipDays.length})</h2>
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
                                    onClick={() => handleDelete(day.id)}
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
    );
}
