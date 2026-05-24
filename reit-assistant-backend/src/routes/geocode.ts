import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { geocodeUserRateLimit } from '../middleware/geocodeRateLimit';
import { reverseGeocode, searchAddress, getPlaceDetails } from '../services/nominatimService';

const router = Router();

router.use(authenticate);
router.use(geocodeUserRateLimit);

const searchQuerySchema = z.object({
  q: z.string().trim().min(3, 'Query must be at least 3 characters'),
});

const reverseQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const detailsQuerySchema = z.object({
  osm_type: z.string().trim().min(1),
  osm_id: z.coerce.number().int().positive(),
});

// GET /api/geocode/search?q={address_query}
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = searchQuerySchema.parse(req.query);
    const { results, cached } = await searchAddress(q);

    res.json({
      results,
      cached,
      source: 'nominatim',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }

    console.error('Geocode search error:', error);
    res.status(502).json({
      error: 'Geocode Failed',
      message: error.message ?? 'Could not search address',
    });
  }
});

// GET /api/geocode/reverse?lat={lat}&lon={lon}
router.get('/reverse', async (req: Request, res: Response) => {
  try {
    const { lat, lon } = reverseQuerySchema.parse(req.query);
    const { result, cached } = await reverseGeocode(lat, lon);

    res.json({
      address: result.address,
      display_name: result.display_name,
      lat: result.lat,
      lon: result.lon,
      osm_id: result.osm_id,
      osm_type: result.osm_type,
      cached,
      source: 'nominatim',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }

    console.error('Geocode reverse error:', error);
    res.status(502).json({
      error: 'Geocode Failed',
      message: error.message ?? 'Could not reverse geocode coordinates',
    });
  }
});

// GET /api/geocode/details?osm_type={type}&osm_id={id}
router.get('/details', async (req: Request, res: Response) => {
  try {
    const { osm_type, osm_id } = detailsQuerySchema.parse(req.query);
    const { details, cached } = await getPlaceDetails(osm_type, osm_id);

    res.json({
      details,
      cached,
      source: 'nominatim',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }

    console.error('Geocode details error:', error);
    res.status(502).json({
      error: 'Geocode Failed',
      message: error.message ?? 'Could not load place details',
    });
  }
});

export default router;
