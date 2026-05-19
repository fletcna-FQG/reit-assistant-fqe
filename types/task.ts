import type { TaskPriority, TaskStatus } from './index';

export interface Task {
  id: string;
  title: string;
  assignee: string;
  assigneeInitials: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus | 'cancelled';
  dealId?: string;
}
