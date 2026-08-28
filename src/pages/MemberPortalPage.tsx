import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useMandal } from '../context/MandalContext';
import { MANDAL_CONFIG } from '../config/constants';
import { Member, MemberType, MemberCategory } from '../types/auth';
import { formatIndianDate, formatMarathiDate, toMarathiDigits } from '../utils/dateUtils';
import { formatINR } from '../utils/currencyUtils';
import { isValidIndianPhone } from '../utils/validationUtils';
import { generateSubscriptionReceiptPDF, sendSubscriptionReceiptWhatsApp } from '../services/receiptService';
import { useNotification } from '../context/NotificationContext';
import {
  User,
  Phone,
  KeyRound,
  ShieldCheck,
  CreditCard,
  Download,
  QrCode,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Award,
  Settings,
  Search,
  UserCheck,
  PhoneCall,
  Eye,
  EyeOff
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { UpiQrPaymentModal } from '../components/common/UpiQrPaymentModal';

export const MemberPortalPage: React.FC = () => {
  const { language, t, isMarathi } = useLanguage();
  const { user, memberProfile, isAuthenticated, loginWithPhone, sendOtp, logout, updateMemberProfile } = useAuth();
  const { addMember, addMemberPayment, deleteMemberPayment, getMemberSummary, payments, members } = useMandal();
  const { showSuccess, showError } = useNotification();

  // Mode: portal vs directory list
  const [mainTab, setMainTab] = useState<'portal' | 'directory'>('portal');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryCategoryFilter, setDirectoryCategoryFilter] = useState<'all' | 'annual' | 'life' | 'patron'>('all');

  // Mode: login, register, profile
  const [activeMode, setActiveMode] = useState<'profile' | 'login' | 'register'>(
    isAuthenticated && memberProfile ? 'profile' : 'login'
  );

  // BUG 7 fix: sync activeMode when auth state changes (useState initial value is only used once)
  React.useEffect(() => {
    if (isAuthenticated && memberProfile) {
      setActiveMode('profile');
    } else if (!isAuthenticated) {
      setActiveMode('login');
    }
  }, [isAuthenticated, memberProfile]);

  // Login Form
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  React.useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Registration Form
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('पुणे');
  const [regPincode, setRegPincode] = useState('411011');
  const [regMemberType, setRegMemberType] = useState<MemberType>('individual');
  const [regCategory, setRegCategory] = useState<MemberCategory>('annual');
  const [familyMembersList, setFamilyMembersList] = useState<{ name: string; relation: string }[]>([
    { name: '', relation: 'पती/पत्नी' }
  ]);
  const [isRegistering, setIsRegistering] = useState(false);

  // Subscription Pay Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isUpiQrModalOpen, setIsUpiQrModalOpen] = useState(false);
  const [isPayingSubscription, setIsPayingSubscription] = useState(false);
  const [customPayAmount, setCustomPayAmount] = useState<string>('1500');

  // Computed Financial Summary for Member
  const memberSummary = memberProfile ? getMemberSummary(memberProfile.id) : null;
  const memberPaymentHistory = memberProfile
    ? payments.filter((p) => p.memberId === memberProfile.id && p.paymentStatus === 'successful')
    : [];

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputVal = loginPhone.trim();
    const passVal = loginOtp.trim();
    if (!inputVal) {
      showError('कृपया आपला नोंदणीकृत मोबाईल नंबर किंवा सभासद आयडी प्रविष्ट करा.');
      return;
    }
    if (!passVal) {
      showError('कृपया आपला पासवर्ड प्रविष्ट करा.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const result = await loginWithPhone(inputVal, passVal);
      const isSuccess = typeof result === 'boolean' ? result : result.success;
      if (isSuccess) {
        showSuccess('लॉगिन यशस्वी! आपले प्रोफाइल उघडले आहे.');
        setActiveMode('profile');
      } else {
        const msg = typeof result === 'object' && result.message ? result.message : 'लॉगिन अयशस्वी. कृपया प्रविष्ट माहिती तपासा.';
        showError(msg);
      }
    } catch (err: any) {
      showError(err?.message || t.common.errorOccurred);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAddFamilyRow = () => {
    setFamilyMembersList((prev) => [...prev, { name: '', relation: 'कुटुंब सदस्य' }]);
  };

  const handleRemoveFamilyRow = (index: number) => {
    setFamilyMembersList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      showError('कृपया आपले पूर्ण नाव प्रविष्ट करा.');
      return;
    }
    if (!isValidIndianPhone(regPhone)) {
      showError('कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.');
      return;
    }

    setIsRegistering(true);
    try {
      const validFamily = familyMembersList.filter((f) => f.name.trim().length > 0);
      const newMember = await addMember({
        fullName: regFullName.trim(),
        fullNameMarathi: regFullName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim() || undefined,
        address: regAddress.trim(),
        cityVillage: regCity.trim(),
        pincode: regPincode.trim() || undefined,
        memberType: regMemberType,
        category: regCategory,
        familyMembers: regMemberType === 'family' ? validFamily : undefined,
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0],
        annualDueAmount: MANDAL_CONFIG.annualSubscriptionFee,
      });

      // Auto login as new member
      await loginWithPhone(regPhone.trim(), '123456');
      showSuccess('सभासद नोंदणी यशस्वीरित्या पूर्ण झाली! आपले ओळखपत्र तयार आहे.');
      setActiveMode('profile');
    } catch (err) {
      showError('नोंदणी करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleOpenPayModal = () => {
    if (!memberSummary) return;
    if (memberSummary.status === 'paid' || memberSummary.remainingDue <= 0) {
      showError('आपली या आर्थिक वर्षासाठीची वर्गणी (₹1,500) आधीच पूर्ण भरली आहे! दुप्पट वर्गणी नोंदवण्याची गरज नाही.');
      return;
    }
    const due = memberSummary.remainingDue > 0 ? memberSummary.remainingDue : MANDAL_CONFIG.annualSubscriptionFee;
    setCustomPayAmount(String(due));
    setIsPayModalOpen(true);
  };

  const handlePaySubscription = () => {
    if (!memberProfile || !memberSummary) return;

    if (memberSummary.status === 'paid' || memberSummary.remainingDue <= 0) {
      showError('आपली या आर्थिक वर्षासाठीची वर्गणी (₹1,500) आधीच पूर्ण भरली आहे!');
      return;
    }

    const amountToPay = parseInt(customPayAmount, 10);
    if (!amountToPay || amountToPay <= 0) {
      showError('कृपया वैध रक्कम प्रविष्ट करा (किमान ₹ 1).');
      return;
    }

    if (amountToPay > memberSummary.remainingDue) {
      showError(`वर्गणी रक्कम बाकी रक्कमेपेक्षा (${formatINR(memberSummary.remainingDue)}) जास्त असू शकत नाही.`);
      return;
    }

    // Open UPI QR Scanner modal directly
    setIsPayModalOpen(false);
    setIsUpiQrModalOpen(true);
  };

  const handleUpiQrSuccess = async (paymentId: string, orderId: string, utr?: string) => {
    if (!memberProfile || !memberSummary) return;

    if (memberSummary.status === 'paid' || memberSummary.remainingDue <= 0) {
      showError('आपली या आर्थिक वर्षासाठीची वर्गणी (₹1,500) आधीच पूर्ण भरली आहे!');
      setIsUpiQrModalOpen(false);
      return;
    }

    const amountToPay = Math.min(
      memberSummary.remainingDue || MANDAL_CONFIG.annualSubscriptionFee,
      parseInt(customPayAmount, 10) || (memberSummary.remainingDue || MANDAL_CONFIG.annualSubscriptionFee)
    );

    try {
      const savedPayment = await addMemberPayment({
        memberId: memberProfile.id,
        memberName: memberProfile.fullNameMarathi || memberProfile.fullName,
        memberPhone: memberProfile.phone,
        financialYear: MANDAL_CONFIG.currentFinancialYear,
        amount: amountToPay,
        paymentType: 'annual_subscription',
        paymentMethod: 'upi_qr',
        paymentStatus: 'pending',
        razorpayOrderId: orderId,
        razorpayPaymentId: utr ? `UTR_${utr}` : paymentId,
        recordedBy: 'online'
      });

      showSuccess(`₹ ${amountToPay} ची वर्गणी नोंदणी स्वीकारली आहे! मंडळ ॲडमिन बँक पडताळणीनंतर WhatsApp वर अधिकृत पावती पाठवली जाईल.`);
      setIsUpiQrModalOpen(false);
    } catch (e) {
      showError('पेमेंट रेकॉर्ड नोंदवताना त्रुटी आली.');
    }
  };

  const handleDownloadReceipt = (payment: any) => {
    const doc = generateSubscriptionReceiptPDF(payment);
    doc.save(`Durga_Mandal_Subscription_${payment.receiptNumber.replace(/\//g, '_')}.pdf`);
  };

  const handleShareSubscriptionWhatsApp = (payment: any) => {
    sendSubscriptionReceiptWhatsApp(payment);
  };

  const filteredDirectoryMembers = members.filter((m) => {
    const searchLower = directorySearch.toLowerCase().trim();
    const nameMatch =
      (m.fullNameMarathi || '').toLowerCase().includes(searchLower) ||
      (m.fullName || '').toLowerCase().includes(searchLower) ||
      (m.phone || '').includes(searchLower) ||
      (m.cityVillage || '').toLowerCase().includes(searchLower) ||
      (m.memberNumber || '').toLowerCase().includes(searchLower);

    const categoryMatch = directoryCategoryFilter === 'all' || m.category === directoryCategoryFilter;

    return nameMatch && categoryMatch;
  });

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)', paddingTop: 'var(--space-lg)' }}>
      {/* 1. Header */}
      <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.1rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
          {t.member.portalTitle}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          {language === 'en'
            ? 'Access your digital ID card, manage annual subscription, and view official members list.'
            : 'आपले डिजिटल ओळखपत्र, वार्षिक वर्गणी जमा करण्याची सुविधा व अधिकृत सभासद सूची'}
        </p>
      </div>

      {/* Main View Switcher: Portal vs Directory */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button
          onClick={() => setMainTab('portal')}
          className={`btn ${mainTab === 'portal' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '6px', padding: '8px 18px', fontWeight: 700 }}
        >
          <User size={18} />
          <span>सभासद ओळखपत्र / लॉगिन</span>
        </button>
        <button
          onClick={() => setMainTab('directory')}
          className={`btn ${mainTab === 'directory' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '6px', padding: '8px 18px', fontWeight: 700, backgroundColor: mainTab === 'directory' ? '#16a34a' : undefined, borderColor: mainTab === 'directory' ? '#16a34a' : undefined }}
        >
          <UserCheck size={18} />
          <span>मंडळ सभासद यादी ({members.length})</span>
        </button>
      </div>

      {mainTab === 'directory' ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--color-maroon-800)', margin: 0 }}>
            दुर्गा मंडळ — अधिकृत सभासद सूची ({filteredDirectoryMembers.length}/{members.length})
          </h2>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="नाव, मोबाईल, शहर किंवा सभासद क्र. शोधा..."
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
              style={{ paddingLeft: '38px', minHeight: '42px', fontSize: '0.92rem', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {filteredDirectoryMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                कोणतेही सभासद सापडले नाहीत. कृपया सर्च बदलून पहा.
              </div>
            ) : (
              filteredDirectoryMembers.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-maroon-100)',
                      color: 'var(--color-maroon-800)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      flexShrink: 0,
                      border: '1.5px solid var(--color-maroon-300)'
                    }}>
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.fullName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        (m.fullNameMarathi || m.fullName || 'S').charAt(0)
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--color-maroon-900)' }}>
                        {m.fullNameMarathi || m.fullName}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        📍 {m.cityVillage || 'चोप / गडचिरोली'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: m.category === 'patron' ? '#fef3c7' : m.category === 'life' ? '#e0f2fe' : '#f3f4f6',
                        color: m.category === 'patron' ? '#b45309' : m.category === 'life' ? '#0369a1' : '#374151'
                      }}
                    >
                      {m.category === 'patron' ? 'मानद आश्रयदाते' : m.category === 'life' ? 'आजीवन सभासद' : 'वार्षिक सभासद'}
                    </span>

                    {m.phone && (
                      <a
                        href={`tel:${m.phone.replace(/[^0-9+]/g, '')}`}
                        className="btn btn-sm btn-primary"
                        style={{
                          fontSize: '0.78rem',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          textDecoration: 'none',
                          backgroundColor: 'var(--color-maroon-700)'
                        }}
                      >
                        <PhoneCall size={13} />
                        <span>कॉल करा</span>
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2. State: Authenticated Profile View */}
      {isAuthenticated && memberProfile && activeMode === 'profile' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* Member ID Card & Financial Status Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-xl)',
            alignItems: 'start'
          }}>
            {/* Digital Member ID Card (डिजिटल ओळखपत्र) */}
            <div style={{
              background: 'linear-gradient(135deg, #6F1616 0%, #871C1C 60%, #4A0808 100%)',
              color: '#fff',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-lg)',
              boxShadow: 'var(--shadow-xl)',
              border: '2px solid var(--color-gold-500)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Card Watermark */}
              <div style={{ position: 'absolute', right: '-15px', bottom: '-20px', opacity: 0.08, pointerEvents: 'none' }}>
                <span style={{ fontSize: '180px', color: '#D4AF37', fontWeight: 800 }}>ॐ</span>
              </div>

              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(212, 175, 55, 0.4)', paddingBottom: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-maroon-900)', border: '1.5px solid var(--color-gold-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#D4AF37', fontWeight: 800 }}>ॐ</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FAF7F2' }}>{MANDAL_CONFIG.nameMarathi}</div>
                    <div style={{ fontSize: '0.68rem', color: '#FFD54F' }}>डिजिटल सभासद ओळखपत्र (Official ID)</div>
                  </div>
                </div>

                <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                  {memberProfile.memberNumber}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#f5f5f5',
                  overflow: 'hidden',
                  border: '2px solid var(--color-gold-500)',
                  flexShrink: 0
                }}>
                  <img
                    src={memberProfile.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'}
                    alt={memberProfile.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '2px' }}>
                    {memberProfile.fullNameMarathi || memberProfile.fullName}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#FFE0B2', marginBottom: '4px' }}>
                    मोबाईल:{' '}
                    <a
                      href={`tel:${(memberProfile.phone || '').replace(/\D/g, '')}`}
                      style={{ color: '#FFE0B2', fontWeight: 700, textDecoration: 'none' }}
                      title="थेट कॉल करा"
                    >
                      📞 +91 {memberProfile.phone}
                    </a>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#E0D6C8' }}>
                    प्रकार: {memberProfile.memberType === 'family' ? 'कुटुंब सभासद' : 'वैयक्तिक'} ({memberProfile.category})
                  </div>
                </div>
              </div>

              {/* Card Footer: Address & QR */}
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem'
              }}>
                <div>
                  <div style={{ color: '#D4AF37', fontWeight: 600 }}>पत्ता व शहर:</div>
                  <div style={{ color: '#F0E6D8' }}>{memberProfile.address}, {memberProfile.cityVillage}</div>
                </div>
                <div style={{
                  backgroundColor: '#fff',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <QrCode size={36} color="#871C1C" />
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#B5A898' }}>
                  नोंदणी दिनांक: {formatIndianDate(memberProfile.joinedDate)}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: memberSummary?.status === 'paid' ? '#81C784' : '#FFB74D'
                }}>
                  ● {memberSummary?.status === 'paid' ? 'वार्षिक वर्गणी पूर्ण (Active)' : `वर्गणी बाकी (${formatINR(memberSummary?.remainingDue ?? 1500)})`}
                </span>
              </div>
            </div>

            {/* Annual Subscription Status Box */}
            <div className="card card-gold-accent" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="flex-between">
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    आर्थिक वर्ष {MANDAL_CONFIG.currentFinancialYear}
                  </div>
                  <h2 style={{ fontSize: '1.3rem', color: 'var(--color-maroon-800)', margin: 0 }}>
                    वार्षिक वर्गणी स्थिती
                  </h2>
                </div>

                {memberSummary?.status === 'paid' ? (
                  <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                    <CheckCircle size={14} /> वर्गणी पूर्ण (PAID)
                  </span>
                ) : (memberSummary?.status as string) === 'pending_verification' || (memberSummary?.pendingPaid || 0) > 0 ? (
                  <span className="badge" style={{ fontSize: '0.85rem', padding: '6px 12px', backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontWeight: 700 }}>
                    <Clock size={14} /> ⏳ पडताळणी प्रलंबित ({formatINR(memberSummary?.pendingPaid || 0)})
                  </span>
                ) : memberSummary?.status === 'partial' ? (
                  <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '6px 12px', backgroundColor: '#FFF3E0', color: '#E65100', border: '1px solid #FFE0B2' }}>
                    <Clock size={14} /> अपूर्ण वर्गणी (बाकी: {formatINR(memberSummary?.remainingDue || 0)})
                  </span>
                ) : (
                  <span className="badge badge-danger" style={{ fontSize: '0.85rem', padding: '6px 12px', backgroundColor: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2' }}>
                    <AlertCircle size={14} /> वर्गणी बाकी ({formatINR(memberSummary?.remainingDue ?? 1500)})
                  </span>
                )}
              </div>

              {/* 3-Box Financial Breakdown */}
              <div style={{
                backgroundColor: 'var(--color-surface-subtle)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px'
              }}>
                <div style={{ padding: '8px 10px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>१. वार्षिक शुल्क</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                    {formatINR(memberSummary?.totalAnnualDue || 1500)}
                  </div>
                </div>

                <div style={{ padding: '8px 10px', backgroundColor: (memberSummary?.pendingPaid || 0) > 0 && memberSummary?.status !== 'paid' ? '#FEF3C7' : '#F1F8E9', borderRadius: 'var(--radius-sm)', border: (memberSummary?.pendingPaid || 0) > 0 && memberSummary?.status !== 'paid' ? '1px solid #FDE68A' : '1px solid #C8E6C9' }}>
                  <div style={{ fontSize: '0.74rem', color: (memberSummary?.pendingPaid || 0) > 0 && memberSummary?.status !== 'paid' ? '#B45309' : '#2E7D32', fontWeight: 600 }}>
                    २. जमा वर्गणी
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: (memberSummary?.pendingPaid || 0) > 0 && memberSummary?.status !== 'paid' ? '#D97706' : '#2E7D32', marginTop: '4px' }}>
                    {formatINR(memberSummary?.status === 'paid' ? (memberSummary?.totalPaid || memberSummary?.totalAnnualDue || 1500) : (memberSummary?.totalPaid || 0))}
                    {(memberSummary?.pendingPaid || 0) > 0 && memberSummary?.status !== 'paid' && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, display: 'block', color: '#B45309' }}>(पडताळणी प्रलंबित: {formatINR(memberSummary?.pendingPaid || 0)})</span>
                    )}
                  </div>
                </div>

                <div style={{ padding: '8px 10px', backgroundColor: '#FFEBEE', borderRadius: 'var(--radius-sm)', border: '1px solid #FFCDD2' }}>
                  <div style={{ fontSize: '0.74rem', color: '#C62828', fontWeight: 700 }}>३. बाकी वर्गणी (Pending)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#C62828', marginTop: '4px' }}>
                    {formatINR(memberSummary?.remainingDue ?? 1500)}
                  </div>
                </div>
              </div>

              {/* Payment Progress Bar */}
              {memberSummary && memberSummary.totalAnnualDue > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="flex-between" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    <span>वर्गणी जमा प्रगती (Progress)</span>
                    <span style={{ color: memberSummary.status === 'paid' ? '#2E7D32' : (memberSummary.pendingPaid || 0) > 0 ? '#D97706' : '#C62828', fontWeight: 700 }}>
                      {memberSummary.status === 'paid' ? 100 : Math.min(100, Math.round(((memberSummary.totalPaid || 0) / memberSummary.totalAnnualDue) * 100))}% भरली
                    </span>
                  </div>
                  <div style={{ height: '8px', width: '100%', backgroundColor: '#E0E0E0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${memberSummary.status === 'paid' ? 100 : Math.min(100, Math.round(((memberSummary.totalPaid || 0) / memberSummary.totalAnnualDue) * 100))}%`,
                        backgroundColor: memberSummary.status === 'paid' ? '#4CAF50' : (memberSummary.pendingPaid || 0) > 0 ? '#F59E0B' : '#FF9800',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              )}

              {memberSummary?.status === 'paid' ? (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--color-success-bg)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-success)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={18} />
                  <span>आर्थिक वर्ष {MANDAL_CONFIG.currentFinancialYear} साठी आपली वर्गणी पूर्ण भरली गेली आहे. धन्यवाद!</span>
                </div>
              ) : (memberSummary?.status as string) === 'pending_verification' || (memberSummary?.remainingDue || 0) === 0 ? (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  borderRadius: 'var(--radius-md)',
                  color: '#92400E',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontWeight: 700
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={20} color="#D97706" />
                    <div>
                      <div>⏳ वर्गणी नोंद स्वीकारली आहे! बँक पडताळणी प्रलंबित</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#B45309', marginTop: '2px' }}>
                        मंडळ ॲडमिन बँक खात्यात पडताळणी करून WhatsApp वर पावती पाठवतील.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 'auto' }}>
                  <button
                    onClick={handleOpenPayModal}
                    className="btn btn-saffron btn-lg"
                    style={{ width: '100%', gap: '8px' }}
                  >
                    <CreditCard size={18} />
                    <span>{t.member.paySubscriptionBtn} ({formatINR(memberSummary?.remainingDue || MANDAL_CONFIG.annualSubscriptionFee)})</span>
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={logout}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--color-danger)' }}
                >
                  {t.nav.logout}
                </button>
              </div>
            </div>
          </div>

          {/* Payment and Receipt History Table */}
          <div className="card">
            {memberSummary && memberSummary.remainingDue > 0 && (
              <div style={{
                backgroundColor: '#FFF8E1',
                border: '1px solid #FFE082',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#FF8F00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#D84315', fontSize: '0.98rem' }}>
                      चालू वर्ष २०२६-२७ ची बाकी वर्गणी: {formatINR(memberSummary.remainingDue)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6D4C41', marginTop: '2px' }}>
                      एकूण वार्षिक शुल्क: {formatINR(memberSummary.totalAnnualDue)} | आतापर्यंत जमा: {formatINR(memberSummary.totalPaid)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)', marginBottom: 'var(--space-md)' }}>
              {t.member.paymentHistory}
            </h2>

            {memberPaymentHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--color-text-muted)' }}>
                {t.member.noPayments}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-maroon-50)', borderBottom: '2px solid var(--color-maroon-100)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', color: 'var(--color-maroon-800)' }}>पावती क्रमांक</th>
                      <th style={{ padding: '10px 14px', color: 'var(--color-maroon-800)' }}>दिनांक</th>
                      <th style={{ padding: '10px 14px', color: 'var(--color-maroon-800)' }}>आर्थिक वर्ष</th>
                      <th style={{ padding: '10px 14px', color: 'var(--color-maroon-800)' }}>रक्कम</th>
                      <th style={{ padding: '10px 14px', color: 'var(--color-maroon-800)' }}>पेमेंट प्रकार</th>
                      <th style={{ padding: '10px 14px', color: 'var(--color-maroon-800)', textAlign: 'right' }}>कृती</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberPaymentHistory.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, fontFamily: 'monospace' }}>{p.receiptNumber}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>{formatIndianDate(p.createdAt)}</td>
                        <td style={{ padding: '10px 14px' }}>FY {p.financialYear}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-success)' }}>{formatINR(p.amount)}</td>
                        <td style={{ padding: '10px 14px' }}>{p.paymentMethod.toUpperCase()}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDownloadReceipt(p)}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: '4px', fontSize: '0.78rem' }}
                            title="Download PDF Receipt"
                          >
                            <Download size={13} />
                            <span>पावती</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeMode === 'register' ? (
        /* 3. Member Registration View */
        <div className="card card-maroon-accent" style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--color-maroon-800)', marginBottom: '4px' }}>
            {t.member.registerTitle}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
            दुर्गा मंडळाचे अधिकृत सभासदत्व मिळवण्यासाठी सर्व माहिती अचूकपणे भरावी.
          </p>

          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label form-label-required">{t.donations.fullName}</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="उदा. श्री. विकास दत्तात्रय देशपांडे"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label form-label-required">{t.donations.mobileNumber}</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  className="form-input"
                  placeholder="१० अंकी मोबाईल नंबर"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.donations.email}</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">सभासद प्रकार (Membership Type)</label>
                <select
                  className="form-select"
                  value={regMemberType}
                  onChange={(e) => setRegMemberType(e.target.value as MemberType)}
                >
                  <option value="individual">{t.member.individualType}</option>
                  <option value="family">{t.member.familyType}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">वर्गणी श्रेणी (Category)</label>
                <select
                  className="form-select"
                  value={regCategory}
                  onChange={(e) => setRegCategory(e.target.value as MemberCategory)}
                >
                  <option value="annual">वार्षिक सभासद (Annual - ₹५००/वर्ष)</option>
                  <option value="life">आजीवन सभासद (Life Member)</option>
                  <option value="patron">मानद आश्रयदाते (Patron)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">{t.donations.address}</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="घर/फ्लॅट क्र., इमारत, रस्ता"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label form-label-required">{t.member.cityVillage}</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="उदा. पुणे"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.member.pincode}</label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="उदा. 411011"
                  value={regPincode}
                  onChange={(e) => setRegPincode(e.target.value)}
                />
              </div>
            </div>

            {/* Family Members Rows if Family Type */}
            {regMemberType === 'family' && (
              <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-maroon-800)' }}>
                    कुटुंबातील इतर सदस्यांची नावे:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddFamilyRow}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                  >
                    <Plus size={13} /> सदस्य जोडा
                  </button>
                </div>

                {familyMembersList.map((row, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="सदस्याचे पूर्ण नाव"
                      value={row.name}
                      onChange={(e) => {
                        const updated = [...familyMembersList];
                        updated[idx].name = e.target.value;
                        setFamilyMembersList(updated);
                      }}
                      style={{ flex: 2, minHeight: '36px' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="नाते (उदा. मुलगा)"
                      value={row.relation}
                      onChange={(e) => {
                        const updated = [...familyMembersList];
                        updated[idx].relation = e.target.value;
                        setFamilyMembersList(updated);
                      }}
                      style={{ flex: 1, minHeight: '36px' }}
                    />
                    {familyMembersList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFamilyRow(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 'var(--space-md)' }}>
              <button
                type="submit"
                disabled={isRegistering}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                {isRegistering ? t.common.loading : 'नोंदणी पूर्ण करा (Complete Registration)'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveMode('login')}
                style={{ background: 'none', border: 'none', color: 'var(--color-maroon-700)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                आधीच सभासद आहात? येथे लॉगिन करा (Already a Member? Login)
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* 4. Member Login View */
        <div className="card card-gold-accent" style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-maroon-50)',
              color: 'var(--color-maroon-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px auto'
            }}>
              <User size={28} />
            </div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--color-maroon-800)', marginBottom: '4px' }}>
              {t.member.loginTitle}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {t.member.enterPhone}
            </p>
          </div>

            <form onSubmit={handleDirectLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label form-label-required">सभासद आयडी किंवा मोबाईल नंबर (Member ID / Mobile No.)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    disabled={isLoggingIn}
                    className="form-input"
                    placeholder="सभासद आयडी किंवा मोबाईल नंबर प्रविष्ट करा"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">पासवर्ड / पिन (Password / Secret PIN)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoggingIn}
                    className="form-input"
                    placeholder="पासवर्ड प्रविष्ट करा (Enter Password)"
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value)}
                    style={{ paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted, #666)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn || !loginPhone.trim()}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', gap: '8px', justifyContent: 'center', fontWeight: 700 }}
              >
                {isLoggingIn ? (
                  <span>प्रतिक्षा करा, प्रोफाइल उघडत आहे...</span>
                ) : (
                  <>
                    <KeyRound size={18} />
                    <span>सभासद लॉगिन करा (Member Login)</span>
                  </>
                )}
              </button>

            </form>
        </div>
      )}
        </>
      )}

      {/* Subscription Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`वार्षिक वर्गणी जमा — FY ${MANDAL_CONFIG.currentFinancialYear}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ backgroundColor: 'var(--color-maroon-50)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>सभासद नाव:</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-maroon-800)' }}>
              {memberProfile?.fullNameMarathi || memberProfile?.fullName}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              सभासद क्रमांक: {memberProfile?.memberNumber}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: 'var(--color-surface-subtle)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>नियोजित वार्षिक वर्गणी</div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--color-text-primary)' }}>
                {formatINR(memberSummary?.totalAnnualDue || 1500)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>सध्याची बाकी रक्कम</div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: (memberSummary?.remainingDue || 0) > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {formatINR(memberSummary?.remainingDue ?? 1500)}
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px', marginBottom: '8px' }}>
            <label className="form-label form-label-required" style={{ fontWeight: 700, fontSize: '0.92rem' }}>
              जमा करावयाची रक्कम एडिट / प्रविष्ट करा (₹):
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-maroon-800)', fontSize: '1.1rem' }}>₹</span>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-maroon-800)' }}
                value={customPayAmount}
                onChange={(e) => setCustomPayAmount(e.target.value)}
                placeholder="उदा. ५००, १०००, १५००"
              />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              💡 आपण १५०० पैकी कोणतीही रक्कम (उदा. ₹५००, ₹१०००, ₹१५००) एडिट करून भरू शकता.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
            <button
              onClick={() => setIsPayModalOpen(false)}
              className="btn btn-secondary"
            >
              {t.admin.actions.cancel}
            </button>
            <button
              onClick={handlePaySubscription}
              disabled={!customPayAmount || parseInt(customPayAmount, 10) <= 0}
              className="btn btn-saffron"
              style={{ fontWeight: 700, gap: '6px' }}
            >
              <QrCode size={16} />
              <span>QR कोड स्कॅन करा व भरा ({formatINR(parseInt(customPayAmount, 10) || 0)})</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Live UPI QR Scanner Modal */}
      {memberProfile && (
        <UpiQrPaymentModal
          isOpen={isUpiQrModalOpen}
          onClose={() => setIsUpiQrModalOpen(false)}
          amount={parseInt(customPayAmount, 10) || (memberSummary?.remainingDue || MANDAL_CONFIG.annualSubscriptionFee)}
          title={`वार्षिक वर्गणी QR कोड स्कॅनर — FY ${MANDAL_CONFIG.currentFinancialYear}`}
          donorName={memberProfile.fullNameMarathi || memberProfile.fullName}
          donorPhone={memberProfile.phone}
          onSuccess={handleUpiQrSuccess}
        />
      )}
    </div>
  );
};
