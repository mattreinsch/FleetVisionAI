export interface BoundingBox {
  label: string;
  box: [number, number, number, number]; // [x, y, width, height] normalized (0-1)
}

export interface LabelCategories {
  driverMonitoring: string[];
  roadEnvironment: string[];
  logistics: string[];
}

export type AppStep =
  | 'UPLOAD'
  | 'NARRATIVE'
  | 'LABELS'
  | 'BOUNDING_BOXES'
  | 'FILTER_BOXES'
  | 'MASKS'
  | 'SUMMARY';
