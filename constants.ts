import type { AppStep } from './types';

interface Step {
  id: AppStep;
  name: string;
}

export const STEPS: Step[] = [
  { id: 'UPLOAD', name: 'Upload Frame' },
  { id: 'NARRATIVE', name: 'Generate Narrative' },
  { id: 'LABELS', name: 'Propose Labels' },
  { id: 'BOUNDING_BOXES', name: 'Detect Objects (DINO)' },
  { id: 'FILTER_BOXES', name: 'Filter Boxes (LLM)' },
  { id: 'MASKS', name: 'Generate Masks (SAM2)' },
  { id: 'SUMMARY', name: 'Deploy Model (YOLO)' },
];
