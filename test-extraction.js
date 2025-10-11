const { extractContextFromConversation } = require('./src/lib/utils/contextExtraction.ts');

// Test conversation with vocal preferences
const testMessages = [
  { role: 'user', content: 'I want to create a love song for my girlfriend' },
  { role: 'assistant', content: 'That sounds wonderful! Tell me about her.' },
  { role: 'user', content: 'She has been with me for 5 years. I want English lyrics with a female voice, mature tone around 30-40 years old, with a warm and soulful sound.' },
  { role: 'assistant', content: 'Beautiful! What memories do you cherish?' },
  { role: 'user', content: 'We met on a train and she stayed with me during my hospital stay.' }
];

async function test() {
  try {
    const result = await extractContextFromConversation(
      testMessages,
      process.env.OPENROUTER_API_KEY || ''
    );
    console.log('Extraction Result:', JSON.stringify(result, null, 2));
    
    // Check if vocal preferences were extracted
    console.log('\nVocal Preferences Detected:');
    console.log('- Language:', result.language || 'Not detected');
    console.log('- Gender:', result.vocalGender || 'Not detected');
    console.log('- Age:', result.vocalAge || 'Not detected');
    console.log('- Description:', result.vocalDescription || 'Not detected');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

test();
