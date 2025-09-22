import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import analyzeHandler from './api/analyze.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Serve static files from root directory
app.use(express.static(path.resolve(__dirname, './')));
app.use('/detector', express.static(path.resolve(__dirname, './detector')));

// API route
app.post('/api/analyze', analyzeHandler);

// Serve detector page
app.get('/detector', (req, res) => {
  res.sendFile(path.resolve(__dirname, './detector/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
