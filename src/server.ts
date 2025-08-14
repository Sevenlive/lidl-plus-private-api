import { LidlPlusClient } from './lidlplus-client.js';
import type { LidlPlusConfig, TicketsQuery } from './types.js';

interface ServerConfig {
  port?: number;
  host?: string;
}

interface ApiRequest {
  bearerToken?: string;
  country?: string;
  appVersion?: string;
}

interface TicketsRequest extends ApiRequest {
  pageNumber?: number;
  onlyFavorite?: boolean;
}

interface TicketDetailsRequest extends ApiRequest {
  ticketId: string;
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

      // Get tickets endpoint (POST)
      if (path === '/api/tickets' && method === 'POST') {
        const body = await request.json() as TicketsRequest;
        
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

        const query: TicketsQuery = {
          pageNumber: body.pageNumber,
          onlyFavorite: body.onlyFavorite,
          country: body.country || this.defaultCountry
        };

        const result = await client.getTickets(query);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : (result.statusCode || 500), 
            headers: corsHeaders 
          }
        );
      }

      // Get tickets with query params (GET method)
      if (path === '/api/tickets' && method === 'GET') {
        const bearerToken = url.searchParams.get('token') || this.defaultBearerToken;
        const country = url.searchParams.get('country') || this.defaultCountry;
        const appVersion = url.searchParams.get('appVersion') || this.defaultAppVersion;
        const pageNumber = parseInt(url.searchParams.get('pageNumber') || '1');
        const onlyFavorite = url.searchParams.get('onlyFavorite') === 'true';

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

        const query: TicketsQuery = {
          pageNumber,
          onlyFavorite,
          country
        };

        const result = await client.getTickets(query);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : (result.statusCode || 500), 
            headers: corsHeaders 
          }
        );
      }

      // Get ticket details endpoint (POST)
      if (path === '/api/ticket-details' && method === 'POST') {
        const body = await request.json() as TicketDetailsRequest;
        
        const bearerToken = body.bearerToken || this.defaultBearerToken;
        
        if (!bearerToken) {
          return new Response(
            JSON.stringify({ 
              error: 'Bearer token is required. Provide it in request body or set LIDL_BEARER_TOKEN environment variable.' 
            }),
            { status: 400, headers: corsHeaders }
          );
        }

        if (!body.ticketId) {
          return new Response(
            JSON.stringify({ error: 'ticketId is required in request body.' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const client = this.createClient({
          bearerToken,
          country: body.country || this.defaultCountry,
          appVersion: body.appVersion || this.defaultAppVersion
        });

        const result = await client.getTicketDetails(body.ticketId, body.country);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : (result.statusCode || 500), 
            headers: corsHeaders 
          }
        );
      }

      // Get ticket details with query params (GET method)
      if (path.startsWith('/api/ticket-details/') && method === 'GET') {
        const ticketId = path.split('/api/ticket-details/')[1];
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

        if (!ticketId) {
          return new Response(
            JSON.stringify({ error: 'ticketId is required in URL path.' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const client = this.createClient({
          bearerToken,
          country,
          appVersion
        });

        const result = await client.getTicketDetails(ticketId, country);
        
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
            },
            'POST /api/tickets': {
              description: 'Get tickets/receipts using POST with JSON body',
              body: {
                bearerToken: 'string (optional if LIDL_BEARER_TOKEN env var is set)',
                country: `string (optional, default: ${this.defaultCountry})`,
                appVersion: `string (optional, default: ${this.defaultAppVersion})`,
                pageNumber: 'number (optional, default: 1)',
                onlyFavorite: 'boolean (optional, default: false)'
              },
              response: 'ApiResponse<TicketsResponse>'
            },
            'GET /api/tickets': {
              description: 'Get tickets/receipts using GET with query parameters',
              queryParams: {
                token: 'string (optional if LIDL_BEARER_TOKEN env var is set) - Bearer token',
                country: `string (optional, default: ${this.defaultCountry})`,
                pageNumber: 'number (optional, default: 1)',
                onlyFavorite: 'boolean (optional, default: false)',
                appVersion: `string (optional, default: ${this.defaultAppVersion})`
              },
              response: 'ApiResponse<TicketsResponse>'
            },
            'POST /api/ticket-details': {
              description: 'Get detailed ticket information using POST with JSON body',
              body: {
                bearerToken: 'string (optional if LIDL_BEARER_TOKEN env var is set)',
                ticketId: 'string (required) - The ticket ID',
                country: `string (optional, default: ${this.defaultCountry})`,
                appVersion: `string (optional, default: ${this.defaultAppVersion})`
              },
              response: 'ApiResponse<TicketDetails>'
            },
            'GET /api/ticket-details/{ticketId}': {
              description: 'Get detailed ticket information using GET with ticket ID in URL',
              pathParams: {
                ticketId: 'string (required) - The ticket ID'
              },
              queryParams: {
                token: 'string (optional if LIDL_BEARER_TOKEN env var is set) - Bearer token',
                country: `string (optional, default: ${this.defaultCountry})`,
                appVersion: `string (optional, default: ${this.defaultAppVersion})`
              },
              response: 'ApiResponse<TicketDetails>'
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
            },
            'POST /api/tickets': {
              'with token in body': `curl -X POST http://localhost:${this.port}/api/tickets \\
  -H "Content-Type: application/json" \\
  -d '{"bearerToken": "your-token-here", "country": "DE", "pageNumber": 1, "onlyFavorite": false}'`,
              'using env token': `curl -X POST http://localhost:${this.port}/api/tickets \\
  -H "Content-Type: application/json" \\
  -d '{"country": "DE", "pageNumber": 1, "onlyFavorite": false}'`
            },
            'GET /api/tickets': {
              'with token in query': `curl "http://localhost:${this.port}/api/tickets?token=your-token-here&country=DE&pageNumber=1&onlyFavorite=false"`,
              'using env token': `curl "http://localhost:${this.port}/api/tickets?country=DE&pageNumber=1&onlyFavorite=false"`
            },
            'POST /api/ticket-details': {
              'with token in body': `curl -X POST http://localhost:${this.port}/api/ticket-details \\
  -H "Content-Type: application/json" \\
  -d '{"bearerToken": "your-token-here", "ticketId": "23003378862025081310063", "country": "DE"}'`,
              'using env token': `curl -X POST http://localhost:${this.port}/api/ticket-details \\
  -H "Content-Type: application/json" \\
  -d '{"ticketId": "23003378862025081310063", "country": "DE"}'`
            },
            'GET /api/ticket-details/{ticketId}': {
              'with token in query': `curl "http://localhost:${this.port}/api/ticket-details/23003378862025081310063?token=your-token-here&country=DE"`,
              'using env token': `curl "http://localhost:${this.port}/api/ticket-details/23003378862025081310063?country=DE"`
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
          availableEndpoints: ['/health', '/api/promotions', '/api/tickets', '/api/ticket-details', '/api/docs'] 
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