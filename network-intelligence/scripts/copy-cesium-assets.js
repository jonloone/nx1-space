const fs = require('fs-extra');
const path = require('path');

async function copyCesiumAssets() {
  const cesiumSource = path.join(__dirname, '../node_modules/cesium/Build/Cesium');
  const cesiumDest = path.join(__dirname, '../public/cesium');
  
  try {
    // Remove old cesium assets if they exist
    await fs.remove(cesiumDest);
    
    // Copy new assets
    await fs.copy(cesiumSource, cesiumDest);
    
    console.log('✅ Cesium assets copied successfully');
  } catch (error) {
    console.error('❌ Error copying Cesium assets:', error);
    process.exit(1);
  }
}

copyCesiumAssets();