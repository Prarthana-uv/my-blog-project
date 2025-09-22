require('dotenv').config();
const express = require('express');
const path = require('path');
const analyzeHandler = require('./api/analyze.cjs');

const app = express();
const port = 3000;

app.use(express.json());

// Serve static files from root directory
app.use(express.static(path.resolve('./')));
app.use('/detector', express.static(path.resolve('./detector')));

// API route
app.use('/api/analyze', (req, res, next) => {
  console.log(`Received ${req.method} request on /api/analyze`);
  next();
});
app.post('/api/analyze', analyzeHandler);

// Serve detector page
app.get('/detector', (req, res) => {
  res.sendFile(path.resolve('./detector/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
