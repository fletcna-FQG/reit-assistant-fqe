export type DealStateDb =
  | 'Prospecting'
  | 'Under Contract'
  | 'Due Diligence'
  | 'Closed'
  | 'Lost';

export type DealStatusApi = 'pipeline' | 'review' | 'approved' | 'closed';

export type TaskStatusDb = 'Pending' | 'In Progress' | 'Done';
export type TaskStatusApi = 'pending' | 'in_progress' | 'completed' | 'cancelled';

const DEAL_STATE_TO_API: Record<DealStateDb, DealStatusApi> = {
  Prospecting: 'pipeline',
  'Due Diligence': 'review',
  'Under Contract': 'approved',
  Closed: 'closed',
  Lost: 'closed',
};

const DEAL_STATUS_TO_STATE: Record<DealStatusApi, DealStateDb> = {
  pipeline: 'Prospecting',
  review: 'Due Diligence',
  approved: 'Under Contract',
  closed: 'Lost',
};

const TASK_STATUS_TO_API: Record<TaskStatusDb, TaskStatusApi> = {
  Pending: 'pending',
  'In Progress': 'in_progress',
  Done: 'completed',
};

const TASK_STATUS_TO_DB: Record<TaskStatusApi, TaskStatusDb> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Done',
  cancelled: 'Done',
};

export function dealStateToApi(state: string | null | undefined): DealStatusApi {
  if (state && state in DEAL_STATE_TO_API) {
    return DEAL_STATE_TO_API[state as DealStateDb];
  }
  return 'pipeline';
}

export function dealStatusToState(status: string): DealStateDb {
  if (status in DEAL_STATUS_TO_STATE) {
    return DEAL_STATUS_TO_STATE[status as DealStatusApi];
  }
  if (status in DEAL_STATE_TO_API) {
    return status as DealStateDb;
  }
  return 'Prospecting';
}

export function taskStatusToApi(status: string | null | undefined): TaskStatusApi {
  if (status && status in TASK_STATUS_TO_API) {
    return TASK_STATUS_TO_API[status as TaskStatusDb];
  }
  return 'pending';
}

export function taskStatusToDb(status: string): TaskStatusDb {
  if (status in TASK_STATUS_TO_DB) {
    return TASK_STATUS_TO_DB[status as TaskStatusApi];
  }
  if (status in TASK_STATUS_TO_API) {
    return status as TaskStatusDb;
  }
  return 'Pending';
}
