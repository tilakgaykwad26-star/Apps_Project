import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useMandal } from '../context/MandalContext';
import { MANDAL_CONFIG } from '../config/constants';
import { Member, MemberType, MemberCategory } from '../types/auth';
import { formatIndianDate, formatMarathiDate, toMarathiDigits } from '../utils/dateUtils';
import { formatINR } from '../utils/currencyUtils';
import { isValidIndianPhone } from '../utils/validationUtils';
import { processRazorpayCheckout } from '../services/paymentService';
import { generateSubscriptionReceiptPDF } from '../services/receiptService';
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
  Award
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const MemberPortalPage: React.FC = () => {
  const { language, t, isMarathi } = useLanguage();
  const { user, memberProfile, isAuthenticated, loginWithPhone, sendOtp, logout, updateMemberProfile } = useAuth();
  const { addMember, addMemberPayment, getMemberSummary, payments } = useMandal();
  const { showSuccess, showError } = useNotification();

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
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
  const [isPayingSubscription, setIsPayingSubscription] = useState(false);

  // Computed Financial Summary for Member
  const memberSummary = memberProfile ? getMemberSummary(memberProfile.id) : null;
  const memberPaymentHistory = memberProfile
    ? payments.filter((p) => p.memberId === memberProfile.id && p.paymentStatus === 'successful')
    : [];

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIndianPhone(loginPhone)) {
      showError('कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.');
      return;
    }
    await sendOtp(loginPhone);
    setIsOtpSent(true);
    showSuccess('६ अंकी OTP आपल्या मोबाईलवर पाठवला आहे (परीक्षणासाठी: 123456).');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    // BUG 11 fix: validate exactly 6 digits (not just >= 4)
    if (!loginOtp || loginOtp.length !== 6) {
      showError('कृपया सहा अंकी OTP प्रविष्ट करा.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const ok = await loginWithPhone(loginPhone, loginOtp);
      if (ok) {
        showSuccess('यशस्वीरित्या लॉगिन झाले!');
        setActiveMode('profile');
      } else {
        showError('चुकीचा OTP. कृपया पुन्हा प्रयत्न करा (डेमो: 123456).');
      }
    } catch (err) {
      showError(t.common.errorOccurred);
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

  const handlePaySubscription = () => {
    if (!memberProfile || !memberSummary) return;

    const amountToPay = memberSummary.remainingDue > 0 ? memberSummary.remainingDue : MANDAL_CONFIG.annualSubscriptionFee;
    setIsPayingSubscription(true);

    processRazorpayCheckout({
      amount: amountToPay,
      donorName: memberProfile.fullNameMarathi || memberProfile.fullName,
      donorPhone: memberProfile.phone,
      donorEmail: memberProfile.email,
      description: `वार्षिक सभासद वर्गणी FY ${MANDAL_CONFIG.currentFinancialYear}`,
      onSuccess: async (paymentId, orderId) => {
        try {
          const savedPayment = await addMemberPayment({
            memberId: memberProfile.id,
            memberName: memberProfile.fullNameMarathi || memberProfile.fullName,
            memberPhone: memberProfile.phone,
            financialYear: MANDAL_CONFIG.currentFinancialYear,
            amount: amountToPay,
            paymentType: 'annual_subscription',
            paymentMethod: 'razorpay_upi',
            paymentStatus: 'successful',
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            recordedBy: 'online'
          });

          showSuccess('वार्षिक वर्गणी यशस्वीरित्या जमा झाली! पावती डाउनलोड होत आहे.');
          setIsPayModalOpen(false);

          // Download receipt
          const doc = generateSubscriptionReceiptPDF(savedPayment);
          doc.save(`Durga_Mandal_Subscription_${savedPayment.receiptNumber.replace(/\//g, '_')}.pdf`);
        } catch (e) {
          showError('पेमेंट रेकॉर्ड नोंदवताना त्रुटी आली.');
        } finally {
          setIsPayingSubscription(false);
        }
      },
      onFailure: () => {
        setIsPayingSubscription(false);
        showError('पेमेंट रद्द केले किंवा अयशस्वी झाले.');
      },
      // BUG 8 fix: reset loading state when user dismisses the payment modal
      onDismiss: () => {
        setIsPayingSubscription(false);
      }
    });
  };

  const handleDownloadReceipt = (payment: any) => {
    const doc = generateSubscriptionReceiptPDF(payment);
    doc.save(`Durga_Mandal_Subscription_${payment.receiptNumber.replace(/\//g, '_')}.pdf`);
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)', paddingTop: 'var(--space-lg)' }}>
      {/* 1. Header */}
      <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.1rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
          {t.member.portalTitle}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          {language === 'en'
            ? 'Access your digital ID card, manage annual subscription, and download official receipts.'
            : 'आपले डिजिटल ओळखपत्र, वार्षिक वर्गणी जमा करण्याची सुविधा व अधिकृत पावती इतिहास'}
        </p>
      </div>

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
                    मोबाईल: +91 {memberProfile.phone}
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
                  ● {memberSummary?.status === 'paid' ? 'वार्षिक वर्गणी पूर्ण (Active)' : 'वर्गणी बाकी'}
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
                  <h2 style={{ fontSize: '1.3rem', color: 'var(--color-maroon-800)' }}>
                    वार्षिक वर्गणी स्थिती
                  </h2>
                </div>

                {memberSummary?.status === 'paid' ? (
                  <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                    <CheckCircle size={14} /> {t.member.statusPaid}
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                    <AlertCircle size={14} /> {t.member.statusPending}
                  </span>
                )}
              </div>

              <div style={{
                backgroundColor: 'var(--color-surface-subtle)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>नियोजित वार्षिक शुल्क</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {formatINR(memberSummary?.totalAnnualDue || 500)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>जमा केलेली रक्कम</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-success)' }}>
                    {formatINR(memberSummary?.totalPaid || 0)}
                  </div>
                </div>
              </div>

              {memberSummary?.status !== 'paid' ? (
                <div style={{ marginTop: 'auto' }}>
                  <button
                    onClick={() => setIsPayModalOpen(true)}
                    className="btn btn-saffron btn-lg"
                    style={{ width: '100%', gap: '8px' }}
                  >
                    <CreditCard size={18} />
                    <span>{t.member.paySubscriptionBtn} ({formatINR(memberSummary?.remainingDue || 500)})</span>
                  </button>
                </div>
              ) : (
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

          {!isOtpSent ? (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label form-label-required">{t.donations.mobileNumber}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    className="form-input"
                    style={{ paddingLeft: '44px' }}
                    placeholder="9822112233"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                <span>{t.member.getOtp}</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: 'var(--space-sm)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>नवीन सभासद आहात? </span>
                <button
                  type="button"
                  onClick={() => setActiveMode('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-maroon-700)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {t.member.registerTitle}
                </button>
              </div>

              {/* Super Admin & Administrative Direct Access Box */}
              <div style={{
                marginTop: 'var(--space-md)',
                paddingTop: 'var(--space-md)',
                borderTop: '2px dashed var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--color-maroon-800)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <ShieldCheck size={16} color="var(--color-maroon-700)" />
                  <span>प्रशासकीय थेट प्रवेश (Administrative Access):</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const { switchRoleForDemo } = useAuth as any;
                    }}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await loginWithPhone('9822000001', '123456');
                      showSuccess('👑 Super Admin म्हणून यशस्वीरित्या लॉगिन झाले!');
                      setActiveMode('profile');
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '6px 8px', justifyContent: 'flex-start', gap: '4px' }}
                  >
                    <span>👑 Super Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await loginWithPhone('9822055667', '123456');
                      showSuccess('💰 खजिनदार (Treasurer) म्हणून लॉगिन झाले!');
                      setActiveMode('profile');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '6px 8px', justifyContent: 'flex-start', gap: '4px' }}
                  >
                    <span>💰 खजिनदार (Treasurer)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await loginWithPhone('9822044556', '123456');
                      showSuccess('📋 कार्यकारणी प्रमुख म्हणून लॉगिन झाले!');
                      setActiveMode('profile');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '6px 8px', justifyContent: 'flex-start', gap: '4px' }}
                  >
                    <span>📋 कार्यकारणी प्रमुख</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await loginWithPhone('9822112233', '123456');
                      showSuccess('👤 सर्वसाधारण सभासद म्हणून लॉगिन झाले!');
                      setActiveMode('profile');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '6px 8px', justifyContent: 'flex-start', gap: '4px' }}
                  >
                    <span>👤 सभासद (Member)</span>
                  </button>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  टीप: वरील कोणत्याही बटणावर क्लिक करून थेट संबंधित भूमिकेत प्रवेश करता येईल.
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label form-label-required">{t.member.enterOtp}</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="form-input"
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.4rem', fontWeight: 700 }}
                  placeholder="123456"
                  value={loginOtp}
                  onChange={(e) => setLoginOtp(e.target.value)}
                />
                <span className="form-hint">डेमो प्रमाणीकरण: 123456 प्रविष्ट करा</span>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                {isLoggingIn ? t.common.loading : t.member.verifyOtp}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  मोबाईल नंबर बदला (Change Number)
                </button>
              </div>
            </form>
          )}
        </div>
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

          <div className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span>वार्षिक शुल्क रक्कम:</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--color-maroon-800)' }}>
              {formatINR(memberSummary?.remainingDue || MANDAL_CONFIG.annualSubscriptionFee)}
            </strong>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            पेमेंट पूर्ण होताच अधिकृत संगणकीकृत पावती आपणास त्वरित प्राप्त होईल आणि ओळखपत्रावर 'वर्गणी पूर्ण (Paid)' स्थिती अद्ययावत केली जाईल.
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
            <button
              onClick={() => setIsPayModalOpen(false)}
              className="btn btn-secondary"
            >
              {t.admin.actions.cancel}
            </button>
            <button
              onClick={handlePaySubscription}
              disabled={isPayingSubscription}
              className="btn btn-saffron"
            >
              {isPayingSubscription ? 'प्रक्रिया सुरू आहे...' : 'सुरक्षित पेमेंट करा (Razorpay)'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
