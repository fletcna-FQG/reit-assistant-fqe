import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/db';

const router = Router();

const subscribeSchema = z.object({
  phone: z.string().min(10),
  email: z.string().email().optional(),
  consent: z.literal(true),
  source: z.enum(['website', 'qr', 'keyword']).optional(),
});

function normalizePhoneNumber(to: string): string {
  const digits = to.trim().replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits.startsWith('+') ? to.trim() : `+${digits}`;
}

/** Public SMS opt-in — no auth (TCPA consent captured client-side). */
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const parsed = subscribeSchema.parse(req.body);
    const phone = normalizePhoneNumber(parsed.phone);

    if (phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid phone number',
      });
    }

    const { error } = await supabaseAdmin.from('sms_opt_ins').upsert(
      {
        phone,
        email: parsed.email?.trim() || null,
        source: parsed.source ?? 'website',
        consent: true,
        consented_at: new Date().toISOString(),
      },
      { onConflict: 'phone' },
    );

    if (error) {
      console.error('[SMS opt-in] insert failed:', error.message);
      return res.status(500).json({
        error: 'Subscription Failed',
        message: 'Could not save subscription. Please try again.',
      });
    }

    console.log('[SMS opt-in] Subscribed', { phone, source: parsed.source ?? 'website' });

    res.json({
      success: true,
      message: 'SMS subscription saved.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }

    console.error('[SMS opt-in] error:', error);
    res.status(500).json({
      error: 'Subscription Failed',
      message: 'Could not complete subscription.',
    });
  }
});

export default router;
