const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Enable CORS for your React app
app.use(cors({
  origin: 'http://localhost:3000'
}));

// Proxy endpoint for Nominatim API
app.get('/api/geocode', async (req, res) => {
  try {
    const { lat, lng, type } = req.query;
    const url = type === 'reverse'
      ? `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      : `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(req.query.q)}&limit=1`;

    const response = await axios.get(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'IslandGo/1.0 (https://github.com/yourusername/islandgo; your@email.com)',
        'Referer': 'http://localhost:3000'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch geocoding data' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 