import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { MANDAL_CONFIG } from '../config/constants';
import {
  PhoneCall,
  Mail,
  MapPin,
  ExternalLink,
  MessageSquare,
  Send,
  Sparkles,
  Share2,
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const ContactPage: React.FC = () => {
  const { language, t, isMarathi } = useLanguage();
  const { committee } = useMandal();
  const { showSuccess, showError } = useNotification();

  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderPhone || !messageText) {
      showError('कृपया सर्व आवश्यक माहिती प्रविष्ट करा.');
      return;
    }
    setIsSent(true);
    showSuccess('आपला संदेश मंडळाच्या सचिवालयाकडे पाठवला गेला आहे!');
    setSenderName('');
    setSenderPhone('');
    setMessageText('');
    setTimeout(() => setIsSent(false), 4000);
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)', paddingTop: 'var(--space-lg)' }}>
      {/* 1. Header */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.1rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
          {t.nav.contact}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          {language === 'en'
            ? 'Get in touch with Mandal trustees, office bearers, or visit our office in Chop, Gadchiroli.'
            : 'मंडळाचे पदाधिकारी, विश्वस्त यांच्याशी थेट संपर्क साधा किंवा चोप येथील कार्यालयास भेट द्या.'}
        </p>
      </div>

      {/* 2. Key Contact Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 'var(--space-md)'
      }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '4px solid var(--color-maroon-700)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--color-maroon-50)', color: 'var(--color-maroon-700)' }}>
              <PhoneCall size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-maroon-800)' }}>थेट संपर्क क्रमांक</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>कार्यालयीन वेळ: सकाळी ९ ते रात्री ९</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
            <a href={`tel:${MANDAL_CONFIG.phonePrimary.replace(/\s/g, '')}`} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <PhoneCall size={14} color="var(--color-maroon-700)" />
              <span>{MANDAL_CONFIG.phonePrimary} (अध्यक्ष)</span>
            </a>
            <a href={`tel:${MANDAL_CONFIG.phoneSecondary.replace(/\s/g, '')}`} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <PhoneCall size={14} color="var(--color-maroon-700)" />
              <span>{MANDAL_CONFIG.phoneSecondary} (सचिव)</span>
            </a>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '4px solid var(--color-saffron-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--color-saffron-50)', color: 'var(--color-saffron-600)' }}>
              <Mail size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-maroon-800)' }}>ईमेल व सोशल मीडिया</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>पत्रव्यवहार व अधिकृत अपडेट्स</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
            <a href={`mailto:${MANDAL_CONFIG.email}`} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <Mail size={14} color="var(--color-saffron-600)" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{MANDAL_CONFIG.email}</span>
            </a>
            <a href={MANDAL_CONFIG.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <ExternalLink size={14} color="#E1306C" />
              <span>Instagram: @ig_aaibhawani_official</span>
            </a>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '4px solid var(--color-gold-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--color-gold-50)', color: 'var(--color-gold-700)' }}>
              <MapPin size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-maroon-800)' }}>कार्यालय पत्ता</h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            {language === 'en' ? MANDAL_CONFIG.addressEnglish : MANDAL_CONFIG.addressMarathi}
          </p>
          <div style={{ marginTop: 'auto' }}>
            <a href={MANDAL_CONFIG.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              <ExternalLink size={14} />
              <span>{t.common.directions}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3. Committee Contacts Grid */}
      <section>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--color-maroon-800)', marginBottom: 'var(--space-md)' }}>
          कार्यकारणी पदाधिकारी थेट संपर्क
        </h2>
        <div className="grid-3">
          {committee.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid var(--color-gold-500)' }}>
                <img src={item.photoUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-maroon-800)' }}>
                  {isMarathi ? item.nameMarathi : item.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-saffron-600)', fontWeight: 600, marginBottom: '4px' }}>
                  {isMarathi ? item.designationMarathi : item.designationEnglish}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  <a
                    href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                    className="btn btn-primary btn-sm"
                    style={{
                      fontSize: '0.78rem',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      textDecoration: 'none',
                      backgroundColor: 'var(--color-maroon-700)',
                      color: '#ffffff'
                    }}
                    title="थेट कॉल करा (Direct Call)"
                  >
                    <PhoneCall size={12} />
                    <span>{item.phone}</span>
                  </a>
                  <a
                    href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontSize: '0.78rem',
                      padding: '4px 8px',
                      borderRadius: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none',
                      backgroundColor: '#25D366',
                      color: '#ffffff',
                      borderColor: '#25D366'
                    }}
                    title="WhatsApp मेसेज करा"
                  >
                    <MessageCircle size={12} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Inquiry / Feedback Form */}
      <div className="card card-gold-accent" style={{ maxWidth: '650px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '1.3rem', color: 'var(--color-maroon-800)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={20} color="var(--color-maroon-700)" />
          <span>मंडळाला संदेश किंवा सूचना पाठवा</span>
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          आपल्या सूचना, उत्सव अभिप्राय किंवा सेवेबद्दल विचारणा करण्यासाठी खालील फॉर्म भरा.
        </p>

        {isSent ? (
          <div style={{ padding: 'var(--space-lg)', textAlign: 'center', backgroundColor: 'var(--color-success-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>
            <CheckCircle size={36} style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>संदेश यशस्वीरित्या पाठवला गेला आहे!</div>
            <div style={{ fontSize: '0.85rem' }}>आमचे प्रतिनिधी लवकरच आपल्याशी संपर्क साधतील.</div>
          </div>
        ) : (
          <form onSubmit={handleInquirySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div className="form-group">
              <label className="form-label form-label-required">{t.donations.fullName}</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="आपले पूर्ण नाव"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">{t.donations.mobileNumber}</label>
              <input
                type="tel"
                required
                maxLength={10}
                className="form-input"
                placeholder="१० अंकी मोबाईल नंबर"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">आपला संदेश / अभिप्राय</label>
              <textarea
                required
                rows={4}
                className="form-textarea"
                placeholder="आपला संदेश किंवा विचारणा येथे टाईप करा..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>

            <div style={{ marginTop: 'var(--space-xs)' }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', gap: '8px' }}>
                <Send size={18} />
                <span>संदेश पाठवा (Send Message)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
