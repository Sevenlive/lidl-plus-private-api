import { LidlPlusServer } from './src/server.js';

const server = new LidlPlusServer({
  port: 3000,
  host: 'localhost'
});

// Start the server
server.start().catch(console.error);