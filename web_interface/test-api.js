const http = require('http');

async function testAPI(path, description) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ ${description}: ${res.statusCode} - ${json.data ? json.data.length : json.nodes ? json.nodes.length : 0} items`);
          resolve(json);
        } catch (error) {
          console.log(`❌ ${description}: Invalid JSON`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${description}: ${error.message}`);
      resolve(null);
    });
    
    req.setTimeout(5000, () => {
      console.log(`❌ ${description}: Timeout`);
      req.destroy();
      resolve(null);
    });
  });
}

async function runTests() {
  console.log('🧪 Testing API endpoints...\n');
  
  await testAPI('/api/data', 'Main data endpoint (nodes & relationships)');
  await testAPI('/api/institutions', 'Institutions endpoint');
  await testAPI('/api/companies', 'Companies endpoint');
  await testAPI('/api/clinical-trials', 'Clinical trials endpoint');
  await testAPI('/api/funders', 'Funders endpoint');
  
  console.log('\n✅ API testing complete!');
  process.exit(0);
}

runTests();
