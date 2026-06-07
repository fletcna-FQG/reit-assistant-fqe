import type { PortfolioImportRow } from '@/types/portfolio';

const HEADER_ALIASES: Record<string, keyof PortfolioImportRow> = {
  address: 'address',
  city: 'city',
  state: 'state',
  zip: 'zip',
  gross_rental_income: 'gross_rental_income',
  grossrentalincome: 'gross_rental_income',
  other_income: 'other_income',
  vacancy_percent: 'vacancy_percent',
  vacancy: 'vacancy_percent',
  property_taxes: 'property_taxes',
  insurance: 'insurance',
  utilities: 'utilities',
  repairs_maintenance: 'repairs_maintenance',
  property_management: 'property_management',
  other_operating_expenses: 'other_operating_expenses',
  cap_rate: 'cap_rate',
  caprate: 'cap_rate',
  property_type: 'property_type',
};

function normalizeHeader(cell: string): string {
  return cell.trim().toLowerCase().replace(/\s+/g, '_');
}

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number(value.replace(/[$,%]/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parsePortfolioCsv(text: string): PortfolioImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error('CSV is empty');
  }

  const firstCells = lines[0].split(',').map((cell) => normalizeHeader(cell));
  const hasHeader = firstCells.includes('address');
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const headers = hasHeader
    ? firstCells.map((cell) => HEADER_ALIASES[cell] ?? null)
    : [
        'address',
        'city',
        'state',
        'zip',
        'gross_rental_income',
        'other_income',
        'vacancy_percent',
        'property_taxes',
        'insurance',
        'utilities',
        'repairs_maintenance',
        'property_management',
        'other_operating_expenses',
        'cap_rate',
      ];

  const rows: PortfolioImportRow[] = [];

  for (const line of dataLines) {
    const cells = line.split(',').map((cell) => cell.trim());
    if (cells.length < 5) continue;

    const record: Partial<PortfolioImportRow> = {};
    headers.forEach((key, index) => {
      if (!key || cells[index] == null) return;
      const raw = cells[index];
      if (
        key === 'address' ||
        key === 'city' ||
        key === 'state' ||
        key === 'zip' ||
        key === 'property_type'
      ) {
        (record as Record<string, string>)[key] = raw;
      } else {
        (record as Record<string, number>)[key] = parseNumber(raw);
      }
    });

    if (!record.address || !record.city || !record.state || !record.zip) {
      continue;
    }

    rows.push({
      address: record.address,
      city: record.city,
      state: record.state,
      zip: record.zip,
      gross_rental_income: record.gross_rental_income ?? 0,
      other_income: record.other_income ?? 0,
      vacancy_percent: record.vacancy_percent ?? 5,
      property_taxes: record.property_taxes ?? 0,
      insurance: record.insurance ?? 0,
      utilities: record.utilities ?? 0,
      repairs_maintenance: record.repairs_maintenance ?? 0,
      property_management: record.property_management ?? 0,
      other_operating_expenses: record.other_operating_expenses ?? 0,
      cap_rate: record.cap_rate ?? 6.5,
      property_type: record.property_type as PortfolioImportRow['property_type'],
    });
  }

  if (rows.length === 0) {
    throw new Error('No valid rows found. Include address, city, state, zip, and financial columns.');
  }

  return rows;
}

export const PORTFOLIO_CSV_TEMPLATE = `address,city,state,zip,gross_rental_income,other_income,vacancy_percent,property_taxes,insurance,utilities,repairs_maintenance,property_management,other_operating_expenses,cap_rate
123 Main St,Seattle,WA,98101,120000,0,5,12000,3000,0,5000,4000,2000,6.5`;
