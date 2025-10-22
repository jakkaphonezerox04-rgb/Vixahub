// Script to make a user admin in cloned site
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDsxkKY3M9476plC9NUIIeuXrPfH0EUB8Y",
  authDomain: "vixahub.firebaseapp.com",
  projectId: "vixahub",
  storageBucket: "vixahub.firebasestorage.app",
  messagingSenderId: "336784504819",
  appId: "1:336784504819:web:958bad204051e9c1534486"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Usage: node scripts/make-admin.js <siteId> <userId>
const siteId = process.argv[2];
const userId = process.argv[3];

if (!siteId || !userId) {
  console.error('❌ Usage: node scripts/make-admin.js <siteId> <userId>');
  console.error('   Example: node scripts/make-admin.js 1759853173644 1759853173644_1759853605673');
  process.exit(1);
}

async function makeAdmin() {
  try {
    const userRef = doc(firestore, `cloned_sites/${siteId}/users`, userId);
    
    await updateDoc(userRef, {
      role: 'admin'
    });
    
    console.log(`✅ User ${userId} is now an admin!`);
    console.log(`   Path: cloned_sites/${siteId}/users/${userId}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

makeAdmin();






