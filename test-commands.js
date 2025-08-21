// test-new-system.js
// ✅ Test script untuk system baru dengan auto-refresh dan webhook

const axios = require('axios');

const LARAVEL_BASE = 'http://127.0.0.1:8000/api/whatsapp';
const NEXTJS_BASE = 'http://localhost:3000/api/whatsapp';

async function testNewSystem() {
  console.log('🧪 Testing New Auto-Refresh System...\n');

  try {
    // Test 1: Laravel API (should work)
    console.log('1️⃣ Testing Laravel API...');
    const laravelResponse = await axios.get(`${LARAVEL_BASE}/commands`, {
      timeout: 5000
    });
    console.log(`✅ Laravel API: ${laravelResponse.data.commands?.length || 0} commands`);

    // Test 2: NextJS API (simplified, should work)
    console.log('\n2️⃣ Testing NextJS API (simplified)...');
    const nextResponse = await axios.get(`${NEXTJS_BASE}/commands`, {
      timeout: 8000
    });
    console.log(`✅ NextJS API: ${nextResponse.data.commands?.length || 0} commands`);

    // Test 3: Bot Status
    console.log('\n3️⃣ Testing Bot Status...');
    const statusResponse = await axios.get(`${NEXTJS_BASE}/sync-commands`, {
      timeout: 5000
    });
    console.log('✅ Bot Status:', {
      connected: statusResponse.data.botConnected,
      commandCount: statusResponse.data.commandCount,
      autoRefresh: statusResponse.data.autoRefreshEnabled
    });

    // Test 4: Webhook endpoint
    console.log('\n4️⃣ Testing Webhook Endpoint...');
    const webhookResponse = await axios.get(`${NEXTJS_BASE}/webhook`);
    console.log('✅ Webhook Endpoint:', webhookResponse.data.status);

    // Test 5: Laravel webhook test
    console.log('\n5️⃣ Testing Laravel Webhook Trigger...');
    const webhookTestResponse = await axios.post(`${LARAVEL_BASE}/test-webhook`, {}, {
      timeout: 10000
    });
    console.log('✅ Webhook Test:', webhookTestResponse.data.message);

    console.log('\n🎉 All basic tests completed successfully!');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    });

    // Specific error analysis
    if (error.code === 'ECONNREFUSED') {
      if (error.config?.url?.includes(':8000')) {
        console.log('💡 Laravel server might not be running. Try: php artisan serve');
      } else if (error.config?.url?.includes(':3000')) {
        console.log('💡 Next.js server might not be running. Try: npm run dev');
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.log('💡 Request timeout. This might be normal for the new system.');
    }
    return false;
  }
}

async function testAddCommandWithWebhook() {
  console.log('\n🧪 Testing Add Command with Webhook Notification...\n');

  try {
    const testCommand = {
      trigger: 'autotest' + Date.now(),
      response: 'Auto-test command created at ' + new Date().toLocaleString(),
      is_active: true
    };

    console.log('➕ Adding test command via Laravel:', testCommand.trigger);
    
    // ✅ Add command directly to Laravel (which will webhook NextJS)
    const addResponse = await axios.post(`${LARAVEL_BASE}/commands`, testCommand, {
      timeout: 10000
    });
    
    console.log('✅ Laravel Response:', addResponse.data.message);

    // Wait for webhook processing
    console.log('\n⏳ Waiting 3 seconds for webhook processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check bot status to see if command was loaded
    const statusResponse = await axios.get(`${NEXTJS_BASE}/sync-commands`);
    const botCommands = statusResponse.data.commands || [];
    const commandExists = botCommands.some(cmd => cmd.trigger === testCommand.trigger);

    console.log('📊 Bot Status Check:');
    console.log(`   - Total commands: ${statusResponse.data.commandCount}`);
    console.log(`   - New command exists: ${commandExists ? '✅' : '❌'}`);
    console.log(`   - Auto-refresh: ${statusResponse.data.autoRefreshEnabled ? '✅' : '❌'}`);

    if (commandExists) {
      console.log('\n🎉 SUCCESS! Webhook system working correctly!');
      console.log(`💡 Try sending "${testCommand.trigger}" to your WhatsApp bot`);
    } else {
      console.log('\n⚠️  Command not found in bot. Checking if auto-refresh will pick it up...');
      console.log('💡 Wait up to 10 seconds and try again, or check WhatsApp bot logs');
    }

    return true;

  } catch (error) {
    console.error('❌ Add command test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return false;
  }
}

async function monitorAutoRefresh() {
  console.log('\n🔍 Monitoring Auto-Refresh System...\n');
  console.log('This will check the bot status every 5 seconds for 30 seconds');
  console.log('Add/edit a command in Laravel during this time to see auto-refresh in action\n');

  let previousHash = '';
  const startTime = Date.now();
  const duration = 30000; // 30 seconds

  while (Date.now() - startTime < duration) {
    try {
      const response = await axios.get(`${NEXTJS_BASE}/sync-commands`, {
        timeout: 5000
      });

      const currentCount = response.data.commandCount;
      const currentHash = JSON.stringify(response.data.commands);
      const changed = currentHash !== previousHash;
      
      if (changed && previousHash !== '') {
        console.log(`🔄 [${new Date().toLocaleTimeString()}] CHANGE DETECTED! Commands: ${currentCount}`);
      } else {
        console.log(`📊 [${new Date().toLocaleTimeString()}] Status: ${currentCount} commands, Bot: ${response.data.botConnected ? '✅' : '❌'}`);
      }

      previousHash = currentHash;
      
      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
      console.log(`❌ [${new Date().toLocaleTimeString()}] Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log('\n✅ Monitoring completed');
}

async function runAllTests() {
  const basicTestsSuccess = await testNewSystem();
  
  if (!basicTestsSuccess) {
    console.log('\n❌ Basic tests failed. Please fix issues before proceeding.');
    return;
  }

  await testAddCommandWithWebhook();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 NEXT STEPS:');
  console.log('1. The system now uses auto-refresh every 10 seconds');
  console.log('2. Laravel sends webhooks to NextJS when commands change');
  console.log('3. No more circular API calls or timeouts');
  console.log('4. Commands should appear in WhatsApp within 10 seconds');
  console.log('\nTo test further, run: node test-new-system.js monitor');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args[0] === 'monitor') {
  monitorAutoRefresh();
} else {
  runAllTests();
}