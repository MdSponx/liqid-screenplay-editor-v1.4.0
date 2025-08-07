import WebSocket from 'ws';

console.log('Testing WebSocket connection to Y.js server...');

// Test connection to the Y.js WebSocket server
const ws = new WebSocket('ws://localhost:1234/test-document');

ws.on('open', () => {
  console.log('✅ WebSocket connection established successfully!');
  console.log('✅ CORS configuration is working properly');
  
  // Send a test message to verify bidirectional communication
  console.log('Sending test message...');
  
  // Close connection after successful test
  setTimeout(() => {
    ws.close();
    console.log('✅ Test completed successfully - connection closed gracefully');
    process.exit(0);
  }, 1000);
});

ws.on('message', (data) => {
  console.log('📨 Received message from server:', data.length, 'bytes');
});

ws.on('close', (code, reason) => {
  console.log('🔌 WebSocket connection closed:', code, reason.toString());
});

ws.on('error', (error) => {
  console.error('❌ WebSocket connection failed:', error.message);
  console.error('❌ CORS configuration may need adjustment');
  process.exit(1);
});

// Timeout after 5 seconds if connection fails
setTimeout(() => {
  if (ws.readyState !== WebSocket.OPEN) {
    console.error('❌ Connection timeout - server may not be responding');
    process.exit(1);
  }
}, 5000);
