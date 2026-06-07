import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/db';
import { authenticate } from '../middleware/auth';
import { dealStateToApi, dealStatusToState } from '../utils/dealMapping';
import { requireTenantId } from '../utils/tenant';
import {
  addDealDocument as persistDealDocument,
  getDealDocuments,
  type DealDocumentRecord,
} from '../services/dealDocumentsStore';

const router = Router();

router.use(authenticate);

const documentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  type: z.string().min(1),
  size: z.string().optional(),
});

const createDealSchema = z.object({
  property_id: z.string().uuid(),
  deal_state: z
    .enum(['Prospecting', 'Under Contract', 'Due Diligence', 'Closed', 'Lost'])
    .optional(),
  status: z.enum(['pipeline', 'review', 'approved', 'closed']).optional(),
  property_type: z.enum(['Multifamily', 'Retail', 'Office', 'Industrial', 'Land']).optional(),
  entry_mode: z.string().max(64).optional(),
});

const updateDealSchema = z.object({
  deal_state: z
    .enum(['Prospecting', 'Under Contract', 'Due Diligence', 'Closed', 'Lost'])
    .optional(),
  status: z.enum(['pipeline', 'review', 'approved', 'closed']).optional(),
  property_type: z.enum(['Multifamily', 'Retail', 'Office', 'Industrial', 'Land']).optional(),
  entry_mode: z.string().max(64).optional(),
});

type PropertyRow = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  cap_rate?: number | null;
  indicated_value?: number | null;
  noi?: number | null;
};

async function loadPropertiesByIds(tenantId: string, propertyIds: string[]): Promise<Record<string, PropertyRow>> {
  if (propertyIds.length === 0) return {};

  const { data, error } = await supabaseAdmin
    .from('properties')
    .select('id, address, city, state, zip, cap_rate, indicated_value, noi')
    .eq('tenant_id', tenantId)
    .in('id', propertyIds);

  if (error) throw error;

  const byId: Record<string, PropertyRow> = {};
  for (const property of (data as PropertyRow[]) ?? []) {
    byId[property.id] = property;
  }
  return byId;
}

type AnalysisRow = {
  id: string;
  property_id: string;
  score?: number | null;
  recommendation?: string | null;
  indicated_value?: number | null;
  noi?: number | null;
  cap_rate?: number | null;
  created_at: string;
};

type DealRow = {
  id: string;
  tenant_id: string;
  property_id: string | null;
  deal_state: string;
  property_type: string | null;
  entry_mode: string | null;
  in_portfolio?: boolean | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  properties?: PropertyRow | PropertyRow[] | null;
};

function unwrapProperty(deal: DealRow): PropertyRow | null {
  const value = deal.properties;
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatRecommendation(value: string | null | undefined) {
  if (!value) return undefined;
  return value.toUpperCase() as 'BUY' | 'HOLD' | 'SELL' | 'NEGOTIATE' | 'PASS';
}

function formatDealResponse(deal: DealRow, analysis: AnalysisRow | null) {
  const property = unwrapProperty(deal);
  return {
    id: deal.id,
    propertyId: deal.property_id,
    address: property?.address ?? '',
    city: property?.city ?? '',
    state: property?.state ?? '',
    zip: property?.zip ?? '',
    price: property?.indicated_value ?? analysis?.indicated_value ?? 0,
    capRate: property?.cap_rate ?? analysis?.cap_rate ?? 0,
    status: dealStateToApi(deal.deal_state),
    dealState: deal.deal_state,
    propertyType: deal.property_type ?? 'Property',
    entryMode: deal.entry_mode,
    inPortfolio: Boolean(deal.in_portfolio),
    score: analysis?.score ?? undefined,
    recommendation: formatRecommendation(analysis?.recommendation),
    analysisId: analysis?.id,
    createdAt: deal.created_at?.slice(0, 10) ?? '',
    property,
    analysis,
  };
}

function formatDealDetail(
  deal: DealRow,
  analysis: AnalysisRow | null,
  documents: DealDocumentRecord[] = [],
) {
  const base = formatDealResponse(deal, analysis);
  const property = unwrapProperty(deal);
  const price = base.price;
  return {
    ...base,
    purchasePrice: price,
    estimatedValue: price,
    noi: property?.noi ?? analysis?.noi ?? 0,
    occupancy: 0,
    loanAmount: 0,
    interestRate: 0,
    loanTerm: 0,
    dscr: 0,
    documents,
    financials: [],
    timeline: [],
  };
}

async function buildDealDetailResponse(deal: DealRow, tenantId: string) {
  const analysis = await loadLatestAnalysis(deal.property_id, tenantId);
  const documents = getDealDocuments(tenantId, deal.id);
  return formatDealDetail(deal, analysis, documents);
}

async function loadLatestAnalysis(propertyId: string | null, tenantId: string) {
  if (!propertyId) return null;
  const { data } = await supabaseAdmin
    .from('analysis_results')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as AnalysisRow | null) ?? null;
}

