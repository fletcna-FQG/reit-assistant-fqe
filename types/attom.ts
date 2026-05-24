export type AttomFieldSource = 'attom' | 'manual' | 'estimated' | 'calculated';

export type AttomMarketSnapshot = {
  gross_rental_income?: number;
  other_income?: number;
  vacancy_percent?: number;
  property_taxes?: number;
  insurance?: number;
  utilities?: number;
  repairs_maintenance?: number;
  property_management?: number;
  other_operating_expenses?: number;
  cap_rate?: number;
  year_built?: number;
  lot_size_sqft?: number;
  price?: number;
  avm?: number;
  attom_id?: number;
  property_type?: string;
  fetched_at: string;
  cached?: boolean;
  field_sources?: Partial<Record<string, AttomFieldSource>>;
};

export type AttomMarketDataResponse = {
  attom_enabled: boolean;
  attom_data: AttomMarketSnapshot | null;
  message: string;
};
