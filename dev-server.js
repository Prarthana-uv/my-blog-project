import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';

// Import API handlers
import analyzeHandler from './api/analyze.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from root directory
app.use(express.static(__dirname));

// API routes
app.use('/api/analyze', analyzeHandler);

// Route handlers for HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.html'));
});

app.get('/detector', (req, res) => {
  res.sendFile(path.join(__dirname, 'detector', 'index.html'));
});

// Chat route removed

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📝 Blog available at http://localhost:${port}/blog`);
  console.log(`🔍 Detector available at http://localhost:${port}/detector`);
  console.log(`💬 Chat available at http://localhost:${port}/chat`);
});