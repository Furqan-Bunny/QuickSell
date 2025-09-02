// Minimal server test for Railway
const express = require('express');
const app = express();

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, HOST, () => {
  console.log(`Test server running on http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  process.exit(0);
});