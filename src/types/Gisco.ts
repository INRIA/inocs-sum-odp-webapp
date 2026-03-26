export interface IGiscoRawFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat] — GeoJSON convention
  };
  properties: {
    name: string;
    postalcode?: string;
    country: string;
    country_code: string;
    label: string;
    [key: string]: unknown;
  };
}

export interface IGiscoRawResponse {
  type: "FeatureCollection";
  features: IGiscoRawFeature[];
}

export interface IGiscoSearchResult {
  cityName: string;
  postalCode: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  label: string;
}
