import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { attomCache, attomCacheHealth, buildTrendsIdentifier } from '../services/attomCache';

const router = Router();

function getTenantId(req: Request): string | undefined {
  return req.user?.user_metadata?.tenant_id;
}

function getUserId(req: Request): string | undefined {
  return req.user?.id;
}

function cacheOptionsFromRequest(req: Request) {
  return {
    bypassCache: req.query.refresh === 'true',
    userId: getUserId(req),
    tenantId: getTenantId(req),
  };
}

function handleAttomError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : 'ATTOM request failed';

  if (
    message.includes('rate limit exceeded') ||
    message.includes('Refresh limit reached')
  ) {
    return res.status(429).json({ error: 'Rate Limit Exceeded', message });
  }

  console.error('ATTOM route error:', error);
  return res.status(500).json({ error: 'Internal Server Error', message });
}

router.get('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const address = String(req.query.address ?? '').trim();
    if (!address) {
      return res.status(400).json({ error: 'Bad Request', message: 'address query param is required' });
    }

    const result = await attomCache.getPropertyProfile(address, cacheOptionsFromRequest(req));
    return res.json(result);
  } catch (error) {
    return handleAttomError(res, error);
  }
});

router.get('/valuation', authenticate, async (req: Request, res: Response) => {
  try {
    const address = String(req.query.address ?? '').trim();
    if (!address) {
      return res.status(400).json({ error: 'Bad Request', message: 'address query param is required' });
    }

    const result = await attomCache.getAVMDetail(address, cacheOptionsFromRequest(req));
    return res.json(result);
  } catch (error) {
    return handleAttomError(res, error);
  }
});

router.get('/comparables', authenticate, async (req: Request, res: Response) => {
  try {
    const address = String(req.query.address ?? '').trim();
    if (!address) {
      return res.status(400).json({ error: 'Bad Request', message: 'address query param is required' });
    }

    const result = await attomCache.getSaleComparables(address, cacheOptionsFromRequest(req));
    return res.json(result);
  } catch (error) {
    return handleAttomError(res, error);
  }
});

router.get('/trends', authenticate, async (req: Request, res: Response) => {
  try {
    const city = String(req.query.city ?? '').trim();
    const state = String(req.query.state ?? '').trim();
    if (!city || !state) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'city and state query params are required',
      });
    }

    const geography = buildTrendsIdentifier(city, state);
    const result = await attomCache.getSalesTrends(geography, cacheOptionsFromRequest(req));
    return res.json(result);
  } catch (error) {
    return handleAttomError(res, error);
  }
});

router.get('/cache-stats', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'tenant_id not found on user profile' });
    }

    const stats = await attomCacheHealth.getCacheStats(tenantId);
    return res.json(stats);
  } catch (error) {
    return handleAttomError(res, error);
  }
});

router.get('/monthly-spend', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'tenant_id not found on user profile' });
    }

    const spend = await attomCacheHealth.getMonthlySpend(tenantId);
    return res.json(spend);
  } catch (error) {
    return handleAttomError(res, error);
  }
});

export default router;
