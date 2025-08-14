import { LidlPlusClient } from './lidlplus-client.js';
import type { LidlPlusConfig } from './types.js';

interface ServerConfig {
  port?: number;
  host?: string;
}

interface ApiRequest {
  bearerToken?: string;
  country?: string;
  appVersion?: string;
}

export class LidlPlusServer {
  private port: number;
  private host: string;
  private defaultBearerToken: string | undefined;
  private defaultCountry: string;
  private defaultAppVersion: string;

  constructor(config: ServerConfig = {}) {
    this.port = config.port || parseInt(process.env.PORT || '3000');
    this.host = config.host || process.env.HOST || 'localhost';
    this.defaultBearerToken = process.env.LIDL_BEARER_TOKEN;
    this.defaultCountry = process.env.LIDL_COUNTRY || 'DE';
    this.defaultAppVersion = process.env.LIDL_APP_VERSION || '16.33.1';
  }

  private createClient(config: LidlPlusConfig): LidlPlusClient {
    return new LidlPlusClient(config);
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      // Health check endpoint
      if (path === '/health' && method === 'GET') {
        return new Response(
          JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
          { status: 200, headers: corsHeaders }
        );
      }

      // Get promotions endpoint
      if (path === '/api/promotions' && method === 'POST') {
        const body = await request.json() as ApiRequest;
        
        const bearerToken = body.bearerToken || this.defaultBearerToken;
        
        if (!bearerToken) {
          return new Response(
            JSON.stringify({ 
              error: 'Bearer token is required. Provide it in request body or set LIDL_BEARER_TOKEN environment variable.' 
            }),
            { status: 400, headers: corsHeaders }
          );
        }

        const client = this.createClient({
          bearerToken,
          country: body.country || this.defaultCountry,
          appVersion: body.appVersion || this.defaultAppVersion
        });

        const result = await client.getPromotions();
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : (result.statusCode || 500), 
            headers: corsHeaders 
          }
        );
      }

      // Get promotions with query params (GET method)
      if (path === '/api/promotions' && method === 'GET') {
        const bearerToken = url.searchParams.get('token') || this.defaultBearerToken;
        const country = url.searchParams.get('country') || this.defaultCountry;
        const appVersion = url.searchParams.get('appVersion') || this.defaultAppVersion;

        if (!bearerToken) {
          return new Response(
            JSON.stringify({ 
              error: 'Bearer token is required. Provide it as query parameter "token" or set LIDL_BEARER_TOKEN environment variable.' 
            }),
            { status: 400, headers: corsHeaders }
          );
        }

        const client = this.createClient({
          bearerToken,
          country,
          appVersion
        });

        const result = await client.getPromotions();
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : (result.statusCode || 500), 
            headers: corsHeaders 
          }
        );
      }

      // API documentation endpoint
      if (path === '/api/docs' && method === 'GET') {
        const docs = {
          title: 'LidlPlus API Wrapper',
          version: '1.0.0',
          endpoints: {
            'GET /health': {
              description: 'Health check endpoint',
              response: { status: 'ok', timestamp: 'ISO string' }
            },
            'POST /api/promotions': {
              description: 'Get promotions using POST with JSON body',
              body: {
                bearerToken: 'string (optional if LIDL_BEARER_TOKEN env var is set)',
                country: `string (optional, default: ${this.defaultCountry})`,
                appVersion: `string (optional, default: ${this.defaultAppVersion})`
              },
              response: 'ApiResponse<PromotionsResponse>'
            },
            'GET /api/promotions': {
              description: 'Get promotions using GET with query parameters',
              queryParams: {
                token: 'string (optional if LIDL_BEARER_TOKEN env var is set) - Bearer token',
                country: `string (optional, default: ${this.defaultCountry})`,
                appVersion: `string (optional, default: ${this.defaultAppVersion})`
              },
              response: 'ApiResponse<PromotionsResponse>'
            }
          },
          examples: {
            'POST /api/promotions': {
              'with token in body': `curl -X POST http://localhost:${this.port}/api/promotions \\
  -H "Content-Type: application/json" \\
  -d '{"bearerToken": "your-token-here", "country": "DE"}'`,
              'using env token': `curl -X POST http://localhost:${this.port}/api/promotions \\
  -H "Content-Type: application/json" \\
  -d '{"country": "DE"}'`
            },
            'GET /api/promotions': {
              'with token in query': `curl "http://localhost:${this.port}/api/promotions?token=your-token-here&country=DE"`,
              'using env token': `curl "http://localhost:${this.port}/api/promotions?country=DE"`
            }
          },
          environment: {
            tokenConfigured: !!this.defaultBearerToken,
            defaultCountry: this.defaultCountry,
            defaultAppVersion: this.defaultAppVersion
          }
        };

        return new Response(
          JSON.stringify(docs, null, 2),
          { status: 200, headers: corsHeaders }
        );
      }

      // 404 for unknown routes
      return new Response(
        JSON.stringify({ 
          error: 'Not found', 
          availableEndpoints: ['/health', '/api/promotions', '/api/docs'] 
        }),
        { status: 404, headers: corsHeaders }
      );

    } catch (error) {
      console.error('Server error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  async start(): Promise<void> {
    const server = Bun.serve({
      port: this.port,
      hostname: this.host,
      fetch: (request) => this.handleRequest(request),
    });

    console.log(`🚀 LidlPlus API Server running at http://${this.host}:${this.port}`);
    console.log(`📚 API Documentation: http://${this.host}:${this.port}/api/docs`);
    console.log(`❤️  Health Check: http://${this.host}:${this.port}/health`);
    
    return new Promise(() => {}); // Keep server running
  }
}