// This file MUST be imported BEFORE any Supabase imports
// It patches the global WebSocket object for Node.js 20 compatibility
import WebSocket from 'ws';

if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

console.log('🔧 WebSocket patched for Node.js 20');
