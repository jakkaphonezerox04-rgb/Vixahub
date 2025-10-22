/**
 * Script to clean up old cloned_sites documents that use timestamp IDs
 * Only keeps documents with proper slug-based structure
 */

import { firestore } from '../lib/firebase'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'

async function cleanupClonedSites() {
  console.log('🧹 Starting Firestore cleanup...\n')
  
  try {
    const clonedSitesRef = collection(firestore, 'cloned_sites')
    const snapshot = await getDocs(clonedSitesRef)
    
    console.log(`📊 Found ${snapshot.size} cloned_sites documents\n`)
    
    let deletedCount = 0
    let keptCount = 0
    
    for (const docSnapshot of snapshot.docs) {
      const docId = docSnapshot.id
      
      // Check if document ID is a timestamp (all numbers) or undefined
      const isTimestamp = /^\d+_[a-z0-9]+$/.test(docId) || docId === 'undefined'
      
      if (isTimestamp) {
        console.log(`❌ Deleting: ${docId} (timestamp-based ID)`)
        await deleteDoc(doc(firestore, 'cloned_sites', docId))
        deletedCount++
      } else {
        console.log(`✅ Keeping: ${docId} (slug-based ID)`)
        keptCount++
      }
    }
    
    console.log(`\n✨ Cleanup complete!`)
    console.log(`   - Deleted: ${deletedCount} documents`)
    console.log(`   - Kept: ${keptCount} documents`)
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  }
}

// Run the cleanup
cleanupClonedSites()
  .then(() => {
    console.log('\n✅ Cleanup script finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Cleanup script failed:', error)
    process.exit(1)
  })