async function loadTenantDeal(tenantId: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select('*, properties(*)')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .is('archived_at', null)
    .maybeSingle();

  if (error) throw error;
  return (data as DealRow | null) ?? null;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const filter = typeof req.query.filter === 'string' ? req.query.filter : '';

    const { data, error } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = (data as DealRow[]) ?? [];
    const propertyIds = [...new Set(rows.map((row) => row.property_id).filter(Boolean) as string[])];
    const propertiesById = await loadPropertiesByIds(tenantId, propertyIds);

    const rowsWithProperties = rows.map((row) => ({
      ...row,
      properties: row.property_id ? propertiesById[row.property_id] ?? null : null,
    }));

  // Load latest analysis per property (batch `.in()` hits Supabase RLS on some tenants).
    const analysesByProperty: Record<string, AnalysisRow> = {};
    await Promise.all(
      propertyIds.map(async (propertyId) => {
        try {
          const analysis = await loadLatestAnalysis(propertyId, tenantId);
          if (analysis) analysesByProperty[propertyId] = analysis;
        } catch (analysisError) {
          console.warn(`analysis_results lookup failed for property ${propertyId}:`, analysisError);
        }
      }),
    );

    let deals = rowsWithProperties.map((row) =>
      formatDealResponse(row, row.property_id ? analysesByProperty[row.property_id] ?? null : null),
    );

    if (search) {
      deals = deals.filter(
        (deal) =>
          deal.address.toLowerCase().includes(search) ||
          deal.city.toLowerCase().includes(search) ||
          deal.state.toLowerCase().includes(search),
      );
    }

    if (filter && filter !== 'All') {
      deals = deals.filter((deal) => deal.propertyType === filter);
    }

    res.json(deals);
  } catch (error: any) {
    console.error('List deals error:', error);
    res.status(500).json({ error: 'Failed to fetch deals', message: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const deal = await loadTenantDeal(tenantId, String(req.params.id));
    if (!deal) {
      return res.status(404).json({ error: 'Not Found', message: 'Deal not found' });
    }

    res.json(await buildDealDetailResponse(deal, tenantId));
  } catch (error: any) {
    console.error('Get deal error:', error);
    res.status(500).json({ error: 'Failed to fetch deal', message: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const input = createDealSchema.parse(req.body);
    const dealState = input.deal_state ?? (input.status ? dealStatusToState(input.status) : 'Prospecting');

    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', input.property_id)
      .maybeSingle();

    if (propertyError) throw propertyError;
    if (!property) {
      return res.status(404).json({ error: 'Not Found', message: 'Property not found for tenant' });
    }

    const { data, error } = await supabaseAdmin
      .from('deals')
      .insert({
        tenant_id: tenantId,
        property_id: input.property_id,
        deal_state: dealState,
        property_type: input.property_type ?? null,
        entry_mode: input.entry_mode ?? null,
        created_by: req.user?.id ?? null,
      })
      .select('*, properties(*)')
      .single();

    if (error) throw error;

    res.status(201).json(await buildDealDetailResponse(data as DealRow, tenantId));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }
    console.error('Create deal error:', error);
    res.status(500).json({ error: 'Failed to create deal', message: error.message });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const input = updateDealSchema.parse(req.body);
    const dealState = input.deal_state ?? (input.status ? dealStatusToState(input.status) : undefined);

    const updates: Record<string, unknown> = {};
    if (dealState) updates.deal_state = dealState;
    if (input.property_type !== undefined) updates.property_type = input.property_type;
    if (input.entry_mode !== undefined) updates.entry_mode = input.entry_mode;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'No valid fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('deals')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', String(req.params.id))
      .is('archived_at', null)
      .select('*, properties(*)')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Not Found', message: 'Deal not found' });
    }

    const deal = data as DealRow;
    res.json(await buildDealDetailResponse(deal, tenantId));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }
    console.error('Update deal error:', error);
    res.status(500).json({ error: 'Failed to update deal', message: error.message });
  }
});

router.post('/:id/documents', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const dealId = String(req.params.id);
    const deal = await loadTenantDeal(tenantId, dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Not Found', message: 'Deal not found' });
    }

    const input = documentSchema.parse(req.body);
    const doc: DealDocumentRecord = {
      id: input.id ?? `doc_${Date.now()}`,
      name: input.name,
      type: input.type,
      size: input.size ?? '—',
    };

    persistDealDocument(tenantId, dealId, doc);
    res.status(201).json(await buildDealDetailResponse(deal, tenantId));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }
    console.error('Add deal document error:', error);
    res.status(500).json({ error: 'Failed to add document', message: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const { data, error } = await supabaseAdmin
      .from('deals')
      .update({ archived_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('id', String(req.params.id))
      .is('archived_at', null)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Not Found', message: 'Deal not found' });
    }

    res.json({ message: 'Deal archived', id: data.id });
  } catch (error: any) {
    console.error('Archive deal error:', error);
    res.status(500).json({ error: 'Failed to archive deal', message: error.message });
  }
});

export default router;
