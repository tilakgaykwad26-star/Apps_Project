import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { NoticePriority } from '../types/notice';
import { formatMarathiDate, toMarathiDigits } from '../utils/dateUtils';
import {
  Bell,
  AlertTriangle,
  FileText,
  Download,
  Calendar,
  User,
  Search,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { useNotification } from '../context/NotificationContext';

export const NoticesPage: React.FC = () => {
  const { language, t, isMarathi } = useLanguage();
  const { notices } = useMandal();
  const { showSuccess } = useNotification();

  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredNotices = notices.filter((n) => {
    if (!n.isPublished) return false;
    const priorityMatch = filterPriority === 'all' || n.priority === filterPriority;
    const textMatch = (n.title + (n.titleMarathi || '') + n.message + (n.messageMarathi || '')).toLowerCase().includes(searchTerm.toLowerCase());
    return priorityMatch && textMatch;
  });

  const getPriorityBadge = (priority: NoticePriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="badge badge-danger">● {t.notices.priorityUrgent}</span>;
      case 'important':
        return <span className="badge badge-warning">● {t.notices.priorityImportant}</span>;
      default:
        return <span className="badge badge-success">● {t.notices.priorityNormal}</span>;
    }
  };

  const handleDownload = (name?: string) => {
    showSuccess(`${name || 'परिपत्रक'} डाउनलोड प्रक्रिया सुरू झाली आहे.`);
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', paddingTop: 'var(--space-lg)' }}>
      {/* 1. Header */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.1rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
          {t.notices.title}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          {language === 'en'
            ? 'Official announcements, circulars, meeting notices, and updates from Durga Mandal.'
            : 'मंडळाचे अधिकृत ठराव, बैठकांच्या सूचना, वर्गणी आवाहन व उत्सव नियोजनाची परिपत्रके'}
        </p>
      </div>

      {/* 2. Filters & Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
        backgroundColor: 'var(--color-surface)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)'
      }}>
        {/* Priority Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterPriority('all')}
            className={`btn btn-sm ${filterPriority === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {t.common.all}
          </button>
          <button
            onClick={() => setFilterPriority('urgent')}
            className={`btn btn-sm ${filterPriority === 'urgent' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ color: filterPriority !== 'urgent' ? 'var(--color-danger)' : undefined }}
          >
            {t.notices.priorityUrgent}
          </button>
          <button
            onClick={() => setFilterPriority('important')}
            className={`btn btn-sm ${filterPriority === 'important' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ color: filterPriority !== 'important' ? 'var(--color-warning)' : undefined }}
          >
            {t.notices.priorityImportant}
          </button>
          <button
            onClick={() => setFilterPriority('normal')}
            className={`btn btn-sm ${filterPriority === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {t.notices.priorityNormal}
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '350px' }}>
          <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t.common.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', minHeight: '36px', fontSize: '0.88rem' }}
          />
        </div>
      </div>

      {/* 3. Notices Feed */}
      {filteredNotices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t.notices.emptyNotices}
          description="या प्रकारात सध्या कोणतीही नवीन परिपत्रके प्रसिद्ध केलेली नाहीत."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="card"
              style={{
                borderLeft: notice.priority === 'urgent'
                  ? '5px solid var(--color-danger)'
                  : notice.priority === 'important'
                  ? '5px solid var(--color-warning)'
                  : '5px solid var(--color-maroon-700)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* Header: Priority & Date */}
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getPriorityBadge(notice.priority)}
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    <span>{formatMarathiDate(notice.publishedAt)}</span>
                  </span>
                </div>

                {notice.viewCount !== undefined && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={13} />
                    <span>{toMarathiDigits(notice.viewCount)} भाविकांनी पाहिले</span>
                  </div>
                )}
              </div>

              {/* Title & Message */}
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
                  {isMarathi ? notice.titleMarathi || notice.title : notice.title}
                </h2>
                <p style={{ fontSize: '0.94rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                  {isMarathi ? notice.messageMarathi || notice.message : notice.message}
                </p>
              </div>

              {/* Attachment Download & Signer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--color-border)',
                paddingTop: 'var(--space-sm)',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="var(--color-maroon-700)" />
                  <span><strong>प्रसिद्धी:</strong> {notice.publishedBy}</span>
                </div>

                {notice.attachmentName && (
                  <button
                    onClick={() => handleDownload(notice.attachmentName)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', gap: '6px' }}
                  >
                    <Download size={14} color="var(--color-maroon-700)" />
                    <span>{notice.attachmentName}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
