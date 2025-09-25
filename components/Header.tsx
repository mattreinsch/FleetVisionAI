import React from 'react';
import TruckIcon from './icons/TruckIcon';

const Header: React.FC = () => {
    return (
        <header className="w-full max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4">
                <TruckIcon className="h-10 w-10 text-blue-400" />
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 tracking-tight">
                    FleetVision AI
                </h1>
            </div>
            <p className="mt-2 text-lg text-gray-400">
                Unsupervised Video Segmentation & Labeling for Trucking and Fleet Management
            </p>
        </header>
    );
};

export default Header;
