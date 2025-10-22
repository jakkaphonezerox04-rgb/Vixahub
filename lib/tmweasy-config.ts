/**
 * TMWEasy API Configuration
 * ข้อมูลการตั้งค่าสำหรับระบบ Anti-Detection Payment
 */

export const TMWEASY_CONFIG = {
  // API Settings
  api_url: "https://www.tmweasy.com/apipp.php",
  username: "jakkaphonezerox04",
  password: "oam0967788993",
  con_id: "108443",
  
  // Bank Account & PromptPay Settings
  promptpay_id: "0959836162", // เลขพร้อมเพย์ (เบอร์โทร)
  promptpay_name: "ธนเทพ โสภาคำ", // ชื่อบัญชี
  promptpay_type: "01", // 01=เบอร์โทร, 02=บัตรปชช, 03=E-Wallet
  
  // Bank Account Settings  
  account_no: "0488510843", // เลขบัญชีธนาคาร 10 หลัก
  accode: "tmpwoktXABBQMDi[pl]FTaDTwuvkLUGcoi9LnvcQ4DJ5KYMWkgjDXKK4PwN1GfKsBFbtQBklJKMmj0Ouiq5pT2SR[sa]ersmxg[tr][tr]",
  
  // API Key (สำหรับบางฟังก์ชัน)
  api_key: "4c2012ece2c849a82bad840fd568b914",
  
  // Anti-Detection Settings
  anti_detection: {
    enabled: true,
    check_interval: 30, // วินาที
    max_attempts: 20,
    timeout: 900, // 15 นาที
    user_agents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
    ]
  }
};

// Helper Functions
export function getRandomUserAgent(): string {
  const agents = TMWEASY_CONFIG.anti_detection.user_agents;
  return agents[Math.floor(Math.random() * agents.length)];
}

export function generateFingerprint(): string {
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

export function getClientIP(request: any): string {
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

export function humanDelay(): number {
  const baseDelay = 30000; // 30 วินาที
  const randomFactor = Math.random() * 45000; // สุ่ม 0-45 วินาที
  return baseDelay + randomFactor;
} 