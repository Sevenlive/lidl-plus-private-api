# LidlPlus API Wrapper

A TypeScript wrapper for the LidlPlus API built with Bun.

## Installation

```bash
bun install
```

## Usage

```typescript
import { LidlPlusClient } from './src/index.js';

const client = new LidlPlusClient({
  bearerToken: 'your-bearer-token-here',
  country: 'DE', // Optional, defaults to 'DE'
  appVersion: '16.33.1' // Optional, defaults to '16.33.1'
});

// Get available promotions/coupons
const result = await client.getPromotions();

if (result.success) {
  console.log('Promotions:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## API Methods

### `getPromotions()`
Fetches available coupons and promotions.

### `updateToken(newToken: string)`
Updates the bearer token for authentication.

### `updateCountry(country: string)`
Updates the country code for region-specific promotions.

### `getConfig()`
Returns the current client configuration.

## REST API Server

### Environment Configuration

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Configure your environment variables:

```env
LIDL_BEARER_TOKEN=your-bearer-token-here
LIDL_COUNTRY=DE
LIDL_APP_VERSION=16.33.1
PORT=3000
HOST=localhost
```

Start the HTTP server:

```bash
bun run server
```

The server runs on `http://localhost:3000` by default.

### API Endpoints

#### `GET /health`
Health check endpoint
```bash
curl http://localhost:3000/health
```

#### `GET /api/docs`
API documentation
```bash
curl http://localhost:3000/api/docs
```

#### `POST /api/promotions`
Get promotions with JSON body

With token in request:
```bash
curl -X POST http://localhost:3000/api/promotions \
  -H "Content-Type: application/json" \
  -d '{"bearerToken": "your-token", "country": "DE"}'
```

Using environment token:
```bash
curl -X POST http://localhost:3000/api/promotions \
  -H "Content-Type: application/json" \
  -d '{"country": "DE"}'
```

#### `GET /api/promotions`
Get promotions with query parameters

With token in query:
```bash
curl "http://localhost:3000/api/promotions?token=your-token&country=DE"
```

Using environment token:
```bash
curl "http://localhost:3000/api/promotions?country=DE"
```

## Development

```bash
# Run in development mode
bun dev

# Start the API server
bun run server

# Build the project
bun build

# Run tests
bun test
```

## Configuration

The client requires a bearer token for authentication. You can obtain this from the LidlPlus mobile app or web interface.

### Required Headers
- `Authorization`: Bearer token
- `App`: com.lidl.eci.lidlplus
- `App-Version`: Version of the app (default: 16.33.1)
- `Country`: Country code (default: DE)

## Example Response

```json
{
  "success": true,
  "data": {
    "promotions": [
      {
        "id": "promo-123",
        "title": "20% off fruits",
        "description": "Get 20% discount on all fruits",
        "validFrom": "2024-01-01",
        "validTo": "2024-01-31",
        "discount": {
          "type": "percentage",
          "value": 20
        }
      }
    ],
    "totalCount": 1,
    "hasMore": false
  }
}
```