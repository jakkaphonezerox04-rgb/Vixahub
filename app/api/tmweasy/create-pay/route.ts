import { NextRequest, NextResponse } from 'next/server';

// TMWEasy API Configuration
const TMWEASY_CONFIG = {
  api_url: "https://www.tmweasy.com/apipp.php",
  username: "jakkaphonezerox04",
  password: "oam0967788993", 
  con_id: "108443",
  promptpay_id: "0959836162", // ใช้เลขจาก config.php
  promptpay_name: "ธนเทพ โสภาคำ", // เพิ่มชื่อบัญชี
  promptpay_type: "01", // 01=เบอร์โทร
  api_key: "4c2012ece2c849a82bad840fd568b914"
};

interface CreatePayRequest {
  amount: number;
  ref1: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 TMWEasy Create Pay API called");

    const body: CreatePayRequest = await request.json();
    const { amount, ref1 } = body;

    console.log("📥 Create pay request:", body);

    // Validate required fields
    if (!amount || !ref1) {
      return NextResponse.json(
        { 
          success: false, 
          error: "กรุณาส่งข้อมูลให้ครบถ้วน: amount, ref1" 
        },
        { status: 400 }
      );
    }

    // Validate amount (must be integer, no decimals)
    if (!Number.isInteger(amount) || amount < 1) {
      return NextResponse.json(
        { 
          success: false, 
          error: "จำนวนเงินต้องเป็นจำนวนเต็มที่มากกว่า 0" 
        },
        { status: 400 }
      );
    }

    // Get client IP
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';

    // Build API parameters according to TMWEasy documentation
    const params = new URLSearchParams({
      username: TMWEASY_CONFIG.username,
      password: TMWEASY_CONFIG.password,
      con_id: TMWEASY_CONFIG.con_id,
      amount: amount.toString(),
      ref1: ref1,
      ip: clientIp,
      promptpay_id: TMWEASY_CONFIG.promptpay_id,
      type: TMWEASY_CONFIG.promptpay_type,
      method: "create_pay"
    });

    const apiUrl = `${TMWEASY_CONFIG.api_url}?${params.toString()}`;
    
    console.log("🔗 TMWEasy API call:", {
      url: TMWEASY_CONFIG.api_url,
      amount,
      ref1,
      clientIp
    });

    // Call TMWEasy API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VIXAHUB-TMWEasy/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`TMWEasy API HTTP ${response.status}: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log("📥 TMWEasy Create Pay Response:", responseText);

    try {
      const result = JSON.parse(responseText);
      
      console.log("📊 Create pay result:", result);

      if (result.status === 1 && result.id_pay) {
        console.log("✅ Payment created successfully:", result.id_pay);
        
        return NextResponse.json({
          success: true,
          data: {
            status: result.status,
            id_pay: result.id_pay,
            base_amount: amount,
            amount_for_tmweasy: amount,
            ref1: result.ref1 || ref1,
            promptpay_id: TMWEASY_CONFIG.promptpay_id,
            promptpay_name: TMWEASY_CONFIG.promptpay_name,
            msg: result.msg || "Payment created successfully",
            generation_time: new Date().toISOString()
          }
        });
      } else {
        console.log("❌ Payment creation failed:", result.msg);
        
        return NextResponse.json({
          success: false,
          error: result.msg || "ไม่สามารถสร้างการชำระเงินได้",
          data: result
        }, { status: 400 });
      }

    } catch (parseError) {
      console.error("❌ Failed to parse JSON response:", parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: "รูปแบบการตอบกลับจาก TMWEasy API ไม่ถูกต้อง",
          raw_response: responseText
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("❌ TMWEasy create pay error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่ภายหลัง" 
      },
      { status: 500 }
    );
  }
} 