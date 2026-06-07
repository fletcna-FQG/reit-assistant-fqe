import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  REDIS_URL: z.string().min(1),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().optional(),
  BREVO_SENDER_NAME: z.string().optional(),
  AA_API_KEY: z.string().optional(),
  AA_COMMUNITY_ID: z.string().optional(),
  SMS_PROVIDER: z.string().optional(),
  GHL_API_KEY: z.string().optional(),
  GHL_LOCATION_ID: z.string().optional(),
  ATTOM_API_KEY: z.string().optional(),
  ATTOM_BASE_URL: z.string().optional(),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:', env.error.format());
  process.exit(1);
}

export const config = {
  supabase: {
    url: env.data.SUPABASE_URL,
    anonKey: env.data.SUPABASE_ANON_KEY,
    serviceRoleKey: env.data.SUPABASE_SERVICE_ROLE_KEY,
  },
  redis: {
    url: env.data.REDIS_URL,
  },
  server: {
    port: parseInt(env.data.PORT, 10),
    env: env.data.NODE_ENV,
  },
  services: {
    brevo: {
      apiKey: env.data.BREVO_API_KEY,
      senderEmail: env.data.BREVO_SENDER_EMAIL,
      senderName: env.data.BREVO_SENDER_NAME ?? 'REIT Assistant',
    },
    actionAccel: {
      apiKey: env.data.AA_API_KEY,
      communityId: env.data.AA_COMMUNITY_ID,
    },
    sms: {
      provider: env.data.SMS_PROVIDER ?? 'ghl',
      ghl: {
        apiKey: env.data.GHL_API_KEY,
        locationId: env.data.GHL_LOCATION_ID,
      },
    },
    attom: {
      apiKey: env.data.ATTOM_API_KEY,
      baseUrl: env.data.ATTOM_BASE_URL,
    },
  },
};
