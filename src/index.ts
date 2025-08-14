import { LidlPlusClient } from './lidlplus-client.js';

export { LidlPlusClient } from './lidlplus-client.js';
export type {
  LidlPlusConfig,
  ApiHeaders,
  Promotion,
  PromotionsResponse,
  Ticket,
  TicketItem,
  TicketsResponse,
  TicketsQuery,
  TicketDetails,
  TicketDetailItem,
  TicketCoupon,
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
    console.log('Testing promotions...');
    const promotionsResult = await client.getPromotions();
    if (promotionsResult.success) {
      console.log('✅ Promotions:', promotionsResult.data);
    } else {
      console.error('❌ Promotions error:', promotionsResult.error);
    }

    console.log('\nTesting tickets...');
    const ticketsResult = await client.getTickets({ pageNumber: 1, onlyFavorite: false });
    if (ticketsResult.success) {
      console.log('✅ Tickets:', ticketsResult.data);
      
      // Test ticket details with the first ticket ID if available
      if (ticketsResult.data?.tickets && ticketsResult.data.tickets.length > 0) {
        const firstTicketId = ticketsResult.data.tickets[0].id;
        console.log(`\nTesting ticket details for ID: ${firstTicketId}...`);
        
        const ticketDetailsResult = await client.getTicketDetails(firstTicketId);
        if (ticketDetailsResult.success) {
          console.log('✅ Ticket Details:', ticketDetailsResult.data);
        } else {
          console.error('❌ Ticket Details error:', ticketDetailsResult.error);
        }
        
        // Also test with the specific ticket ID from your curl example
        console.log('\nTesting ticket details for ID: 2300337886202508099832...');
        const specificTicketResult = await client.getTicketDetails('2300337886202508099832');
        if (specificTicketResult.success) {
          console.log('✅ Specific Ticket Details:', specificTicketResult.data);
        } else {
          console.error('❌ Specific Ticket Details error:', specificTicketResult.error);
        }
      }
    } else {
      console.error('❌ Tickets error:', ticketsResult.error);
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}