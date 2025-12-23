// index.js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Express on Vercel');
});

app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]);
});

// Export the app for Vercel
module.exports = app;