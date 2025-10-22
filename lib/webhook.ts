/**
 * Webhook Helper for Cloned Sites
 * Sends Discord-compatible webhooks for various events
 */

export interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: Array<{ name: string; value: string; inline?: boolean }>
  footer?: { text: string }
  timestamp?: string
  image?: { url: string }
}

export interface WebhookPayload {
  username?: string
  avatar_url?: string
  embeds?: DiscordEmbed[]
}

/**
 * Send a Discord-compatible webhook
 */
export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: WebhookPayload | FormData
): Promise<boolean> {
  if (!webhookUrl || webhookUrl.trim() === '') {
    console.log('⚠️ Webhook URL is empty, skipping webhook send')
    return false
  }

  try {
    const options: RequestInit = {
      method: 'POST',
    }

    if (payload instanceof FormData) {
      options.body = payload
    } else {
      options.headers = {
        'Content-Type': 'application/json',
      }
      options.body = JSON.stringify(payload)
    }

    const response = await fetch(webhookUrl, options)

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
    }

    console.log('✅ Webhook sent successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to send webhook:', error)
    return false
  }
}

/**
 * Convert hex color to Discord color integer
 */
export function hexToDiscordColor(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

/**
 * Send Leave Request Webhook
 */
export async function sendLeaveRequestWebhook(
  webhookUrl: string,
  data: {
    username: string
    houseName?: string
    leaveTypes: string[]
    startDate: string
    endDate: string
    reason: string
    websiteName?: string
    logoUrl?: string
    themeColor?: string
  }
): Promise<boolean> {
  const fullName = data.houseName ? `[${data.houseName}] ${data.username}` : data.username

  const payload: WebhookPayload = {
    username: data.websiteName || 'ระบบแจ้งลา',
    avatar_url: data.logoUrl || '',
    embeds: [
      {
        title: '📝 คำขอแจ้งลาใหม่',
        description: `**ผู้ยื่นคำขอ:** ${fullName}\n**เหตุผลโดยย่อ:** ${data.reason}`,
        color: data.themeColor ? hexToDiscordColor(data.themeColor) : 5814783,
        fields: [
          { name: 'ประเภทการลา', value: data.leaveTypes.join(', '), inline: true },
          { name: 'วันที่เริ่มลา', value: data.startDate, inline: true },
          { name: 'วันที่สิ้นสุด', value: data.endDate, inline: true },
        ],
        footer: { text: `ส่งโดย: ${data.username}` },
        timestamp: new Date().toISOString(),
      },
    ],
  }

  return sendDiscordWebhook(webhookUrl, payload)
}

/**
 * Send Delivery Webhook (with optional image)
 */
export async function sendDeliveryWebhook(
  webhookUrl: string,
  data: {
    username: string
    houseName?: string
    deliveryDate: string
    deliveryType: string
    screenshot?: string
    websiteName?: string
    themeColor?: string
  }
): Promise<boolean> {
  const fullName = data.houseName ? `[${data.houseName}] ${data.username}` : data.username

  const payload: WebhookPayload = {
    username: data.websiteName || 'ระบบส่งของ',
    embeds: [
      {
        title: '🚚 ส่งของใหม่',
        description: `**ผู้ส่ง:** ${fullName}`,
        color: data.themeColor ? hexToDiscordColor(data.themeColor) : 3066993,
        fields: [
          { name: 'วันที่ส่ง', value: data.deliveryDate, inline: true },
          { name: 'ประเภท', value: data.deliveryType, inline: true },
        ],
        footer: { text: `ทำรายการโดย: ${data.username}` },
        timestamp: new Date().toISOString(),
      },
    ],
  }

  // If there's a screenshot or video, send it as an attachment
  if (data.screenshot) {
    try {
      const formData = new FormData()
      
      // Convert base64 to blob
      const blob = await (await fetch(data.screenshot)).blob()
      
      // Determine file type and extension
      let fileName = 'screenshot.jpg'
      let attachmentUrl = 'attachment://screenshot.jpg'
      
      if (data.screenshot.startsWith('data:video/')) {
        // It's a video
        const mimeType = data.screenshot.split(';')[0].split(':')[1]
        if (mimeType === 'video/webm') {
          fileName = 'recording.webm'
          attachmentUrl = 'attachment://recording.webm'
        } else if (mimeType === 'video/mp4') {
          fileName = 'recording.mp4'
          attachmentUrl = 'attachment://recording.mp4'
        } else {
          fileName = 'recording.webm'
          attachmentUrl = 'attachment://recording.webm'
        }
      } else if (data.screenshot.startsWith('data:image/')) {
        // It's an image
        const mimeType = data.screenshot.split(';')[0].split(':')[1]
        if (mimeType === 'image/png') {
          fileName = 'screenshot.png'
          attachmentUrl = 'attachment://screenshot.png'
        } else if (mimeType === 'image/jpeg') {
          fileName = 'screenshot.jpg'
          attachmentUrl = 'attachment://screenshot.jpg'
        } else {
          fileName = 'screenshot.jpg'
          attachmentUrl = 'attachment://screenshot.jpg'
        }
      }
      
      formData.append('file', blob, fileName)
      
      // Add media reference to embed
      if (payload.embeds && payload.embeds[0]) {
        if (data.screenshot.startsWith('data:video/')) {
          // For videos, we can't embed them directly in Discord embeds
          // But we can add a note that there's a video attachment
          payload.embeds[0].description += '\n\n📹 **มีวิดีโอแนบ**'
        } else {
          // For images, we can embed them
          payload.embeds[0].image = { url: attachmentUrl }
        }
      }
      
      formData.append('payload_json', JSON.stringify(payload))
      
      return sendDiscordWebhook(webhookUrl, formData)
    } catch (error) {
      console.error('Failed to attach media, sending without attachment:', error)
      // Fall back to sending without attachment
      return sendDiscordWebhook(webhookUrl, payload)
    }
  }

  return sendDiscordWebhook(webhookUrl, payload)
}

/**
 * Send Report Webhook
 */
export async function sendReportWebhook(
  webhookUrl: string,
  data: {
    username: string
    group?: string
    houseName?: string
    subject: string
    details: string
    websiteName?: string
    logoUrl?: string
  }
): Promise<boolean> {
  const payload: WebhookPayload = {
    username: data.websiteName || 'ระบบรายงาน',
    avatar_url: data.logoUrl || '',
    embeds: [
      {
        title: '📢 รายงานใหม่',
        description: `**ผู้รายงาน:** ${data.username}\n**กลุ่ม:** ${data.group || 'ไม่ระบุ'}\n**บ้าน:** ${data.houseName || 'ไม่ระบุ'}\n**หัวข้อ:** ${data.subject}`,
        color: hexToDiscordColor('#FFD700'),
        fields: [{ name: 'รายละเอียด', value: data.details }],
        footer: { text: `รายงานจาก: ${data.username}${data.group ? ` (${data.group})` : ''}` },
        timestamp: new Date().toISOString(),
      },
    ],
  }

  return sendDiscordWebhook(webhookUrl, payload)
}

/**
 * Send Fine Webhook
 */
export async function sendFineWebhook(
  webhookUrl: string,
  data: {
    memberName: string
    reason: string
    amount: number
    status: string
    websiteName?: string
    logoUrl?: string
    themeColor?: string
  }
): Promise<boolean> {
  const payload: WebhookPayload = {
    username: data.websiteName || 'ระบบแจ้งปรับ',
    avatar_url: data.logoUrl || '',
    embeds: [
      {
        title: '⚠️ แจ้งเตือนค่าปรับใหม่',
        description: `**สมาชิก:** ${data.memberName}\n**เหตุผล:** ${data.reason}`,
        color: data.themeColor ? hexToDiscordColor(data.themeColor) : 15158332,
        fields: [
          { name: 'จำนวนเงิน', value: `฿${data.amount.toLocaleString()}`, inline: true },
          { name: 'สถานะ', value: data.status === 'paid' ? '✅ ชำระแล้ว' : '❌ ยังไม่ชำระ', inline: true },
        ],
        footer: { text: `แจ้งเตือนค่าปรับ - ${new Date().toLocaleString('th-TH')}` },
        timestamp: new Date().toISOString(),
      },
    ],
  }

  return sendDiscordWebhook(webhookUrl, payload)
}




