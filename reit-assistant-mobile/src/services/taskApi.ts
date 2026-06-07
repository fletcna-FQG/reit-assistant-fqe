import api from './api';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskRecord = {
  id: string;
  title: string;
  assignee: string;
  assigneeInitials: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  dealId: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTaskInput = {
  deal_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_name?: string;
  assignee_initials?: string;
  due_date?: string;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_name?: string;
  assignee_initials?: string;
  due_date?: string;
};

export const taskApi = {
  fetchTasks: async (dealId?: string) => {
    const response = await api.get<TaskRecord[]>('/api/tasks', {
      params: dealId ? { deal_id: dealId } : undefined,
    });
    return response.data;
  },
  createTask: async (input: CreateTaskInput) => {
    const response = await api.post<TaskRecord>('/api/tasks', input);
    return response.data;
  },
  updateTask: async (id: string, input: UpdateTaskInput) => {
    const response = await api.patch<TaskRecord>(`/api/tasks/${id}`, input);
    return response.data;
  },
};
