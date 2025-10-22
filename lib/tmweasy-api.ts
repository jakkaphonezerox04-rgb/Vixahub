// TMWEasy PromptPay QR API Integration
// Based on official documentation: https://www.tmweasyapi.com/pph_qr.php

const TMWEASY_CONFIG = {
  // API Endpoints
  api_url: "https://www.tmweasyapi.com/api_pph.php",
  api_url_alt: "http://tmwallet.thaighost.net/api_pph.php",
  
  // Credentials
  username: "jakkaphonezerox04",
  password: "oam0967788993", 
  con_id: "108444",
  api_key: "4c2012ece2c849a82bad840fd568b914",
  
  // PromptPay Settings
  promptpay_id: "0959836162",
  type: "01" // 01=เบอร์โทร, 02=เลขบัตร ปชช
};

export interface CreatePayRequest {
  amount: number;
  ref1: string;
  ip?: string;
}

export interface CreatePayResponse {
  status: number; // 1=สำเร็จ 0=ผิดพลาด
  id_pay?: string;
  msg?: string;
}

export interface DetailPayRequest {
  id_pay: string;
}

export interface DetailPayResponse {
  status: number;
  ref1?: string;
  amount_check?: number; // ยอดที่ให้โอน หน่วยเป็น สตางค์
  qr_image_base64?: string;
  msg?: string;
  time_out?: number; // เวลาคงเหลือที่ต้องชำระ หน่วยเป็นวินาที
}

export interface WebhookData {
  id_pay: string;
  ref1: string;
  amount_check: string;
  amount: string;
  date_pay: string;
}

export interface WebhookPayload {
  data: string; // JSON string
  signature: string; // MD5 hash
}

class TMWEasyAPI {
  private config = TMWEASY_CONFIG;

  /**
   * ขั้นตอน 1: สร้าง ID Pay
   * ตาม API Documentation: GET method
   */
  async createPay(request: CreatePayRequest): Promise<CreatePayResponse> {
    try {
      const params = new URLSearchParams({
        username: this.config.username,
        password: this.config.password,
        con_id: this.config.con_id,
        amount: request.amount.toString(),
        ref1: request.ref1,
        method: "create_pay"
      });

      // เพิ่ม IP ถ้ามี
      if (request.ip) {
        params.append('ip', request.ip);
      }

      const url = `${this.config.api_url}?${params.toString()}`;
      console.log("🚀 TMWEasy Create Pay:", url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VIXAHUB-TMWEasy/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("📥 Create Pay Response:", result);

      return {
        status: result.status || 0,
        id_pay: result.id_pay,
        msg: result.msg
      };

    } catch (error) {
      console.error("❌ Create Pay Error:", error);
      throw error;
    }
  }

  /**
   * ขั้นตอน 2: รายละเอียดการชำระ และ QR code
   * ตาม API Documentation: GET method
   */
  async getPaymentDetails(request: DetailPayRequest): Promise<DetailPayResponse> {
    try {
      const params = new URLSearchParams({
        username: this.config.username,
        password: this.config.password,
        con_id: this.config.con_id,
        id_pay: request.id_pay,
        promptpay_id: this.config.promptpay_id,
        type: this.config.type,
        method: "detail_pay"
      });

      const url = `${this.config.api_url}?${params.toString()}`;
      console.log("🔍 TMWEasy Get Details:", url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VIXAHUB-TMWEasy/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("📥 Get Details Response:", result);

      return {
        status: result.status || 0,
        ref1: result.ref1,
        amount_check: result.amount_check,
        qr_image_base64: result.qr_image_base64,
        msg: result.msg,
        time_out: result.time_out
      };

    } catch (error) {
      console.error("❌ Get Details Error:", error);
      throw error;
    }
  }

  /**
   * ยกเลิก ID Pay (เมื่อ timeout แล้ว)
   */
  async cancelPayment(id_pay: string): Promise<{ status: number; msg?: string }> {
    try {
      const params = new URLSearchParams({
        username: this.config.username,
        password: this.config.password,
        con_id: this.config.con_id,
        id_pay: id_pay,
        method: "cancel"
      });

      const url = `${this.config.api_url}?${params.toString()}`;
      console.log("🚫 TMWEasy Cancel Payment:", url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VIXAHUB-TMWEasy/1.0'
        }
      });

      const result = await response.json();
      console.log("📥 Cancel Response:", result);

      return {
        status: result.status || 0,
        msg: result.msg
      };

    } catch (error) {
      console.error("❌ Cancel Payment Error:", error);
      throw error;
    }
  }

  /**
   * ตรวจสอบ Webhook Signature
   * signature = MD5(data:api_key)
   */
  verifyWebhookSignature(data: string, signature: string): boolean {
    try {
      // สร้าง signature ที่คาดหวัง
      const expectedData = `${data}:${this.config.api_key}`;
      
      // ใช้ crypto API ของ browser หรือ Node.js
      const crypto = require('crypto');
      const expectedSignature = crypto.createHash('md5').update(expectedData).digest('hex');
      
      console.log("🔐 Webhook Signature Verification:");
      console.log("Data:", data);
      console.log("Expected:", expectedSignature);
      console.log("Received:", signature);
      
      return expectedSignature.toLowerCase() === signature.toLowerCase();
    } catch (error) {
      console.error("❌ Signature Verification Error:", error);
      return false;
    }
  }

  /**
   * Parse Webhook Data
   */
  parseWebhookData(dataString: string): WebhookData | null {
    try {
      const data = JSON.parse(dataString);
      return {
        id_pay: data.id_pay,
        ref1: data.ref1,
        amount_check: data.amount_check,
        amount: data.amount,
        date_pay: data.date_pay
      };
    } catch (error) {
      console.error("❌ Parse Webhook Data Error:", error);
      return null;
    }
  }

  /**
   * Get Configuration (for debugging)
   */
  getConfig() {
    return {
      ...this.config,
      password: "***", // Hide password
      api_key: "***" // Hide API key
    };
  }
}

// Export singleton instance
export const tmweasyAPI = new TMWEasyAPI();
export default TMWEasyAPI; 