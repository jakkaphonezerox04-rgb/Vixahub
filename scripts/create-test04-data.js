const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'vixahub'
  });
}

const db = admin.firestore();

async function createTest04Data() {
  try {
    console.log('Creating test04 data...');
    
    // สร้างข้อมูล website
    const websiteData = {
      slug: 'test04',
      subdomain: 'test04',
      name: 'Test04 Website',
      url: 'https://test04.vixahub-2.vercel.app',
      plan: 'Basic',
      status: 'active',
      createdDate: new Date().toLocaleDateString('th-TH'),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH'),
      visitors: 0,
      revenue: 0,
      thumbnail: '/portfolio-website-showcase.png',
      description: 'Test04 website for debugging',
      userId: 'test-user-123',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const websiteRef = await db.collection('websites').add(websiteData);
    console.log('Website created with ID:', websiteRef.id);
    
    // สร้างข้อมูล cloned site
    const clonedSiteData = {
      websiteId: websiteRef.id,
      subdomain: 'test04',
      slug: 'test04',
      name: 'Test04 Website',
      plan: 'Basic',
      status: 'active',
      userId: 'test-user-123',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      settings: {
        site_settings: {
          siteName: 'Test04 Website',
          siteDescription: 'Test04 website for debugging',
          siteLogo: '',
          siteFavicon: '',
          primaryColor: '#8B5CF6',
          secondaryColor: '#06B6D4',
          fontFamily: 'Kanit',
          customCSS: '',
          customJS: '',
          analyticsCode: '',
          seoTitle: 'Test04 Website',
          seoDescription: 'Test04 website for debugging',
          seoKeywords: '',
          socialMedia: {
            facebook: '',
            twitter: '',
            instagram: '',
            youtube: '',
            tiktok: ''
          },
          contactInfo: {
            email: '',
            phone: '',
            address: '',
            website: ''
          },
          leaveTypes: ['ป่วย', 'ลากิจ', 'ลาพักผ่อน', 'อื่นๆ'],
          deliveryTypes: ['อาหาร', 'ของใช้', 'เอกสาร', 'อื่นๆ'],
          reportTypes: ['ปัญหาทางเทคนิค', 'ข้อเสนอแนะ', 'การใช้งาน', 'อื่นๆ'],
          fineItems: [
            { name: 'มาสาย', amount: 50 },
            { name: 'ไม่มาเรียน', amount: 100 },
            { name: 'ไม่ส่งงาน', amount: 200 }
          ],
          webhookUrls: {
            leaveWebhookUrl: '',
            deliveryWebhookUrl: '',
            reportWebhookUrl: '',
            fineWebhookUrl: ''
          }
        }
      }
    };
    
    const clonedSiteRef = await db.collection('cloned_sites').add(clonedSiteData);
    console.log('Cloned site created with ID:', clonedSiteRef.id);
    
    console.log('✅ Test04 data created successfully!');
    console.log('You can now test: http://localhost:3000/test04');
    
  } catch (error) {
    console.error('Error creating test04 data:', error);
  }
}

createTest04Data();
