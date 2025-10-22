import { NextRequest, NextResponse } from 'next/server';
import { firebaseCreditsService } from '@/lib/firebase-credits';

// TMWEasy API Configuration - ใช้ข้อมูลจากระบบ Anti-Detection
const TMWEASY_CONFIG = {
  api_url: "https://www.tmweasy.com/apipp.php",
  username: "jakkaphonezerox04", 
  password: "oam0967788993",
  con_id: "108443", // ใช้ con_id ที่ถูกต้อง
  accode: "tmpwoktXABBQMDi[pl]FTaDTwuvkLUGcoi9LnvcQ4DJ5KYMWkgjDXKK4PwN1GfKsBFbtQBklJKMmj0Ouiq5pT2SR[sa]ersmxg[tr][tr]",
  account_no: "0488510843", // ใช้เลขบัญชีจาก config.php
  promptpay_no: "0959836162", // เพิ่มเลขพร้อมเพย์
  promptpay_name: "ธนเทพ โสภาคำ" // เพิ่มชื่อบัญชี
};

// Anti-Detection User Agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

// Browser Fingerprinting
function generateFingerprint() {
  const components = {
    screen: `${Math.floor(Math.random() * 640) + 1920}x${Math.floor(Math.random() * 360) + 1080}`,
    timezone: Math.floor(Math.random() * 25) - 12,
    lang: 'th-TH,th;q=0.9,en;q=0.8',
    platform: ['Win32', 'MacIntel', 'Linux x86_64'][Math.floor(Math.random() * 3)],
    cookieEnabled: true,
    doNotTrack: Math.random() > 0.5 ? 'unspecified' : '1'
  };
  return Buffer.from(JSON.stringify(components)).toString('base64');
}

// Human-like delay
function humanDelay() {
  const baseDelay = 30000; // 30 วินาที
  const randomFactor = Math.random() * 45000; // สุ่ม 0-45 วินาที
  return baseDelay + randomFactor;
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  return '127.0.0.1';
}

