// Cloudflare Worker สำหรับ TMWEasy Webhook
// Deploy ไฟล์นี้ไปยัง Cloudflare Workers

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // เพิ่ม CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle OPTIONS request (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }

  // เฉพาะ POST requests สำหรับ webhook
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    })
  }

  try {
    console.log('🎯 TMWEasy Webhook received via Cloudflare Worker')

    // อ่าน form data จาก TMWEasy
    const formData = await request.formData()
    const data = formData.get('data')
    const signature = formData.get('signature')

    console.log('📥 Webhook data:', { data, signature })

    if (!data || !signature) {
      console.log('❌ Missing data or signature')
      return new Response(JSON.stringify({ 
        status: 0, 
        error: 'Missing data or signature' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

    // ตรวจสอบ signature
    const apiKey = '4c2012ece2c849a82bad840fd568b914'
    const expectedData = `${data}:${apiKey}`
    
    // สร้าง MD5 hash
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('MD5', encoder.encode(expectedData))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    console.log('🔐 Signature verification:')
    console.log('Expected:', expectedSignature)
    console.log('Received:', signature)

    if (expectedSignature.toLowerCase() !== signature.toLowerCase()) {
      console.log('❌ Invalid signature')
      return new Response(JSON.stringify({ 
        status: 0, 
        error: 'Invalid signature' 
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

    // Parse webhook data
    let webhookData
    try {
      webhookData = JSON.parse(data)
      console.log('📊 Parsed webhook data:', webhookData)
    } catch (parseError) {
      console.error('❌ Failed to parse webhook data:', parseError)
      return new Response(JSON.stringify({ 
        status: 0, 
        error: 'Invalid JSON data' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

    // ส่งต่อไปยัง Next.js server (ปรับ URL ตามจริง)
    const nextjsUrl = 'https://your-domain.com/api/tmweasy/webhook' // เปลี่ยนเป็น URL จริง
    
    try {
      const forwardResponse = await fetch(nextjsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          data: data,
          signature: signature
        })
      })

      const result = await forwardResponse.json()
      console.log('✅ Forwarded to Next.js:', result)

      return new Response(JSON.stringify({ status: 1 }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })

    } catch (forwardError) {
      console.error('❌ Failed to forward to Next.js:', forwardError)
      
      // แม้ forward ไม่สำเร็จ ก็ยังต้องตอบกลับ TMWEasy ว่าได้รับแล้ว
      // และทำการประมวลผลเองใน Worker
      
      console.log('🎉 Processing payment in Worker:')
      console.log(`💰 Amount: ${webhookData.amount} บาท`)
      console.log(`🏷️ Reference: ${webhookData.ref1}`)
      console.log(`📄 Payment ID: ${webhookData.id_pay}`)
      console.log(`📅 Date: ${webhookData.date_pay}`)

      // TODO: เพิ่มการอัพเดทข้อมูลใน database ที่นี่
      // เช่น เรียก API ไปยัง Firebase หรือ database อื่นๆ

      return new Response(JSON.stringify({ status: 1 }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

  } catch (error) {
    console.error('❌ Worker error:', error)
    return new Response(JSON.stringify({ 
      status: 0, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
}

// Helper function สำหรับ MD5 (สำหรับ environments ที่ไม่มี crypto.subtle.digest MD5)
async function md5(text) {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('MD5', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    // Fallback: ใช้ SHA-256 แทน MD5 ถ้าไม่รองรับ
    console.warn('MD5 not supported, using SHA-256 instead')
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
  }
} 