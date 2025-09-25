import React from 'react';
import { STEPS } from '../constants';
import CheckIcon from './icons/CheckIcon';

interface ProcessStepperProps {
    currentStep: number;
}

const ProcessStepper: React.FC<ProcessStepperProps> = ({ currentStep }) => {
    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex flex-wrap items-center justify-center">
                {STEPS.map((step, stepIdx) => (
                    <li key={step.name} className="relative flex-1 min-w-[120px] pb-4 sm:pb-0">
                        {stepIdx < STEPS.length - 1 ? (
                            <div className="absolute top-4 left-1/2 -ml-px mt-0.5 h-0.5 w-full bg-gray-600" aria-hidden="true" />
                        ) : null}
                        <div className="group relative flex flex-col items-center text-center">
                            <span className="flex items-center">
                                <span className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full ${
                                    stepIdx < currentStep
                                        ? 'bg-blue-600'
                                        : stepIdx === currentStep
                                        ? 'border-2 border-blue-500 bg-gray-800'
                                        : 'border-2 border-gray-600 bg-gray-800'
                                }`}>
                                    {stepIdx < currentStep ? (
                                        <CheckIcon className="h-6 w-6 text-white" />
                                    ) : (
                                        <span className={`h-2.5 w-2.5 rounded-full ${
                                            stepIdx === currentStep ? 'bg-blue-500' : 'bg-gray-600'
                                        }`} />
                                    )}
                                </span>
                            </span>
                            <span className="mt-2 flex min-h-[40px] flex-col">
                                <span className={`text-xs font-semibold tracking-wide uppercase ${
                                    stepIdx <= currentStep ? 'text-gray-200' : 'text-gray-500'
                                }`}>
                                    {step.name}
                                </span>
                            </span>
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default ProcessStepper;
