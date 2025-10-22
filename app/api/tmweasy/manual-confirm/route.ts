import { NextRequest, NextResponse } from 'next/server';
import { firebaseCreditsService } from '@/lib/firebase-credits';

// TMWEasy API Configuration
const TMWEASY_CONFIG = {
  api_url: "https://www.tmweasy.com/apipp.php",
  username: "jakkaphonezerox04",
  password: "oam0967788993",
  con_id: "108443",
  accode: "tmpwoktXABBQMDi[pl]FTaDTwuvkLUGcoi9LnvcQ4DJ5KYMWkgjDXKK4PwN1GfKsBFbtQBklJKMmj0Ouiq5pT2SR[sa]ersmxg[tr][tr]",
  account_no: "0488510843",
  promptpay_no: "0959836162",
  promptpay_name: "ธนเทพ โสภาคำ"
};

interface ManualConfirmRequest {
  id_pay: string;
  ref1: string;
  expected_amount: number;
  user_confirmed: boolean; // ผู้ใช้ยืนยันว่าโอนแล้ว
}

export async function POST(request: NextRequest) {
  try {
    console.log("👤 Manual Payment Confirmation API called");

    const body: ManualConfirmRequest = await request.json();
    const { id_pay, ref1, expected_amount, user_confirmed } = body;

    console.log("📥 Manual confirm request:", { id_pay, ref1, expected_amount, user_confirmed });

    // Validate required fields
    if (!id_pay || !ref1 || !expected_amount || !user_confirmed) {
      return NextResponse.json(
        { 
          success: false, 
          error: "กรุณาส่งข้อมูลให้ครบถ้วนและยืนยันการโอนเงิน" 
        },
        { status: 400 }
      );
    }

    // ลองตรวจสอบจาก TMWEasy ก่อน
    try {
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
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
      
      console.log("🔍 Trying TMWEasy confirm first...");
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (response.ok) {
        const responseText = await response.text();
        console.log("📥 TMWEasy confirm response:", responseText);
        
        try {
          const result = JSON.parse(responseText);
          if (result.status === 1 || result.status === "1") {
            console.log("✅ TMWEasy confirmed payment!");
            
            // อัพเดทเครดิต
            const creditsToAdd = Math.floor(result.amount || expected_amount);
            const updateResult = await firebaseCreditsService.addCredits(
              result.ref1 || ref1,
              creditsToAdd,
              id_pay,
              `Manual confirmation with TMWEasy verify - ${new Date().toISOString()}`
            );
            
            return NextResponse.json({
              success: true,
              is_paid: true,
              method: "tmweasy_verified",
              message: "🎉 ยืนยันการชำระเงินจาก TMWEasy สำเร็จ!",
              data: {
                payment_id: id_pay,
                amount_received: creditsToAdd,
                credits_added: updateResult.creditsAdded,
                new_balance: updateResult.newBalance,
                verification_method: "TMWEasy API"
              }
            });
          }
        } catch (e) {
          console.log("📄 TMWEasy response not JSON, continuing to manual verification");
        }
      }
    } catch (error) {
      console.log("⚠️ TMWEasy check failed, proceeding with manual verification:", error);
    }

    // ถ้า TMWEasy ไม่สามารถยืนยันได้ และผู้ใช้ยืนยันการโอนแล้ว
    // ให้ทำการอัพเดทเครดิตแบบ manual verification
    console.log("👤 Proceeding with manual verification as user confirmed payment");
    
    // ตรวจสอบว่า payment ID นี้ยังไม่ถูกใช้งาน
    try {
      const creditsToAdd = Math.floor(expected_amount);
      const updateResult = await firebaseCreditsService.addCredits(
        ref1,
        creditsToAdd,
        id_pay,
        `Manual verification - User confirmed payment to ${TMWEASY_CONFIG.promptpay_no} (${TMWEASY_CONFIG.promptpay_name}) - ${new Date().toISOString()}`
      );
      
      if (updateResult.success) {
        console.log("✅ Credits updated via manual verification:");
        console.log(`💰 Credits added: ${updateResult.creditsAdded}`);
        console.log(`🏦 New balance: ${updateResult.newBalance}`);
        
        return NextResponse.json({
          success: true,
          is_paid: true,
          method: "manual_verification",
          message: "🎉 ยืนยันการชำระเงินด้วยตนเองสำเร็จ! เครดิตได้ถูกเพิ่มแล้ว",
          data: {
            payment_id: id_pay,
            amount_received: expected_amount,
            credits_added: updateResult.creditsAdded,
            new_balance: updateResult.newBalance,
            verification_method: "Manual User Confirmation",
            note: `Payment confirmed to ${TMWEASY_CONFIG.promptpay_no} (${TMWEASY_CONFIG.promptpay_name})`
          }
        });
      } else {
        throw new Error(updateResult.error || 'Failed to update credits');
      }
    } catch (creditError) {
      console.error("❌ Failed to update credits:", creditError);
      return NextResponse.json({
        success: false,
        error: "ไม่สามารถอัพเดทเครดิตได้ อาจเป็นเพราะ Payment ID นี้ถูกใช้ไปแล้ว"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ Manual confirmation error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดของระบบ" 
      },
      { status: 500 }
    );
  }
} 