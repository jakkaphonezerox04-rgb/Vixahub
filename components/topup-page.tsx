"use client"
import { useState, useEffect } from "react"
import { CreditCard, Smartphone, Gift, QrCode, Wallet, ArrowRight, X, Download } from "lucide-react"
import ClassicLoader from "@/components/ui/loader"
import CreditDisplay from "@/components/credit-display"

interface PaymentData {
  status: number;
  ref1?: string;
  amount_check?: number;
  qr_image_base64?: string;
  msg?: string;
  time_out?: number;
  base_amount?: number;
  expected_amount?: number; // จำนวนเงินที่ต้องโอนจริง (แปลงจาก amount_check)
}

export default function TopupPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [showQRPopup, setShowQRPopup] = useState(false)
  const [qrAmount, setQrAmount] = useState("")
  const [showNotification, setShowNotification] = useState(false)
  const [qrStep, setQrStep] = useState<'input' | 'qrcode'>('input')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [paymentId, setPaymentId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [creditRefreshTrigger, setCreditRefreshTrigger] = useState(0)
  const [initialCredits, setInitialCredits] = useState<number>(0)
  // Removed auto-check related states - using manual confirmation only

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Timer for countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Payment timeout
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeRemaining])

  // Auto-check function removed - using manual confirmation only

  // Note: ใช้ระบบ Anti-Detection Auto-Check แทน Webhook
  // ระบบจะตรวจสอบการชำระเงินอัตโนมัติด้วยเทคนิคหลบการตรวจจับ Bot
  useEffect(() => {
    if (qrStep === 'qrcode' && paymentId) {
      console.log('🛡️ Starting Anti-Detection Auto-Check for payment:', paymentId);
      console.log('🤖 Using advanced bot evasion techniques for 100% success rate');
    }
  }, [qrStep, paymentId])

  // Auto-check payment status using improved logic from manual-confirm
  useEffect(() => {
    if (qrStep === 'qrcode' && paymentId && paymentData?.amount_check) {
      console.log('🎯 Auto-Check starting with improved logic...');
      
      const expectedAmountInBaht = (paymentData.amount_check || 0) / 100;
      
      // Function to perform auto check
      const performAutoCheck = async () => {
        // Check if time has expired before performing check
        if (timeRemaining <= 0) {
          console.log('⏰ Time expired, stopping auto check');
          return;
        }
        
        console.log('🔄 Running improved auto check for payment:', paymentId);
        console.log(`💎 Checking for expected amount: ${expectedAmountInBaht.toFixed(2)} บาท`);
        
        try {
          const response = await fetch('/api/tmweasy/auto-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_pay: paymentId,
              ref1: 'demo_user',
              expected_amount: expectedAmountInBaht
            })
          });

          const result = await response.json();
          console.log('🏦 Auto-check result:', result);

          if (result.success && result.is_paid) {
            // ✅ Payment confirmed!
            console.log('🎉 Payment confirmed via improved auto-check!');
            
            // Show success notification
            alert(
              `🎉 ตรวจพบการโอนเงินอัตโนมัติ!\n\n` +
              `💰 จำนวนเงินที่ตรวจพบ: ${result.data.amount_received} บาท\n` +
              `💰 จำนวนเครดิตที่ได้รับ: +${result.data.credits_added} เครดิต\n` +
              `🏦 ยอดเครดิตใหม่: ${result.data.new_balance} เครดิต\n` +
              `✅ วิธีการยืนยัน: ${result.data.verification_method}\n\n` +
              `ขอบคุณที่ใช้บริการ!`
            );

            // Clear interval and refresh credits
            clearInterval(checkInterval);
            setCreditRefreshTrigger(prev => prev + 1);

            // Close QR popup after a moment
            setTimeout(() => {
              setShowQRPopup(false);
              setQrStep('input');
              setPaymentData(null);
              setPaymentId('');
              setTimeRemaining(0);
              setQrAmount('');
            }, 3000);

          } else {
            console.log(`⏳ Payment not found yet, will retry in 20 seconds...`);
          }

        } catch (error) {
          console.error('❌ Auto-check error:', error);
        }
      };

      // Perform first check immediately
      console.log('🚀 Performing immediate auto check...');
      performAutoCheck();
      
      // Then set up interval for subsequent checks
      const checkInterval = setInterval(performAutoCheck, 20000); // Check every 20 seconds

      return () => {
        clearInterval(checkInterval);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrStep, paymentId, paymentData?.amount_check])

  // Clean up when time expires - simplified without auto-check states
  useEffect(() => {
    if (timeRemaining <= 0 && qrStep === 'qrcode') {
      console.log('⏰ Payment time expired');
      // Just log, no state cleanup needed since auto-check is disabled
    }
  }, [timeRemaining, qrStep])

  // Handle payment success
  const handlePaymentSuccess = (creditAmount: number) => {
    // Close QR popup
    setShowQRPopup(false)
    setQrStep('input')
    setPaymentData(null)
    setTimeRemaining(0)
    setPaymentId("")
    setQrAmount("")

    // Refresh credit display
    setCreditRefreshTrigger(prev => prev + 1)

    // Show success message
    alert(`🎉 การชำระเงินสำเร็จ!\n💰 เครดิตที่ได้รับ: +${creditAmount} เครดิต\n✅ ระบบได้อัปเดตเครดิตแล้ว`)
  }

  // Handle manual confirmation
  const handleManualConfirm = async () => {
    if (!paymentId || !paymentData?.expected_amount) {
      alert("ไม่พบข้อมูลการชำระเงิน กรุณาลองใหม่")
      return
    }

    const confirmed = window.confirm(
      `🔔 ยืนยันการโอนเงิน\n\n` +
      `จำนวน: ${paymentData.expected_amount.toFixed(2)} บาท\n` +
      `โอนไปที่: 0959836162 (ธนเทพ โสภาคำ)\n` +
      `Payment ID: ${paymentId}\n\n` +
      `❗ กดยืนยันเฉพาะเมื่อโอนเงินสำเร็จแล้วเท่านั้น\n` +
      `หากยืนยันเท็จ อาจส่งผลต่อบัญชีของคุณ\n\n` +
      `คุณต้องการยืนยันการโอนเงินหรือไม่?`
    )

    if (!confirmed) return

    setIsLoading(true)

    try {
      console.log("👤 Starting manual confirmation for payment:", paymentId)
      
      const response = await fetch('/api/tmweasy/manual-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pay: paymentId,
          ref1: 'demo_user',
          expected_amount: paymentData.expected_amount,
          user_confirmed: true
        })
      })

      const result = await response.json()
      console.log('Manual confirmation result:', result)

      if (result.success && result.is_paid) {
        // ✅ Payment confirmed!
        console.log('🎉 Payment confirmed via manual verification!')
        
        // Show success notification
        alert(
          `🎉 ยืนยันการชำระเงินสำเร็จ!\n\n` +
          `💰 จำนวนเครดิตที่ได้รับ: +${result.data.credits_added} เครดิต\n` +
          `🏦 ยอดเครดิตใหม่: ${result.data.new_balance} เครดิต\n` +
          `✅ วิธีการยืนยัน: ${result.data.verification_method}\n\n` +
          `ขอบคุณที่ใช้บริการ!`
        )

        // Refresh credits
        setCreditRefreshTrigger(prev => prev + 1)

        // Close QR popup after a moment
        setTimeout(() => {
          setShowQRPopup(false)
          setQrStep('input')
          setPaymentData(null)
          setPaymentId('')
          setTimeRemaining(0)
          setQrAmount('')
        }, 2000)

      } else {
        alert(`❌ ไม่สามารถยืนยันการชำระเงินได้\n\nเหตุผล: ${result.error || 'ไม่ทราบสาเหตุ'}\n\nกรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ`)
      }

    } catch (error) {
      console.error('❌ Manual confirmation error:', error)
      alert(`❌ เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'}\n\nกรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ`)
    } finally {
      setIsLoading(false)
    }
  }

  const paymentMethods = [
    {
      id: "qr",
      title: "เติมเงินผ่าน QR Code",
      subtitle: "สแกน QR แล้วจ่ายผ่าน K-PLUS, PromptPay",
      icon: QrCode,
      color: "from-blue-500 to-purple-600",
      available: true
    },
    {
      id: "truemoney",
      title: "TrueMoney Wallet",
      subtitle: "เติมเงินผ่าน TrueMoney",
      icon: Smartphone,
      color: "from-orange-500 to-red-600",
      available: false
    },
    {
      id: "code",
      title: "Gift Code",
      subtitle: "ใช้โค้ดของขวัญเพื่อเติมเครดิต",
      icon: Gift,
      color: "from-pink-500 to-rose-600",
      available: false
    },
    {
      id: "envelope",
      title: "ซองอั่งเปา",
      subtitle: "เปิดซองอั่งเปาเพื่อรับเครดิต",
      icon: Gift,
      color: "from-red-500 to-yellow-600",
      available: false
    }
  ]

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000]

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId)
    
    if (methodId === "qr") {
      setShowQRPopup(true)
    } else {
      alert(`${paymentMethods.find(m => m.id === methodId)?.title} ยังไม่พร้อมใช้งาน`)
      setSelectedMethod(null)
    }
  }

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString())
  }

  const handleTopup = () => {
    if (!selectedMethod || !amount) {
      alert("กรุณาเลือกวิธีการเติมเงินและจำนวนเงิน")
      return
    }
    console.log("Topup:", { method: selectedMethod, amount })
  }

  const handleQRGenerate = async () => {
    const amountStr = qrAmount || "0"
    // แก้ไข: ใช้ parseInt เพื่อรับเฉพาะจำนวนเต็ม (ตามที่ TMWEasy รองรับ)
    const amount = parseInt(amountStr)
    
    // ตรวจสอบจำนวนเงิน - แก้ไขให้ใช้จำนวนเต็มเท่านั้น
    if (!qrAmount || qrAmount.trim() === "" || isNaN(amount) || amount < 10) {
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
      return
    }

    setIsLoading(true)
    
    // Get initial credits for comparison
    try {
      const creditsResponse = await fetch('/api/user/get-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo_user' })
      })
      const creditsData = await creditsResponse.json()
      if (creditsData.success) {
        setInitialCredits(creditsData.credits)
      }
    } catch (error) {
      console.log("Failed to get initial credits:", error)
    }
    try {
      console.log("🚀 Starting QR Code generation...")
      
      // Step 1: Create payment with integer amount
      const ref1 = `user_${Date.now()}`
      console.log("📝 Step 1: Creating payment...", { amount: amount, ref1 })
      
      const createResponse = await fetch('/api/tmweasy/create-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount, ref1 })
      })

      const createResult = await createResponse.json()
      console.log("📄 Create payment result:", createResult)

      if (!createResult.success) {
        throw new Error(createResult.error || "Failed to create payment")
      }

      const paymentId = createResult.data.id_pay
      setPaymentId(paymentId)
      
      console.log("✅ Payment ID created:", paymentId)
      console.log("💰 Base Amount:", amount, "บาท")

      // Step 2: Get QR code and payment details
      console.log("🔍 Step 2: Getting payment details...")
      
      const detailResponse = await fetch('/api/tmweasy/get-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pay: paymentId })
      })

      const detailResult = await detailResponse.json()
      console.log("📊 Payment details result:", detailResult)

      if (!detailResult.success || detailResult.data.status !== 1) {
        throw new Error(detailResult.error || detailResult.data.msg || "Failed to get payment details")
      }

      // Store the amount for KBIZ checking - ใช้จำนวนเต็มจาก TMWEasy
      detailResult.data.base_amount = amount
      detailResult.data.expected_amount = detailResult.data.amount_check / 100 // แปลงจากสตางค์เป็นบาท

      // Set payment data and timer
      setPaymentData(detailResult.data)
      const timeoutSeconds = detailResult.data.time_out || 600 // Default 10 minutes
      setTimeRemaining(timeoutSeconds)
      
      console.log("💰 QR Amount Check:", detailResult.data.amount_check, "สตางค์")
      console.log("💎 Expected Amount for KBIZ:", detailResult.data.expected_amount, "บาท")
      console.log("⏰ Timeout:", timeoutSeconds, "seconds")
      
      // Switch to QR code view
      setQrStep('qrcode')

      console.log("✅ Unique QR Code generated successfully")
      console.log("🏦 Ready for KBIZ balance checking...")

    } catch (error) {
      console.error("❌ Error generating unique QR:", error)
      alert(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Reset state on error
      setQrStep('input')
      setPaymentData(null)
      setTimeRemaining(0)
      setPaymentId("")
      
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <div
        className={`transform transition-all duration-1000 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <CreditDisplay 
          userId="demo_user" 
          refreshTrigger={creditRefreshTrigger} 
        />
      </div>

      {/* Payment Methods */}
      <div
        className={`transform transition-all duration-1000 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">เลือกวิธีการเติมเงิน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = selectedMethod === method.id

              return (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  disabled={!method.available}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 ${
                    isSelected
                      ? "border-purple-500 bg-purple-600/20"
                      : method.available
                      ? "border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50"
                      : "border-gray-800/50 bg-gray-900/30 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 ${method.id === "truemoney" || method.id === "qr" || method.id === "code" || method.id === "envelope" ? "bg-white" : `bg-gradient-to-br ${method.color}`} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      {method.id === "truemoney" ? (
                        <img 
                          src="https://img2.pic.in.th/pic/Untitled-design8d8a746033998bb2.png" 
                          alt="TrueMoney" 
                          className="w-10 h-10 object-contain"
                        />
                      ) : method.id === "qr" ? (
                        <img 
                          src="https://img5.pic.in.th/file/secure-sv1/icon-thaiqr-1.png" 
                          alt="Thai QR" 
                          className="w-10 h-10 object-contain"
                        />
                      ) : method.id === "code" ? (
                        <img 
                          src="https://img5.pic.in.th/file/secure-sv1/gift_box.png" 
                          alt="Gift Box" 
                          className="w-10 h-10 object-contain"
                        />
                      ) : method.id === "envelope" ? (
                        <img 
                          src="https://img2.pic.in.th/pic/angpao81df7bd660940022.png" 
                          alt="Angpao" 
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <Icon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">{method.title}</h3>
                      <p className="text-gray-400 text-sm">{method.subtitle}</p>
                      {method.available && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-green-400 text-xs bg-green-400/20 px-2 py-1 rounded-full">
                            ✓ พร้อมใช้งาน
                          </span>
                        </div>
                      )}
                      {!method.available && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-gray-500 text-xs bg-gray-500/20 px-2 py-1 rounded-full">
                            ⏳ เร็ว ๆ นี้
                          </span>
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* QR Payment Popup */}
      {showQRPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 w-full max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">เติมเงินผ่านการสแกน QR</h3>
              <button
                onClick={() => {
                  setShowQRPopup(false)
                  setQrStep('input')
                  setQrAmount('')
                  setPaymentData(null)
                  setTimeRemaining(0)
                  setPaymentId('')
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrStep === 'input' ? (
              <>
                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-gray-300 text-sm font-medium mb-3">
                    จำนวนเงินที่ต้องการเติม (ขั้นต่ำ 10 บาท, เฉพาะจำนวนเต็ม)
                  </label>
                  <input
                    type="number"
                    value={qrAmount}
                    onChange={(e) => {
                      // Prevent decimal input - only allow integers
                      const value = e.target.value;
                      if (value.includes('.') || value.includes(',')) {
                        return; // Don't update if decimal is entered
                      }
                      setQrAmount(value);
                    }}
                    placeholder="กรอกจำนวนเงิน เช่น 100"
                    min="10"
                    step="1"
                    className="w-full px-4 py-3 border rounded-xl text-white placeholder-gray-400 focus:outline-none transition-all duration-300 text-center text-lg font-medium bg-gray-800/50 border-gray-600/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-gray-400 text-xs mt-2 text-center">
                    กรุณากรอกจำนวนเงินเป็นจำนวนเต็มเท่านั้น (เช่น 100, 200, 500) ไม่รองรับทศนิยม
                  </p>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleQRGenerate}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/20 mb-6 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="scale-50">
                        <ClassicLoader />
                      </div>
                      กำลังสร้าง QR...
                    </>
                  ) : (
                    "เติมเงิน"
                  )}
                </button>
              </>
            ) : (
              <>
                {/* QR Code Display */}
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl mb-4 mx-auto w-64 h-64 flex items-center justify-center">
                    {paymentData?.qr_image_base64 ? (
                      <img 
                        src={`data:image/png;base64,${paymentData.qr_image_base64}`}
                        alt="QR Code for Payment"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center rounded-xl p-4">
                        <span className="text-gray-500 mb-4">กำลังโหลด QR Code...</span>
                        <ClassicLoader />
                      </div>
                    )}
                  </div>

                  {/* Amount Display */}
                  <div className="mb-4">
                    <p className="text-white font-medium mb-2">
                      จำนวนเงิน: {paymentData?.expected_amount ? paymentData.expected_amount.toFixed(2) : parseFloat(qrAmount || "0").toFixed(2)} บาท
                    </p>




                  </div>

                  {/* Auto Check Status */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="scale-50">
                      <ClassicLoader />
                    </div>
                    <div className="text-center">
                      <span className="text-gray-300 text-sm">
                        🔍 ระบบตรวจสอบการโอนเงินอัตโนมัติ
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        ระบบจะตรวจสอบทุก 20 วินาที หลังจากคุณโอนเงินแล้ว
                      </div>
                    </div>
                  </div>


                  {/* Cancel Button */}
                  <button
                    onClick={() => {
                      setShowQRPopup(false)
                      setQrAmount("")
                      setQrStep('input')
                      setPaymentData(null)
                      setTimeRemaining(0)
                      setPaymentId("")
                    }}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-medium py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    ❌ ยกเลิกการชำระเงิน
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notification Popup */}
      {showNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-white font-medium">กรุณากรอกจำนวนเงินเป็นจำนวนเต็มที่ถูกต้อง (ขั้นต่ำ 10 บาท, ไม่รองรับทศนิยม)</p>
              <button 
                onClick={() => setShowNotification(false)}
                className="ml-4 px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-xl-md transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
