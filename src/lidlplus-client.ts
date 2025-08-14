import type { LidlPlusConfig, ApiHeaders, PromotionsResponse, TicketsResponse, TicketsQuery, TicketDetails, ApiResponse } from './types.js';

export class LidlPlusClient {
  private config: Required<LidlPlusConfig>;
  private promotionsBaseUrl = 'https://coupons.lidlplus.com/app/api/v3';
  private ticketsBaseUrl = 'https://tickets.lidlplus.com/api/v2';
  private ticketDetailsBaseUrl = 'https://tickets.lidlplus.com/api/v3';

  constructor(config: LidlPlusConfig) {
    this.config = {
      bearerToken: this.cleanBearerToken(config.bearerToken),
      country: config.country || 'DE',
      appVersion: config.appVersion || '16.33.1'
    };
  }

  private cleanBearerToken(token: string): string {
    // Remove "Bearer " prefix if it exists
    return token.replace(/^Bearer\s+/i, '');
  }

  private getHeaders(): ApiHeaders {
    return {
      'Authorization': `Bearer ${this.config.bearerToken}`,
      'App': 'com.lidl.eci.lidlplus',
      'App-Version': this.config.appVersion,
      'Country': this.config.country,
      'Content-Type': 'application/json'
    };
  }

  private async makeRequest<T>(baseUrl: string, endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const url = `${baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options?.headers
        }
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        statusCode: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Search for available coupons/promotions
   */
  async getPromotions(): Promise<ApiResponse<PromotionsResponse>> {
    return this.makeRequest<PromotionsResponse>(this.promotionsBaseUrl, '/promotionslist');
  }

  /**
   * Get tickets/receipts with optional filtering
   */
  async getTickets(query: TicketsQuery = {}): Promise<ApiResponse<TicketsResponse>> {
    const {
      pageNumber = 1,
      onlyFavorite = false,
      country = this.config.country
    } = query;

    const endpoint = `/${country}/tickets?pageNumber=${pageNumber}&onlyFavorite=${onlyFavorite}`;
    return this.makeRequest<TicketsResponse>(this.ticketsBaseUrl, endpoint);
  }

  /**
   * Get detailed information for a specific ticket
   */
  async getTicketDetails(ticketId: string, country?: string): Promise<ApiResponse<TicketDetails>> {
    const targetCountry = country || this.config.country;
    const endpoint = `/${targetCountry}/tickets/${ticketId}`;
    
    // Ticket details endpoint requires Accept-Language header
    const additionalHeaders = {
      'Accept-Language': targetCountry
    };
    
    return this.makeRequest<TicketDetails>(this.ticketDetailsBaseUrl, endpoint, {
      headers: additionalHeaders
    });
  }

  /**
   * Update the bearer token
   */
  updateToken(newToken: string): void {
    this.config.bearerToken = this.cleanBearerToken(newToken);
  }

  /**
   * Update the country code
   */
  updateCountry(country: string): void {
    this.config.country = country;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<LidlPlusConfig>> {
    return { ...this.config };
  }
}