import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for completed payments (in production, use database)
const completedPayments = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    console.log("💳 Credit update API called");

    const body = await request.json();
    console.log("📥 Credit update request:", body);

    const { 
      userId, 
      amount, 
      paymentId, 
      type, 
      source, 
      date_pay, 
      webhook_confirmed,
      bank_verified 
    } = body;

    // Handle status check requests
    if (type === 'status_check') {
      console.log("🔍 Checking payment status for:", paymentId);
      
      const isPaymentCompleted = completedPayments.has(paymentId);
      
      return NextResponse.json({
        success: true,
        payment_found: isPaymentCompleted,
        message: isPaymentCompleted ? "Payment already processed" : "Payment not found yet",
        paymentId: paymentId,
        checked_at: new Date().toISOString()
      });
    }

    // Validate required fields for actual credit updates
    if (!userId || !amount || !paymentId) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: userId, amount, paymentId" 
        },
        { status: 400 }
      );
    }

    // Skip processing if amount is 0 (status check only)
    if (amount === 0) {
      return NextResponse.json({
        success: true,
        payment_found: completedPayments.has(paymentId),
        message: "Status check completed",
        paymentId: paymentId
      });
    }

    // Check if payment already processed
    if (completedPayments.has(paymentId)) {
      console.log("⚠️ Payment already processed:", paymentId);
      return NextResponse.json({
        success: true,
        payment_found: true,
        message: "Payment already processed",
        paymentId: paymentId,
        amount_added: amount,
        duplicate: true
      });
    }

    // Process credit update
    console.log("💰 Processing credit update:");
    console.log(`- User ID: ${userId}`);
    console.log(`- Amount: ${amount} บาท`);
    console.log(`- Payment ID: ${paymentId}`);
    console.log(`- Type: ${type}`);
    console.log(`- Source: ${source}`);
    console.log(`- Date: ${date_pay}`);
    console.log(`- Webhook Confirmed: ${webhook_confirmed}`);
    console.log(`- Bank Verified: ${bank_verified}`);

    // Mark payment as completed
    completedPayments.add(paymentId);

    // TODO: Add real database logic here
    // Example:
    // await updateUserCredits(userId, amount, paymentId, type);

    const updateResult = {
      success: true,
      payment_found: true,
      message: "Credits updated successfully",
      userId: userId,
      amount_added: parseFloat(amount.toString()),
      payment_id: paymentId,
      type: type,
      source: source,
      processed_at: new Date().toISOString(),
      webhook_confirmed: webhook_confirmed || false,
      bank_verified: bank_verified || false
    };

    console.log("✅ Credit update successful:", updateResult);

    return NextResponse.json(updateResult);

  } catch (error) {
    console.error("❌ Credit update error:", error);
    return NextResponse.json(
      { 
        success: false, 
        payment_found: false,
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
} 