import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseDb } from '../config/db';
import { authenticate } from '../middleware/auth';
import { dealStateToApi } from '../utils/dealMapping';
import { requireTenantId } from '../utils/tenant';

const router = Router();

router.use(authenticate);

type PortfolioSourceRow = {
  tenant_id: string;
  deal_state: string | null;
  property_state: string | null;
  indicated_value: number | string | null;
  noi: number | string | null;
  cap_rate: number | string | null;
};

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function capRateBucket(rate: number): string {
  if (rate < 5) return '<5%';
  if (rate < 6) return '5-6%';
  if (rate < 7) return '6-7%';
  if (rate < 8) return '7-8%';
  return '>8%';
}

router.get('/kpis', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const { data, error } = await supabaseDb
      .from('portfolio_kpi_source')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      // Fallback if migration view is not applied yet.
      const { data: deals, error: dealsError } = await supabaseDb
        .from('deals')
        .select('deal_state, property_id, properties(indicated_value, noi, cap_rate, state)')
        .eq('tenant_id', tenantId)
        .is('archived_at', null);

      if (dealsError) throw dealsError;

      const rows = (deals ?? []).map((deal: any) => {
        const property = Array.isArray(deal.properties) ? deal.properties[0] : deal.properties;
        return {
          tenant_id: tenantId,
          deal_state: deal.deal_state,
          property_state: property?.state ?? null,
          indicated_value: property?.indicated_value ?? 0,
          noi: property?.noi ?? 0,
          cap_rate: property?.cap_rate ?? 0,
        } satisfies PortfolioSourceRow;
      });

      return res.json(await buildKpiResponse(rows, tenantId));
    }

    res.json(await buildKpiResponse((data as PortfolioSourceRow[]) ?? [], tenantId));
  } catch (error: any) {
    console.error('Portfolio KPI error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio KPIs', message: error.message });
  }
});

async function buildKpiResponse(rows: PortfolioSourceRow[], tenantId: string) {
  const totalPortfolioValue = rows.reduce((sum, row) => sum + toNumber(row.indicated_value), 0);
  const totalNoi = rows.reduce((sum, row) => sum + toNumber(row.noi), 0);
  const capRates = rows.map((row) => toNumber(row.cap_rate)).filter((rate) => rate > 0);
  const avgCapRate =
    capRates.length > 0 ? capRates.reduce((sum, rate) => sum + rate, 0) / capRates.length : 0;

  const dealCountByState = rows.reduce<Record<string, number>>((acc, row) => {
    const key = row.deal_state ?? 'Unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const activeDeals = rows.filter(
    (row) => row.deal_state !== 'Closed' && row.deal_state !== 'Lost',
  ).length;

  const { count } = await supabaseDb
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'Pending');

  return {
    totalPortfolioValue,
    totalNoi,
    avgCapRate,
    dealCountByState,
    totalAum: totalPortfolioValue,
    aumChange: 0,
    capRateChange: 0,
    activeDeals,
    dealsChange: 0,
    pendingTasks: count ?? 0,
    tasksChange: 0,
  };
}

router.get('/activity', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const [dealsResult, tasksResult] = await Promise.all([
      supabaseDb
        .from('deals')
        .select('id, created_at, properties(address, city)')
        .eq('tenant_id', tenantId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(5),
      supabaseDb
        .from('tasks')
        .select('id, title, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    if (dealsResult.error) throw dealsResult.error;
    if (tasksResult.error) throw tasksResult.error;

    const dealActivity = (dealsResult.data ?? []).map((deal: any) => {
      const property = Array.isArray(deal.properties) ? deal.properties[0] : deal.properties;
      const label = property ? `${property.address}, ${property.city}` : 'New deal';
      return {
        id: `deal-${deal.id}`,
        icon: 'deal' as const,
        message: `Deal created: ${label}`,
        timestamp: deal.created_at,
      };
    });

    const taskActivity = (tasksResult.data ?? []).map((task: any) => ({
      id: `task-${task.id}`,
      icon: 'task' as const,
      message: `Task created: ${task.title}`,
      timestamp: task.created_at,
    }));

    const combined = [...dealActivity, ...taskActivity]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    res.json(combined);
  } catch (error: any) {
    console.error('Portfolio activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity', message: error.message });
  }
});

router.get('/cap-rate-chart', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const { data, error } = await supabaseDb
      .from('portfolio_kpi_source')
      .select('cap_rate')
      .eq('tenant_id', tenantId);

    if (error) throw error;

    const buckets: Record<string, number> = {
      '<5%': 0,
      '5-6%': 0,
      '6-7%': 0,
      '7-8%': 0,
      '>8%': 0,
    };

    for (const row of (data as PortfolioSourceRow[]) ?? []) {
      const rate = toNumber(row.cap_rate);
      if (rate <= 0) continue;
      buckets[capRateBucket(rate)] += 1;
    }

    res.json(
      Object.entries(buckets).map(([label, value]) => ({
        label,
        value,
      })),
    );
  } catch (error: any) {
    console.error('Cap rate chart error:', error);
    res.status(500).json({ error: 'Failed to fetch cap rate chart', message: error.message });
  }
});

