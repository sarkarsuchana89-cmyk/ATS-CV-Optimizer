const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env and root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const express = require('express');
const cors = require('cors');

const parseRoutes = require('./routes/parse');
const analyzeRoutes = require('./routes/analyze');
const optimizeRoutes = require('./routes/optimize');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/parse', parseRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/optimize', optimizeRoutes);
app.use('/api/export', exportRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'healthy',
    service: 'ATS CV Optimizer API',
    aiEnabled: hasKey,
    timestamp: new Date().toISOString()
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`ATS CV Optimizer Server running on port ${PORT}`);
  console.log(`AI Integration: ${process.env.GEMINI_API_KEY ? 'Active (Gemini AI Key Found)' : 'Algorithmic Mode (No API Key)'}`);
  console.log(`API Health: http://localhost:${PORT}/api/health`);
  console.log(`==========================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${PORT} is already in use by another process.`);
    console.error(`To free port ${PORT}, run:`);
    console.error(`  PowerShell: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
