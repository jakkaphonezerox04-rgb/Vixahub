"use client"
import { useState, useEffect } from "react"
import { Building2, Copy, Check, AlertCircle, CreditCard, Clock, User, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import CreditDisplay from "@/components/credit-display"

interface BankInfo {
  bank_name: string;
  account_number: string;
  promptpay_id: string;
  account_name: string;
}

export default function BankTransferPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [creditRefreshTrigger, setCreditRefreshTrigger] = useState(0)
  
  // Form data
  const [formData, setFormData] = useState({
    transactionId: '',
    amount: '',
    ref1: 'demo_user',
    dateTime: new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm format
  })
  
  // Result states
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Bank information
  const bankInfo: BankInfo = {
    bank_name: "ธนาคารกสิกรไทย",
    account_number: "0488510843",
    promptpay_id: "0959836162",
    account_name: "ธนเทพ โสภาคำ"
  }

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    setResult(null)
  }

  const handleVerifyTransfer = async () => {
    if (!formData.transactionId || !formData.amount || !formData.ref1) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }

    if (formData.transactionId.length < 14) {
      setError("กรุณากรอก Transaction ID ให้ครบ 14 หลัก")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/tmweasy/bank-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: formData.transactionId,
          amount: parseFloat(formData.amount),
          ref1: formData.ref1,
          dateTime: formData.dateTime
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        setCreditRefreshTrigger(prev => prev + 1)
        
        // Clear form after success
        setFormData(prev => ({
          ...prev,
          transactionId: '',
          amount: ''
        }))
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการตรวจสอบ")
      }

    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่ภายหลัง")
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

      {/* Bank Transfer System */}
      <div
        className={`transform transition-all duration-1000 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Step 1: Bank Information */}
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 backdrop-blur-sm border border-blue-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                ขั้นตอนที่ 1: โอนเงิน
              </CardTitle>
              <CardDescription className="text-blue-200">
                โอนเงินเข้าบัญชีธนาคารด้านล่าง
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bank Account */}
              <div className="bg-white/10 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{bankInfo.bank_name}</p>
                    <p className="text-2xl font-mono text-green-300">{bankInfo.account_number}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(bankInfo.account_number, 'account')}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {copiedField === 'account' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-white/80">ชื่อบัญชี: {bankInfo.account_name}</p>
              </div>

              {/* PromptPay */}
              <div className="bg-white/10 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">PromptPay</p>
                    <p className="text-2xl font-mono text-green-300">{bankInfo.promptpay_id}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(bankInfo.promptpay_id, 'promptpay')}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {copiedField === 'promptpay' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Alert className="bg-orange-500/20 border-orange-500/50">
                <AlertCircle className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-orange-200">
                  <strong>หมายเหตุ:</strong> ควรโอนยอดให้เป็นเศษสตางค์ เช่น 100.25 บาท 
                  เพื่อไม่ให้ยอดซ้ำกันและระบบตรวจสอบได้แม่นยำ
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 2: Verification Form */}
          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 backdrop-blur-sm border border-green-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                ขั้นตอนที่ 2: แจ้งโอน
              </CardTitle>
              <CardDescription className="text-green-200">
                กรอกข้อมูลการโอนเพื่อตรวจสอบ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Username */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </Label>
                <Input
                  value={formData.ref1}
                  onChange={(e) => handleInputChange('ref1', e.target.value)}
                  placeholder="ชื่อผู้ใช้"
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  จำนวนเงิน (บาท)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="จำนวนเงินที่โอน เช่น 100.25"
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
              </div>

              {/* Transaction ID */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Transaction ID (14 หลัก)
                </Label>
                <Input
                  value={formData.transactionId}
                  onChange={(e) => handleInputChange('transactionId', e.target.value)}
                  placeholder="เลขที่อ้างอิงจากการโอน"
                  maxLength={20}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
                <p className="text-green-200 text-sm">
                  ดูได้จากประวัติการทำรายการในแอปธนาคาร
                </p>
              </div>

              {/* Date Time */}
              <div className="space-y-2">
                <Label className="text-white">วันที่และเวลาที่โอน</Label>
                <Input
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={(e) => handleInputChange('dateTime', e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerifyTransfer}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "กำลังตรวจสอบ..." : "ตรวจสอบการโอนเงิน"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {error && (
          <Alert className="bg-red-500/20 border-red-500/50 mt-6">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="bg-green-500/20 border-green-500/50 mt-6">
            <Check className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">
              <div className="space-y-2">
                <p className="font-medium">{result.message}</p>
                <div className="text-sm">
                  <p>💰 จำนวนเงินที่ได้รับ: {result.data.amount_received} บาท</p>
                  <p>🎯 เครดิตที่ได้รับ: {result.data.credits_earned} credits</p>
                  <p>📄 Transaction ID: {result.data.transaction_id}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
} 