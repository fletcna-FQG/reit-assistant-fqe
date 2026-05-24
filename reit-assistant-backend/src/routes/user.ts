import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/db';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /me - Returns the current authenticated user's profile
// This route is PROTECTED by the authenticate middleware
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch the full profile from Supabase
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        phone,
        aa_member_id,
        tenants (
          id,
          name,
          display_name,
          owner_entity,
          plan
        )
      `)
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Profile not found' 
      });
    }

    res.json({
      message: 'Authenticated user profile',
      user: profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch profile' 
    });
  }
});

export default router;
