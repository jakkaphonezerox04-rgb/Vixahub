/**
 * Script to verify the cloned site system is working correctly
 * Checks:
 * 1. All websites have slugs
 * 2. cloned_sites uses slug-based structure
 * 3. No orphaned data
 */

import { firestore } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

async function verifySystem() {
  console.log('🔍 Starting system verification...\n')
  
  let hasErrors = false
  
  try {
    // 1. Check websites collection
    console.log('📋 Checking websites collection...')
    const websitesRef = collection(firestore, 'websites')
    const websitesSnapshot = await getDocs(websitesRef)
    
    let websitesWithoutSlug = 0
    const validSlugs = new Set<string>()
    
    websitesSnapshot.forEach((doc) => {
      const data = doc.data()
      if (!data.slug) {
        console.log(`  ⚠️  Website ${doc.id} is missing slug`)
        websitesWithoutSlug++
        hasErrors = true
      } else {
        console.log(`  ✅ Website "${data.name}" has slug: ${data.slug}`)
        validSlugs.add(data.slug)
      }
    })
    
    if (websitesWithoutSlug === 0) {
      console.log(`  ✅ All ${websitesSnapshot.size} websites have slugs\n`)
    } else {
      console.log(`  ❌ ${websitesWithoutSlug} websites are missing slugs\n`)
    }
    
    // 2. Check cloned_sites collection
    console.log('📋 Checking cloned_sites collection...')
    const clonedSitesRef = collection(firestore, 'cloned_sites')
    const clonedSitesSnapshot = await getDocs(clonedSitesRef)
    
    let invalidIds = 0
    let orphanedSites = 0
    
    clonedSitesSnapshot.forEach((doc) => {
      const docId = doc.id
      
      // Check if ID is timestamp-based
      const isTimestamp = /^\d+_[a-z0-9]+$/.test(docId) || docId === 'undefined'
      if (isTimestamp) {
        console.log(`  ❌ Invalid ID format: ${docId} (timestamp-based)`)
        invalidIds++
        hasErrors = true
      } else {
        // Check if this slug exists in websites
        if (!validSlugs.has(docId)) {
          console.log(`  ⚠️  Orphaned cloned_site: ${docId} (no matching website)`)
          orphanedSites++
          hasErrors = true
        } else {
          console.log(`  ✅ Valid cloned_site: ${docId}`)
        }
      }
    })
    
    if (invalidIds === 0 && orphanedSites === 0) {
      console.log(`  ✅ All ${clonedSitesSnapshot.size} cloned_sites are valid\n`)
    } else {
      if (invalidIds > 0) {
        console.log(`  ❌ ${invalidIds} cloned_sites have invalid IDs`)
      }
      if (orphanedSites > 0) {
        console.log(`  ⚠️  ${orphanedSites} cloned_sites are orphaned`)
      }
      console.log('')
    }
    
    // Summary
    console.log('📊 Verification Summary:')
    console.log(`   - Websites: ${websitesSnapshot.size}`)
    console.log(`   - Cloned Sites: ${clonedSitesSnapshot.size}`)
    console.log(`   - Valid Slugs: ${validSlugs.size}`)
    
    if (hasErrors) {
      console.log('\n❌ System has errors! Please run cleanup script.')
      console.log('   Run: npm run cleanup-firestore')
    } else {
      console.log('\n✅ System verification passed!')
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error)
    throw error
  }
  
  return !hasErrors
}

// Run verification
verifySystem()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n❌ Verification script failed:', error)
    process.exit(1)
  })

