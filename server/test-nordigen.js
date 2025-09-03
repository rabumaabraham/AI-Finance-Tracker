// Test script to check Nordigen API response structure
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

console.log('🔍 Testing Nordigen API...');
console.log('Environment variables:');
console.log('NORDIGEN_SECRET_ID:', process.env.NORDIGEN_SECRET_ID ? 'Set' : 'Not set');
console.log('NORDIGEN_SECRET_KEY:', process.env.NORDIGEN_SECRET_KEY ? 'Set' : 'Not set');

// Test with mock data to see the expected structure
const mockInstitutionResponse = {
  data: [
    {
      id: "DE123456789",
      name: "Deutsche Bank",
      country: "DE",
      logo: "https://example.com/logo.png",
      bic: "DEUTDEFF"
    },
    {
      id: "US987654321",
      name: "Chase Bank",
      country: "US",
      logo: "https://example.com/logo2.png",
      bic: "CHASUS33"
    },
    {
      id: "GB456789123",
      name: "Barclays Bank",
      country: "GB",
      logo: "https://example.com/logo3.png",
      bic: "BARCGB22"
    }
  ]
};

console.log('\n🏦 Mock institution response structure:');
console.log(JSON.stringify(mockInstitutionResponse, null, 2));

console.log('\n🔍 Testing data extraction:');
mockInstitutionResponse.data.forEach((inst, index) => {
  console.log(`\nBank ${index + 1}:`);
  console.log('  ID:', inst.id);
  console.log('  Name:', inst.name);
  console.log('  Country:', inst.country);
  console.log('  Logo:', inst.logo);
  console.log('  BIC:', inst.bic);
  
  // Test country extraction logic
  if (inst.country === 'DE') {
    console.log('  Country Name: Germany');
  } else if (inst.country === 'US') {
    console.log('  Country Name: United States');
  } else if (inst.country === 'GB') {
    console.log('  Country Name: United Kingdom');
  }
});

console.log('\n✅ Test completed. Check the structure above to understand the expected data format.');

