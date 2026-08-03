/**
 * Downloads real Gujarat district GeoJSON boundaries and merges them
 * with existing groundwater properties from the current data.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');

// Read existing groundwater summary to get district property data
const gwData = JSON.parse(readFileSync(join(DATA_DIR, 'groundwater_summary.json'), 'utf-8'));
const existingGeoJSON = JSON.parse(readFileSync(join(DATA_DIR, 'gujarat_districts.json'), 'utf-8'));

// Get existing district names (our data keys)
const ourDistricts = Object.keys(gwData);
console.log(`Our groundwater data has ${ourDistricts.length} districts:`);
console.log(ourDistricts.sort().join(', '));

async function main() {
  // Fetch real boundaries
  const url = 'https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/states/gujarat.geojson';
  console.log(`\nFetching real boundaries from:\n${url}\n`);
  
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch: ${resp.status}`);
  const realGeo = await resp.json();
  
  const realDistricts = realGeo.features.map(f => f.properties.district);
  console.log(`Real GeoJSON has ${realDistricts.length} districts:`);
  console.log(realDistricts.sort().join(', '));
  
  // Name mapping: real GeoJSON names → our data keys
  // Build a case-insensitive lookup first
  const nameMap = {};
  for (const realName of realDistricts) {
    // Try exact match first
    if (ourDistricts.includes(realName)) {
      nameMap[realName] = realName;
      continue;
    }
    // Try case-insensitive
    const match = ourDistricts.find(d => d.toLowerCase() === realName.toLowerCase());
    if (match) {
      nameMap[realName] = match;
      continue;
    }
  }

  // Manual overrides for known mismatches
  const manualMap = {
    'Kachchh': 'Kachchh',
    'Kutch': 'Kachchh',
    'Kachch': 'Kachchh',
    'The Dangs': 'Dang',
    'Dangs': 'Dang',
    'Dang': 'Dang',
    'Dahod': 'Dohad',
    'Dohad': 'Dohad',
    'Mehsana': 'Mahesana',
    'Mahesana': 'Mahesana',
    'Panchmahal': 'Panchmahals',
    'Panchmahals': 'Panchmahals',
    'Panch Mahals': 'Panchmahals',
    'Sabar Kantha': 'Sabarkantha',
    'Sabarkantha': 'Sabarkantha',
    'Tapi': 'TAPI',
    'TAPI': 'TAPI',
    'Devbhoomi Dwarka': 'Devbhumi Dwarka',
    'Devbhumi Dwarka': 'Devbhumi Dwarka',
    'Chhotaudepur': 'Chhota Udaipur',
    'Chhota Udepur': 'Chhota Udaipur',
    'Chhota Udaipur': 'Chhota Udaipur',
    'Mahisagar': 'Mahisagar',
    'Mahi Sagar': 'Mahisagar',
    'GIR SOMNATH': 'Gir Somnath',
    'Gir Somnath': 'Gir Somnath',
    'Arvalli': 'Aravalli',
    'Aravalli': 'Aravalli',
  };
  
  // Apply manual overrides
  for (const realName of realDistricts) {
    if (!nameMap[realName] && manualMap[realName]) {
      nameMap[realName] = manualMap[realName];
    }
    // Also try partial match
    if (!nameMap[realName]) {
      for (const [pattern, target] of Object.entries(manualMap)) {
        if (realName.toLowerCase().includes(pattern.toLowerCase()) || 
            pattern.toLowerCase().includes(realName.toLowerCase())) {
          nameMap[realName] = target;
          break;
        }
      }
    }
  }
  
  console.log('\n--- Name Mapping ---');
  const matched = [];
  const unmatched = [];
  for (const realName of realDistricts) {
    if (nameMap[realName]) {
      matched.push(`  ${realName} → ${nameMap[realName]}`);
    } else {
      unmatched.push(`  ${realName} → ???`);
    }
  }
  matched.forEach(m => console.log(m));
  if (unmatched.length) {
    console.log('\nUNMATCHED (will use defaults):');
    unmatched.forEach(m => console.log(m));
  }
  
  // Check which of our districts have no real boundary match
  const mappedTargets = new Set(Object.values(nameMap));
  const unmappedOurs = ourDistricts.filter(d => !mappedTargets.has(d));
  if (unmappedOurs.length) {
    console.log('\nOur districts with NO real boundary found:');
    unmappedOurs.forEach(d => console.log(`  ${d}`));
  }
  
  // Build merged GeoJSON
  const features = [];
  
  for (const feature of realGeo.features) {
    const realName = feature.properties.district;
    const ourName = nameMap[realName];
    
    if (!ourName) {
      // Include the real boundary even if not in our data, with default properties
      features.push({
        type: 'Feature',
        properties: {
          name: realName,
          district: realName,
          mean_depth: 8.0,
          category: 'Semi-Critical',
          risk_color: '#eab308',
          annual_drawdown_rate: 0.1
        },
        geometry: feature.geometry
      });
      continue;
    }
    
    const gw = gwData[ourName];
    features.push({
      type: 'Feature',
      properties: {
        name: ourName,
        district: ourName,
        mean_depth: gw ? gw.mean_depth : 8.0,
        category: gw ? gw.cgwb_category : 'Semi-Critical',
        risk_color: gw ? gw.risk_color : '#eab308',
        annual_drawdown_rate: gw ? gw.annual_drawdown_rate : 0.1
      },
      geometry: feature.geometry
    });
  }
  
  // For our districts that had no real boundary, keep the old hexagonal fallback
  for (const distName of unmappedOurs) {
    const oldFeature = existingGeoJSON.features.find(f => f.properties.name === distName);
    if (oldFeature) {
      console.log(`  Keeping hexagon fallback for: ${distName}`);
      features.push(oldFeature);
    }
  }
  
  const merged = {
    type: 'FeatureCollection',
    features
  };
  
  const outPath = join(DATA_DIR, 'gujarat_districts.json');
  writeFileSync(outPath, JSON.stringify(merged, null, 2));
  console.log(`\nWrote ${features.length} features to ${outPath}`);
  console.log(`File size: ${(JSON.stringify(merged).length / 1024).toFixed(0)} KB`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
