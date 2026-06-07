import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/db';
import { authenticate } from '../middleware/auth';
import { taskStatusToApi, taskStatusToDb } from '../utils/dealMapping';
import { requireTenantId } from '../utils/tenant';

const router = Router();

router.use(authenticate);

const createTaskSchema = z.object({
  deal_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'Pending', 'In Progress', 'Done']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  assignee_name: z.string().optional(),
  assignee_initials: z.string().optional(),
  due_date: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'Pending', 'In Progress', 'Done']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  assignee_name: z.string().optional(),
  assignee_initials: z.string().optional(),
  due_date: z.string().optional(),
});

type TaskRow = {
  id: string;
  tenant_id: string;
  deal_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_name: string | null;
  assignee_initials: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

function formatTask(task: TaskRow) {
  return {
    id: task.id,
    title: task.title,
    assignee: task.assignee_name ?? 'Unassigned',
    assigneeInitials: task.assignee_initials ?? 'UA',
    dueDate: task.due_date ?? task.created_at.slice(0, 10),
    priority: task.priority,
    status: taskStatusToApi(task.status),
    dealId: task.deal_id,
    description: task.description,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    let query = supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (typeof req.query.deal_id === 'string') {
      query = query.eq('deal_id', req.query.deal_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(((data as TaskRow[]) ?? []).map(formatTask));
  } catch (error: any) {
    console.error('List tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', message: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const input = createTaskSchema.parse(req.body);

    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', input.deal_id)
      .is('archived_at', null)
      .maybeSingle();

    if (dealError) throw dealError;
    if (!deal) {
      return res.status(404).json({ error: 'Not Found', message: 'Deal not found for tenant' });
    }

    const insertPayload: Record<string, unknown> = {
      tenant_id: tenantId,
      deal_id: input.deal_id,
      title: input.title.trim(),
      status: input.status ? taskStatusToDb(input.status) : 'Pending',
      priority: input.priority ?? 'medium',
    };
    if (input.description !== undefined) insertPayload.description = input.description ?? null;
    if (input.assignee_name) insertPayload.assignee_name = input.assignee_name;
    if (input.assignee_initials) insertPayload.assignee_initials = input.assignee_initials;
    if (input.due_date) insertPayload.due_date = input.due_date;
    if (req.user?.id) insertPayload.created_by = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(formatTask(data as TaskRow));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task', message: error.message });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const input = updateTaskSchema.parse(req.body);
    const updates: Record<string, unknown> = {};

    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.description !== undefined) updates.description = input.description;
    if (input.status !== undefined) updates.status = taskStatusToDb(input.status);
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.assignee_name !== undefined) updates.assignee_name = input.assignee_name;
    if (input.assignee_initials !== undefined) updates.assignee_initials = input.assignee_initials;
    if (input.due_date !== undefined) updates.due_date = input.due_date;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'No valid fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', String(req.params.id))
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Not Found', message: 'Task not found' });
    }

    res.json(formatTask(data as TaskRow));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task', message: error.message });
  }
});

export default router;
