import { NextRequest, NextResponse } from 'next/server';

// TMWEasy API Configuration
const TMWEASY_CONFIG = {
  api_url: "https://www.tmweasy.com/apipp.php",
  username: "jakkaphonezerox04",
  password: "oam0967788993",
  con_id: "108443",
  promptpay_id: "0959836162", // ใช้เลขจาก config.php
  promptpay_name: "ธนเทพ โสภาคำ", // เพิ่มชื่อบัญชี
  type: "01" // 01=เบอร์โทร, 02=เลขบัตร ปชช
};

interface GetDetailsRequest {
  id_pay: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 TMWEasy Get Details API called");

    const body: GetDetailsRequest = await request.json();
    const { id_pay } = body;

    console.log("📥 Get details request:", body);

    // Validate required fields
    if (!id_pay) {
      return NextResponse.json(
        { 
          success: false, 
          error: "กรุณาส่ง id_pay" 
        },
        { status: 400 }
      );
    }

    // Build API parameters according to TMWEasy documentation
    const params = new URLSearchParams({
      username: TMWEASY_CONFIG.username,
      password: TMWEASY_CONFIG.password,
      con_id: TMWEASY_CONFIG.con_id,
      id_pay: id_pay,
      promptpay_id: TMWEASY_CONFIG.promptpay_id,
      type: TMWEASY_CONFIG.type,
      method: "detail_pay"
    });

    const apiUrl = `${TMWEASY_CONFIG.api_url}?${params.toString()}`;

    console.log("🔗 TMWEasy API call:", {
      url: TMWEASY_CONFIG.api_url,
      id_pay,
      promptpay_id: TMWEASY_CONFIG.promptpay_id,
      type: TMWEASY_CONFIG.type
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
    console.log("📥 TMWEasy Get Details Response:", responseText);

    try {
      const result = JSON.parse(responseText);
      
      console.log("📊 Get details result:", result);

      if (result.status === 1) {
        console.log("✅ Payment details retrieved successfully");
        
        return NextResponse.json({
          success: true,
          data: {
            status: result.status,
            ref1: result.ref1,
            amount_check: result.amount_check, // ยอดที่ให้โอน หน่วยเป็น สตางค์
            qr_image_base64: result.qr_image_base64,
            msg: result.msg,
            time_out: result.time_out // เวลาคงเหลือที่ต้องชำระ หน่วยเป็นวินาที
          }
        });
      } else {
        console.log("❌ Failed to get payment details:", result.msg);
        
        return NextResponse.json({
          success: false,
          error: result.msg || "ไม่สามารถดึงข้อมูลการชำระเงินได้",
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
    console.error("❌ TMWEasy get details error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่ภายหลัง" 
      },
      { status: 500 }
    );
  }
} 