import { WebSocketServer } from 'ws'
import http from 'http'
import { setupWSConnection, setPersistence } from '@y/websocket-server/utils'
import { LeveldbPersistence } from 'y-leveldb'
import * as Y from 'yjs'

const PORT = 1234
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:5174']

// Initialize LevelDB persistence
const persistence = new LeveldbPersistence('./db')

// Set up persistence for the Y.js server
setPersistence({
  provider: persistence,
  bindState: async (docName, ydoc) => {
    const persistedYdoc = await persistence.getYDoc(docName)
    const newUpdates = Y.encodeStateAsUpdate(ydoc)
    persistence.storeUpdate(docName, newUpdates)
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc))
    ydoc.on('update', update => {
      persistence.storeUpdate(docName, update)
    })
  },
  writeState: async (_docName, _ydoc) => {}
})

// Create HTTP server
const server = http.createServer()

// Handle CORS for WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  const origin = request.headers.origin
  
  // Check if origin is allowed (allow null origin for file:// URLs and testing)
  if (origin && origin !== 'null' && !ALLOWED_ORIGINS.includes(origin)) {
    console.log(`Rejected WebSocket connection from unauthorized origin: ${origin}`)
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
    socket.destroy()
    return
  }
  
  console.log(`Accepting WebSocket connection from origin: ${origin || 'no origin'}`)
  
  // Let the WebSocket server handle the upgrade
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request)
  })
})

// Create WebSocket server
const wss = new WebSocketServer({ 
  noServer: true // We handle the upgrade manually for CORS
})

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established')
  console.log('Request URL:', req.url)
  
  // Extract document name from URL
  const docName = req.url?.slice(1).split('?')[0] || 'default'
  console.log(`Document name: ${docName}`)
  
  // Setup Y.js WebSocket connection
  setupWSConnection(ws, req, {
    docName,
    gc: true
  })
})

// Handle WebSocket server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error)
})

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`Y.js WebSocket server running on port ${PORT}`)
  console.log(`WebSocket URL: ws://localhost:${PORT}`)
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`)
  console.log(`Persistence: LevelDB in ./db directory`)
})

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error)
})

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down Y.js WebSocket server...')
  
  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed')
    
    // Close HTTP server
    server.close(() => {
      console.log('HTTP server closed')
      
      // Close persistence
      persistence.destroy().then(() => {
        console.log('Persistence closed')
        process.exit(0)
      }).catch((err) => {
        console.error('Error closing persistence:', err)
        process.exit(1)
      })
    })
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  shutdown()
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason)
  shutdown()
})
