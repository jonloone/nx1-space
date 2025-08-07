const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8081;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Create index.html with embedded Kepler.gl
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Ground Station Intelligence - Kepler.gl</title>
    <style>
        body { margin: 0; padding: 0; }
        iframe { width: 100vw; height: 100vh; border: none; }
        .overlay {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
        }
    </style>
</head>
<body>
    <iframe id="keplerFrame" src="https://kepler.gl/demo"></iframe>
    <div class="overlay">
        <h3>🛰️ Ground Station Intelligence</h3>
        <p>Loading 50 commercial ground stations...</p>
        <button onclick="loadData()" style="padding: 10px 20px; background: #5A91E6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Load Ground Station Data
        </button>
    </div>
    
    <script>
        async function loadData() {
            const response = await fetch('/data/kepler_ground_stations.json');
            const data = await response.json();
            
            // Post message to Kepler.gl iframe
            const iframe = document.getElementById('keplerFrame');
            iframe.onload = function() {
                // Wait for Kepler to be ready
                setTimeout(() => {
                    iframe.contentWindow.postMessage({
                        type: 'LOAD_DATA',
                        data: data
                    }, 'https://kepler.gl');
                }, 3000);
            };
            
            document.querySelector('.overlay p').textContent = 'Data loaded! Check Kepler.gl window.';
        }
        
        // Auto-load after 3 seconds
        setTimeout(loadData, 3000);
    </script>
</body>
</html>`;
  
  res.send(html);
});

// Serve ground station data
app.get('/api/ground-stations', (req, res) => {
  const dataPath = path.join(__dirname, 'kepler_ground_stations.json');
  if (fs.existsSync(dataPath)) {
    res.sendFile(dataPath);
  } else {
    res.status(404).json({ error: 'Data not found' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Ground Station Intelligence Server Running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🛰️  Ground Station Intelligence Server
=====================================
Server running at:
- Local:    http://localhost:${PORT}
- Network:  http://0.0.0.0:${PORT}

Access the app at: http://YOUR_SERVER_IP:${PORT}
  `);
});