// Test Bank Connection Flow
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testBankFlow() {
    try {
        console.log('Testing bank connection flow...');
        
        // Step 1: Get GoCardless link
        const response = await axios.get(`${BASE_URL}/api/bank/connect-bank`);
        const { requisitionId, link } = response.data;
        
        console.log('✅ Bank connection initiated');
        console.log('🔗 GoCardless Link:', link);
        console.log('🆔 Requisition ID:', requisitionId);
        
        console.log('\n📋 Next Steps:');
        console.log('1. Click the GoCardless link above');
        console.log('2. Complete the sandbox authentication');
        console.log('3. You will be redirected to dashboard with connected bank');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testBankFlow(); 