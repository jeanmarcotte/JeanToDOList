"use client";

interface CelebrationProps {
    milestone: number;
    onClose: () => void;
}

export default function Celebration({ milestone, onClose }: CelebrationProps) {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-1 rounded-2xl animate-pulse">
                <div className="bg-gray-900 rounded-2xl p-8 text-center max-w-md">
                    <div className="text-6xl mb-4 animate-bounce">
                        🎉🏆🎉
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">
                        MILESTONE!
                    </h2>

                    <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
                        {milestone} Tasks
                    </p>

                    <p className="text-gray-300 mb-6">
                        You&apos;ve completed {milestone} tasks! Keep crushing it! 💪
                    </p>

                    <button
                        onClick={onClose}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
                    >
                        Let&apos;s Keep Going!
                    </button>
                </div>
            </div>
        </div>
    );
}