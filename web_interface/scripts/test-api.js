#!/usr/bin/env node
/**
 * Simple ClinicalTrials.gov API Test
 */

const axios = require('axios');

async function testAPI() {
  console.log('Testing ClinicalTrials.gov API...');
  
  try {
    // Simple test query - search for trials in Kenya
    const url = 'https://clinicaltrials.gov/api/v2/studies';
    const params = {
      'query.locn': 'Kenya',
      'pageSize': 5
    };
    
    console.log(`Making request to: ${url}`);
    console.log('Parameters:', params);
    
    const response = await axios.get(url, { 
      params,
      timeout: 30000,
      headers: {
        'User-Agent': 'SATN-Test/1.0 (Academic Research)'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Total studies found:', response.data.totalCount);
    console.log('Studies returned:', response.data.studies?.length || 0);
    
    if (response.data.studies && response.data.studies.length > 0) {
      console.log('\nFirst study:');
      const study = response.data.studies[0];
      console.log('- NCT ID:', study.protocolSection?.identificationModule?.nctId);
      console.log('- Title:', study.protocolSection?.identificationModule?.briefTitle);
      console.log('- Status:', study.protocolSection?.statusModule?.overallStatus);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.statusText);
    console.error('Error message:', error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

testAPI();
