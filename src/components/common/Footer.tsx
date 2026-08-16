import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MANDAL_CONFIG } from '../../config/constants';
import { MapPin, Phone, Mail, QrCode, ExternalLink, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();

  return (
    <footer style={{
      backgroundColor: '#1E1B18',
      color: '#E6DED4',
      paddingTop: 'var(--space-2xl)',
      paddingBottom: 'var(--space-xl)',
      borderTop: '3px solid var(--color-gold-500)',
      marginTop: 'var(--space-2xl)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-xl)',
          marginBottom: 'var(--space-xl)'
        }}>
          {/* Col 1: Trust & Mandal Identity */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-maroon-700)',
                border: '1.5px solid var(--color-gold-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: '1.1rem' }}>ॐ</span>
              </div>
              <h3 style={{ color: '#FAF7F2', fontSize: '1.2rem', margin: 0 }}>
                {language === 'en' ? MANDAL_CONFIG.nameEnglish : MANDAL_CONFIG.nameMarathi}
              </h3>
            </div>
            <p style={{ color: '#B5A898', fontSize: '0.85rem', lineHeight: 1.6 }}>
              {language === 'en'
                ? 'Dedicated to the service of Goddess Durga, promoting culture, education, and social unity since 1984.'
                : '१९८४ पासून अखंडपणे दुर्गा मातेची उपासना, मराठी संस्कृतीचे संवर्धन आणि समाजोपयोगी उपक्रमांची परंपरा.'}
            </p>
            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#D4AF37' }}>
              <strong>{t.about.regNumber}:</strong><br />
              {MANDAL_CONFIG.registrationNumber}
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 style={{ color: '#FAF7F2', marginBottom: '16px', fontSize: '1rem', borderBottom: '2px solid var(--color-maroon-700)', paddingBottom: '6px', display: 'inline-block' }}>
              {t.quickActions.title}
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              <li><a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} style={{ color: '#E6DED4' }}>{t.nav.home}</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }} style={{ color: '#E6DED4' }}>{t.nav.about}</a></li>
              <li><a href="#events" onClick={(e) => { e.preventDefault(); onNavigate('events'); }} style={{ color: '#E6DED4' }}>{t.nav.events}</a></li>
              <li><a href="#gallery" onClick={(e) => { e.preventDefault(); onNavigate('gallery'); }} style={{ color: '#E6DED4' }}>{t.nav.gallery}</a></li>
              <li><a href="#notices" onClick={(e) => { e.preventDefault(); onNavigate('notices'); }} style={{ color: '#E6DED4' }}>{t.nav.notices}</a></li>
              <li><a href="#donate" onClick={(e) => { e.preventDefault(); onNavigate('donate'); }} style={{ color: '#FF9800', fontWeight: 600 }}>{t.nav.donate} (Online Seva)</a></li>
              <li><a href="#members" onClick={(e) => { e.preventDefault(); onNavigate('members'); }} style={{ color: '#E6DED4' }}>{t.nav.members}</a></li>
            </ul>
          </div>

          {/* Col 3: Contact & Temple Address */}
          <div>
            <h4 style={{ color: '#FAF7F2', marginBottom: '16px', fontSize: '1rem', borderBottom: '2px solid var(--color-maroon-700)', paddingBottom: '6px', display: 'inline-block' }}>
              {t.nav.contact}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#B5A898' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <MapPin size={16} color="#FF9800" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{language === 'en' ? MANDAL_CONFIG.addressEnglish : MANDAL_CONFIG.addressMarathi}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Phone size={16} color="#FF9800" style={{ flexShrink: 0 }} />
                <span>
                  <a href={`tel:${MANDAL_CONFIG.phonePrimary.replace(/[^0-9+]/g, '')}`} style={{ color: '#FAF7F2', textDecoration: 'underline' }}>{MANDAL_CONFIG.phonePrimary}</a>
                  {' / '}
                  <a href={`tel:${MANDAL_CONFIG.phoneSecondary.replace(/[^0-9+]/g, '')}`} style={{ color: '#FAF7F2', textDecoration: 'underline' }}>{MANDAL_CONFIG.phoneSecondary}</a>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Mail size={16} color="#FF9800" style={{ flexShrink: 0 }} />
                <span>{MANDAL_CONFIG.email}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                <QrCode size={16} color="#D4AF37" style={{ flexShrink: 0 }} />
                <span><strong>UPI ID:</strong> {MANDAL_CONFIG.officialUpiId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: 'var(--space-md)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: '#8A8075'
        }}>
          <div>
            © {new Date().getFullYear()} {language === 'en' ? MANDAL_CONFIG.nameEnglish : MANDAL_CONFIG.nameMarathi}. {t.common.copyright}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Made with devotion & community spirit</span>
            <Heart size={12} color="#E65100" fill="#E65100" />
          </div>
        </div>
      </div>
    </footer>
  );
};
