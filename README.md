# VIXAHUB - AI Platform

ระบบจัดการทีมเพื่อเพิ่มประสิทธิภาพสูงสุด

## Features

- 👥 **จัดการทีม** - ระบบจัดการสมาชิกและสิทธิ์การเข้าถึง
- 📋 **ระบบลา** - จัดการคำขอลาและติดตามสถานะ
- 📦 **ระบบส่งของ** - ติดตามการส่งของและรับของ
- 📊 **รายงาน** - สร้างรายงานและวิเคราะห์ข้อมูล
- 💰 **ระบบปรับ** - จัดการค่าปรับและติดตามการชำระเงิน
- 🔔 **แจ้งเตือน** - ระบบแจ้งเตือนผ่าน Discord

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Firebase Firestore, Firebase Auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/VIXAHUB2.git
cd VIXAHUB2
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your Firebase config
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for detailed instructions.

### Firebase

1. Build the project
```bash
npm run build
```

2. Deploy to Firebase
```bash
firebase deploy --only hosting
```

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.region.firebasedatabase.app
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

This project is licensed under the MIT License.

## Support

For support, email support@vixahub.com or create an issue on GitHub.


