import type { LidlPlusConfig, ApiHeaders, PromotionsResponse, ApiResponse } from './types.js';

export class LidlPlusClient {
  private config: Required<LidlPlusConfig>;
  private baseUrl = 'https://coupons.lidlplus.com/app/api/v3';

  constructor(config: LidlPlusConfig) {
    this.config = {
      bearerToken: config.bearerToken,
      country: config.country || 'DE',
      appVersion: config.appVersion || '16.33.1'
    };
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

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
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
    return this.makeRequest<PromotionsResponse>('/promotionslist');
  }

  /**
   * Update the bearer token
   */
  updateToken(newToken: string): void {
    this.config.bearerToken = newToken;
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