import React from 'react';
import type { BoundingBox } from '../types';

interface ImageDisplayProps {
    imageUrl: string | null;
    mediaType: 'image' | 'video' | null;
    boxes: BoundingBox[];
    filteredLabels?: string[];
    maskedLabel?: string | null;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageUrl, mediaType, boxes, filteredLabels = [], maskedLabel }) => {
    const isFiltered = boxes.length > 0 && filteredLabels.length > 0;
    const isMasked = !!maskedLabel;

    return (
        <div className="w-full aspect-video bg-gray-800/50 border border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            {imageUrl ? (
                <div className="relative w-full h-full">
                    {mediaType === 'video' ? (
                        <video 
                            src={imageUrl} 
                            className="w-full h-full object-contain" 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            aria-label="Uploaded video for analysis"
                        />
                    ) : (
                        <img 
                            src={imageUrl} 
                            alt="Analysis frame" 
                            className="w-full h-full object-contain" 
                        />
                    )}
                    {boxes.map((b, index) => {
                        const style: React.CSSProperties = {
                            left: `${b.box[0] * 100}%`,
                            top: `${b.box[1] * 100}%`,
                            width: `${b.box[2] * 100}%`,
                            height: `${b.box[3] * 100}%`,
                        };

                        let borderColor = 'border-cyan-400';
                        let labelBg = 'bg-cyan-400';
                        let opacity = 'opacity-100';
                        let zIndex = 10;
                        let innerContent: React.ReactNode = null;

                        if (isFiltered) {
                            if (!filteredLabels.includes(b.label)) {
                                opacity = 'opacity-30';
                                zIndex = 5;
                            }
                        }

                        if (isMasked && b.label === maskedLabel) {
                            borderColor = 'border-purple-400';
                            labelBg = 'bg-purple-400';
                            zIndex = 20;
                            innerContent = <div className="absolute inset-0 bg-purple-500/30"></div>;
                        }

                        return (
                            <div
                                key={`${b.label}-${index}`}
                                className={`absolute border-2 ${borderColor} ${opacity} transition-all duration-300`}
                                style={{ ...style, zIndex }}
                                role="figure"
                                aria-label={`Bounding box for ${b.label}`}
                            >
                                {innerContent}
                                <span className={`absolute -top-0.5 left-0 -translate-y-full text-xs font-mono text-black px-1.5 py-0.5 rounded-t-sm whitespace-nowrap ${labelBg}`}>
                                    {b.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-gray-500">Upload an image or video to begin</p>
            )}
        </div>
    );
};

export default ImageDisplay;
