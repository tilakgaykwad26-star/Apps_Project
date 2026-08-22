import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { MANDAL_CONFIG } from '../../config/constants';
import { formatINR } from '../../utils/currencyUtils';
import { Modal } from './Modal';
import { fireCelebrationConfetti } from '../../services/paymentService';
import {
  Copy,
  Check,
  CheckCircle,
  Smartphone,
  ExternalLink,
  MessageCircle,
  ShieldCheck
} from 'lucide-react';

interface UpiQrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  title: string;
  donorName: string;
  donorPhone: string;
  onSuccess: (paymentId: string, orderId: string, utrNumber?: string) => void;
}

export const UpiQrPaymentModal: React.FC<UpiQrPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  title,
  donorName,
  donorPhone,
  onSuccess
}) => {
  const [upiId] = useState<string>(() => {
    return localStorage.getItem('dm_custom_upi_id') || 'shekharkuthe30@okhdfcbank';
  });
  const [accountHolderName] = useState<string>('Chandrashekhar Kuthe');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');

  // Generate UPI payment URL and QR Code
  useEffect(() => {
    if (!isOpen) return;

    const cleanUpi = upiId.trim();
    const cleanName = encodeURIComponent(accountHolderName || 'Chandrashekhar Kuthe');
    const cleanNote = encodeURIComponent(`Durga Mandal: ${donorName ? donorName.slice(0, 15) : 'Seva'}`);

    // Standard NPCI UPI URI Scheme
    const upiUri = amount > 0
      ? `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${amount}&cu=INR&tn=${cleanNote}`
      : `upi://pay?pa=${cleanUpi}&pn=${cleanName}&cu=INR&tn=${cleanNote}`;

    QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating UPI QR code:', err);
      });
  }, [isOpen, amount, upiId, accountHolderName, donorName]);

  const handleCompletePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const paymentId = `upi_pay_${Date.now()}`;
      const orderId = `order_${Date.now()}`;

      fireCelebrationConfetti();
      onSuccess(paymentId, orderId, utrNumber.trim() || undefined);
      setIsProcessing(false);
      onClose();
    }, 300);
  };

  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent(accountHolderName || 'Chandrashekhar Kuthe');
  const cleanNote = encodeURIComponent(`Durga Mandal: ${donorName ? donorName.slice(0, 15) : 'Seva'}`);
  const amtParam = amount > 0 ? `&am=${amount}` : '';
  const baseParams = `pa=${cleanUpi}&pn=${cleanName}${amtParam}&cu=INR&tn=${cleanNote}`;

  const upiLink = `upi://pay?${baseParams}`;
  const gpayLink = `tez://upi/pay?${baseParams}`;
  const phonepeLink = `phonepe://pay?${baseParams}`;
  const paytmLink = `paytmmp://pay?${baseParams}`;

  const handleAppClick = (appLink: string) => {
    try {
      navigator.clipboard.writeText(cleanUpi);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 3000);
    } catch (e) {
      console.warn('Clipboard write error', e);
    }

    try {
      window.location.href = appLink;
    } catch (err) {
      console.warn('Protocol launch error', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'UPI QR पेमेंट (Google Pay / PhonePe)'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', maxWidth: '380px', margin: '0 auto' }}>

        {/* Payable Amount Header */}
        <div style={{
          width: '100%',
          backgroundColor: '#F3F4F6',
          border: '1px solid #E5E7EB',
          padding: '10px 14px',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>देय रक्कम (Amount):</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#871C1C' }}>
              {formatINR(amount)}
            </div>
          </div>
          {donorName && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>नाव:</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F2937' }}>
                {donorName}
              </div>
            </div>
          )}
        </div>

        {/* Google Pay Style Official QR Card */}
        <div style={{
          width: '100%',
          backgroundColor: '#F0F4F9',
          borderRadius: '20px',
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}>
          {/* User Profile Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#1E293B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem',
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}>
              🙏
            </div>
            <div style={{ fontSize: '1.18rem', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.2px' }}>
              {accountHolderName}
            </div>
          </div>

          {/* White QR Card with Center Emblem */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            padding: '16px 16px 12px 16px',
            width: '100%',
            maxWidth: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            position: 'relative'
          }}>
            <div style={{ position: 'relative', width: '220px', height: '220px' }}>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`UPI QR Code for ${upiId}`}
                  style={{ width: '100%', height: '100%', display: 'block', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>
                  QR कोड तयार होत आहे...
                </div>
              )}

              {/* Center GPay Emblem Badge */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '42px',
                height: '42px',
                backgroundColor: '#FFFFFF',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                border: '2px solid #FFFFFF'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4" />
                  <path d="M16.5 12c0-.34-.03-.68-.08-1H12v2h2.56c-.11.6-.45 1.11-.96 1.45v1.2h1.56c.91-.84 1.44-2.08 1.44-3.65z" fill="#FFFFFF" />
                  <path d="M12 16.5c1.22 0 2.24-.4 2.99-1.1l-1.56-1.2c-.41.28-.93.44-1.43.44-1.1 0-2.03-.74-2.36-1.74H7.98v1.25A4.49 4.49 0 0012 16.5z" fill="#34A853" />
                  <path d="M9.64 12.9a2.7 2.7 0 010-1.8V9.85H7.98a4.5 4.5 0 000 4.3l1.66-1.25z" fill="#FBBC05" />
                  <path d="M12 7.5c.66 0 1.26.23 1.73.67l1.3-1.3A4.47 4.47 0 0012 5.5a4.5 4.5 0 00-4.02 2.35l1.66 1.25c.33-1 1.26-1.74 2.36-1.74z" fill="#EA4335" />
                </svg>
              </div>
            </div>

            {/* UPI ID Text */}
            <div style={{
              marginTop: '12px',
              fontSize: '0.86rem',
              fontWeight: 600,
              color: '#374151',
              fontFamily: 'monospace',
              letterSpacing: '-0.3px',
              textAlign: 'center',
              wordBreak: 'break-all'
            }}>
              UPI ID: <span style={{ color: '#1E293B', fontWeight: 700 }}>{upiId}</span>
            </div>
          </div>

          {/* Subtext */}
          <div style={{
            marginTop: '12px',
            fontSize: '0.82rem',
            color: '#4B5563',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Smartphone size={15} color="#2563EB" />
            <span>Scan to pay with any UPI app</span>
          </div>
        </div>

        {/* Direct Mobile UPI App Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4B5563', textAlign: 'center' }}>
            📱 मोबाईलवर थेट ॲप उघडा (Tap to Pay):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <a
              href={gpayLink}
              onClick={() => handleAppClick(gpayLink)}
              className="btn btn-secondary btn-sm"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#4285F4',
                color: '#1A73E8',
                fontWeight: 700,
                fontSize: '0.82rem',
                justifyContent: 'center',
                padding: '8px 6px',
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              <span>🔵 Google Pay</span>
            </a>

            <a
              href={phonepeLink}
              onClick={() => handleAppClick(phonepeLink)}
              className="btn btn-secondary btn-sm"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#5F259F',
                color: '#5F259F',
                fontWeight: 700,
                fontSize: '0.82rem',
                justifyContent: 'center',
                padding: '8px 6px',
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              <span>🟣 PhonePe</span>
            </a>

            <a
              href={paytmLink}
              onClick={() => handleAppClick(paytmLink)}
              className="btn btn-secondary btn-sm"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#00BAF2',
                color: '#002970',
                fontWeight: 700,
                fontSize: '0.82rem',
                justifyContent: 'center',
                padding: '8px 6px',
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              <span>🔷 Paytm</span>
            </a>

            <a
              href={upiLink}
              onClick={() => handleAppClick(upiLink)}
              className="btn btn-secondary btn-sm"
              style={{
                backgroundColor: '#F3F4F6',
                borderColor: '#9CA3AF',
                color: '#1F2937',
                fontWeight: 700,
                fontSize: '0.82rem',
                justifyContent: 'center',
                padding: '8px 6px',
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              <ExternalLink size={13} />
              <span>All UPI Apps</span>
            </a>
          </div>
        </div>

        {/* Payment Verification & Completion Action */}
        <div style={{ width: '100%', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
              <span>१२ अंकी UTR / Trans Ref No. (Google Pay / PhonePe क्र.):</span>
              <span style={{ color: '#6B7280', fontWeight: 400 }}>(ऐच्छिक/Optional)</span>
            </label>
            <input
              type="text"
              maxLength={12}
              placeholder="उदा. 423810192831"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                letterSpacing: '1px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleCompletePayment}
            disabled={isProcessing}
            className="btn btn-primary btn-lg"
            style={{
              width: '100%',
              gap: '8px',
              backgroundColor: '#16A34A',
              borderColor: '#16A34A',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1rem',
              padding: '12px',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
            }}
          >
            <CheckCircle size={18} />
            <span>{isProcessing ? 'नोंद होत आहे...' : '✅ मी ऑनलाईन पेमेंट केले आहे (पावती नोंदवा)'}</span>
          </button>

          <div style={{ fontSize: '0.78rem', color: '#4B5563', textAlign: 'center', padding: '6px 4px', lineHeight: 1.4, backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #F3F4F6' }}>
            🔒 <em>पेमेंट केल्यानंतर मंडळ ॲडमिन बँक खात्यात पडताळणी करतील व <strong>{donorPhone ? `+91 ${donorPhone}` : 'आपल्या WhatsApp वर'}</strong> अधिकृत पावती पाठवली जाईल.</em>
          </div>
        </div>

      </div>
    </Modal>
  );
};
