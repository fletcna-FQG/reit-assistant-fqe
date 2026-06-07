import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/db';
import { authenticate } from '../middleware/auth';
import {
  evaluateProperty,
  recommendationFromDb,
  recommendationToDb,
  type AnalysisResult,
} from '../services/analysisEngine';
import { requireTenantId } from '../utils/tenant';

const analyzeRouter = Router();
const analysisRouter = Router();

const analysisInputSchema = z.object({
  address: z.string().min(1),
  propertyType: z.string().min(1),
  yearBuilt: z.number(),
  sqft: z.number(),
  units: z.number(),
  purchasePrice: z.number(),
  estimatedValue: z.number(),
  noi: z.number(),
  occupancy: z.number(),
  loanAmount: z.number(),
  interestRate: z.number(),
  loanTerm: z.number(),
  property_id: z.string().uuid().optional(),
});

const analysisStore = new Map<string, AnalysisResult>();

type PropertyRow = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  noi?: number | null;
  cap_rate?: number | null;
  indicated_value?: number | null;
  vacancy_percent?: number | null;
  property_type?: string | null;
  year_built?: number | null;
  sqft?: number | null;
  units?: number | null;
};

function mapPropertyToAnalysisInput(property: PropertyRow, propertyId: string) {
  const noi = Number(property.noi ?? 0);
  const capRate = Number(property.cap_rate ?? 6.5);
  const indicatedValue = Number(property.indicated_value ?? 0);
  const purchasePrice =
    indicatedValue > 0 ? indicatedValue : capRate > 0 ? noi / (capRate / 100) : 0;
  const vacancyPercent = Number(property.vacancy_percent ?? 5);
  const occupancy = Math.max(0, Math.min(100, 100 - vacancyPercent));

  return {
    address: `${property.address}, ${property.city}, ${property.state} ${property.zip}`.trim(),
    propertyType: property.property_type ?? 'Property',
    yearBuilt: property.year_built ?? 2000,
    sqft: property.sqft ?? 0,
    units: property.units ?? 0,
    purchasePrice,
    estimatedValue: purchasePrice,
    noi,
    occupancy,
    loanAmount: purchasePrice > 0 ? purchasePrice * 0.65 : 0,
    interestRate: 5.75,
    loanTerm: 30,
    property_id: propertyId,
  };
}

function mapDbRowToAnalysisResult(row: any): AnalysisResult {
  const payload =
    row.triggered_rules && typeof row.triggered_rules === 'object' && !Array.isArray(row.triggered_rules)
      ? row.triggered_rules
      : {};
  const input = payload.input ?? {
    address: '',
    propertyType: 'Property',
    yearBuilt: 2000,
    sqft: 0,
    units: 0,
    purchasePrice: row.indicated_value ?? 0,
    estimatedValue: row.indicated_value ?? 0,
    noi: row.noi ?? 0,
    occupancy: 90,
    loanAmount: 0,
    interestRate: 5.75,
    loanTerm: 30,
  };

  return {
    id: row.id,
    input,
    score: row.score ?? 0,
    recommendation: recommendationFromDb(row.recommendation),
    reasoning: payload.reasoning ?? 'Analysis complete.',
    capRate: row.cap_rate ?? 0,
    dscr: payload.dscr ?? 0,
    triggeredRules: Array.isArray(row.triggered_rules)
      ? row.triggered_rules
      : (payload.triggered ?? []),
    passedRules: payload.passed ?? [],
    risks: payload.risks ?? [],
    opportunities: payload.opportunities ?? [],
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

analyzeRouter.use(authenticate);

analyzeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    let requestBody = req.body as Record<string, unknown>;

    if (requestBody?.property_id) {
      const propertyId = String(requestBody.property_id);
      const { data: property, error: propertyError } = await supabaseAdmin
        .from('properties')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', propertyId)
        .maybeSingle();

      if (propertyError) throw propertyError;
      if (!property) {
        return res.status(404).json({ error: 'Not Found', message: 'Property not found' });
      }

      requestBody = {
        ...mapPropertyToAnalysisInput(property as PropertyRow, propertyId),
        ...requestBody,
      };
    }

    const parsed = analysisInputSchema.parse(requestBody);
    const { property_id, ...input } = parsed;
    const result = evaluateProperty(input);

    if (property_id) {
      const { data: property, error: propertyError } = await supabaseAdmin
        .from('properties')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('id', property_id)
        .maybeSingle();

      if (propertyError) throw propertyError;

      if (property) {
        const { data, error } = await supabaseAdmin
          .from('analysis_results')
          .insert({
            tenant_id: tenantId,
            property_id,
            score: result.score,
            recommendation: recommendationToDb(result.recommendation),
            triggered_rules: {
              triggered: result.triggeredRules,
              passed: result.passedRules,
              risks: result.risks,
              opportunities: result.opportunities,
              input,
              reasoning: result.reasoning,
              dscr: result.dscr,
            },
            indicated_value: input.estimatedValue,
            noi: input.noi,
            cap_rate: result.capRate,
          })
          .select('id, created_at')
          .single();

        if (error) {
          console.warn(
            'analysis_results insert failed, returning in-memory result:',
            error.message,
            error.code,
            error.details,
            error.hint,
          );
        } else if (data) {
          result.id = data.id;
          result.createdAt = data.created_at ?? result.createdAt;
        }
      }
    }

    analysisStore.set(result.id, result);
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }
    console.error('Analyze property error:', error);
    res.status(500).json({ error: 'Analysis Failed', message: error.message });
  }
});

analysisRouter.use(authenticate);

analysisRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const id = String(req.params.id);
    const cached = analysisStore.get(id);
    if (cached) {
      return res.json(cached);
    }

    const { data, error } = await supabaseAdmin
      .from('analysis_results')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Not Found', message: 'Analysis not found' });
    }

    const mapped = mapDbRowToAnalysisResult(data);
    analysisStore.set(mapped.id, mapped);
    res.json(mapped);
  } catch (error: any) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis', message: error.message });
  }
});

export { analyzeRouter, analysisRouter };
