import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/db';
import { authenticate } from '../middleware/auth';
import {
  generateDOCX,
  generatePDF,
  generatePPT,
  type AnalysisDocumentData,
  type AnalysisListItem,
  type FiveYearProjectionRow,
} from '../services/documentGenerator';
import { recommendationFromDb } from '../services/analysisEngine';
import { smsFactory } from '../services/smsFactory';
import { sendEmail } from '../services/emailAdapter';
import { requireTenantId } from '../utils/tenant';
import {
  resolveShareRecipients,
  validateEmailRecipients,
  validateSmsRecipients,
} from '../utils/shareRecipients';

const router = Router();

router.use(authenticate);

const generateSchema = z.object({
  propertyId: z.string().uuid(),
  format: z.enum(['pdf', 'docx', 'ppt']),
});

const shareSchema = z.object({
  propertyId: z.string().uuid(),
  recipient: z.string().min(1).optional(),
  recipients: z.array(z.string().min(1)).min(1).optional(),
  type: z.enum(['sms', 'email', 'link']),
  format: z.enum(['pdf', 'docx', 'ppt']).optional(),
});

type DocumentFormat = 'pdf' | 'docx' | 'ppt';
type ShareAction = 'SHARE_SMS' | 'SHARE_EMAIL' | 'SHARE_LINK';

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
};

type AnalysisRow = {
  id: string;
  property_id: string;
  score?: number | null;
  recommendation?: string | null;
  triggered_rules?: unknown;
  indicated_value?: number | null;
  noi?: number | null;
  cap_rate?: number | null;
  created_at: string;
};

type DealRow = {
  id: string;
  property_id: string | null;
  property_type?: string | null;
  deal_state?: string | null;
};

type TriggeredRulesPayload = {
  risks?: Array<{ id?: string; title?: string; description?: string }>;
  opportunities?: Array<{ id?: string; title?: string; description?: string }>;
  reasoning?: string;
  input?: {
    purchasePrice?: number;
    estimatedValue?: number;
    noi?: number;
  };
};

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatFullAddress(property: PropertyRow): string {
  return `${property.address}, ${property.city}, ${property.state} ${property.zip}`.trim();
}

function mapListItems(
  items: TriggeredRulesPayload['risks'] | TriggeredRulesPayload['opportunities'],
): AnalysisListItem[] {
  return (items ?? [])
    .filter((item) => item?.title || item?.description)
    .map((item) => ({
      title: item?.title?.trim() || 'Untitled',
      description: item?.description?.trim() || '',
    }));
}

function parseTriggeredRulesPayload(value: unknown): TriggeredRulesPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as TriggeredRulesPayload;
}

function buildFiveYearProjection(baseNoi: number, baseValue: number): FiveYearProjectionRow[] {
  const startYear = new Date().getFullYear();
  let noi = baseNoi;
  let value = baseValue > 0 ? baseValue : baseNoi > 0 ? baseNoi / 0.065 : 0;

  return Array.from({ length: 5 }, (_, index) => {
    const projectedNoi = Math.round(noi);
    const projectedValue = Math.round(value);
    const row = {
      year: startYear + index,
      projectedNoi,
      projectedValue,
      cashFlow: Math.round(projectedNoi * 0.7),
    };
    noi *= 1.05;
    value *= 1.03;
    return row;
  });
}

async function loadProperty(tenantId: string, propertyId: string): Promise<PropertyRow | null> {
  const { data, error } = await supabaseAdmin
    .from('properties')
    .select('id, address, city, state, zip, noi, cap_rate, indicated_value, vacancy_percent')
    .eq('tenant_id', tenantId)
    .eq('id', propertyId)
    .maybeSingle();

  if (error) throw error;
  return (data as PropertyRow | null) ?? null;
}

async function loadLatestAnalysis(tenantId: string, propertyId: string): Promise<AnalysisRow | null> {
  const { data, error } = await supabaseAdmin
    .from('analysis_results')
    .select('id, property_id, score, recommendation, triggered_rules, indicated_value, noi, cap_rate, created_at')
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as AnalysisRow | null) ?? null;
}

async function loadDealForProperty(tenantId: string, propertyId: string): Promise<DealRow | null> {
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select('id, property_id, property_type, deal_state')
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId)
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as DealRow | null) ?? null;
}