const PORTFOLIO_ELIGIBLE_STATES = new Set(['Under Contract', 'Closed']);

const importRowSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  gross_rental_income: z.number().min(0),
  other_income: z.number().min(0).default(0),
  vacancy_percent: z.number().min(0).max(100).default(5),
  property_taxes: z.number().min(0).default(0),
  insurance: z.number().min(0).default(0),
  utilities: z.number().min(0).default(0),
  repairs_maintenance: z.number().min(0).default(0),
  property_management: z.number().min(0).default(0),
  other_operating_expenses: z.number().min(0).default(0),
  cap_rate: z.number().positive(),
  property_type: z.enum(['Multifamily', 'Retail', 'Office', 'Industrial', 'Land']).optional(),
});

const importBodySchema = z.object({
  rows: z.array(importRowSchema).min(1).max(100),
});

function calculateDerivedFields(input: z.infer<typeof importRowSchema>) {
  const egi = (input.gross_rental_income + input.other_income) * (1 - input.vacancy_percent / 100);
  const total_operating_expenses =
    input.property_taxes +
    input.insurance +
    input.utilities +
    input.repairs_maintenance +
    input.property_management +
    input.other_operating_expenses;
  const noi = egi - total_operating_expenses;
  const indicated_value = noi / (input.cap_rate / 100);
  return { egi, total_operating_expenses, noi, indicated_value };
}

type HoldingRow = {
  deal_id: string;
  tenant_id: string;
  deal_state: string | null;
  property_id: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  indicated_value: number | string | null;
  noi: number | string | null;
  cap_rate: number | string | null;
  score: number | null;
  recommendation: string | null;
};

function formatHolding(row: HoldingRow) {
  const value = toNumber(row.indicated_value);
  return {
    dealId: row.deal_id,
    propertyId: row.property_id,
    address: row.address ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    zip: row.zip ?? '',
    value,
    noi: toNumber(row.noi),
    capRate: toNumber(row.cap_rate),
    status: dealStateToApi(row.deal_state),
    dealState: row.deal_state,
    score: row.score ?? undefined,
    recommendation: row.recommendation?.toUpperCase(),
    inPortfolio: true,
  };
}

function isMissingPortfolioColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    (error.message?.includes('in_portfolio') ?? false)
  );
}

async function loadHoldingsFromDeals(
  tenantId: string,
  options?: { inPortfolioOnly?: boolean },
): Promise<HoldingRow[]> {
  let query = supabaseDb
    .from('deals')
    .select(
      'id, deal_state, property_id, properties(address, city, state, zip, indicated_value, noi, cap_rate)',
    )
    .eq('tenant_id', tenantId)
    .is('archived_at', null);

  if (options?.inPortfolioOnly) {
    query = query.eq('in_portfolio', true);
  } else {
    query = query.in('deal_state', [...PORTFOLIO_ELIGIBLE_STATES]);
  }

  const { data: deals, error: dealsError } = await query;
  if (dealsError) throw dealsError;

  return (deals ?? []).map((deal: any) => {
    const property = Array.isArray(deal.properties) ? deal.properties[0] : deal.properties;
    return {
      deal_id: deal.id,
      tenant_id: tenantId,
      deal_state: deal.deal_state,
      property_id: deal.property_id,
      address: property?.address ?? null,
      city: property?.city ?? null,
      state: property?.state ?? null,
      zip: property?.zip ?? null,
      indicated_value: property?.indicated_value ?? 0,
      noi: property?.noi ?? 0,
      cap_rate: property?.cap_rate ?? 0,
      score: null,
      recommendation: null,
    } satisfies HoldingRow;
  });
}

async function loadHoldings(tenantId: string): Promise<HoldingRow[]> {
  const { data, error } = await supabaseDb
    .from('portfolio_holdings_source')
    .select('*')
    .eq('tenant_id', tenantId);

  if (!error && data) {
    return data as HoldingRow[];
  }

  if (error && !isMissingPortfolioColumn(error)) {
    console.warn('portfolio_holdings_source unavailable:', error.message);
  }

  try {
    return await loadHoldingsFromDeals(tenantId, { inPortfolioOnly: true });
  } catch (dealsError: any) {
    if (!isMissingPortfolioColumn(dealsError)) {
      throw dealsError;
    }
    return loadHoldingsFromDeals(tenantId, { inPortfolioOnly: false });
  }
}

