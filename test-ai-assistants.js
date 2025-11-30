#!/usr/bin/env node
/**
 * Test AI Assistants Setup and Functionality
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';

function makeRequest(path, method = 'POST', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testSetupAssistants() {
  console.log('🤖 Setting up AI Assistants...\n');
  
  try {
    const response = await makeRequest('/ai/assistants/setup', 'POST');
    
    if (response.success) {
      console.log('✅ Assistants created successfully!\n');
      console.log('Assistant IDs:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('\n📝 Save these IDs to .env.local:');
      console.log(`BILLING_ASSISTANT_ID=${response.data.BILLING_ASSISTANT}`);
      console.log(`INVENTORY_ASSISTANT_ID=${response.data.INVENTORY_ASSISTANT}`);
      console.log(`GST_ASSISTANT_ID=${response.data.GST_COMPLIANCE}`);
      console.log(`FORECAST_ASSISTANT_ID=${response.data.DEMAND_FORECAST}`);
      console.log(`SUPPORT_ASSISTANT_ID=${response.data.CUSTOMER_SUPPORT}`);
      return response.data;
    } else {
      console.error('❌ Failed to create assistants:', response.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testBillingAssistant() {
  console.log('\n\n🧪 Testing Billing Assistant...\n');
  
  try {
    const response = await makeRequest('/ai/billing-assistant', 'POST', {
      query: 'What is the margin if I sell a product at ₹100 that I bought for ₹60?',
      context: {
        cart: [
          { name: 'Sulphur 200C', quantity: 2, mrp: 100, unit_price: 100 }
        ],
        total: 200,
      }
    });

    console.log('Response:', response);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testAIChat() {
  console.log('\n\n🧪 Testing AI Chat (GPT-4o-mini)...\n');
  
  try {
    const response = await makeRequest('/ai/chat', 'POST', {
      message: 'What GST rate should I apply to Arnica Shampoo?',
      context: 'I am billing a homeopathy product'
    });

    console.log('Response:', response);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function main() {
  console.log('════════════════════════════════════════');
  console.log('  Yeelo Homeopathy AI Assistant Test');
  console.log('════════════════════════════════════════\n');

  // Test 1: Setup assistants
  const assistantIds = await testSetupAssistants();
  
  if (!assistantIds) {
    console.log('\n⚠️  Assistant setup failed. Trying other tests...\n');
  }

  // Test 2: Billing assistant
  await testBillingAssistant();

  // Test 3: AI chat
  await testAIChat();

  console.log('\n════════════════════════════════════════');
  console.log('  ✅ Tests Complete');
  console.log('════════════════════════════════════════\n');
}

main().catch(console.error);
