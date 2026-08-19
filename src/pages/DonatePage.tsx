import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { DonationType, Donation } from '../types/donation';
import { MANDAL_CONFIG } from '../config/constants';
import { formatINR, numberToMarathiWords, numberToEnglishWords } from '../utils/currencyUtils';
import { isValidIndianPhone, isValidPAN, isValidEmail } from '../utils/validationUtils';
import { generateDonationReceiptPDF, sendDonationReceiptWhatsApp } from '../services/receiptService';
import { useNotification } from '../context/NotificationContext';
import {
  HeartHandshake,
  ShieldCheck,
  Download,
  Share2,
  CheckCircle,
  Sparkles,
  Lock,
  Receipt,
  FileCheck,
  ArrowRight,
  Info,
  CreditCard,
  Building,
  QrCode
} from 'lucide-react';
import { UpiQrPaymentModal } from '../components/common/UpiQrPaymentModal';

export const DonatePage: React.FC = () => {
  const { language, t, isMarathi } = useLanguage();
  const { addDonation } = useMandal();
  const { showSuccess, showError } = useNotification();

  const [selectedType, setSelectedType] = useState<DonationType>('annadaan');
  const [selectedAmount, setSelectedAmount] = useState<number>(1101);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustomSelected, setIsCustomSelected] = useState<boolean>(false);

  // Donor Details
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPan, setDonorPan] = useState('');
  const [donorCity, setDonorCity] = useState('पुणे');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Success State
  const [completedDonation, setCompletedDonation] = useState<Donation | null>(null);
  const [isUpiQrModalOpen, setIsUpiQrModalOpen] = useState(false);

  const donationCategories: { key: DonationType; label: string; desc: string }[] = [
    {
      key: 'annadaan',
      label: t.donations.typeAnnadaan,
      desc: '१०,०००+ भाविकांसाठी अखंड सात्विक महाप्रसाद व भोजन सेवा'
    },
    {
      key: 'maharati',
      label: t.donations.typeMaharati,
      desc: '१०८ दिव्यांची दीपोत्सव महाआरती, समई व होम-हवन सेवा'
    },
    {
      key: 'special_utsav',
      label: t.donations.typeSpecial,
      desc: 'नवरात्रोत्सवाचे मुख्य प्रायोजकत्व व मंडप सुशोभीकरण'
    },
    {
      key: 'murti_decoration',
      label: t.donations.typeMurti,
      desc: 'श्री दुर्गा मातेचा सुवर्ण-पुष्प शृंगार व अलंकार सेवा'
    },
    {
      key: 'general',
      label: t.donations.typeGeneral,
      desc: 'मंडळाचे शैक्षणिक, आरोग्य व सामाजिक उपक्रम निधी'
    },
  ];

  const presetAmounts = [501, 1101, 2101, 5101, 11000, 25000];

  const getEffectiveAmount = (): number => {
    if (isCustomSelected) {
      return parseInt(customAmount, 10) || 0;
    }
    return selectedAmount;
  };

  const handlePresetSelect = (amt: number) => {
    setSelectedAmount(amt);
    setIsCustomSelected(false);
    setCustomAmount('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    setIsCustomSelected(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = getEffectiveAmount();

    if (amount < 11) {
      showError('कृपया किमान ₹ ११ देणगी रक्कम प्रविष्ट करा.');
      return;
    }

    if (!isAnonymous && !donorName.trim()) {
      showError('कृपया देणगीदाराचे पूर्ण नाव प्रविष्ट करा.');
      return;
    }

    if (!isValidIndianPhone(donorPhone)) {
      showError('कृपया वैध १० अंकी मोबाईल नंबर टाका (पावती पाठवण्यासाठी).');
      return;
    }

    if (donorPan && !isValidPAN(donorPan)) {
      showError('कृपया वैध पॅन नंबर (PAN) प्रविष्ट करा.');
      return;
    }

    // Open UPI QR Code Scanner Modal directly
    setIsUpiQrModalOpen(true);
  };

  const handleUpiQrSuccess = async (paymentId: string, orderId: string, utr?: string) => {
    const amount = getEffectiveAmount();
    const typeObj = donationCategories.find((c) => c.key === selectedType);
    try {
      const savedDonation = await addDonation({
        amount,
        donorName: isAnonymous ? 'Anonymous Devotee' : donorName.trim(),
        donorPhone: donorPhone.trim(),
        donorEmail: donorEmail.trim() || undefined,
        donorPan: donorPan.trim().toUpperCase() || undefined,
        donorCity: donorCity.trim() || 'पुणे',
        donationType: selectedType,
        donationTypeMarathi: typeObj?.label || 'देणगी',
        paymentMethod: 'upi_qr',
        paymentStatus: 'pending',
        razorpayOrderId: orderId,
        razorpayPaymentId: utr ? `UTR_${utr}` : paymentId,
        isAnonymous
      });

      setCompletedDonation(savedDonation);
      showSuccess('देणगी समर्पण यशस्वीरित्या नोंदवले! मंडळ ॲडमिन बँक पडताळणीनंतर WhatsApp वर अधिकृत पावती पाठवली जाईल.');
    } catch (err) {
      showError('पेमेंट रेकॉर्ड जतन करताना अडचण आली.');
    }
  };

  const handleDownloadPDF = () => {
    if (completedDonation) {
      const doc = generateDonationReceiptPDF(completedDonation);
      doc.save(`Durga_Mandal_Receipt_${completedDonation.receiptNumber.replace(/\//g, '_')}.pdf`);
    }
  };

  const handleShareWhatsApp = () => {
    if (!completedDonation) return;
    sendDonationReceiptWhatsApp(completedDonation);
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)', paddingTop: 'var(--space-lg)' }}>
      {/* 1. Header */}
      <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--color-saffron-50)',
          color: 'var(--color-saffron-600)',
          border: '1px solid var(--color-saffron-100)',
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '8px'
        }}>
          <Sparkles size={16} />
          <span>डिजिटल देणगी व सेवा समर्पण</span>
        </div>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
          {t.donations.title}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.98rem' }}>
          {t.donations.subtitle}
        </p>
      </div>

      {/* 2. Success / Pending Modal / Card State */}
      {completedDonation ? (
        <div className="card" style={{
          maxWidth: '680px',
          margin: '0 auto',
          textAlign: 'center',
          padding: 'var(--space-2xl) var(--space-xl)',
          border: completedDonation.paymentStatus === 'pending' ? '2px solid #F59E0B' : '2px solid var(--color-gold-500)',
          backgroundColor: '#fff',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: completedDonation.paymentStatus === 'pending' ? '#FEF3C7' : 'var(--color-success-bg)',
            color: completedDonation.paymentStatus === 'pending' ? '#D97706' : 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-md) auto'
          }}>
            <CheckCircle size={40} />
          </div>

          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
            {completedDonation.paymentStatus === 'pending' ? 'देणगी नोंदणी यशस्वी! (पडताळणी प्रलंबित)' : t.donations.paymentSuccessTitle}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
            {completedDonation.paymentStatus === 'pending'
              ? `आपली ₹${completedDonation.amount} ची देणगी नोंदणी स्वीकारली आहे. मंडळ ॲडमिनकडून बँक खात्यात पडताळणी पूर्ण होताच आपल्या WhatsApp (+91 ${completedDonation.donorPhone}) वर अधिकृत पावती पाठवली जाईल.`
              : t.donations.paymentSuccessMsg}
          </p>

          <div style={{
            backgroundColor: 'var(--color-surface-subtle)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-xl)',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.9rem'
          }}>
            <div className="flex-between">
              <span style={{ color: 'var(--color-text-muted)' }}>{t.donations.receiptNoLabel}:</span>
              <strong style={{ color: 'var(--color-maroon-800)', fontFamily: 'monospace' }}>{completedDonation.receiptNumber}</strong>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--color-text-muted)' }}>दान रक्कम:</span>
              <strong style={{ color: 'var(--color-maroon-800)', fontSize: '1.1rem' }}>{formatINR(completedDonation.amount)}</strong>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--color-text-muted)' }}>देणगीदार:</span>
              <strong>{completedDonation.isAnonymous ? 'गुप्त दान' : completedDonation.donorName}</strong>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--color-text-muted)' }}>प्रकार:</span>
              <span>{completedDonation.donationTypeMarathi}</span>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--color-text-muted)' }}>पडताळणी स्थिती:</span>
              <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>
                ⏳ मंडळ ॲडमिन पडताळणी प्रलंबित
              </span>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--color-text-muted)' }}>WhatsApp नंबर:</span>
              <strong>+91 {completedDonation.donorPhone}</strong>
            </div>
          </div>

          {completedDonation.paymentStatus === 'successful' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', justifyContent: 'center' }}>
              <button
                onClick={handleDownloadPDF}
                className="btn btn-primary btn-lg"
                style={{ gap: '8px' }}
              >
                <Download size={18} />
                <span>{t.donations.downloadReceipt}</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="btn btn-saffron btn-lg"
                style={{ gap: '8px', backgroundColor: '#25D366', borderColor: '#25D366' }}
              >
                <Share2 size={18} />
                <span>{t.donations.shareWhatsApp}</span>
              </button>
            </div>
          )}

          <div style={{ marginTop: 'var(--space-xl)' }}>
            <button
              onClick={() => {
                setCompletedDonation(null);
                setDonorName('');
                setDonorPhone('');
                setCustomAmount('');
              }}
              className="btn btn-secondary btn-md"
            >
              + दुसरी देणगी नोंदवा (Make Another Donation)
            </button>
          </div>
        </div>
      ) : (
        /* 3. Main 4-Step Donation Form */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-xl)',
          maxWidth: '1050px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Left Column: Category & Amount Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {/* Step 1: Donation Type */}
            <div className="card">
              <h2 style={{ fontSize: '1.15rem', color: 'var(--color-maroon-800)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-maroon-700)', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>१</span>
                <span>{t.donations.selectType}</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {donationCategories.map((cat) => {
                  const isSelected = selectedType === cat.key;
                  return (
                    <div
                      key={cat.key}
                      onClick={() => setSelectedType(cat.key)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--color-maroon-700)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? 'var(--color-maroon-50)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? 'var(--color-maroon-800)' : 'var(--color-text-primary)' }}>
                          {cat.label}
                        </div>
                        {isSelected && <CheckCircle size={18} color="var(--color-maroon-700)" />}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {cat.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Amount Selection */}
            <div className="card">
              <h2 style={{ fontSize: '1.15rem', color: 'var(--color-maroon-800)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-maroon-700)', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>२</span>
                <span>{t.donations.amountLabel}</span>
              </h2>

              {/* Presets */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                {presetAmounts.map((amt) => {
                  const isSelected = !isCustomSelected && selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetSelect(amt)}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--color-gold-500)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? 'var(--color-gold-100)' : 'var(--color-surface)',
                        color: isSelected ? 'var(--color-maroon-900)' : 'var(--color-text-primary)',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      ₹ {amt}
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount */}
              <div className="form-group">
                <label className="form-label">{t.donations.customAmount}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-text-muted)' }}>₹</span>
                  <input
                    type="text"
                    placeholder="उदा. ५००१"
                    value={customAmount}
                    onChange={handleCustomChange}
                    className="form-input"
                    style={{ paddingLeft: '28px', fontWeight: 700, fontSize: '1.05rem' }}
                  />
                </div>
              </div>

              {/* Amount In Marathi Words Preview */}
              <div style={{
                backgroundColor: 'var(--color-surface-subtle)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                color: 'var(--color-maroon-800)',
                fontWeight: 600
              }}>
                अक्षरी: {numberToMarathiWords(getEffectiveAmount())}
              </div>
            </div>
          </div>

          {/* Right Column: Donor Info & Payment Trigger */}
          <div className="card card-gold-accent" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--color-maroon-800)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-maroon-700)', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>३</span>
                <span>{t.donations.donorInfoTitle}</span>
              </h2>

              <div className="form-group">
                <label className="form-label form-label-required">{t.donations.fullName}</label>
                <input
                  type="text"
                  required={!isAnonymous}
                  disabled={isAnonymous}
                  placeholder="आपले संपूर्ण नाव"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">{t.donations.mobileNumber}</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="१० अंकी मोबाईल नंबर"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="form-input"
                />
                <span className="form-hint">डिजिटल पावती WhatsApp वर त्वरित पाठवण्यासाठी</span>
              </div>

              <div className="form-group">
                <label className="form-label">{t.donations.panNumber}</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="ABCDE1234F (आयकर सवलतीसाठी)"
                  value={donorPan}
                  onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                  className="form-input"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.donations.address}</label>
                <input
                  type="text"
                  placeholder="गाव / शहर (उदा. कसबा पेठ, पुणे)"
                  value={donorCity}
                  onChange={(e) => setDonorCity(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Anonymous Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-maroon-700)' }}
                />
                <label htmlFor="anonymousCheck" style={{ fontSize: '0.88rem', cursor: 'pointer', fontWeight: 500 }}>
                  {t.donations.anonymousCheckbox}
                </label>
              </div>

              {/* Summary and Pay Button */}
              <div style={{
                borderTop: '2px solid var(--color-border)',
                paddingTop: 'var(--space-md)',
                marginTop: 'var(--space-xs)'
              }}>
                <div className="flex-between" style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>एकूण देणगी रक्कम:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-maroon-800)' }}>{formatINR(getEffectiveAmount())}</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || getEffectiveAmount() < 11}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', gap: '8px', fontSize: '1.05rem' }}
                >
                  <Lock size={18} />
                  <span>{isProcessing ? 'प्रक्रिया सुरू आहे...' : t.donations.proceedToPay}</span>
                </button>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)',
                textAlign: 'center'
              }}>
                <ShieldCheck size={14} color="#2E7D32" />
                <span>{t.donations.securityNote}</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live UPI QR Scanner Modal for Donations */}
      <UpiQrPaymentModal
        isOpen={isUpiQrModalOpen}
        onClose={() => setIsUpiQrModalOpen(false)}
        amount={getEffectiveAmount()}
        title="श्री दुर्गा मंडळ — देणगी UPI QR कोड स्कॅनर"
        donorName={isAnonymous ? 'Anonymous Devotee' : (donorName || 'भाविक')}
        donorPhone={donorPhone}
        onSuccess={handleUpiQrSuccess}
      />
    </div>
  );
};
