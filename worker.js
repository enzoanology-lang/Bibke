export default {
  async fetch(request) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method === 'POST') {
      const { token } = await request.json();
      
      // Verify with Cloudflare
      const formData = new FormData();
      formData.append('secret', '0x4AAAAAACzWlwGguatYGKhMxO0uDLTrEds');
      formData.append('response', token);
      
      const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
      });
      
      const outcome = await result.json();
      
      return new Response(JSON.stringify({ success: outcome.success }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    return new Response('Method not allowed', { status: 405 });
  }
};
