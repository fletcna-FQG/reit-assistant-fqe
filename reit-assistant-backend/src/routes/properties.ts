import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/db';
import { authenticate } from '../middleware/auth';
import { fetchAttomProfile, isAttomConfigured } from '../services/attomService';

const router = Router();

const searchLocationSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

const propertyInputSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  gross_rental_income: z.number().min(0),
  other_income: z.number().min(0),
  vacancy_percent: z.number().min(0).max(100),
  property_taxes: z.number().min(0),
  insurance: z.number().min(0),
  utilities: z.number().min(0),
  repairs_maintenance: z.number().min(0),
  property_management: z.number().min(0),
  other_operating_expenses: z.number().min(0),
  cap_rate: z.number().positive(),
});

function calculateDerivedFields(input: z.infer<typeof propertyInputSchema>) {
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

function getTenantId(req: Request): string | undefined {
  return req.user?.user_metadata?.tenant_id;
}

// POST /api/properties/search — Nominatim location first; ATTOM financial data when integrated
router.post('/search', authenticate, async (req: Request, res: Response) => {
  try {
    const location = searchLocationSchema.parse(req.body);
    const attomEnabled = isAttomConfigured();

    let attom_data = null;
    if (attomEnabled && location.lat != null && location.lon != null) {
      attom_data = await fetchAttomProfile(
        {
          address: location.address.trim(),
          city: location.city.trim(),
          state: location.state.trim().toUpperCase(),
          zip: location.zip.trim(),
          lat: location.lat,
          lon: location.lon,
        },
        { refresh: false },
      );
    }

    res.json({
      message: attom_data
        ? 'Location verified. ATTOM market data loaded — review and edit before saving.'
        : attomEnabled
          ? 'Location verified via Nominatim. ATTOM integration pending — enter financial data manually.'
          : 'Location verified via Nominatim (free geocoding). Enter financial data manually; ATTOM will pre-fill when connected.',
      source: attom_data ? 'attom' : attomEnabled ? 'nominatim_attom_pending' : 'nominatim',
      nominatim_verified: true,
      attom_enabled: attomEnabled,
      manual_entry_required: !attom_data,
      location: {
        address: location.address.trim(),
        city: location.city.trim(),
        state: location.state.trim().toUpperCase(),
        zip: location.zip.trim(),
        lat: location.lat ?? null,
        lon: location.lon ?? null,
      },
      attom_data,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((i) => i.message).join('; '),
      });
    }
    console.error('Property search error:', error);
    res.status(500).json({ error: 'Search Failed', message: error.message });
  }
});

// POST /api/properties - Create property (manual entry; server-side calculations)
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const input = propertyInputSchema.parse(req.body);
    const derived = calculateDerivedFields(input);

    const { data, error } = await supabaseAdmin
      .from('properties')
      .insert({
        tenant_id: tenantId,
        ...input,
        ...derived,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Property created', property: data });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((i) => i.message).join('; '),
      });
    }
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Failed to create property', message: error.message });
  }
});

// GET /api/properties - List all properties for tenant
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ properties: data || [] });
  } catch (error: any) {
    console.error('List properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties', message: error.message });
  }
});

const marketDataQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  refresh: z
    .union([z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
    .optional()
    .transform((value) => value === 'true' || value === '1'),
});

async function loadTenantProperty(req: Request, id: string) {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    return { error: { status: 400, body: { error: 'Bad Request', message: 'Tenant ID missing from user profile' } } };
  }

  const { data, error } = await supabaseAdmin
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return { error: { status: 404, body: { error: 'Property not found' } } };
  }

  return { property: data };
}

// GET /api/properties/:id/market-data — ATTOM snapshot (cached)
router.get('/:id/market-data', authenticate, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { lat, lon, refresh } = marketDataQuerySchema.parse(req.query);
    const loaded = await loadTenantProperty(req, id);
    if ('error' in loaded && loaded.error) {
      return res.status(loaded.error.status).json(loaded.error.body);
    }

    const property = loaded.property!;
    const attom_data = await fetchAttomProfile(
      {
        address: property.address,
        city: property.city,
        state: property.state,
        zip: property.zip,
        lat,
        lon,
      },
      { refresh: refresh ?? false },
    );

    res.json({
      attom_enabled: isAttomConfigured(),
      attom_data,
      message: attom_data
        ? refresh
          ? 'ATTOM market data refreshed.'
          : 'ATTOM market data loaded from cache or provider.'
        : isAttomConfigured()
          ? 'ATTOM is configured but no market data was returned for this property.'
          : 'ATTOM is not configured — connect API keys to enable market pre-fill.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((i) => i.message).join('; '),
      });
    }
    console.error('Market data error:', error);
    res.status(502).json({ error: 'Market Data Failed', message: error.message });
  }
});

// POST /api/properties/:id/market-data — force refresh (rate-limited via ATTOM cache TTL)
router.post('/:id/market-data', authenticate, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const body = marketDataQuerySchema.parse(req.body);
    const loaded = await loadTenantProperty(req, id);
    if ('error' in loaded && loaded.error) {
      return res.status(loaded.error.status).json(loaded.error.body);
    }

    const property = loaded.property!;
    const attom_data = await fetchAttomProfile(
      {
        address: property.address,
        city: property.city,
        state: property.state,
        zip: property.zip,
        lat: body.lat,
        lon: body.lon,
      },
      { refresh: true },
    );

    res.json({
      attom_enabled: isAttomConfigured(),
      attom_data,
      message: attom_data
        ? 'ATTOM market data refreshed successfully.'
        : 'Could not refresh ATTOM market data for this property.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((i) => i.message).join('; '),
      });
    }
    console.error('Market data refresh error:', error);
    res.status(502).json({ error: 'Market Data Failed', message: error.message });
  }
});

// GET /api/properties/:id - Get single property
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ property: data });
  } catch (error: any) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Failed to fetch property', message: error.message });
  }
});

// PUT /api/properties/:id - Update property (recalculates derived fields)
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const merged = { ...existing, ...req.body };
    const input = propertyInputSchema.parse({
      address: merged.address,
      city: merged.city,
      state: merged.state,
      zip: merged.zip,
      gross_rental_income: merged.gross_rental_income,
      other_income: merged.other_income,
      vacancy_percent: merged.vacancy_percent,
      property_taxes: merged.property_taxes,
      insurance: merged.insurance,
      utilities: merged.utilities,
      repairs_maintenance: merged.repairs_maintenance,
      property_management: merged.property_management,
      other_operating_expenses: merged.other_operating_expenses,
      cap_rate: merged.cap_rate,
    });

    const derived = calculateDerivedFields(input);

    const { data, error } = await supabaseAdmin
      .from('properties')
      .update({ ...input, ...derived })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ message: 'Property updated', property: data });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((i) => i.message).join('; '),
      });
    }
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Failed to update property', message: error.message });
  }
});

// DELETE /api/properties/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    res.json({ message: 'Property deleted' });
  } catch (error: any) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property', message: error.message });
  }
});

export default router;
