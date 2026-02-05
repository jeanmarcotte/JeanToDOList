'use client';

import { useEffect } from 'react';

interface GoalCelebrationProps {
    goalTitle: string;
    onClose: () => void;
}

export default function GoalCelebration({ goalTitle, onClose }: GoalCelebrationProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 cursor-pointer"
            onClick={onClose}
        >
            <div className="text-center animate-bounce">
                <div className="text-8xl mb-6">🎯</div>
                <h2 className="text-4xl font-bold text-white mb-4">GOAL ACHIEVED!</h2>
                <p className="text-xl text-teal-400 max-w-md mx-auto px-4">{goalTitle}</p>
                <p className="text-gray-500 mt-6 text-sm">Tap anywhere to close</p>
            </div>
        </div>
    );
}
