const axios = require('axios');
const url = 'https://valhalla1.openstreetmap.de/route?json=' + encodeURIComponent(JSON.stringify({
  locations: [
    { lat: 10.7721, lon: 106.7228 },
    { lat: 10.7821, lon: 106.7328 }
  ],
  costing: 'pedestrian'
}));
axios.get(url)
  .then(res => {
    const shape = res.data.trip.legs[0].shape;
    console.log('Shape length:', shape.length, shape.substring(0, 50));
  })
  .catch(err => console.error('Valhalla failed:', err.response ? err.response.status : err.message));
