export type GeocodeStructuredAddress = {
  address: string;
  city: string;
  state: string;
  zip: string;
};

export type GeocodeSearchResult = {
  display_name: string;
  lat: number;
  lon: number;
  address: GeocodeStructuredAddress;
  osm_id: number;
  osm_type: string;
};

export type GeocodeSearchResponse = {
  results: GeocodeSearchResult[];
  cached: boolean;
  source: 'nominatim';
};

export type GeocodeReverseResponse = {
  address: GeocodeStructuredAddress;
  display_name: string;
  lat: number;
  lon: number;
  osm_id?: number;
  osm_type?: string;
  cached: boolean;
  source: 'nominatim';
};

export type SelectedPropertyLocation = GeocodeStructuredAddress & {
  lat: number;
  lon: number;
  display_name: string;
  osm_id?: number;
  osm_type?: string;
};

export type GeocodePlaceDetails = {
  osm_id: number;
  osm_type: string;
  display_name: string;
  lat: number;
  lon: number;
  address: GeocodeStructuredAddress;
  category?: string;
  type?: string;
  boundingbox?: [string, string, string, string];
  geometry?: unknown;
};

export type GeocodeDetailsResponse = {
  details: GeocodePlaceDetails;
  cached: boolean;
  source: 'nominatim';
};
