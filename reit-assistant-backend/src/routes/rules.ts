import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { cloneSystemRules, type InvestmentRule } from '../constants/systemRules';
import { authenticate } from '../middleware/auth';
import { requireTenantId } from '../utils/tenant';

const router = Router();

router.use(authenticate);

const customRulesByTenant = new Map<string, InvestmentRule[]>();
const systemOverridesByTenant = new Map<string, Record<string, Partial<InvestmentRule>>>();

const createRuleSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['financial', 'risk', 'market']),
  description: z.string().min(1),
  conditions: z
    .array(
      z.object({
        field: z.string().min(1),
        operator: z.enum(['>=', '<=', '>', '<', '==', '!=']),
        value: z.string().min(1),
      }),
    )
    .min(1),
  scoreImpact: z.number(),
  active: z.boolean().default(true),
  priority: z.number().int().positive(),
});

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['financial', 'risk', 'market']).optional(),
  description: z.string().min(1).optional(),
  conditions: createRuleSchema.shape.conditions.optional(),
  scoreImpact: z.number().optional(),
  active: z.boolean().optional(),
  priority: z.number().int().positive().optional(),
});

function getRulesForTenant(tenantId: string): InvestmentRule[] {
  const overrides = systemOverridesByTenant.get(tenantId) ?? {};
  const systemRules = cloneSystemRules().map((rule) => ({
    ...rule,
    ...overrides[rule.id],
    conditions: overrides[rule.id]?.conditions ?? rule.conditions,
  }));
  const customRules = customRulesByTenant.get(tenantId) ?? [];
  return [...systemRules, ...customRules].sort((a, b) => a.priority - b.priority);
}

function findRuleForTenant(tenantId: string, id: string): InvestmentRule | undefined {
  return getRulesForTenant(tenantId).find((rule) => rule.id === id);
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    res.json(getRulesForTenant(tenantId));
  } catch (error: any) {
    console.error('List rules error:', error);
    res.status(500).json({ error: 'Failed to fetch rules', message: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const input = createRuleSchema.parse(req.body);
    const customRules = customRulesByTenant.get(tenantId) ?? [];
    const newRule: InvestmentRule = {
      ...input,
      id: `custom_${Date.now()}`,
      isSystem: false,
    };
    customRulesByTenant.set(tenantId, [...customRules, newRule]);
    res.status(201).json(newRule);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }
    console.error('Create rule error:', error);
    res.status(500).json({ error: 'Failed to create rule', message: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const id = String(req.params.id);
    const updates = updateRuleSchema.parse(req.body);
    const existing = findRuleForTenant(tenantId, id);
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Rule not found' });
    }

    if (existing.isSystem) {
      const allowed = {
        active: updates.active,
        scoreImpact: updates.scoreImpact,
      };
      const tenantOverrides = systemOverridesByTenant.get(tenantId) ?? {};
      tenantOverrides[id] = {
        ...tenantOverrides[id],
        ...Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined)),
      };
      systemOverridesByTenant.set(tenantId, tenantOverrides);
      const updated = findRuleForTenant(tenantId, id);
      return res.json(updated);
    }

    const customRules = customRulesByTenant.get(tenantId) ?? [];
    const idx = customRules.findIndex((rule) => rule.id === id);
    if (idx < 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Rule not found' });
    }

    customRules[idx] = { ...customRules[idx], ...updates };
    customRulesByTenant.set(tenantId, customRules);
    res.json(customRules[idx]);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }
    console.error('Update rule error:', error);
    res.status(500).json({ error: 'Failed to update rule', message: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const id = String(req.params.id);
    const existing = findRuleForTenant(tenantId, id);
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Rule not found' });
    }
    if (existing.isSystem) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Out-of-box rules cannot be deleted. Disable them instead.',
      });
    }

    const customRules = (customRulesByTenant.get(tenantId) ?? []).filter((rule) => rule.id !== id);
    customRulesByTenant.set(tenantId, customRules);
    res.json({ message: 'Rule deleted', id });
  } catch (error: any) {
    console.error('Delete rule error:', error);
    res.status(500).json({ error: 'Failed to delete rule', message: error.message });
  }
});

export default router;
