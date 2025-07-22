require('dotenv').config();
const WebSocket = require('ws');
const Redis = require('ioredis');

const PORT = process.env.PORT || 3001;
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`WebSocket server started on port ${PORT}`);
});

const redis = new Redis(process.env.REDIS_URL, { family: 0 });

const clientChannels = new Map();
const CHANNEL_PREFIX = 'zen_sushi_database_';

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'welcome', message: 'WebSocket connection established' }));

  ws.on('message', msg => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'subscribe' && data.channel) {
        const channelName = CHANNEL_PREFIX + data.channel;
        clientChannels.set(ws, channelName);
        redis.subscribe(channelName, (err) => {
          if (err) {
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to subscribe channel' }));
          }
        });
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    clientChannels.delete(ws);
  });
});

redis.on('message', (channel, message) => {
  wss.clients.forEach(client => {
    if (
      client.readyState === WebSocket.OPEN &&
      clientChannels.get(client) === channel
    ) {
      client.send(message);
    }
  });
  console.log(`Message pushed to frontend on ${channel}:`, message);
});