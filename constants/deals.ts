import type { DealStatus } from '@/types/index';
import { PROPERTY_TYPES } from '@/constants/propertyTypes';

export const DEAL_STATUS_OPTIONS: { value: DealStatus; label: string }[] = [
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'closed', label: 'Closed' },
];

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  pipeline: 'Pipeline',
  review: 'Under Review',
  approved: 'Approved',
  closed: 'Closed',
};

/** Deal State dropdown labels (aligned with Tasks kanban columns). */
export const DEAL_STATE_DROPDOWN_OPTIONS: { value: DealStatus; label: string }[] = [
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'review', label: 'In Progress' },
  { value: 'approved', label: 'Completed' },
  { value: 'closed', label: 'Cancelled' },
];

export const DEAL_STATE_DROPDOWN_LABELS: Record<DealStatus, string> = {
  pipeline: 'Pipeline',
  review: 'In Progress',
  approved: 'Completed',
  closed: 'Cancelled',
};

/** Selectable deal-state tiles on the Tasks screen. */
export const TASK_DEAL_STATE_TILES: {
  dealStatus: DealStatus;
  label: string;
  subtitle?: string;
}[] = [
  { dealStatus: 'pipeline', label: 'New', subtitle: 'Pending' },
  { dealStatus: 'review', label: 'In Progress' },
  { dealStatus: 'approved', label: 'Completed' },
  { dealStatus: 'closed', label: 'Cancelled' },
];

/** Default deal states when no tile is selected (New / Pending). */
export const DEFAULT_TASK_DEAL_STATES: DealStatus[] = ['pipeline'];

/** Kanban columns on the Tasks screen — task status mapped to deal state. */
export const TASK_DEAL_STATE_COLUMNS: {
  taskStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dealStatus: DealStatus;
  label: string;
}[] = [
  { taskStatus: 'pending', dealStatus: 'pipeline', label: 'New' },
  { taskStatus: 'in_progress', dealStatus: 'review', label: 'In Progress' },
  { taskStatus: 'completed', dealStatus: 'approved', label: 'Completed' },
  { taskStatus: 'cancelled', dealStatus: 'closed', label: 'Cancelled' },
];

export const DEAL_STATUS_TO_TASK_STATUS: Record<
  DealStatus,
  'pending' | 'in_progress' | 'completed' | 'cancelled'
> = {
  pipeline: 'pending',
  review: 'in_progress',
  approved: 'completed',
  closed: 'cancelled',
};

export const TASK_STATUS_TO_DEAL_STATUS: Record<
  'pending' | 'in_progress' | 'completed' | 'cancelled',
  DealStatus
> = {
  pending: 'pipeline',
  in_progress: 'review',
  completed: 'approved',
  cancelled: 'closed',
};

/** Document types commonly required to complete property analysis. */
export const ANALYSIS_DOCUMENT_TYPES = [
  'Purchase Agreement',
  'Financial Pro Forma',
  'Rent Roll',
  'Operating Expenses',
  'Inspection Report',
  'Appraisal',
  'Title Report',
] as const;

export type AnalysisDocumentType = (typeof ANALYSIS_DOCUMENT_TYPES)[number];

export const DEAL_PROPERTY_FILTERS = ['All', ...PROPERTY_TYPES] as const;
