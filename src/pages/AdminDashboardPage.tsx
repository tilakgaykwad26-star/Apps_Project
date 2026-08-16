import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useMandal } from '../context/MandalContext';
import { MANDAL_CONFIG } from '../config/constants';
import { UserRole } from '../types/auth';
import { formatIndianDate, formatMarathiDate, getAvailableFinancialYears, toMarathiDigits } from '../utils/dateUtils';
import { formatINR } from '../utils/currencyUtils';
import { exportDonationsCSV, exportMembersCSV, generateFinancialBalanceSheetPDF } from '../services/exportService';
import { generateDonationReceiptPDF, generateSubscriptionReceiptPDF } from '../services/receiptService';
import { useNotification } from '../context/NotificationContext';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  HeartHandshake,
  Calendar,
  Bell,
  Image,
  Award,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  Plus,
  Search,
  Download,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertTriangle,
  Send,
  Lock,
  ChevronRight,
  Filter,
  DollarSign
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const AdminDashboardPage: React.FC = () => {
  const { language, t, isMarathi } = useLanguage();
  const { role, isSuperAdmin, isTreasurer, isCommitteeAdmin, isContentManager } = useAuth();
  const {
    events,
    notices,
    albums,
    committee,
    members,
    donations,
    payments,
    sponsors,
    auditLogs,
    addEvent,
    deleteEvent,
    addNotice,
    deleteNotice,
    addAlbum,
    deleteAlbum,
    addSponsor,
    deleteSponsor,
    addCommitteeMember,
    deleteCommitteeMember,
    addMemberPayment,
    deleteMember,
    getFinancialMetrics,
    getMemberSummary
  } = useMandal();

  const { showSuccess, showError } = useNotification();

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedFY, setSelectedFY] = useState<string>(MANDAL_CONFIG.currentFinancialYear);

  // Search & Filters
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'paid' | 'pending' | 'partial'>('all');
  const [donationSearch, setDonationSearch] = useState('');

  // Modals
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<any>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('500');
  const [paymentMethodInput, setPaymentMethodInput] = useState<any>('cash');

  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('सकाळी ०९:०० ते दुपारी १२:००');
  const [newEventVenue, setNewEventVenue] = useState('श्री दुर्गा मंडप, कसबा पेठ');
  const [newEventRsvp, setNewEventRsvp] = useState(true);

  const [isAddNoticeModalOpen, setIsAddNoticeModalOpen] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeMessage, setNewNoticeMessage] = useState('');
  const [newNoticePriority, setNewNoticePriority] = useState<any>('important');

  const [isAddAlbumModalOpen, setIsAddAlbumModalOpen] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumYear, setNewAlbumYear] = useState('2026');
  const [newAlbumCover, setNewAlbumCover] = useState('https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop&q=80');

  const [isAddSponsorModalOpen, setIsAddSponsorModalOpen] = useState(false);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorBusiness, setNewSponsorBusiness] = useState('');
  const [newSponsorTier, setNewSponsorTier] = useState<any>('gold');

  // Metrics
  const metrics = getFinancialMetrics(selectedFY);

  // Tab definitions with RBAC permissions
  const tabs = [
    { key: 'overview', label: t.admin.tabs.overview, icon: LayoutDashboard, allowed: isTreasurer || isSuperAdmin },
    { key: 'members', label: t.admin.tabs.members, icon: Users, allowed: isCommitteeAdmin || isSuperAdmin },
    { key: 'payments', label: t.admin.tabs.payments, icon: CreditCard, allowed: isTreasurer || isSuperAdmin },
    { key: 'donations', label: t.admin.tabs.donations, icon: HeartHandshake, allowed: isTreasurer || isSuperAdmin },
    { key: 'events', label: t.admin.tabs.events, icon: Calendar, allowed: isContentManager || isSuperAdmin },
    { key: 'notices', label: t.admin.tabs.notices, icon: Bell, allowed: isContentManager || isSuperAdmin },
    { key: 'gallery', label: t.admin.tabs.gallery, icon: Image, allowed: isContentManager || isSuperAdmin },
    { key: 'sponsors', label: t.admin.tabs.sponsors, icon: Award, allowed: isCommitteeAdmin || isSuperAdmin },
    { key: 'reports', label: t.admin.tabs.reports, icon: FileSpreadsheet, allowed: isTreasurer || isSuperAdmin },
    { key: 'auditLogs', label: t.admin.tabs.auditLogs, icon: ShieldAlert, allowed: isSuperAdmin },
  ].filter((t) => t.allowed);

  // Handlers
  const handleRecordOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForPayment) return;
    const amount = parseInt(paymentAmountInput, 10);
    if (!amount || amount < 10) {
      showError('कृपया वैध रक्कम प्रविष्ट करा.');
      return;
    }

    try {
      const saved = await addMemberPayment({
        memberId: selectedMemberForPayment.id,
        memberName: selectedMemberForPayment.fullNameMarathi || selectedMemberForPayment.fullName,
        memberPhone: selectedMemberForPayment.phone,
        financialYear: selectedFY,
        amount,
        paymentType: 'annual_subscription',
        paymentMethod: paymentMethodInput,
        paymentStatus: 'successful',
        recordedBy: 'admin',
        recordedByName: 'खजिनदार (Admin)'
      });

      showSuccess(`पावती ${saved.receiptNumber} यशस्वीरित्या नोंदवली गेली!`);
      setIsAddPaymentModalOpen(false);
      const doc = generateSubscriptionReceiptPDF(saved);
      doc.save(`Receipt_${saved.receiptNumber.replace(/\//g, '_')}.pdf`);
    } catch (err) {
      showError('पेमेंट रेकॉर्ड करताना त्रुटी आली.');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    try {
      await addEvent({
        title: newEventTitle.trim(),
        titleMarathi: newEventTitle.trim(),
        description: newEventDesc.trim() || 'शारदीय नवरात्रोत्सव विशेष कार्यक्रम',
        descriptionMarathi: newEventDesc.trim() || 'शारदीय नवरात्रोत्सव विशेष कार्यक्रम',
        startDate: newEventDate ? new Date(newEventDate).toISOString() : new Date().toISOString(),
        endDate: newEventDate ? new Date(newEventDate).toISOString() : new Date().toISOString(),
        timeString: newEventTime,
        venue: newEventVenue,
        venueMarathi: newEventVenue,
        coverImageUrl: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop&q=80',
        status: 'upcoming',
        isRsvpEnabled: newEventRsvp,
        rsvpLimit: 500
      });
      showSuccess('नवीन कार्यक्रम यशस्वीरित्या जोडला गेला!');
      setIsAddEventModalOpen(false);
      setNewEventTitle('');
      setNewEventDesc('');
    } catch (err) {
      showError('कार्यक्रम जोडताना त्रुटी आली.');
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim()) return;

    try {
      await addNotice({
        title: newNoticeTitle.trim(),
        titleMarathi: newNoticeTitle.trim(),
        message: newNoticeMessage.trim(),
        messageMarathi: newNoticeMessage.trim(),
        priority: newNoticePriority,
        isPublished: true,
        publishedBy: 'प्रशासक मंडळ'
      });
      showSuccess('सूचना प्रसिद्ध करण्यात आली व सदस्यांना पाठवण्यात आली!');
      setIsAddNoticeModalOpen(false);
      setNewNoticeTitle('');
      setNewNoticeMessage('');
    } catch (err) {
      showError('सूचना प्रसिद्ध करताना त्रुटी आली.');
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumTitle.trim()) return;

    try {
      await addAlbum({
        title: newAlbumTitle.trim(),
        titleMarathi: newAlbumTitle.trim(),
        year: newAlbumYear,
        coverImageUrl: newAlbumCover,
      });
      showSuccess('नवीन अल्बम यशस्वीरित्या तयार करण्यात आला!');
      setIsAddAlbumModalOpen(false);
      setNewAlbumTitle('');
    } catch (err) {
      showError('अल्बम जोडताना त्रुटी आली.');
    }
  };

  const handleExportBalanceSheet = () => {
    const doc = generateFinancialBalanceSheetPDF(selectedFY, donations, payments, metrics);
    doc.save(`Durga_Mandal_Financial_Audit_FY_${selectedFY}.pdf`);
    showSuccess('आर्थिक अहवाल (PDF Balance Sheet) तयार झाला!');
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', paddingTop: 'var(--space-md)' }}>
      {/* 1. Admin Top Banner & Role Bar */}
      <div style={{
        backgroundColor: 'var(--color-maroon-50)',
        border: '1px solid var(--color-maroon-100)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-md) var(--space-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-maroon-700)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Lock size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', color: 'var(--color-maroon-800)', margin: 0 }}>
              {t.admin.dashboardTitle}
            </h1>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              सध्याची भूमिका: <strong>{t.admin.roles[role]}</strong>
            </div>
          </div>
        </div>

        {/* Financial Year Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-maroon-800)' }}>
            {t.admin.stats.financialYear}:
          </span>
          <select
            className="form-select"
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            style={{ minHeight: '36px', padding: '4px 10px', fontSize: '0.88rem', fontWeight: 700 }}
          >
            {getAvailableFinancialYears().map((fy) => (
              <option key={fy} value={fy}>FY {fy}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Admin Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '6px',
        borderBottom: '2px solid var(--color-border)'
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: isActive ? 'var(--color-maroon-700)' : 'var(--color-surface)',
                color: isActive ? '#ffffff' : 'var(--color-text-primary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
                borderBottom: isActive ? 'none' : '1px solid var(--color-border)'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: ACCOUNTS & OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* Key Metrics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-md)'
          }}>
            <div className="card" style={{ borderLeft: '4px solid var(--color-maroon-700)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>एकूण जमा संकलन (Total Collection)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-maroon-800)', marginTop: '4px' }}>
                {formatINR(metrics.totalCollection)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600 }}>
                ✓ {metrics.successfulTxnCount} सत्यापित व्यवहार
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--color-gold-500)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t.admin.stats.totalDonations}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-gold-700)', marginTop: '4px' }}>
                {formatINR(metrics.totalDonations)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                अन्नदान, महाआरती व उत्सव निधी
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--color-saffron-500)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>वार्षिक सभासद वर्गणी (Subscriptions)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-saffron-600)', marginTop: '4px' }}>
                {formatINR(metrics.totalSubscriptions)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {metrics.paidMembersCount} सभासदांनी भरली
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t.admin.stats.pendingDues}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '4px' }}>
                {formatINR(metrics.pendingDues)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {metrics.pendingMembersCount} सभासदांची बाकी
              </div>
            </div>
          </div>

          {/* Category Breakdown & Monthly Collections Grid */}
          <div className="grid-2">
            {/* Category Breakdown */}
            <div className="card">
              <h2 style={{ fontSize: '1.15rem', color: 'var(--color-maroon-800)', marginBottom: '14px' }}>
                निधी संकलन विभागवार वर्गीकरण (Category Share)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(metrics.categoryBreakdown).map(([cat, amt]) => {
                  const pct = metrics.totalCollection > 0 ? Math.round((amt / metrics.totalCollection) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600 }}>{cat}</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-maroon-800)' }}>{formatINR(amt)} ({pct}%)</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#EBE5DC', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-maroon-700)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="card">
              <h2 style={{ fontSize: '1.15rem', color: 'var(--color-maroon-800)', marginBottom: '14px' }}>
                मासिक संकलन आलेख (Monthly Trend FY {selectedFY})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {metrics.monthlyTrend.map((m) => (
                  <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                    <span style={{ width: '80px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{m.month}:</span>
                    <div style={{ flex: 1, height: '20px', backgroundColor: 'var(--color-surface-subtle)', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(5, (m.amount / 50000) * 100))}%`,
                        height: '12px',
                        backgroundColor: 'var(--color-saffron-500)',
                        borderRadius: '2px'
                      }} />
                    </div>
                    <span style={{ width: '90px', textAlign: 'right', fontWeight: 700, color: 'var(--color-maroon-800)' }}>
                      {formatINR(m.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: MEMBERS DIRECTORY */}
      {activeTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
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
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setMemberStatusFilter('all')}
                className={`btn btn-sm ${memberStatusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              >
                सर्व सभासद ({members.length})
              </button>
              <button
                onClick={() => setMemberStatusFilter('paid')}
                className={`btn btn-sm ${memberStatusFilter === 'paid' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ color: memberStatusFilter !== 'paid' ? 'var(--color-success)' : undefined }}
              >
                वर्गणी पूर्ण (Paid)
              </button>
              <button
                onClick={() => setMemberStatusFilter('pending')}
                className={`btn btn-sm ${memberStatusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ color: memberStatusFilter !== 'pending' ? 'var(--color-danger)' : undefined }}
              >
                वर्गणी बाकी (Pending)
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* BUG 6 fix: wire up the memberSearch state to an actual input */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="नाव, मोबाईल वा सभासद क्र. शोधा"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '32px', minHeight: '36px', fontSize: '0.85rem', width: '220px' }}
                />
              </div>
              <button
                onClick={() => exportMembersCSV(members)}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px' }}
              >
                <Download size={14} />
                <span>{t.admin.actions.exportCsv}</span>
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-maroon-50)', borderBottom: '2px solid var(--color-maroon-100)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', color: 'var(--color-maroon-800)' }}>सभासद क्र.</th>
                    <th style={{ padding: '12px 14px', color: 'var(--color-maroon-800)' }}>नाव</th>
                    <th style={{ padding: '12px 14px', color: 'var(--color-maroon-800)' }}>मोबाईल</th>
                    <th style={{ padding: '12px 14px', color: 'var(--color-maroon-800)' }}>प्रकार</th>
                    <th style={{ padding: '12px 14px', color: 'var(--color-maroon-800)' }}>वर्गणी स्थिती (FY {selectedFY})</th>
                    <th style={{ padding: '12px 14px', color: 'var(--color-maroon-800)', textAlign: 'right' }}>कृती</th>
                  </tr>
                </thead>
                <tbody>
                  {members
                    .filter((m) => {
                      // BUG 5 fix: apply memberStatusFilter
                      if (memberSearch.trim()) {
                        const query = memberSearch.toLowerCase();
                        if (
                          !m.fullName.toLowerCase().includes(query) &&
                          !(m.fullNameMarathi || '').toLowerCase().includes(query) &&
                          !m.phone.includes(query) &&
                          !(m.memberNumber || '').toLowerCase().includes(query)
                        ) return false;
                      }
                      if (memberStatusFilter === 'all') return true;
                      const sum = getMemberSummary(m.id, selectedFY);
                      return sum.status === memberStatusFilter;
                    })
                    .map((m) => {
                    const sum = getMemberSummary(m.id, selectedFY);
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace' }}>{m.memberNumber}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {m.fullNameMarathi || m.fullName}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)' }}>+91 {m.phone}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className="badge badge-maroon" style={{ fontSize: '0.72rem' }}>
                            {m.memberType === 'family' ? 'कुटुंब' : 'वैयक्तिक'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {sum.status === 'paid' ? (
                            <span className="badge badge-success">✓ भरली ({formatINR(sum.totalPaid)})</span>
                          ) : (
                            <span className="badge badge-danger">बाकी {formatINR(sum.remainingDue)}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setSelectedMemberForPayment(m);
                                setPaymentAmountInput(String(sum.remainingDue || 500));
                                setIsAddPaymentModalOpen(true);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.78rem', gap: '4px' }}
                              title="Record Offline Payment"
                            >
                              <DollarSign size={13} color="#2E7D32" />
                              <span>वर्गणी जमा</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(t.admin.actions.confirmDelete)) {
                                  deleteMember(m.id);
                                  showSuccess('सभासद नोंद यशस्वीरित्या हटवली.');
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px' }}
                              title="Delete Member"
                              aria-label={`Delete member ${m.fullName}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: PAYMENTS & SUBSCRIPTION LEDGER */}
      {activeTab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="flex-between">
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)' }}>
              वर्गणी पावती नोंदवही (FY {selectedFY})
            </h2>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-maroon-50)', borderBottom: '2px solid var(--color-maroon-100)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>पावती क्र.</th>
                    <th style={{ padding: '10px 14px' }}>दिनांक</th>
                    <th style={{ padding: '10px 14px' }}>सभासद नाव</th>
                    <th style={{ padding: '10px 14px' }}>रक्कम</th>
                    <th style={{ padding: '10px 14px' }}>माध्यम</th>
                    <th style={{ padding: '10px 14px' }}>नोंदणी</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>पावती</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, fontFamily: 'monospace' }}>{p.receiptNumber}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>{formatIndianDate(p.createdAt)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{p.memberName}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-success)' }}>{formatINR(p.amount)}</td>
                      <td style={{ padding: '10px 14px' }}>{p.paymentMethod.toUpperCase()}</td>
                      <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{p.recordedByName || p.recordedBy}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            const doc = generateSubscriptionReceiptPDF(p);
                            doc.save(`Receipt_${p.receiptNumber.replace(/\//g, '_')}.pdf`);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '0.75rem', gap: '4px' }}
                        >
                          <Download size={12} />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: DONATIONS LEDGER */}
      {activeTab === 'donations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="flex-between">
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)' }}>
              सर्व देणग्यांची नोंदवही (Donation Ledger)
            </h2>
            <button
              onClick={() => exportDonationsCSV(donations)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <Download size={14} />
              <span>{t.admin.actions.exportCsv}</span>
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-maroon-50)', borderBottom: '2px solid var(--color-maroon-100)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>पावती क्र.</th>
                    <th style={{ padding: '10px 14px' }}>दिनांक</th>
                    <th style={{ padding: '10px 14px' }}>देणगीदार</th>
                    <th style={{ padding: '10px 14px' }}>प्रकार</th>
                    <th style={{ padding: '10px 14px' }}>रक्कम</th>
                    <th style={{ padding: '10px 14px' }}>पेमेंट मोड</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>पावती</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, fontFamily: 'monospace' }}>{d.receiptNumber}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>{formatIndianDate(d.createdAt)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                        {d.isAnonymous ? 'गुप्त दान (Anonymous)' : d.donorName}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                          {d.donationTypeMarathi || d.donationType}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-maroon-800)' }}>{formatINR(d.amount)}</td>
                      <td style={{ padding: '10px 14px' }}>{d.paymentMethod.toUpperCase()}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            const doc = generateDonationReceiptPDF(d);
                            doc.save(`Donation_${d.receiptNumber.replace(/\//g, '_')}.pdf`);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '0.75rem', gap: '4px' }}
                        >
                          <Download size={12} />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: EVENTS MANAGER */}
      {activeTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="flex-between">
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)' }}>
              कार्यक्रम व्यवस्थापन (Events Manager)
            </h2>
            <button
              onClick={() => setIsAddEventModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              <Plus size={14} />
              <span>{t.admin.actions.createEvent}</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {events.map((evt) => (
              <div key={evt.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '14px 18px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-maroon-800)' }}>
                    {isMarathi ? evt.titleMarathi || evt.title : evt.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {formatMarathiDate(evt.startDate)} | {evt.timeString} | {isMarathi ? evt.venueMarathi || evt.venue : evt.venue}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-maroon" style={{ fontSize: '0.75rem' }}>
                    {toMarathiDigits(evt.rsvpCount)} RSVPs
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(t.admin.actions.confirmDelete)) {
                        deleteEvent(evt.id);
                        showSuccess('कार्यक्रम हटवला गेला.');
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. TAB 6: NOTICES & CIRCULARS */}
      {activeTab === 'notices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="flex-between">
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)' }}>
              सूचना व परिपत्रके (Notices & Push Alerts)
            </h2>
            <button
              onClick={() => setIsAddNoticeModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              <Plus size={14} />
              <span>{t.admin.actions.publishNotice}</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notices.map((n) => (
              <div key={n.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '14px 18px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${n.priority === 'urgent' ? 'badge-danger' : n.priority === 'important' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.72rem' }}>
                      {n.priority.toUpperCase()}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--color-maroon-800)' }}>
                      {isMarathi ? n.titleMarathi || n.title : n.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    दिनांक: {formatIndianDate(n.publishedAt)} | प्रसिद्धी: {n.publishedBy}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(t.admin.actions.confirmDelete)) {
                      deleteNotice(n.id);
                      showSuccess('सूचना हटवली गेली.');
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. TAB 7: GALLERY MANAGER */}
      {activeTab === 'gallery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="flex-between">
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)' }}>
              फोटो दालन व्यवस्थापन (Gallery Albums)
            </h2>
            <button
              onClick={() => setIsAddAlbumModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              <Plus size={14} />
              <span>{t.admin.actions.createAlbum}</span>
            </button>
          </div>

          <div className="grid-3">
            {albums.map((alb) => (
              <div key={alb.id} className="card" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={alb.coverImageUrl} alt={alb.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-maroon-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isMarathi ? alb.titleMarathi || alb.title : alb.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    वर्ष {alb.year} | {alb.imageCount} फोटो
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(t.admin.actions.confirmDelete)) {
                      deleteAlbum(alb.id);
                      showSuccess('अल्बम हटवला गेला.');
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. TAB 8: SPONSORS */}
      {activeTab === 'sponsors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="flex-between">
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)' }}>
              पुरस्कर्ते व्यवस्थापन (Sponsors & Advertisers)
            </h2>
            <button
              onClick={() => setIsAddSponsorModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              <Plus size={14} />
              <span>{t.admin.actions.addSponsor}</span>
            </button>
          </div>

          <div className="grid-3">
            {sponsors.map((sp) => (
              <div key={sp.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <img src={sp.logoUrl} alt={sp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{isMarathi ? sp.nameMarathi || sp.name : sp.name}</div>
                  <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{sp.tier.toUpperCase()}</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(t.admin.actions.confirmDelete)) {
                      deleteSponsor(sp.id);
                      showSuccess('पुरस्कर्ता हटवला.');
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. TAB 9: REPORTS */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="card card-gold-accent">
            <h2 style={{ fontSize: '1.3rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
              अधिकृत वार्षिक आर्थिक अहवाल व ताळेबंद (Audited Balance Sheet FY {selectedFY})
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
              दुर्गा मंडळाचे अधिकृत लेखापरीक्षण विवरणपत्र, देणगी यादी व सभासद वर्गणी जमा-खर्च अहवाल एका क्लिकवर PDF स्वरूपात प्राप्त करा.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
              <button
                onClick={handleExportBalanceSheet}
                className="btn btn-primary btn-lg"
                style={{ gap: '8px' }}
              >
                <Download size={18} />
                <span>{t.admin.actions.exportPdf} (Balance Sheet)</span>
              </button>

              <button
                onClick={() => exportDonationsCSV(donations)}
                className="btn btn-secondary btn-lg"
                style={{ gap: '8px' }}
              >
                <FileSpreadsheet size={18} />
                <span>देणगी यादी (Donations CSV)</span>
              </button>

              <button
                onClick={() => exportMembersCSV(members)}
                className="btn btn-secondary btn-lg"
                style={{ gap: '8px' }}
              >
                <Users size={18} />
                <span>सभासद यादी (Members Directory CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. TAB 10: AUDIT LOGS (Super Admin only) */}
      {activeTab === 'auditLogs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)' }}>
            सिस्टम सुरक्षा व बदल नोंदवही (Immutable Audit Trail)
          </h2>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-maroon-50)', borderBottom: '2px solid var(--color-maroon-100)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>दिनांक व वेळ</th>
                    <th style={{ padding: '10px 14px' }}>वापरकर्ता (Actor)</th>
                    <th style={{ padding: '10px 14px' }}>भूमिका</th>
                    <th style={{ padding: '10px 14px' }}>क्रिया (Action)</th>
                    <th style={{ padding: '10px 14px' }}>विभाग</th>
                    <th style={{ padding: '10px 14px' }}>तपशील</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--color-text-muted)' }}>
                        अद्याप कोणतेही बदल नोंदवले गेले नाहीत.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>{formatIndianDate(log.timestamp)}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{log.actorName}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="badge badge-maroon" style={{ fontSize: '0.7rem' }}>{log.role}</span>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{log.action}</td>
                        <td style={{ padding: '10px 14px' }}>{log.targetCollection}</td>
                        <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          {JSON.stringify(log.details)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Payment */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        title="ऑफलाइन वर्गणी नोंदवा (Record Payment)"
      >
        {selectedMemberForPayment && (
          <form onSubmit={handleRecordOfflinePayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ backgroundColor: 'var(--color-maroon-50)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 700, color: 'var(--color-maroon-800)' }}>
                {selectedMemberForPayment.fullNameMarathi || selectedMemberForPayment.fullName}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                सभासद क्र.: {selectedMemberForPayment.memberNumber} | मोबाईल: +91 {selectedMemberForPayment.phone}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">वर्गणी रक्कम (₹)</label>
              <input
                type="number"
                required
                min={10}
                className="form-input"
                value={paymentAmountInput}
                onChange={(e) => setPaymentAmountInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">पेमेंट प्रकार (Payment Mode)</label>
              <select
                className="form-select"
                value={paymentMethodInput}
                onChange={(e) => setPaymentMethodInput(e.target.value)}
              >
                <option value="cash">रोख (Cash)</option>
                <option value="direct_upi">थेट UPI (GooglePay / PhonePe)</option>
                <option value="bank_transfer">बँक ट्रान्सफर (NEFT/RTGS)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
              <button type="button" onClick={() => setIsAddPaymentModalOpen(false)} className="btn btn-secondary">
                {t.admin.actions.cancel}
              </button>
              <button type="submit" className="btn btn-primary">
                नोंद करा व पावती द्या
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Create Event */}
      <Modal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        title={t.admin.actions.createEvent}
      >
        <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label form-label-required">कार्यक्रमाचे नाव (मराठी)</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="उदा. दांडिया रास व गरबा उत्सव"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">तपशील व वर्णन</label>
            <textarea
              rows={3}
              className="form-textarea"
              placeholder="कार्यक्रमाचा तपशील प्रविष्ट करा..."
              value={newEventDesc}
              onChange={(e) => setNewEventDesc(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">दिनांक</label>
              <input
                type="date"
                required
                className="form-input"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">वेळ</label>
              <input
                type="text"
                className="form-input"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">स्थळ (Venue)</label>
            <input
              type="text"
              className="form-input"
              value={newEventVenue}
              onChange={(e) => setNewEventVenue(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsAddEventModalOpen(false)} className="btn btn-secondary">
              {t.admin.actions.cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              कार्यक्रम प्रसिद्ध करा
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Notice */}
      <Modal
        isOpen={isAddNoticeModalOpen}
        onClose={() => setIsAddNoticeModalOpen(false)}
        title={t.admin.actions.publishNotice}
      >
        <form onSubmit={handleCreateNotice} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label form-label-required">सूचनेचे शीर्षक</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="उदा. उत्सव मंडप उभारणी कामाबाबत"
              value={newNoticeTitle}
              onChange={(e) => setNewNoticeTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">संदेश मजकूर</label>
            <textarea
              required
              rows={4}
              className="form-textarea"
              placeholder="संपूर्ण संदेश येथे लिहा..."
              value={newNoticeMessage}
              onChange={(e) => setNewNoticeMessage(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">प्राधान्य (Priority Level)</label>
            <select
              className="form-select"
              value={newNoticePriority}
              onChange={(e) => setNewNoticePriority(e.target.value)}
            >
              <option value="urgent">तात्काळ (Urgent - Push Alert)</option>
              <option value="important">महत्त्वाची सूचना (Important)</option>
              <option value="normal">सर्वसाधारण (Normal)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsAddNoticeModalOpen(false)} className="btn btn-secondary">
              {t.admin.actions.cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              प्रसिद्ध करा (Publish)
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Album */}
      <Modal
        isOpen={isAddAlbumModalOpen}
        onClose={() => setIsAddAlbumModalOpen(false)}
        title={t.admin.actions.createAlbum}
      >
        <form onSubmit={handleCreateAlbum} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label form-label-required">अल्बम नाव (मराठी)</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="उदा. होम-हवन व महाआरती २०२६"
              value={newAlbumTitle}
              onChange={(e) => setNewAlbumTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">वर्ष (Year)</label>
            <input
              type="text"
              className="form-input"
              value={newAlbumYear}
              onChange={(e) => setNewAlbumYear(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsAddAlbumModalOpen(false)} className="btn btn-secondary">
              {t.admin.actions.cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              अल्बम तयार करा
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Sponsor */}
      <Modal
        isOpen={isAddSponsorModalOpen}
        onClose={() => setIsAddSponsorModalOpen(false)}
        title={t.admin.actions.addSponsor}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!newSponsorName.trim()) return;
          addSponsor({
            name: newSponsorName.trim(),
            nameMarathi: newSponsorName.trim(),
            businessType: newSponsorBusiness.trim() || 'प्रतिष्ठित पुरस्कर्ते',
            logoUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&auto=format&fit=crop&q=80',
            tier: newSponsorTier,
            activeFrom: '2026-01-01',
            activeTo: '2026-12-31',
            isActive: true
          });
          showSuccess('पुरस्कर्ता जोडण्यात आला!');
          setIsAddSponsorModalOpen(false);
          setNewSponsorName('');
        }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label form-label-required">पुरस्कर्त्याचे नाव</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="उदा. काका हलवाई स्वीट्स"
              value={newSponsorName}
              onChange={(e) => setNewSponsorName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">व्यवसाय प्रकार</label>
            <input
              type="text"
              className="form-input"
              placeholder="उदा. मिष्टान्न व उपहारगृह"
              value={newSponsorBusiness}
              onChange={(e) => setNewSponsorBusiness(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">श्रेणी (Tier)</label>
            <select
              className="form-select"
              value={newSponsorTier}
              onChange={(e) => setNewSponsorTier(e.target.value as any)}
            >
              <option value="title">टायटल स्पॉन्सर (Title Sponsor)</option>
              <option value="platinum">प्लॅटिनम स्पॉन्सर (Platinum)</option>
              <option value="gold">सुवर्ण प्रायोजक (Gold)</option>
              <option value="silver">रजत प्रायोजक (Silver)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsAddSponsorModalOpen(false)} className="btn btn-secondary">
              {t.admin.actions.cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              जतन करा
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
