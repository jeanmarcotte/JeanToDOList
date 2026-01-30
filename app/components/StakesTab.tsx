'use client';

import { useState, useEffect } from 'react';
import {
    StakeWithProgress,
    StakeEntry,
    getActiveStakes,
    getInactiveStakes,
    createStake,
    addStakeEntry,
    getStakeEntries,
    deactivateStake,
    abandonStake,
} from '@/actions/stakes';

const SHAME_MESSAGES = [
    "Another one bites the dust.",
    "Quitters never win. You just proved it.",
    "Your future self is disappointed.",
    "That stake believed in you. You didn't believe in it.",
    "Somewhere, a progress bar just cried.",
    "Even the deadline outlasted your commitment.",
    "Commitment level: a New Year's resolution.",
    "The couch won again.",
    "You didn't lose. You chose to not win.",
    "Your consequence thanks you for letting it off the hook.",
];

function getRandomShameMessage() {
    return SHAME_MESSAGES[Math.floor(Math.random() * SHAME_MESSAGES.length)];
}

function StakeCard({
    stake,
    isPast,
    entryLogs,
    expandedStakeId,
    loadingEntries,
    onCheckIn,
    onToggleEntryLog,
    onClaimVictory,
    onAcceptDefeat,
    onAbandon,
}: {
    stake: StakeWithProgress;
    isPast: boolean;
    entryLogs: Record<number, StakeEntry[]>;
    expandedStakeId: number | null;
    loadingEntries: number | null;
    onCheckIn: (id: number) => void;
    onToggleEntryLog: (id: number) => void;
    onClaimVictory: (id: number) => void;
    onAcceptDefeat: (id: number) => void;
    onAbandon: (id: number) => void;
}) {
    const progress = Math.min(stake.current_value / stake.target_count, 1);
    const percent = Math.round(progress * 100);
    const isWon = stake.current_value >= stake.target_count;
    const isLost = !isWon && !!stake.deadline && new Date(stake.deadline) < new Date();
    const isAbandoned = stake.abandoned;
    const isOverdue = isLost;
    const entries = entryLogs[stake.id];
    const isExpanded = expandedStakeId === stake.id;

    return (
        <div
            className={`bg-gray-900 p-5 rounded-lg border-2 ${
                isAbandoned
                    ? 'border-gray-600'
                    : isWon
                      ? 'border-green-600'
                      : isLost
                        ? 'border-red-600'
                        : 'border-gray-700'
            } ${isPast ? 'opacity-70' : ''}`}
        >
            <div className="flex items-center justify-between mb-1">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className={`text-lg font-bold ${isAbandoned ? 'line-through text-gray-500' : ''}`}>
                            {stake.title}
                        </h3>
                        {isAbandoned && (
                            <span className="text-gray-400 font-bold text-sm">
                                QUIT
                            </span>
                        )}
                        {!isAbandoned && isWon && (
                            <span className="text-green-400 font-bold text-sm animate-pulse">
                                WON
                            </span>
                        )}
                        {!isAbandoned && isLost && (
                            <span className="text-red-400 font-bold text-sm">
                                LOST
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-400">
                        {stake.current_value} / {stake.target_count}
                        {stake.deadline && (
                            <span className={isOverdue ? 'text-red-400 ml-2' : 'ml-2'}>
                                &middot; Due {new Date(stake.deadline).toLocaleDateString()}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {!isPast && !isWon && !isLost && (
                        <>
                            <button
                                onClick={() => onAbandon(stake.id)}
                                className="px-3 py-2 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800 text-xs transition-colors"
                            >
                                Abandon
                            </button>
                            <button
                                onClick={() => onCheckIn(stake.id)}
                                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 font-bold text-sm"
                            >
                                Check In
                            </button>
                        </>
                    )}
                    {!isPast && isWon && (
                        <button
                            onClick={() => onClaimVictory(stake.id)}
                            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 font-bold text-sm"
                        >
                            Claim Victory
                        </button>
                    )}
                    {!isPast && isLost && (
                        <button
                            onClick={() => onAcceptDefeat(stake.id)}
                            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 font-bold text-sm"
                        >
                            Accept Defeat
                        </button>
                    )}
                </div>
            </div>

            {/* Reward / Consequence */}
            {(stake.reward || stake.consequence) && (
                <div className="flex gap-4 mb-2 text-xs">
                    {stake.reward && (
                        <span className="text-green-400">Reward: {stake.reward}</span>
                    )}
                    {stake.consequence && (
                        <span className="text-red-400">Consequence: {stake.consequence}</span>
                    )}
                </div>
            )}

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${
                        isAbandoned
                            ? 'bg-gray-600'
                            : isWon
                              ? 'bg-green-500'
                              : isOverdue
                                ? 'bg-red-500'
                                : 'bg-purple-500'
                    }`}
                    style={{ width: `${percent}%` }}
                />
            </div>
            <p className="text-right text-xs text-gray-500 mt-1">{percent}%</p>

            {/* Entry Log Toggle */}
            {stake.entry_count > 0 && (
                <button
                    onClick={() => onToggleEntryLog(stake.id)}
                    className="text-xs text-gray-500 hover:text-purple-400 mt-1 transition-colors"
                >
                    {isExpanded ? 'Hide check-ins' : `Show check-ins (${stake.entry_count})`}
                </button>
            )}

            {/* Entry Log */}
            {isExpanded && (
                <div className="mt-3 space-y-2">
                    {loadingEntries === stake.id ? (
                        <p className="text-xs text-gray-500">Loading...</p>
                    ) : entries && entries.length > 0 ? (
                        entries.map((entry) => (
                            <div
                                key={entry.id}
                                className="bg-gray-800 rounded px-3 py-2 text-sm flex items-center justify-between"
                            >
                                <div className="text-gray-300">
                                    {entry.amount != null && (
                                        <span className="text-purple-400 font-semibold mr-2">
                                            {entry.amount}
                                        </span>
                                    )}
                                    {entry.note || <span className="text-gray-600 italic">No note</span>}
                                </div>
                                <span className="text-xs text-gray-500 ml-3 shrink-0">
                                    {new Date(entry.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500">No entries yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function StakesTab() {
    const [stakes, setStakes] = useState<StakeWithProgress[]>([]);
    const [pastStakes, setPastStakes] = useState<StakeWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [targetCount, setTargetCount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [reward, setReward] = useState('');
    const [consequence, setConsequence] = useState('');

    // Check-in modal state
    const [checkInStakeId, setCheckInStakeId] = useState<number | null>(null);
    const [checkInAmount, setCheckInAmount] = useState('');
    const [checkInNote, setCheckInNote] = useState('');

    // Entry log state: stakeId -> entries
    const [entryLogs, setEntryLogs] = useState<Record<number, StakeEntry[]>>({});
    const [expandedStakeId, setExpandedStakeId] = useState<number | null>(null);
    const [loadingEntries, setLoadingEntries] = useState<number | null>(null);

    // Victory celebration
    const [celebrateStakeTitle, setCelebrateStakeTitle] = useState<string | null>(null);

    // Abandon modal state
    const [abandonStakeId, setAbandonStakeId] = useState<number | null>(null);
    const [abandonConfirmText, setAbandonConfirmText] = useState('');

    // Shame message popup
    const [shameMessage, setShameMessage] = useState<string | null>(null);

    useEffect(() => {
        loadAllStakes();
    }, []);

    const loadAllStakes = async () => {
        try {
            const [activeResult, inactiveResult] = await Promise.all([
                getActiveStakes(),
                getInactiveStakes(),
            ]);
            if (activeResult.error) throw new Error(activeResult.error);
            if (inactiveResult.error) throw new Error(inactiveResult.error);
            setStakes(activeResult.data || []);
            setPastStakes(inactiveResult.data || []);
        } catch (error) {
            console.error('Error loading stakes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStake = async () => {
        const target = parseInt(targetCount);
        if (!title.trim() || isNaN(target) || target < 1) return;

        try {
            const { data, error } = await createStake(
                title.trim(),
                target,
                deadline || null,
                reward.trim() || null,
                consequence.trim() || null
            );
            if (error) throw new Error(error);
            if (data) {
                setStakes([data, ...stakes]);
                setTitle('');
                setTargetCount('');
                setDeadline('');
                setReward('');
                setConsequence('');
                setShowForm(false);
            }
        } catch (error) {
            console.error('Error creating stake:', error);
        }
    };

    const openCheckInModal = (stakeId: number) => {
        setCheckInStakeId(stakeId);
        setCheckInAmount('');
        setCheckInNote('');
    };

    const handleCheckInSubmit = async () => {
        if (checkInStakeId === null) return;

        const amount = checkInAmount ? parseFloat(checkInAmount) : null;

        try {
            const { data, error } = await addStakeEntry(
                checkInStakeId,
                checkInNote.trim() || null,
                amount
            );
            if (error) throw new Error(error);

            setStakes(stakes.map(s =>
                s.id === checkInStakeId
                    ? { ...s, current_value: s.current_value + (amount ?? 0), entry_count: s.entry_count + 1 }
                    : s
            ));

            // Update entry log if expanded
            if (expandedStakeId === checkInStakeId && data) {
                setEntryLogs(prev => ({
                    ...prev,
                    [checkInStakeId]: [data, ...(prev[checkInStakeId] || [])],
                }));
            }

            setCheckInStakeId(null);
        } catch (error) {
            console.error('Error adding entry:', error);
        }
    };

    const toggleEntryLog = async (stakeId: number) => {
        if (expandedStakeId === stakeId) {
            setExpandedStakeId(null);
            return;
        }

        setExpandedStakeId(stakeId);

        if (!entryLogs[stakeId]) {
            setLoadingEntries(stakeId);
            try {
                const { data, error } = await getStakeEntries(stakeId);
                if (error) throw new Error(error);
                setEntryLogs(prev => ({ ...prev, [stakeId]: data || [] }));
            } catch (error) {
                console.error('Error loading entries:', error);
            } finally {
                setLoadingEntries(null);
            }
        }
    };

    const handleClaimVictory = async (stakeId: number) => {
        const stake = stakes.find(s => s.id === stakeId);
        if (!stake) return;

        try {
            const { error } = await deactivateStake(stakeId);
            if (error) throw new Error(error);

            setStakes(prev => prev.filter(s => s.id !== stakeId));
            setPastStakes(prev => [stake, ...prev]);
            setCelebrateStakeTitle(stake.title);
            setTimeout(() => setCelebrateStakeTitle(null), 5000);
        } catch (error) {
            console.error('Error claiming victory:', error);
        }
    };

    const handleAcceptDefeat = async (stakeId: number) => {
        const stake = stakes.find(s => s.id === stakeId);
        if (!stake) return;

        try {
            const { error } = await deactivateStake(stakeId);
            if (error) throw new Error(error);

            setStakes(prev => prev.filter(s => s.id !== stakeId));
            setPastStakes(prev => [stake, ...prev]);
        } catch (error) {
            console.error('Error accepting defeat:', error);
        }
    };

    const openAbandonModal = (stakeId: number) => {
        setAbandonStakeId(stakeId);
        setAbandonConfirmText('');
    };

    const handleAbandonConfirm = async () => {
        if (abandonStakeId === null) return;
        const stake = stakes.find(s => s.id === abandonStakeId);
        if (!stake) return;
        if (abandonConfirmText !== stake.title) return;

        try {
            const { error } = await abandonStake(abandonStakeId);
            if (error) throw new Error(error);

            const abandonedStake = { ...stake, active: false, abandoned: true };
            setStakes(prev => prev.filter(s => s.id !== abandonStakeId));
            setPastStakes(prev => [abandonedStake, ...prev]);
            setAbandonStakeId(null);

            const msg = getRandomShameMessage();
            setShameMessage(msg);
            setTimeout(() => setShameMessage(null), 5000);
        } catch (error) {
            console.error('Error abandoning stake:', error);
        }
    };

    const abandonTarget = abandonStakeId !== null
        ? stakes.find(s => s.id === abandonStakeId)
        : null;

    if (loading) {
        return <p className="text-gray-400 text-center py-8">Loading stakes...</p>;
    }

    return (
        <div>
            {/* Victory Celebration */}
            {celebrateStakeTitle && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                    onClick={() => setCelebrateStakeTitle(null)}
                >
                    <div className="bg-gradient-to-br from-yellow-400 via-green-500 to-emerald-600 p-1 rounded-2xl animate-pulse">
                        <div className="bg-gray-900 rounded-2xl p-8 text-center max-w-md">
                            <div className="text-6xl mb-4 animate-bounce">
                                🎉🏆🎉
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">
                                VICTORY!
                            </h2>
                            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-500 mb-4">
                                {celebrateStakeTitle}
                            </p>
                            <p className="text-gray-300 mb-6">
                                You crushed it! Stake complete.
                            </p>
                            <button
                                onClick={() => setCelebrateStakeTitle(null)}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
                            >
                                Onward!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shame Message */}
            {shameMessage && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                    onClick={() => setShameMessage(null)}
                >
                    <div className="bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 p-1 rounded-2xl">
                        <div className="bg-gray-900 rounded-2xl p-8 text-center max-w-md">
                            <div className="text-6xl mb-4">
                                😔
                            </div>
                            <h2 className="text-2xl font-bold text-gray-400 mb-4">
                                Stake Abandoned
                            </h2>
                            <p className="text-gray-300 mb-6 italic">
                                &ldquo;{shameMessage}&rdquo;
                            </p>
                            <button
                                onClick={() => setShameMessage(null)}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full transition-all"
                            >
                                Yeah, yeah...
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Stake Button / Form */}
            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-gray-900 text-gray-400 text-lg px-6 py-4 rounded-lg border-2 border-dashed border-gray-700 hover:border-purple-500 hover:text-purple-400 mb-8 transition-colors"
                >
                    + New Stake
                </button>
            ) : (
                <div className="bg-gray-900 p-6 rounded-lg border-2 border-purple-700 mb-8">
                    <h3 className="text-lg font-bold text-purple-400 mb-4">Create a Stake</h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What's at stake? (e.g. Run 30 times)"
                            className="w-full bg-black text-white px-4 py-3 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                        />
                        <input
                            type="number"
                            value={targetCount}
                            onChange={(e) => setTargetCount(e.target.value)}
                            placeholder="Target count (e.g. 30)"
                            min="1"
                            className="w-full bg-black text-white px-4 py-3 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                        />
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full bg-black text-white px-4 py-3 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                        />
                        <input
                            type="text"
                            value={reward}
                            onChange={(e) => setReward(e.target.value)}
                            placeholder="Reward (optional, e.g. Buy new shoes)"
                            className="w-full bg-black text-white px-4 py-3 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                        />
                        <input
                            type="text"
                            value={consequence}
                            onChange={(e) => setConsequence(e.target.value)}
                            placeholder="Consequence (optional, e.g. Donate $50 to charity)"
                            className="w-full bg-black text-white px-4 py-3 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                        />
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleCreateStake}
                                className="px-6 py-2 rounded bg-purple-600 hover:bg-purple-700 font-bold"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setTitle('');
                                    setTargetCount('');
                                    setDeadline('');
                                    setReward('');
                                    setConsequence('');
                                }}
                                className="px-6 py-2 rounded bg-gray-700 hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Stakes */}
            {stakes.length === 0 && pastStakes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No active stakes yet.</p>
                    <p className="text-sm mt-2">Create one to start tracking your commitment.</p>
                </div>
            ) : (
                <>
                    {stakes.length === 0 && (
                        <p className="text-gray-500 text-center py-6">No active stakes. Create one above!</p>
                    )}
                    <div className="space-y-4">
                        {stakes.map((stake) => (
                            <StakeCard
                                key={stake.id}
                                stake={stake}
                                isPast={false}
                                entryLogs={entryLogs}
                                expandedStakeId={expandedStakeId}
                                loadingEntries={loadingEntries}
                                onCheckIn={openCheckInModal}
                                onToggleEntryLog={toggleEntryLog}
                                onClaimVictory={handleClaimVictory}
                                onAcceptDefeat={handleAcceptDefeat}
                                onAbandon={openAbandonModal}
                            />
                        ))}
                    </div>

                    {/* Past Stakes */}
                    {pastStakes.length > 0 && (
                        <div className="mt-10">
                            <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-4">Past Stakes</h3>
                            <div className="space-y-4">
                                {pastStakes.map((stake) => (
                                    <StakeCard
                                        key={stake.id}
                                        stake={stake}
                                        isPast={true}
                                        entryLogs={entryLogs}
                                        expandedStakeId={expandedStakeId}
                                        loadingEntries={loadingEntries}
                                        onCheckIn={openCheckInModal}
                                        onToggleEntryLog={toggleEntryLog}
                                        onClaimVictory={handleClaimVictory}
                                        onAcceptDefeat={handleAcceptDefeat}
                                        onAbandon={openAbandonModal}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Check-in Modal */}
            {checkInStakeId !== null && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-1 rounded-2xl">
                        <div className="bg-gray-900 rounded-2xl p-6 w-80">
                            <h3 className="text-lg font-bold text-purple-400 mb-4">Check In</h3>
                            <div className="space-y-3">
                                <input
                                    type="number"
                                    value={checkInAmount}
                                    onChange={(e) => setCheckInAmount(e.target.value)}
                                    placeholder="Amount (optional, e.g. 3.5)"
                                    step="any"
                                    className="w-full bg-black text-white px-4 py-3 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                                />
                                <input
                                    type="text"
                                    value={checkInNote}
                                    onChange={(e) => setCheckInNote(e.target.value)}
                                    placeholder="Note (optional)"
                                    className="w-full bg-black text-white px-4 py-3 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                                />
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleCheckInSubmit}
                                        className="px-6 py-2 rounded bg-purple-600 hover:bg-purple-700 font-bold"
                                    >
                                        Submit
                                    </button>
                                    <button
                                        onClick={() => setCheckInStakeId(null)}
                                        className="px-6 py-2 rounded bg-gray-700 hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Abandon Confirmation Modal */}
            {abandonTarget && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-red-800 to-gray-800 p-1 rounded-2xl">
                        <div className="bg-gray-900 rounded-2xl p-6 w-96">
                            <h3 className="text-lg font-bold text-red-400 mb-2">Abandon Stake?</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Type <span className="text-white font-bold">&ldquo;{abandonTarget.title}&rdquo;</span> to confirm you&apos;re giving up.
                            </p>
                            <input
                                type="text"
                                value={abandonConfirmText}
                                onChange={(e) => setAbandonConfirmText(e.target.value)}
                                placeholder="Type the stake title to confirm"
                                className="w-full bg-black text-white px-4 py-3 rounded border border-gray-700 focus:border-red-500 focus:outline-none mb-4"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAbandonConfirm}
                                    disabled={abandonConfirmText !== abandonTarget.title}
                                    className={`px-6 py-2 rounded font-bold text-sm ${
                                        abandonConfirmText === abandonTarget.title
                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    I Quit
                                </button>
                                <button
                                    onClick={() => setAbandonStakeId(null)}
                                    className="px-6 py-2 rounded bg-gray-700 hover:bg-gray-600 font-bold text-sm"
                                >
                                    Never Mind
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
