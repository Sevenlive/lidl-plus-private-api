import { LidlPlusClient } from './lidlplus-client.js';

export { LidlPlusClient } from './lidlplus-client.js';
export type {
  LidlPlusConfig,
  ApiHeaders,
  Promotion,
  PromotionsResponse,
  ApiResponse
} from './types.js';

// Example usage
if (import.meta.main) {
  const bearerToken = process.env.LIDL_BEARER_TOKEN;

  if (!bearerToken) {
    console.error('LIDL_BEARER_TOKEN environment variable is required');
    process.exit(1);
  }

  const client = new LidlPlusClient({
    bearerToken,
    country: process.env.LIDL_COUNTRY || 'DE'
  });

  try {
    const result = await client.getPromotions();
    if (result.success) {
      console.log('Promotions:', result.data);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Failed to fetch promotions:', error);
  }
}