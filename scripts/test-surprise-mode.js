const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_CALLBACK_URL = process.env.SUNO_CALLBACK_URL;

if (!SUNO_API_KEY) {
  console.error('SUNO_API_KEY not set in environment.');
  process.exit(1);
}

async function testSurpriseMode() {
  const prompt = 'Test prompt for surprise mode with varied instructions.';

  const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUNO_API_KEY}`,
    },
    body: JSON.stringify({
      custom_mode: true,
      prompt,
      title: 'Test Surprise Mode Song',
      tags: 'love song',
      model: 'V5',
      weirdness_constraint: 0.8,
      callBackUrl: SUNO_CALLBACK_URL,
    }),
  });

  const text = await response.text();
  console.log('Response status:', response.status);
  console.log('Raw response:', text);
}

testSurpriseMode().catch(err => {
  console.error('Error testing surprise mode:', err);
  process.exit(1);
});
