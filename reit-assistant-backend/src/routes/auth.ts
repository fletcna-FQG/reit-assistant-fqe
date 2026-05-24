import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/db';
import { z } from 'zod';

const router = Router();

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  role: z.enum(['admin', 'analyst', 'viewer']).optional().default('analyst'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role } = registerSchema.parse(req.body);

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (authError) throw authError;

    // 2. Create Profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user!.id,
        email,
        full_name,
        role,
        tenant_id: 'fletcher-quill-estates-inc', // Default tenant for now
      });

    if (profileError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user!.id);
      throw profileError;
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: authData.user!.id,
        email: authData.user!.email,
        full_name,
        role,
        tenant_id: 'fletcher-quill-estates-inc',
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(400).json({
      error: 'Registration Failed',
      message: error.message,
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // 1. Sign in
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // 2. Get Profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id, role, full_name')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found',
      });
    }

    // 3. Return User + Token
    res.json({
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: profile.full_name,
        role: profile.role,
        tenant_id: profile.tenant_id,
      },
      token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(400).json({
      error: 'Bad Request',
      message: error.message,
    });
  }
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

// POST /api/auth/refresh — exchange refresh token for a new access token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = refreshSchema.parse(req.body);

    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });

    if (error || !data.session?.access_token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    res.json({
      message: 'Token refreshed',
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (error: any) {
    console.error('Refresh error:', error);
    res.status(400).json({
      error: 'Bad Request',
      message: error.message ?? 'Could not refresh session',
    });
  }
});

// GET /api/auth/me (Protected)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({ user, profile });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

export default router;