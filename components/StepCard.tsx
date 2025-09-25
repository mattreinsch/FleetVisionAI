import React from 'react';

interface StepCardProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

const StepCard: React.FC<StepCardProps> = ({ title, description, children }) => {
    return (
        <div className="w-full p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h3 className="text-xl font-bold text-blue-300">{title}</h3>
            <p className="mt-2 text-gray-400">{description}</p>
            <div className="mt-4 border-t border-gray-700 pt-4">
                {children}
            </div>
        </div>
    );
};

export default StepCard;