router.get('/holdings', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const rows = await loadHoldings(tenantId);
    const holdings = rows.map(formatHolding);
    const totalAum = holdings.reduce((sum, row) => sum + row.value, 0);
    const totalNoi = holdings.reduce((sum, row) => sum + row.noi, 0);
    const capRates = holdings.map((row) => row.capRate).filter((rate) => rate > 0);
    const avgCapRate =
      capRates.length > 0 ? capRates.reduce((sum, rate) => sum + rate, 0) / capRates.length : 0;

    res.json({
      holdings,
      summary: {
        count: holdings.length,
        totalAum,
        totalNoi,
        avgCapRate,
      },
    });
  } catch (error: any) {
    console.error('Portfolio holdings error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio holdings', message: error.message });
  }
});

router.post('/holdings/:dealId', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const dealId = String(req.params.dealId);
    const { data: deal, error: fetchError } = await supabaseDb
      .from('deals')
      .select('id, deal_state, property_id')
      .eq('tenant_id', tenantId)
      .eq('id', dealId)
      .is('archived_at', null)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!deal) {
      return res.status(404).json({ error: 'Not Found', message: 'Deal not found' });
    }

    if (!PORTFOLIO_ELIGIBLE_STATES.has(deal.deal_state)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Only approved or closed deals can be added to the portfolio',
      });
    }

    let inPortfolio = true;
    const { data, error } = await supabaseDb
      .from('deals')
      .update({ in_portfolio: true })
      .eq('tenant_id', tenantId)
      .eq('id', dealId)
      .select('id, in_portfolio')
      .single();

    if (error) {
      if (!isMissingPortfolioColumn(error)) {
        throw error;
      }
      inPortfolio = PORTFOLIO_ELIGIBLE_STATES.has(deal.deal_state);
    }

    res.status(201).json({
      message: inPortfolio
        ? 'Deal added to portfolio'
        : 'Deal is eligible for portfolio (run migration to persist in_portfolio flag)',
      dealId: data?.id ?? dealId,
      inPortfolio,
    });
  } catch (error: any) {
    console.error('Add portfolio holding error:', error);
    res.status(500).json({ error: 'Failed to add to portfolio', message: error.message });
  }
});

router.delete('/holdings/:dealId', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const dealId = String(req.params.dealId);
    const { data, error } = await supabaseDb
      .from('deals')
      .update({ in_portfolio: false })
      .eq('tenant_id', tenantId)
      .eq('id', dealId)
      .select('id')
      .maybeSingle();

    if (error && !isMissingPortfolioColumn(error)) {
      throw error;
    }
    if (!data) {
      return res.status(404).json({ error: 'Not Found', message: 'Deal not found' });
    }

    res.json({ message: 'Removed from portfolio', dealId: data.id });
  } catch (error: any) {
    console.error('Remove portfolio holding error:', error);
    res.status(500).json({ error: 'Failed to remove from portfolio', message: error.message });
  }
});

router.post('/import', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const { rows } = importBodySchema.parse(req.body);
    const created: { dealId: string; propertyId: string; address: string }[] = [];

    for (const row of rows) {
      const derived = calculateDerivedFields(row);
      const { data: property, error: propertyError } = await supabaseDb
        .from('properties')
        .insert({
          tenant_id: tenantId,
          address: row.address.trim(),
          city: row.city.trim(),
          state: row.state.trim().toUpperCase(),
          zip: row.zip.trim(),
          gross_rental_income: row.gross_rental_income,
          other_income: row.other_income,
          vacancy_percent: row.vacancy_percent,
          property_taxes: row.property_taxes,
          insurance: row.insurance,
          utilities: row.utilities,
          repairs_maintenance: row.repairs_maintenance,
          property_management: row.property_management,
          other_operating_expenses: row.other_operating_expenses,
          cap_rate: row.cap_rate,
          ...derived,
        })
        .select('id')
        .single();

      if (propertyError) throw propertyError;

      const dealPayload: Record<string, unknown> = {
        tenant_id: tenantId,
        property_id: property.id,
        deal_state: 'Closed',
        property_type: row.property_type ?? 'Multifamily',
        entry_mode: 'csv_import',
        created_by: req.user?.id ?? null,
      };

      let dealResult = await supabaseDb
        .from('deals')
        .insert({ ...dealPayload, in_portfolio: true })
        .select('id')
        .single();

      if (dealResult.error && isMissingPortfolioColumn(dealResult.error)) {
        dealResult = await supabaseDb.from('deals').insert(dealPayload).select('id').single();
      }

      if (dealResult.error) throw dealResult.error;
      const deal = dealResult.data;

      created.push({
        dealId: deal!.id,
        propertyId: property.id,
        address: row.address,
      });
    }

    res.status(201).json({
      message: `Imported ${created.length} holding${created.length === 1 ? '' : 's'}`,
      created,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }
    console.error('Portfolio import error:', error);
    res.status(500).json({ error: 'Failed to import portfolio', message: error.message });
  }
});

export default router;
