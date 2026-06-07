import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import HTMLtoDOCX from 'html-to-docx';
import PptxGenJS from 'pptxgenjs';
import { supabaseDb } from '../config/db';

const EXPORTS_BUCKET = 'export';
/** Private bucket — share links use signed URLs (30 days). */
const EXPORT_SIGNED_URL_EXPIRY_SEC = 60 * 60 * 24 * 30;
const BRAND_NAVY = '003366';
const BRAND_EMERALD = '28A745';

export type AnalysisListItem = {
  title: string;
  description: string;
};

export type FiveYearProjectionRow = {
  year: number;
  noi?: number;
  value?: number;
  cashFlow?: number;
  projectedNoi?: number;
  projectedValue?: number;
};

export type AnalysisDocumentData = {
  propertyId: string;
  propertyName: string;
  address: string;
  score: number;
  recommendation: string;
  noi: number;
  capRate: number;
  roi: number;
  riskList: AnalysisListItem[];
  opportunityList: AnalysisListItem[];
  fiveYearProjection: FiveYearProjectionRow[];
  tenantId?: string;
  userId?: string;
  executiveSummary?: string;
};

export type GeneratedDocumentResult = {
  url: string;
  fileName: string;
  format: 'pdf' | 'docx' | 'pptx';
};

function resolveTemplatePath(fileName: string): string {
  const candidates = [
    path.join(__dirname, '../templates', fileName),
    path.join(process.cwd(), 'src/templates', fileName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Template not found: ${fileName}`);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildScoreGaugeSvg(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const strokeColor = clamped >= 70 ? '#28a745' : clamped >= 50 ? '#ffc107' : '#dc3545';

  return `
    <svg width="140" height="140" viewBox="0 0 140 140" aria-label="Score gauge ${clamped}">
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#e0e0e0" stroke-width="12" />
      <circle
        cx="70"
        cy="70"
        r="${radius}"
        fill="none"
        stroke="${strokeColor}"
        stroke-width="12"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="68" text-anchor="middle" font-size="28" font-weight="700" fill="#003366">${clamped}</text>
      <text x="70" y="88" text-anchor="middle" font-size="11" fill="#7f8c8d">/ 100</text>
    </svg>
  `.trim();
}

function renderListItems(items: AnalysisListItem[], emptyLabel: string): string {
  if (!items.length) {
    return `<li><strong>${escapeHtml(emptyLabel)}</strong><span>No items identified.</span></li>`;
  }

  return items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span></li>`,
    )
    .join('');
}

function renderFinancialRows(rows: FiveYearProjectionRow[]): string {
  if (!rows.length) {
    return `<tr><td colspan="4">No projection data available.</td></tr>`;
  }

  return rows
    .map((row) => {
      const projectedNoi = row.projectedNoi ?? row.noi ?? 0;
      const projectedValue = row.projectedValue ?? row.value ?? 0;
      const cashFlow = row.cashFlow ?? projectedNoi;
      return `
        <tr>
          <td>${row.year}</td>
          <td>${formatCurrency(projectedNoi)}</td>
          <td>${formatCurrency(projectedValue)}</td>
          <td>${formatCurrency(cashFlow)}</td>
        </tr>
      `.trim();
    })
    .join('');
}

function buildExecutiveSummaryPlain(data: AnalysisDocumentData): string {
  if (data.executiveSummary?.trim()) {
    return data.executiveSummary.trim();
  }

  return (
    `${data.propertyName} at ${data.address} received a Rules Engine score of ${data.score}/100 with a ${data.recommendation} recommendation. ` +
    `Based on projected NOI of ${formatCurrency(data.noi)}, cap rate of ${formatPercent(data.capRate)}, and ROI of ${formatPercent(data.roi)}, ` +
    `the asset ${data.score >= 70 ? 'meets' : 'requires further review against'} Fletcher Quill Estates investment criteria.`
  );
}

function buildExecutiveSummary(data: AnalysisDocumentData): string {
  return escapeHtml(buildExecutiveSummaryPlain(data));
}

export function renderAnalysisReportHtml(data: AnalysisDocumentData): string {
  const template = fs.readFileSync(resolveTemplatePath('analysis-report.html'), 'utf8');
  const generatedAt = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';

  return template
    .replace(/{{GENERATED_AT}}/g, escapeHtml(generatedAt))
    .replace(/{{PROPERTY_NAME}}/g, escapeHtml(data.propertyName))
    .replace(/{{ADDRESS}}/g, escapeHtml(data.address))
    .replace(/{{NOI}}/g, escapeHtml(formatCurrency(data.noi)))
    .replace(/{{CAP_RATE}}/g, escapeHtml(formatPercent(data.capRate)))
    .replace(/{{ROI}}/g, escapeHtml(formatPercent(data.roi)))
    .replace(/{{SCORE_GAUGE}}/g, buildScoreGaugeSvg(data.score))
    .replace(/{{RECOMMENDATION}}/g, escapeHtml(data.recommendation.toUpperCase()))
    .replace(/{{EXECUTIVE_SUMMARY}}/g, buildExecutiveSummary(data))
    .replace(/{{FINANCIAL_TABLE_ROWS}}/g, renderFinancialRows(data.fiveYearProjection))
    .replace(/{{RISK_LIST}}/g, renderListItems(data.riskList, 'Risk'))
    .replace(/{{OPPORTUNITY_LIST}}/g, renderListItems(data.opportunityList, 'Opportunity'));
}

function buildExportFileName(propertyId: string, format: 'pdf' | 'docx' | 'pptx'): string {
  return `${propertyId}_${Date.now()}.${format}`;
}

async function logGenerationFailure(
  data: AnalysisDocumentData,
  format: string,
  error: unknown,
): Promise<void> {
  if (!data.tenantId || !data.userId) {
    return;
  }

  try {
    await supabaseDb.from('audit_logs').insert({
      tenant_id: data.tenantId,
      user_id: data.userId,
      action: 'DOCUMENT_GENERATION_FAILED',
      metadata: {
        format,
        property_id: data.propertyId,
        property_name: data.propertyName,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (auditError) {
    console.warn('Document generation audit log write failed:', auditError);
  }
}

async function uploadExportBuffer(
  buffer: Buffer,
  propertyId: string,
  format: 'pdf' | 'docx' | 'pptx',
  contentType: string,
): Promise<GeneratedDocumentResult> {
  const fileName = buildExportFileName(propertyId, format);

  const { data, error } = await supabaseDb.storage
    .from(EXPORTS_BUCKET)
    .upload(fileName, buffer, {
      contentType,
      upsert: false,
      cacheControl: '3600',
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: signedUrlData, error: signedUrlError } = await supabaseDb.storage
    .from(EXPORTS_BUCKET)
    .createSignedUrl(data.path, EXPORT_SIGNED_URL_EXPIRY_SEC);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw new Error(
      `Supabase Storage signed URL failed: ${signedUrlError?.message ?? 'missing signedUrl'}`,
    );
  }

  return {
    url: signedUrlData.signedUrl,
    fileName,
    format,
  };
}

export async function generatePDF(analysisData: AnalysisDocumentData): Promise<GeneratedDocumentResult> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

  try {
    const html = renderAnalysisReportHtml(analysisData);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await page.setContent(html, { waitUntil: 'load' });

    const pdfBuffer = Buffer.from(
      await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
      }),
    );

    return await uploadExportBuffer(pdfBuffer, analysisData.propertyId, 'pdf', 'application/pdf');
  } catch (error) {
    await logGenerationFailure(analysisData, 'pdf', error);
    throw error;
  } finally {
    await browser?.close();
  }
}

export async function generateDOCX(analysisData: AnalysisDocumentData): Promise<GeneratedDocumentResult> {
  try {
    const html = renderAnalysisReportHtml(analysisData);
    const docxArrayBuffer = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    const docxBuffer = Buffer.isBuffer(docxArrayBuffer)
      ? docxArrayBuffer
      : Buffer.from(docxArrayBuffer as ArrayBuffer);

    return await uploadExportBuffer(
      docxBuffer,
      analysisData.propertyId,
      'docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  } catch (error) {
    await logGenerationFailure(analysisData, 'docx', error);
    throw error;
  }
}

export async function generatePPT(analysisData: AnalysisDocumentData): Promise<GeneratedDocumentResult> {
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Fletcher Quill Estates';
    pptx.company = 'REIT Assistant';
    pptx.subject = `Analysis Report — ${analysisData.propertyName}`;

    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: BRAND_NAVY };
    titleSlide.addText('Fletcher Quill Estates', {
      x: 0.6,
      y: 0.8,
      w: 8.8,
      h: 0.6,
      fontSize: 18,
      color: 'FFFFFF',
      bold: true,
    });
    titleSlide.addText(analysisData.propertyName, {
      x: 0.6,
      y: 1.8,
      w: 8.8,
      h: 0.8,
      fontSize: 32,
      color: 'FFFFFF',
      bold: true,
    });
    titleSlide.addText(analysisData.address, {
      x: 0.6,
      y: 2.7,
      w: 8.8,
      h: 0.5,
      fontSize: 16,
      color: 'D9E2EF',
    });
    titleSlide.addText(`Recommendation: ${analysisData.recommendation.toUpperCase()} · Score ${analysisData.score}/100`, {
      x: 0.6,
      y: 4.3,
      w: 8.8,
      h: 0.5,
      fontSize: 14,
      color: BRAND_EMERALD,
      bold: true,
    });

    const summarySlide = pptx.addSlide();
    summarySlide.addText('Executive Summary', {
      x: 0.5,
      y: 0.4,
      w: 9,
      h: 0.5,
      fontSize: 24,
      color: BRAND_NAVY,
      bold: true,
    });
    summarySlide.addText(buildExecutiveSummaryPlain(analysisData), {
      x: 0.5,
      y: 1.1,
      w: 9,
      h: 2.2,
      fontSize: 14,
      color: '2C3E50',
      valign: 'top',
    });
    summarySlide.addText(
      [
        { text: 'NOI: ', options: { bold: true, color: BRAND_NAVY } },
        { text: formatCurrency(analysisData.noi) },
        { text: '   Cap Rate: ', options: { bold: true, color: BRAND_NAVY } },
        { text: formatPercent(analysisData.capRate) },
        { text: '   ROI: ', options: { bold: true, color: BRAND_NAVY } },
        { text: formatPercent(analysisData.roi) },
      ],
      { x: 0.5, y: 3.8, w: 9, h: 0.5, fontSize: 13 },
    );

    const financialSlide = pptx.addSlide();
    financialSlide.addText('Five-Year Financial Projection', {
      x: 0.5,
      y: 0.4,
      w: 9,
      h: 0.5,
      fontSize: 24,
      color: BRAND_NAVY,
      bold: true,
    });

    const tableRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Year', options: { bold: true, fill: { color: BRAND_NAVY }, color: 'FFFFFF' } },
        { text: 'Projected NOI', options: { bold: true, fill: { color: BRAND_NAVY }, color: 'FFFFFF' } },
        { text: 'Projected Value', options: { bold: true, fill: { color: BRAND_NAVY }, color: 'FFFFFF' } },
        { text: 'Cash Flow', options: { bold: true, fill: { color: BRAND_NAVY }, color: 'FFFFFF' } },
      ],
      ...analysisData.fiveYearProjection.map((row) => [
        { text: String(row.year) },
        { text: formatCurrency(row.projectedNoi ?? row.noi ?? 0) },
        { text: formatCurrency(row.projectedValue ?? row.value ?? 0) },
        { text: formatCurrency(row.cashFlow ?? row.projectedNoi ?? row.noi ?? 0) },
      ] satisfies PptxGenJS.TableRow),
    ];

    if (tableRows.length === 1) {
      tableRows.push([
        { text: '—' },
        { text: '—' },
        { text: '—' },
        { text: '—' },
      ]);
    }

    financialSlide.addTable(tableRows, {
      x: 0.5,
      y: 1.1,
      w: 9,
      fontSize: 11,
      border: { type: 'solid', color: 'E0E0E0', pt: 1 },
      fill: { color: 'F5F5F5' },
    });

    const risksSlide = pptx.addSlide();
    risksSlide.addText('Risks & Opportunities', {
      x: 0.5,
      y: 0.4,
      w: 9,
      h: 0.5,
      fontSize: 24,
      color: BRAND_NAVY,
      bold: true,
    });

    const riskBullets = analysisData.riskList.length
      ? analysisData.riskList.map((item) => ({
          text: `${item.title}: ${item.description}`,
          options: { bullet: true, breakLine: true },
        }))
      : [{ text: 'No material risks identified.', options: { bullet: true } }];

    const opportunityBullets = analysisData.opportunityList.length
      ? analysisData.opportunityList.map((item) => ({
          text: `${item.title}: ${item.description}`,
          options: { bullet: true, breakLine: true },
        }))
      : [{ text: 'No opportunities identified.', options: { bullet: true } }];

    risksSlide.addText('Key Risks', {
      x: 0.5,
      y: 1.0,
      w: 4.2,
      h: 0.4,
      fontSize: 16,
      color: 'DC3545',
      bold: true,
    });
    risksSlide.addText(riskBullets, {
      x: 0.5,
      y: 1.5,
      w: 4.2,
      h: 3.5,
      fontSize: 12,
      color: '2C3E50',
      valign: 'top',
    });

    risksSlide.addText('Opportunities', {
      x: 5.0,
      y: 1.0,
      w: 4.2,
      h: 0.4,
      fontSize: 16,
      color: BRAND_EMERALD,
      bold: true,
    });
    risksSlide.addText(opportunityBullets, {
      x: 5.0,
      y: 1.5,
      w: 4.2,
      h: 3.5,
      fontSize: 12,
      color: '2C3E50',
      valign: 'top',
    });

    const pptArrayBuffer = (await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer;
    const pptBuffer = Buffer.from(pptArrayBuffer);

    return await uploadExportBuffer(
      pptBuffer,
      analysisData.propertyId,
      'pptx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    );
  } catch (error) {
    await logGenerationFailure(analysisData, 'pptx', error);
    throw error;
  }
}
