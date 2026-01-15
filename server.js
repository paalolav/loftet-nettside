#!/usr/bin/env node
/**
 * Loftet Lokal Redaktør
 *
 * Enkel server som:
 * 1. Startar Hugo dev-server
 * 2. Startar Decap CMS lokal backend
 * 3. Har ein /publiser-endepunkt for å laste opp til Webhuset
 */

const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 3456;
const HUGO_PORT = 1313;
const SRC_DIR = __dirname;

console.log('🎸 Loftet Lokal Redaktør startar...\n');

// Start Hugo server
const hugo = spawn('hugo', ['server', '--port', HUGO_PORT.toString()], {
  cwd: SRC_DIR,
  stdio: ['ignore', 'pipe', 'pipe']
});

hugo.stdout.on('data', (data) => {
  if (data.toString().includes('Web Server is available')) {
    console.log(`✅ Hugo køyrer på http://localhost:${HUGO_PORT}/`);
  }
});

hugo.stderr.on('data', (data) => {
  // Hugo skriv mykje til stderr, ignorer det meste
});

// Start Decap CMS lokal backend
const decap = spawn('npx', ['decap-server'], {
  cwd: SRC_DIR,
  stdio: ['ignore', 'pipe', 'pipe']
});

decap.stdout.on('data', (data) => {
  if (data.toString().includes('Decap CMS')) {
    console.log('✅ Decap CMS backend køyrer');
  }
});

// Enkel HTTP-server for publisering
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/publiser' && req.method === 'POST') {
    console.log('\n📤 Publiserer til loftet.no...');

    exec('./publish.sh', { cwd: SRC_DIR }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Feil:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
        return;
      }

      console.log(stdout);
      console.log('✅ Publisert!\n');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'loftet.no er oppdatert!' }));
    });
    return;
  }

  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(404);
  res.end('Ikkje funne');
});

server.listen(PORT, () => {
  console.log(`✅ Publiser-server køyrer på port ${PORT}`);
  console.log(`\n🌐 Opne denne i nettlesaren:`);
  console.log(`   http://localhost:${HUGO_PORT}/admin/\n`);
  console.log('📝 Rediger innhaldet, så trykk PUBLISER når du er klar.\n');
  console.log('🛑 Trykk Ctrl+C for å avslutte.\n');
});

// Rydd opp ved avslutning
process.on('SIGINT', () => {
  console.log('\n👋 Avsluttar...');
  hugo.kill();
  decap.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  hugo.kill();
  decap.kill();
  process.exit();
});
