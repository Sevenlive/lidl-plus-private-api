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

export interface Ticket {
  id: string;
  date: string;
  store: string;
  total: number;
  currency: string;
  items: TicketItem[];
  isFavorite?: boolean;
}

export interface TicketItem {
  name: string;
  quantity: number;
  price: number;
  category?: string;
}

export interface TicketsResponse {
  tickets: Ticket[];
  totalCount: number;
  pageNumber: number;
  hasMore: boolean;
}

export interface TicketsQuery {
  pageNumber?: number;
  onlyFavorite?: boolean;
  country?: string;
}

export interface TicketDetails {
  id: string;
  date: string;
  store: {
    code: string;
    name: string;
    address?: string;
  };
  total: number;
  currency: {
    code: string;
    symbol: string;
  };
  items: TicketDetailItem[];
  coupons?: TicketCoupon[];
  isFavorite: boolean;
  htmlDocument?: string;
  returns?: any[];
}

export interface TicketDetailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  ean?: string;
  discount?: number;
}

export interface TicketCoupon {
  id: string;
  name: string;
  discount: number;
  type: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}