function buildAnalysisDocumentData(
  property: PropertyRow,
  analysis: AnalysisRow | null,
  deal: DealRow | null,
  tenantId: string,
  userId: string,
): AnalysisDocumentData {
  const rulesPayload = parseTriggeredRulesPayload(analysis?.triggered_rules);
  const noi = toNumber(analysis?.noi ?? property.noi);
  const indicatedValue = toNumber(analysis?.indicated_value ?? property.indicated_value);
  const capRate = toNumber(analysis?.cap_rate ?? property.cap_rate, noi > 0 && indicatedValue > 0 ? (noi / indicatedValue) * 100 : 0);
  const score = toNumber(analysis?.score, 0);
  const recommendation = analysis?.recommendation
    ? recommendationFromDb(analysis.recommendation)
    : score >= 70
      ? 'BUY'
      : score >= 50
        ? 'NEGOTIATE'
        : 'HOLD';
  const roi = indicatedValue > 0 ? (noi / indicatedValue) * 100 : capRate;

  return {
    propertyId: property.id,
    propertyName: deal?.property_type ? `${property.address} (${deal.property_type})` : property.address,
    address: formatFullAddress(property),
    score,
    recommendation,
    noi,
    capRate,
    roi,
    riskList: mapListItems(rulesPayload.risks),
    opportunityList: mapListItems(rulesPayload.opportunities),
    fiveYearProjection: buildFiveYearProjection(noi, indicatedValue),
    tenantId,
    userId,
    executiveSummary: rulesPayload.reasoning,
  };
}

async function loadDocumentContext(tenantId: string, propertyId: string, userId: string) {
  const property = await loadProperty(tenantId, propertyId);
  if (!property) {
    return null;
  }

  const [analysis, deal] = await Promise.all([
    loadLatestAnalysis(tenantId, propertyId),
    loadDealForProperty(tenantId, propertyId),
  ]);

  return {
    property,
    analysis,
    deal,
    documentData: buildAnalysisDocumentData(property, analysis, deal, tenantId, userId),
  };
}

async function generateDocument(
  documentData: AnalysisDocumentData,
  format: DocumentFormat,
) {
  if (format === 'pdf') {
    return generatePDF(documentData);
  }
  if (format === 'docx') {
    return generateDOCX(documentData);
  }
  return generatePPT(documentData);
}

function buildSmsMessage(documentData: AnalysisDocumentData, reportUrl: string): string {
  return (
    `FQ Estates Analysis: ${documentData.propertyName} — ` +
    `${documentData.recommendation} (${documentData.score}/100). ` +
    `View report: ${reportUrl}`
  );
}

async function logShareAudit(
  tenantId: string,
  userId: string,
  action: ShareAction,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      action,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Share audit log write failed:', error);
  }
}

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const userId = req.user?.id as string | undefined;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
    }

    const { propertyId, format } = generateSchema.parse(req.body);

    const context = await loadDocumentContext(tenantId, propertyId, userId);
    if (!context) {
      return res.status(404).json({ error: 'Not Found', message: 'Property not found' });
    }

    const result = await generateDocument(context.documentData, format);

    res.json({
      url: result.url,
      fileName: result.fileName,
      format,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }

    console.error('REIT document generation error:', error);
    res.status(500).json({
      error: 'Generation Failed',
      message: error?.message ?? 'Document generation failed',
    });
  }
});

