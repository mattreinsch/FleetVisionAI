
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { BoundingBox, LabelCategories } from './types';
import { STEPS } from './constants';
import { fileToGenerativePart, extractFrameFromVideo } from './utils/imageUtils';

import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ProcessStepper from './components/ProcessStepper';
import ImageDisplay from './components/ImageDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import StepCard from './components/StepCard';

// Mocked service for offline development or when API key is not present
const geminiServiceMock = {
    generateNarrative: async () => {
        await new Promise(res => setTimeout(res, 1000));
        return "A driver is operating a commercial truck, looking at their mobile phone while driving on a highway. The seatbelt appears to be fastened.";
    },
    proposeLabels: async () => {
        await new Promise(res => setTimeout(res, 1000));
        return {
            driverMonitoring: ["cell phone use", "hands on wheel", "eyes on road", "drowsiness", "seatbelt fastened"],
            roadEnvironment: ["car", "truck", "lane markings"],
            logistics: []
        };
    },
    // FIX: Add explicit return type to ensure the 'box' property is correctly typed as a tuple.
    generateBoundingBoxes: async (): Promise<BoundingBox[]> => {
        await new Promise(res => setTimeout(res, 1000));
        return [
            { label: 'cell phone use', box: [0.45, 0.55, 0.15, 0.2] },
            { label: 'seatbelt fastened', box: [0.5, 0.4, 0.25, 0.5] },
            { label: 'hands on wheel', box: [0.3, 0.7, 0.3, 0.25] }
        ];
    },
};

