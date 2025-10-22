import { NextRequest, NextResponse } from 'next/server';
import { firebaseCreditsService } from '@/lib/firebase-credits';

interface GetCreditsRequest {
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GetCreditsRequest = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "กรุณาส่ง userId" 
        },
        { status: 400 }
      );
    }

    const result = await firebaseCreditsService.getUserCredits(userId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        credits: result.credits
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "ไม่สามารถดึงข้อมูลเครดิตได้" 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("❌ Get credits error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดของระบบ" 
      },
      { status: 500 }
    );
  }
} 