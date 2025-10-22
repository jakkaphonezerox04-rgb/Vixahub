import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { firebaseCreditsService } from '@/lib/firebase-credits';

// TMWEasy API Configuration
const TMWEASY_CONFIG = {
  api_key: "4c2012ece2c849a82bad840fd568b914"
};

interface WebhookData {
  id_pay: string;
  ref1: string;
  amount_check: string; // ยอดเป็นสตางค์
  amount: string; // ยอดเป็นบาท
  date_pay: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🎯 TMWEasy Webhook received");

    // Get raw body for signature verification
    const formData = await request.formData();
    const data = formData.get('data') as string;
    const signature = formData.get('signature') as string;

    console.log("📥 Webhook payload:", { data, signature });

    if (!data || !signature) {
      console.log("❌ Missing data or signature");
      return NextResponse.json(
        { 
          status: 0, 
          error: "Missing data or signature" 
        },
        { status: 400 }
      );
    }

    // Verify signature according to TMWEasy documentation
    // signature = MD5(data:api_key)
    const expectedData = `${data}:${TMWEASY_CONFIG.api_key}`;
    const expectedSignature = createHash('md5').update(expectedData).digest('hex');
    
    console.log("🔐 Signature verification:");
    console.log("Expected:", expectedSignature);
    console.log("Received:", signature);

    if (expectedSignature.toLowerCase() !== signature.toLowerCase()) {
      console.log("❌ Invalid signature");
      return NextResponse.json(
        { 
          status: 0, 
          error: "Invalid signature" 
        },
        { status: 401 }
      );
    }

    // Parse webhook data
    let webhookData: WebhookData;
    try {
      webhookData = JSON.parse(data);
      console.log("📊 Parsed webhook data:", webhookData);
    } catch (parseError) {
      console.error("❌ Failed to parse webhook data:", parseError);
      return NextResponse.json(
        { 
          status: 0, 
          error: "Invalid JSON data" 
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!webhookData.id_pay || !webhookData.ref1 || !webhookData.amount) {
      console.log("❌ Missing required webhook fields");
      return NextResponse.json(
        { 
          status: 0, 
          error: "Missing required fields" 
        },
        { status: 400 }
      );
    }

    // Process payment confirmation
    console.log("🎉 Payment confirmed via webhook:");
    console.log(`💰 Amount: ${webhookData.amount} บาท`);
    console.log(`🏷️ Reference: ${webhookData.ref1}`);
    console.log(`📄 Payment ID: ${webhookData.id_pay}`);
    console.log(`📅 Date: ${webhookData.date_pay}`);

    // Update user credits in Firebase
    try {
      const result = await firebaseCreditsService.addCredits(
        webhookData.ref1,
        parseFloat(webhookData.amount),
        webhookData.id_pay,
        `TMWEasy payment confirmation - ${webhookData.date_pay}`
      );
      
      if (result.success) {
        console.log("✅ User credits updated successfully:");
        console.log(`💰 Credits added: ${result.creditsAdded}`);
        console.log(`🏦 New balance: ${result.newBalance}`);
      } else {
        throw new Error(result.error || 'Failed to update credits');
      }
    } catch (creditError) {
      console.error("❌ Failed to update credits:", creditError);
      // Don't return error here - payment is still valid
      // We can retry credit update later or handle it manually
    }

    // Send success response as required by TMWEasy
    console.log("✅ Webhook processed successfully");
    return NextResponse.json({ status: 1 });

  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json(
      { 
        status: 0, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}

 