const App: React.FC = () => {
    // FIX: Refactor apiKey to a constant as setApiKey is not used.
    const apiKey = process.env.API_KEY;
    const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [imageFile, setImageFile] = useState<File | null>(null); // This is the file for the API (original image or extracted frame)
    const [imageUrl, setImageUrl] = useState<string | null>(null); // This is for the media display (image or video)
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [narrative, setNarrative] = useState<string>('');
    const [labels, setLabels] = useState<LabelCategories | null>(null);
    const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
    const [filteredLabels, setFilteredLabels] = useState<string[]>([]);
    const [maskedLabel, setMaskedLabel] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFileProcessing, setIsFileProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Effect to clean up object URL
    useEffect(() => {
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageUrl]);

    const resetState = () => {
        setCurrentStepIndex(0);
        setImageFile(null);
        // The imageUrl is revoked by the effect when it changes. 
        // Setting it to null will trigger the cleanup of the old URL.
        setImageUrl(null);
        setMediaType(null);
        setNarrative('');
        setLabels(null);
        setBoundingBoxes([]);
        setFilteredLabels([]);
        setMaskedLabel(null);
        setIsLoading(false);
        setIsFileProcessing(false);
        setError(null);
    };

    const handleFileSelect = async (file: File) => {
        resetState(); // Clear previous state
        
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            setError("Unsupported file type. Please upload an image or MP4 video file.");
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setImageUrl(objectUrl);
        setCurrentStepIndex(1);
        
        if (file.type.startsWith('image/')) {
            setMediaType('image');
            setImageFile(file);
        } else if (file.type.startsWith('video/')) {
            setMediaType('video');
            setIsFileProcessing(true);
            try {
                const frameFile = await extractFrameFromVideo(file);
                setImageFile(frameFile);
            } catch (e: any) {
                setError(`Error extracting frame from video: ${e.message}`);
                console.error(e);
            } finally {
                setIsFileProcessing(false);
            }
        }
    };

    const runStep = useCallback(async () => {
        if (!imageFile) {
            setError("No image frame to process. Please upload a file.");
            return;
        }
        setIsLoading(true);
        setError(null);

        const useMock = !ai;

        try {
            const currentStepId = STEPS[currentStepIndex].id;

            if (currentStepId === 'NARRATIVE') {
                const imagePart = await fileToGenerativePart(imageFile);
                let textResult = '';
                if(useMock) {
                     textResult = await geminiServiceMock.generateNarrative();
                } else {
                    const response = await ai!.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: { parts: [
                            imagePart,
                            {text: "Analyze this image from a commercial trucking perspective. Describe the scene in a concise narrative, focusing on driver behavior, surroundings, and potential safety events."}
                        ] },
                    });
                    textResult = response.text;
                }
                setNarrative(textResult);
            } else if (currentStepId === 'LABELS') {
                let labelResult: LabelCategories;
                if(useMock) {
                    labelResult = await geminiServiceMock.proposeLabels();
                } else {
                     const response = await ai!.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: `Based on the scene narrative: "${narrative}", propose a vocabulary of labels relevant to trucking. Categorize them into 'driverMonitoring', 'roadEnvironment', and 'logistics'.`,
                        config: {
                            responseMimeType: 'application/json',
                            responseSchema: {
                                type: Type.OBJECT,
                                properties: {
                                    driverMonitoring: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    roadEnvironment: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    logistics: { type: Type.ARRAY, items: { type: Type.STRING } },
                                }
                            }
                        }
                    });
                    labelResult = JSON.parse(response.text);
                }
                setLabels(labelResult);
            } else if (currentStepId === 'BOUNDING_BOXES') {
                if (!labels) throw new Error("Labels not found.");
                const allLabels = [...labels.driverMonitoring, ...labels.roadEnvironment, ...labels.logistics];
                
                let boxResult: BoundingBox[];
                if(useMock) {
                    boxResult = await geminiServiceMock.generateBoundingBoxes();
                } else {
                    const imagePart = await fileToGenerativePart(imageFile);
                     const response = await ai!.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: {
                          parts: [
                            imagePart,
                            { text: `For the following labels, provide bounding box coordinates for each one found in the image. Use normalized coordinates [x, y, width, height]. Labels: ${JSON.stringify(allLabels)}` }
                          ]
                        },
                        config: {
                          responseMimeType: 'application/json',
                          responseSchema: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                label: { type: Type.STRING },
                                box: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                              }
                            }
                          }
                        }
                    });
                    // FIX: Add type assertion to ensure the parsed data matches the BoundingBox[] type.
                    boxResult = JSON.parse(response.text) as BoundingBox[];
                }
                setBoundingBoxes(boxResult);
            } else if (currentStepId === 'FILTER_BOXES') {
                // Simulate filtering: prioritize driver monitoring labels
                const importantLabels = new Set(labels?.driverMonitoring || []);
                setFilteredLabels(boundingBoxes.filter(b => importantLabels.has(b.label)).map(b => b.label));
            } else if (currentStepId === 'MASKS') {
                // Simulate masking: pick the most critical item, e.g., 'cell phone use'
                const criticalLabel = boundingBoxes.find(b => b.label.toLowerCase().includes('cell phone'))?.label;
                setMaskedLabel(criticalLabel || boundingBoxes[0]?.label || null);
            }

            setCurrentStepIndex(prev => prev + 1);
        } catch (e: any) {
            setError(`An error occurred: ${e.message}`);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [ai, currentStepIndex, imageFile, narrative, labels, boundingBoxes]);

    const renderCurrentStepContent = () => {
        const stepId = STEPS[currentStepIndex].id;

        switch (stepId) {
            case 'UPLOAD':
                return <FileUpload onFileSelect={handleFileSelect} />;
            
            case 'NARRATIVE':
                return <StepCard title="1. LLM Drafts the Scene Narrative" description="Gemini analyzes the video frame to generate a contextual description of the events, focusing on relevant actions for fleet management.">
                    <button onClick={runStep} disabled={isLoading || isFileProcessing} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors">
                        {isLoading ? <LoadingSpinner /> : (isFileProcessing ? 'Processing Video...' : 'Generate Narrative')}
                    </button>
                </StepCard>;

            case 'LABELS':
                 return <StepCard title="2. LLM Proposes Label Vocabularies" description="Based on the narrative, Gemini proposes a set of relevant labels, categorized for clarity (e.g., Driver Monitoring, Road Environment).">
                     <div className="mt-4 p-3 bg-gray-800/50 rounded text-sm text-gray-300 italic">"{narrative}"</div>
                     <button onClick={runStep} disabled={isLoading} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors">
                        {isLoading ? <LoadingSpinner /> : 'Propose Labels'}
                     </button>
                 </StepCard>;
            
            case 'BOUNDING_BOXES':
                return <StepCard title="3. Grounding DINO Supplies Bounding Boxes" description="A vision model like Grounding-DINO takes the proposed labels and identifies potential matches in the frame, drawing bounding boxes around them.">
                    {labels && (
                        <div className="mt-4 text-xs space-y-2">
                           {Object.entries(labels).map(([category, list]) => {
                                // FIX: The `list` variable is inferred as `unknown` from `Object.entries`.
                                // Cast to `string[]` to safely access array properties like `.length` and `.map`.
                                const items = list as string[];
                                return (
                                   items.length > 0 && <div key={category}>
                                       <h4 className="font-bold text-gray-300 capitalize">{category.replace(/([A-Z])/g, ' $1')}</h4>
                                       <div className="flex flex-wrap gap-2 mt-1">
                                        {items.map(label => <span key={label} className="bg-gray-700 px-2 py-1 rounded-full">{label}</span>)}
                                       </div>
                                   </div>
                               );
                           })}
                        </div>
                    )}
                     <button onClick={runStep} disabled={isLoading} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors">
                        {isLoading ? <LoadingSpinner /> : 'Simulate DINO Detection'}
                     </button>
                </StepCard>;

            case 'FILTER_BOXES':
                return <StepCard title="4. LLM Filters Boxes" description="The LLM uses the original narrative to add context, filtering out irrelevant or low-confidence boxes to improve accuracy.">
                     <button onClick={runStep} disabled={isLoading} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors">
                        {isLoading ? <LoadingSpinner /> : 'Filter with LLM Context'}
                     </button>
                </StepCard>;
            
            case 'MASKS':
                return <StepCard title="5. SAM2 Propagates High-Confidence Masklets" description="For high-confidence objects, a model like SAM2 creates precise, pixel-level masks and tracks them across frames to analyze event duration.">
                     <button onClick={runStep} disabled={isLoading} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors">
                        {isLoading ? <LoadingSpinner /> : 'Simulate SAM2 Segmentation'}
                     </button>
                </StepCard>;

            case 'SUMMARY':
                return <StepCard title="6. Distilled YOLO Runs at the Edge" description="The labeled data trains a compact YOLO model, which is deployed to an in-cab device for real-time alerts without cloud dependency.">
                    <div className="mt-4 p-4 bg-gray-800/50 rounded">
                        <h4 className="font-bold text-lg text-green-400">Real-Time Analysis Complete</h4>
                        <ul className="mt-2 list-disc list-inside text-gray-300">
                            {boundingBoxes.map(b => <li key={b.label}><span className="font-semibold">{b.label}</span> detected.</li>)}
                        </ul>
                    </div>
                     <button onClick={resetState} className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors">
                        Start Over
                     </button>
                </StepCard>;

            default:
                return null;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <Header />

            {!apiKey && (
                <div className="w-full max-w-4xl bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg text-center mb-6">
                    <strong>Warning:</strong> No API key found. Running in mock mode with simulated data.
                </div>
            )}
            
            <main className="w-full max-w-7xl mx-auto mt-6">
                <ProcessStepper currentStep={currentStepIndex} />

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="w-full">
                        <ImageDisplay 
                            imageUrl={imageUrl} 
                            mediaType={mediaType}
                            boxes={boundingBoxes}
                            filteredLabels={filteredLabels}
                            maskedLabel={maskedLabel}
                        />
                    </div>
                    <div className="w-full">
                        {error && <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">{error}</div>}
                        {renderCurrentStepContent()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
