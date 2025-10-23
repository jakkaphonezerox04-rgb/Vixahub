// Utility function for API retry mechanism
export async function apiRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [API-RETRY] Attempt ${attempt}/${maxRetries}`)
      const result = await apiCall()
      console.log(`✅ [API-RETRY] Success on attempt ${attempt}`)
      return result
    } catch (error) {
      lastError = error as Error
      console.warn(`⚠️ [API-RETRY] Attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        console.error(`❌ [API-RETRY] All ${maxRetries} attempts failed`)
        throw lastError
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = delay * Math.pow(2, attempt - 1)
      console.log(`⏳ [API-RETRY] Waiting ${waitTime}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}

// Specific function for saving site settings with retry
export async function saveSiteSettingsWithRetry(slug: string, siteSettings: any) {
  return apiRetry(async () => {
    const response = await fetch('/api/save-site-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug, siteSettings }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  })
}

// Specific function for saving preview settings with retry
export async function savePreviewSettingsWithRetry(id: string, siteSettings: any) {
  return apiRetry(async () => {
    const response = await fetch('/api/save-preview-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, siteSettings }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  })
}
