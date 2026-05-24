export type IntegrationCategory =
  | 'property_data'
  | 'email'
  | 'calendar'
  | 'video'
  | 'spreadsheet';

export type IntegrationDefinition = {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  /** Beta: free tier or manual import available */
  tier: 'free' | 'freemium' | 'paid' | 'manual';
  fields: { key: string; label: string; secure?: boolean }[];
  docsUrl?: string;
};

/** Catalog for Profile → Integrations. Connect in Beta stores keys locally; live OAuth later. */
export const INTEGRATION_CATALOG: IntegrationDefinition[] = [
  {
    id: 'attom',
    name: 'ATTOM Property Data',
    category: 'property_data',
    description: 'Automated property search and financial pre-fill (production API).',
    tier: 'paid',
    fields: [
      { key: 'api_key', label: 'API Key', secure: true },
      { key: 'base_url', label: 'Base URL' },
    ],
    docsUrl: 'https://api.developer.attomdata.com/',
  },
  {
    id: 'nominatim',
    name: 'OpenStreetMap Nominatim',
    category: 'property_data',
    description: 'Free geocoding and address validation (rate-limited; self-host for production).',
    tier: 'free',
    fields: [{ key: 'contact_email', label: 'Contact Email (required by OSM policy)' }],
    docsUrl: 'https://nominatim.org/release-docs/latest/api/Overview/',
  },
  {
    id: 'county_assessor',
    name: 'County Assessor Portal',
    category: 'property_data',
    description: 'Manual export from county assessor / tax records — import CSV into Analyze.',
    tier: 'manual',
    fields: [{ key: 'county_portal_url', label: 'Portal URL' }],
  },
  {
    id: 'csv_import',
    name: 'Spreadsheet / CSV Import',
    category: 'spreadsheet',
    description: 'Import CRE_Valuation_NOI_CapRate or custom CSV after manual download.',
    tier: 'free',
    fields: [],
  },
  {
    id: 'google_email',
    name: 'Google Workspace Email',
    category: 'email',
    description: 'Send rule-engine results and deal alerts from your workspace account.',
    tier: 'freemium',
    fields: [{ key: 'oauth', label: 'OAuth (connect in production)' }],
  },
  {
    id: 'microsoft_email',
    name: 'Microsoft 365 Email',
    category: 'email',
    description: 'Outlook / Exchange integration for notifications.',
    tier: 'freemium',
    fields: [{ key: 'oauth', label: 'OAuth (connect in production)' }],
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: 'calendar',
    description: 'Schedule site visits and task due dates from REIT Assistant.',
    tier: 'freemium',
    fields: [{ key: 'oauth', label: 'OAuth (connect in production)' }],
  },
  {
    id: 'zoom',
    name: 'Zoom Meetings',
    category: 'video',
    description: 'Create video meetings from deal or analysis workflows.',
    tier: 'freemium',
    fields: [
      { key: 'account_id', label: 'Account ID' },
      { key: 'client_id', label: 'Client ID' },
      { key: 'client_secret', label: 'Client Secret', secure: true },
    ],
  },
];

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  property_data: 'Property Data',
  email: 'Email',
  calendar: 'Calendar',
  video: 'Video Meetings',
  spreadsheet: 'Import / Export',
};