router.post('/share', async (req: Request, res: Response) => {
  try {
    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Tenant ID missing from user profile' });
    }

    const userId = req.user?.id as string | undefined;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
    }

    const parsed = shareSchema.parse(req.body);
    const { propertyId, recipient, type } = parsed;
    const format: DocumentFormat = parsed.format ?? 'pdf';
    const shareRecipients = resolveShareRecipients(recipient, parsed.recipients);

    if ((type === 'sms' || type === 'email') && !shareRecipients.length) {
      const channelLabel = type === 'email' ? 'email address' : 'phone number';
      return res.status(400).json({
        error: 'Bad Request',
        message: `At least one ${channelLabel} is required`,
      });
    }

    if (type === 'email') {
      const emailValidationError = validateEmailRecipients(shareRecipients);
      if (emailValidationError) {
        return res.status(400).json({ error: 'Bad Request', message: emailValidationError });
      }
    }

    if (type === 'sms') {
      const smsValidationError = validateSmsRecipients(shareRecipients);
      if (smsValidationError) {
        return res.status(400).json({ error: 'Bad Request', message: smsValidationError });
      }
    }

    const context = await loadDocumentContext(tenantId, propertyId, userId);
    if (!context) {
      return res.status(404).json({ error: 'Not Found', message: 'Property not found' });
    }

    const generated = await generateDocument(context.documentData, format);
    const reportUrl = generated.url;

    if (type === 'link') {
      await logShareAudit(tenantId, userId, 'SHARE_LINK', {
        property_id: propertyId,
        recipient: recipient ?? null,
        format,
        url: reportUrl,
        status: 'sent',
      });

      return res.json({
        success: true,
        url: reportUrl,
      });
    }

    if (type === 'email') {
      const propertyName = context.documentData.propertyName;
      const subject = `FQ Estates: REIT Analysis Report for ${propertyName}`;
      const emailResults = await Promise.all(
        shareRecipients.map(async (emailRecipient) => ({
          recipient: emailRecipient,
          result: await sendEmail(emailRecipient, subject, reportUrl, propertyName),
        })),
      );

      const failedRecipients = emailResults
        .filter(({ result }) => result.status === 'failed')
        .map(({ recipient: emailRecipient }) => emailRecipient);
      const sentCount = emailResults.length - failedRecipients.length;
      const recipientSummary = shareRecipients.join(', ');
      const deliveryError = emailResults.find(({ result }) => result.error)?.result.error;

      await logShareAudit(tenantId, userId, 'SHARE_EMAIL', {
        property_id: propertyId,
        recipient: recipientSummary,
        recipients: shareRecipients,
        format,
        url: reportUrl,
        status: failedRecipients.length ? (sentCount ? 'partial' : 'failed') : 'sent',
        sent_count: sentCount,
        failed_recipients: failedRecipients,
        ...(deliveryError ? { delivery_error: deliveryError } : {}),
      });

      if (!sentCount) {
        return res.status(502).json({
          success: false,
          url: reportUrl,
          error: 'Email delivery failed',
          message: deliveryError ?? 'Email delivery failed',
          failedRecipients,
        });
      }

      return res.json({
        success: true,
        url: reportUrl,
        sentCount,
        ...(failedRecipients.length ? { failedRecipients } : {}),
      });
    }

    const smsMessage = buildSmsMessage(context.documentData, reportUrl);
    const smsResults = await Promise.all(
      shareRecipients.map(async (smsRecipient) => ({
        recipient: smsRecipient,
        result: await smsFactory.sendSms(smsRecipient, smsMessage),
      })),
    );

    const failedRecipients = smsResults
      .filter(({ result }) => result.status === 'failed')
      .map(({ recipient: smsRecipient }) => smsRecipient);
    const sentCount = smsResults.length - failedRecipients.length;
    const recipientSummary = shareRecipients.join(', ');

    if (!sentCount) {
      const deliveryError =
        smsResults.find(({ result }) => result.error)?.result.error ??
        'SMS delivery failed';

      await logShareAudit(tenantId, userId, 'SHARE_SMS', {
        property_id: propertyId,
        recipient: recipientSummary,
        recipients: shareRecipients,
        format,
        url: reportUrl,
        status: 'failed',
        failed_recipients: failedRecipients,
        delivery_error: deliveryError,
      });

      return res.status(502).json({
        success: false,
        url: reportUrl,
        error: 'SMS delivery failed',
        message: deliveryError,
        failedRecipients,
      });
    }

    await logShareAudit(tenantId, userId, 'SHARE_SMS', {
      property_id: propertyId,
      recipient: recipientSummary,
      recipients: shareRecipients,
      format,
      url: reportUrl,
      status: failedRecipients.length ? 'partial' : smsResults[0]?.result.status ?? 'sent',
      sent_count: sentCount,
      failed_recipients: failedRecipients,
      message_id: smsResults.find(({ result }) => result.messageId)?.result.messageId,
    });

    res.json({
      success: true,
      url: reportUrl,
      sentCount,
      messageId: smsResults.find(({ result }) => result.messageId)?.result.messageId,
      ...(failedRecipients.length ? { failedRecipients } : {}),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: error.issues.map((issue) => issue.message).join('; '),
      });
    }

    console.error('REIT share error:', error);
    res.status(500).json({
      error: 'Share Failed',
      message: error?.message ?? 'Share workflow failed',
    });
  }
});

export default router;
