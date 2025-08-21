// ===== test-api.js =====
// Script untuk testing API Laravel secara manual
const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api'; // Ganti sesuai setup Laravel kamu

async function testAPI() {
    console.log('🧪 Testing Laravel API...\n');

    // ✅ Test 1: Cek apakah server Laravel running
    try {
        console.log('1️⃣ Testing basic connectivity...');
        const testResponse = await axios.post(`${API_BASE_URL}/messages/test`, {
            test: 'hello from nodejs'
        });
        console.log('✅ Basic connectivity OK');
        console.log('Response:', testResponse.data);
    } catch (error) {
        console.error('❌ Basic connectivity FAILED');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        return; // Stop jika basic connectivity gagal
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // ✅ Test 2: Test endpoint messages dengan data valid
    try {
        console.log('2️⃣ Testing message creation with valid data...');
        const messageData = {
            id: `test_msg_${Date.now()}`,
            from: '6281234567890@c.us',
            to: '6289876543210@c.us',
            body: 'Test message from API script',
            timestamp: new Date().toISOString(),
            type: 'incoming'
        };

        console.log('Sending data:', JSON.stringify(messageData, null, 2));

        const response = await axios.post(`${API_BASE_URL}/messages`, messageData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('✅ Message creation SUCCESS');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Message creation FAILED');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // ✅ Test 3: Test dengan data invalid untuk cek validasi
    try {
        console.log('3️⃣ Testing with invalid data (should fail)...');
        const invalidData = {
            // Missing required fields
            body: 'Test message with missing required fields'
        };

        const response = await axios.post(`${API_BASE_URL}/messages`, invalidData);
        console.log('⚠️ Unexpected success (should have failed)');
        console.log('Response:', response.data);

    } catch (error) {
        if (error.response && error.response.status === 422) {
            console.log('✅ Validation working correctly (422 error expected)');
            console.log('Validation errors:', error.response.data.errors);
        } else {
            console.error('❌ Unexpected error type');
            console.error('Error:', error.message);
        }
    }
}

// ✅ Fungsi untuk test WhatsApp-like message
async function testWhatsAppMessage() {
    console.log('\n🤖 Testing WhatsApp-like message...\n');

    const whatsappMessage = {
        id: 'false_6281234567890@c.us_3EB0C5E4B2F4A1234567890_1234567890',
        from: '6281234567890@c.us',
        to: '6289876543210@c.us', 
        body: 'Hello, this is a test message from WhatsApp bot!',
        timestamp: new Date().toISOString(),
        type: 'incoming'
    };

    try {
        const response = await axios.post(`${API_BASE_URL}/messages`, whatsappMessage, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('✅ WhatsApp message test SUCCESS');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ WhatsApp message test FAILED');
        console.error('Error details:', error.response?.data || error.message);
    }
}

// Jalankan semua tests
async function runAllTests() {
    console.log('🚀 Starting API Tests...\n');
    
    await testAPI();
    await testWhatsAppMessage();
    
    console.log('\n✨ All tests completed!');
}

// Export functions jika digunakan sebagai module
module.exports = {
    testAPI,
    testWhatsAppMessage,
    runAllTests
};

// Jalankan jika file ini dieksekusi langsung
if (require.main === module) {
    runAllTests().catch(console.error);
}

// ===== CARA PENGGUNAAN =====
/*
1. Pastikan Laravel server sudah running: php artisan serve
2. Jalankan script ini: node test-api.js
3. Lihat hasilnya di console dan di Laravel logs
*/