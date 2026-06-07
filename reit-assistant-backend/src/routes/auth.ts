import { Router, Request, Response } from 'express';
import { supabaseAuth, supabaseClient, supabaseDb } from '../config/db';
import { z } from 'zod';

const router = Router();

// Validation Schemas
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  tenant_id: z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    .optional()
    .default(DEFAULT_TENANT_ID),
  role: z.enum(['admin', 'analyst', 'viewer']).optional().default('analyst'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role, tenant_id } = registerSchema.parse(req.body);

    // 1. Create Auth User
    const autoConfirmEmail = process.env.AUTH_AUTO_CONFIRM_EMAIL !== 'false';
    const { data: authData, error: authError } = await supabaseAuth.auth.admin.createUser({
      email,
      password,
      email_confirm: autoConfirmEmail,
      user_metadata: { full_name, role, tenant_id },
    });

    if (authError) throw authError;

    // 2. Create Profile
    const { error: profileError } = await supabaseDb
      .from('profiles')
      .insert({
        id: authData.user!.id,
        email,
        full_name,
        role,
        tenant_id,
      });

    if (profileError) {
      // Rollback: delete auth user
      await supabaseAuth.auth.admin.deleteUser(authData.user!.id);
      throw profileError;
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: authData.user!.id,
        email: authData.user!.email,
        full_name,
        role,
        tenant_id,
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

// POST /api/auth/forgot-password — sends Supabase recovery email via custom SMTP
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const redirectTo =
      process.env.AUTH_RESET_REDIRECT_URL?.trim() || 'http://localhost:8081/login';

    const { error } = await supabaseClient.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo },
    );

    if (error) {
      console.error('Forgot password error:', error.message);
    }

    // Always return success to avoid email enumeration.
    res.json({
      message: 'If an account exists for that email, a password reset link has been sent.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(400).json({
      error: 'Bad Request',
      message: error.message ?? 'Could not process password reset request',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // 1. Sign in
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
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
    const { data: profile, error: profileError } = await supabaseDb
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

    const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token });

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

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data: profile } = await supabaseDb
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