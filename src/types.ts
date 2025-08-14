export interface LidlPlusConfig {
  bearerToken: string;
  country?: string;
  appVersion?: string;
}

export interface ApiHeaders {
  'Authorization': string;
  'App': string;
  'App-Version': string;
  'Country': string;
  'Content-Type'?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  validFrom: string;
  validTo: string;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  category?: string;
  imageUrl?: string;
}

export interface PromotionsResponse {
  promotions: Promotion[];
  totalCount: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}