// การเรียก API แบบ Anti-Detection
async function secureApiCall(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
      const fingerprint = generateFingerprint();
      
      // สุ่ม delay ก่อน request
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
          'DNT': Math.random() > 0.5 ? '1' : '',
          'Pragma': 'no-cache',
          'X-Fingerprint': fingerprint
        }
      });
      
      if (response.ok) {
        return response;
      }
      
      if (i < retries - 1) {
        console.log(`🔄 Retry ${i + 1}/${retries} after ${response.status} error`);
        continue;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      if (i < retries - 1) {
        console.log(`🔄 Retry ${i + 1}/${retries} after error:`, error);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Maximum retries exceeded');
}

interface AutoCheckRequest {
  id_pay: string;
  ref1: string;
  expected_amount: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🤖 TMWEasy Anti-Detection Auto-Check API called");

    const body: AutoCheckRequest = await request.json();
    const { id_pay, ref1, expected_amount } = body;

    console.log("📥 Auto-check request:", { id_pay, ref1, expected_amount });

    // Validate required fields
    if (!id_pay || !ref1 || !expected_amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: "กรุณาส่งข้อมูลให้ครบถ้วน: id_pay, ref1, expected_amount" 
        },
        { status: 400 }
      );
    }

    // Build API parameters สำหรับยืนยันการชำระเงิน (เหมือน manual-confirm)
    const clientIP = getClientIP(request);
    const params = new URLSearchParams({
      username: TMWEASY_CONFIG.username,
      password: TMWEASY_CONFIG.password,
      con_id: TMWEASY_CONFIG.con_id,
      method: "confirm",
      id_pay: id_pay,
      accode: TMWEASY_CONFIG.accode,
      account_no: TMWEASY_CONFIG.account_no,
      ip: clientIP
    });

    const apiUrl = `${TMWEASY_CONFIG.api_url}?${params.toString()}`;
    
    console.log("🛡️ Anti-Detection API call:", {
      url: TMWEASY_CONFIG.api_url,
      id_pay,
      method: "confirm"
    });

    // เรียก API ด้วยระบบ Anti-Detection
    const response = await secureApiCall(apiUrl);
    const responseText = await response.text();
    
    console.log("📥 TMWEasy Anti-Detection Response:", responseText);

    try {
      const result = JSON.parse(responseText);
      console.log("📊 Payment confirmation result:", result);

      // Debug: แสดงค่าที่สำคัญสำหรับการตรวจสอบ
      console.log("🔍 Debug payment check values:", {
        status: result.status,
        is_pay: result.is_pay,
        pay_status: result.pay_status,
        amount_check: result.amount_check,
        amount_received: result.amount_received,
        time_out: result.time_out
      });

      // ใช้ logic เดียวกับ manual-confirm ที่ทำงานได้
      const isPaymentConfirmed = (result.status === 1 || result.status === "1");

      console.log("🔍 Payment confirmation check:", {
        status: result.status,
        finalResult: isPaymentConfirmed
      });

      if (isPaymentConfirmed) {
        console.log("🎉 Payment confirmed via Anti-Detection system!");
        console.log(`💰 Amount: ${result.amount_check || result.amount || expected_amount} บาท`);
        console.log(`🏷️ Reference: ${result.ref1 || ref1}`);
        console.log(`📄 Payment ID: ${id_pay}`);
        console.log(`📅 Date: ${result.date_pay || result.pay_date || new Date().toISOString()}`);
        console.log(`📊 Raw result:`, result);

        // อัพเดทเครดิตใน Firebase (เหมือน manual-confirm)
        try {
          const creditsToAdd = Math.floor(result.amount || expected_amount);
          const updateResult = await firebaseCreditsService.addCredits(
            result.ref1 || ref1,
            creditsToAdd,
            id_pay,
            `Auto-check confirmation with TMWEasy verify - ${new Date().toISOString()}`
          );
          
          if (updateResult.success) {
            console.log("✅ User credits updated successfully via Anti-Detection:");
            console.log(`💰 Credits added: ${updateResult.creditsAdded}`);
            console.log(`🏦 New balance: ${updateResult.newBalance}`);
            
            return NextResponse.json({
              success: true,
              is_paid: true,
              message: "🎉 ตรวจพบการชำระเงินแล้ว เครดิตได้ถูกเพิ่มเข้าบัญชีของคุณ",
              data: {
                payment_id: id_pay,
                amount_received: creditsToAdd,
                credits_added: updateResult.creditsAdded,
                new_balance: updateResult.newBalance,
                verification_method: "TMWEasy API Auto-Check",
                ref1: result.ref1 || ref1
              }
            });
          } else {
            throw new Error(updateResult.error || 'Failed to update credits');
          }
        } catch (creditError) {
          console.error("❌ Failed to update credits via Anti-Detection:", creditError);
          return NextResponse.json({
            success: true,
            is_paid: true,
            message: "ตรวจพบการชำระเงินแล้ว แต่ไม่สามารถอัพเดทเครดิตได้ กรุณาติดต่อผู้ดูแลระบบ",
            data: {
              payment_id: id_pay,
              amount_received: result.amount || expected_amount,
              verification_method: "TMWEasy API Auto-Check"
            }
          });
        }
      } else {
        // ยังไม่ได้ชำระเงิน
        console.log("⏳ Payment not completed yet - Anti-Detection check");
        console.log("📋 Reason for not confirmed:", {
          status: result.status,
          is_pay: result.is_pay,
          amount_received: result.amount_received,
          msg: result.msg
        });
        
        return NextResponse.json({
          success: true,
          is_paid: false,
          message: "ยังไม่พบการชำระเงิน ระบบกำลังตรวจสอบอัตโนมัติ...",
          data: {
            payment_id: id_pay,
            status: result.status,
            msg: result.msg,
            anti_detection: true,
            debug_info: {
              status: result.status,
              is_pay: result.is_pay,
              amount_received: result.amount_received
            }
          }
        });
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
    console.error("❌ TMWEasy Anti-Detection auto-check error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่ภายหลัง" 
      },
      { status: 500 }
    );
  }
} 