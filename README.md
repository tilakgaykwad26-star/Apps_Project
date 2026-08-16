# श्री दुर्गा मंडळ (Durga Mandal) — Official Production Community App
> **सेवा | संस्कृती | एकता**

A modern, accessible, mobile-first responsive Progressive Web Application (PWA) and digital management ecosystem built for **श्री दुर्गा मंडळ, कसबा पेठ, पुणे** (Reg. No: `MAH/PUNE/F-18942/2004`).

---

## 🌟 Key Features

1. **Multilingual Architecture**:
   - **Marathi (मराठी)** as primary default language.
   - Instant runtime switching to **Hindi (हिंदी)** and **English**.
   - Custom Devanagari typography (`Noto Serif Devanagari` & `Noto Sans Devanagari`).

2. **Public Portal (Guest-Accessible without Login)**:
   - Festive Hero Carousel with greetings (*"॥ श्री दुर्गा प्रसन्न ॥"*).
   - Mandal Information & History, Registration No., Trustees, and Bank NEFT/UPI details.
   - Festival Events Calendar with RSVP confirmations and attendee count.
   - Photo Gallery with year-wise album organizer and full-screen lightbox modal.
   - Notice Board with Priority badges (*Urgent / Important / Normal*) and attachments.
   - Sponsoring Partners Showcase (Active date-range windowing).
   - Committee Directory with one-tap phone dialing and Google Maps navigation.

3. **Secure Online Donation System**:
   - Donation categories: *Annadaan / Mahaprasad, Maha Aarti, Special Utsav, Murti Shringar, General*.
   - Razorpay Payment Gateway integration (UPI, Cards, NetBanking).
   - Server-side signature verification via Cloud Functions.
   - Instant bilingual official PDF Donation Receipt generation with Trust Seal, PAN details, and WhatsApp sharing.

4. **Member Portal & Digital ID Card**:
   - Phone + OTP Authentication.
   - Individual and Family membership registration.
   - **Digital Member ID Card (डिजिटल सभासद ओळखपत्र)** with QR code and active subscription status.
   - Annual Subscription (*वार्षिक वर्गणी*) online payment & downloadable receipts.
   - Member payment ledger and dues tracking (*Paid / Pending / Partial*).

5. **5-Tier Role-Based Access Control (RBAC)**:
   - `Super Admin`: Complete administrative access, system settings, and security audit logs.
   - `Treasurer (खजिनदार)`: Financial ledger, donations, subscription payments, balance sheet PDF export.
   - `Committee Admin (कार्यकारणी प्रमुख)`: Members directory, events, notices, gallery albums, sponsors.
   - `Content Manager (माहिती व्यवस्थापक)`: Events, notices, gallery photos, Mandal public info.
   - `Member (सभासद)`: Own profile, digital ID card, own payment history, event RSVPs.
   - `Guest (सार्वजनिक)`: Public view only.

6. **Accounts & Financial Ledger**:
   - Double-entry Indian Financial Year ledger (1st April – 31st March).
   - Collection summary cards (Total Collection, Subscriptions, Donations, Outstanding Dues).
   - Visual category breakdown and monthly collection graphs.
   - One-click export to official Audited Balance Sheet (PDF), Donations (CSV), and Member Directory (CSV).

7. **Production Security**:
   - Granular `firestore.rules` preventing unauthorized writes.
   - `storage.rules` validating image MIME types and 5MB size limits.
   - Immutable security audit trail (`audit_logs` collection).

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS Design System with custom CSS tokens.
- **Backend & Cloud**: Firebase (Auth, Cloud Firestore, Firebase Storage, Cloud Functions, Cloud Messaging).
- **Payments**: Razorpay Checkout SDK + Server-side HMAC-SHA256 signature verification.
- **Reporting**: jsPDF, jsPDF-AutoTable, UTF-8 CSV exporter.
- **Icons & Visuals**: Lucide React, Canvas Confetti.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Run

```bash
# 1. Clone repository & install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

Local dev server will be running at `http://localhost:3000`.

---

## 📁 Folder Structure

```
tilak-project/
├── .env.example                     # Environment configuration template
├── firestore.rules                  # Production Firestore Security Rules
├── storage.rules                    # Firebase Storage Security Rules
├── index.html                       # Base HTML with Devanagari typography
├── src/
│   ├── index.css                    # Design tokens & responsive styles
│   ├── types/                       # TypeScript interfaces (auth, event, donation, payment, etc.)
│   ├── config/                      # Firebase & Razorpay configuration
│   ├── context/                     # Language, Auth, Notification, Mandal contexts
│   ├── i18n/                        # Marathi, Hindi & English translation dictionaries
│   ├── services/                    # Razorpay, PDF receipt & CSV export services
│   ├── utils/                       # Date, Currency (Marathi words), Seed data
│   ├── components/common/           # Header, BottomNav, Footer, Modal, Skeleton, EmptyState
│   └── pages/                       # HomePage, About, Events, Gallery, Notices, Donate, Members, Admin
└── functions/                       # Firebase Cloud Functions (Razorpay orders & webhooks)
```

---

## 🔒 Security & Deployment

### Firestore Security Rules Deployment
```bash
firebase deploy --only firestore:rules,storage
```

### Cloud Functions Deployment
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### Frontend Web Hosting
```bash
npm run build
firebase deploy --only hosting
```
