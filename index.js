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

const functions = require('firebase-functions');
const fetch = require('node-fetch');

exports.analyzeStyle = functions.https.onCall(async (data, context) => {
    // 1. Get the key securely from environment variables
    const API_KEY = functions.config().gemini.api_key;  // Use config() for Firebase env vars
    
    // 2. Prepare the request to Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.payload) // Pass the data from frontend
    });

    // 3. Return result to frontend
    return await response.json();
});