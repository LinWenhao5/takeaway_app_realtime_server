require('dotenv').config();
const WebSocket = require('ws');
const Redis = require('ioredis');

const PORT = process.env.PORT || 3001;

const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`WebSocket server started on port ${PORT}`);
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const CHANNEL = 'zen_sushi_database_orders';

redis.subscribe(CHANNEL, (err, count) => {
  if (err) {
    console.error('Failed to subscribe to Redis channel:', err);
  } else {
    console.log(`Subscribed to Redis channel: ${CHANNEL}`);
  }
});

redis.on('message', (channel, message) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  console.log('Message pushed to frontend:', message);
});

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'welcome', message: 'WebSocket connection established' }));
});