import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MandalEvent, EventRsvp } from '../types/event';
import { MandalNotice } from '../types/notice';
import { GalleryAlbum, GalleryImage } from '../types/gallery';
import { CommitteeMember } from '../types/committee';
import { Member } from '../types/auth';
import { Donation } from '../types/donation';
import { MemberPayment, MemberFinancialSummary, DuesStatus } from '../types/payment';
import { Sponsor } from '../types/sponsor';
import { AuditLog, AuditActionType } from '../types/audit';
import {
  SEED_COMMITTEE,
  SEED_EVENTS,
  SEED_NOTICES,
  SEED_ALBUMS,
  SEED_IMAGES,
  SEED_MEMBERS,
  SEED_DONATIONS,
  SEED_PAYMENTS,
  SEED_SPONSORS
} from '../utils/seedData';
import { MANDAL_CONFIG } from '../config/constants';
import { getFinancialYear } from '../utils/dateUtils';
import { useAuth } from './AuthContext';

export interface FinancialMetrics {
  financialYear: string;
  totalCollection: number;
  totalDonations: number;
  totalSubscriptions: number;
  totalOther: number;
  pendingDues: number;
  totalMembersCount: number;
  paidMembersCount: number;
  pendingMembersCount: number;
  successfulTxnCount: number;
  failedTxnCount: number;
  categoryBreakdown: Record<string, number>;
  monthlyTrend: { month: string; amount: number }[];
}

interface MandalContextType {
  events: MandalEvent[];
  notices: MandalNotice[];
  albums: GalleryAlbum[];
  images: GalleryImage[];
  committee: CommitteeMember[];
  members: Member[];
  donations: Donation[];
  payments: MemberPayment[];
  sponsors: Sponsor[];
  auditLogs: AuditLog[];
  activeSponsors: Sponsor[];

  // CRUD Operations
  addDonation: (donation: Omit<Donation, 'id' | 'createdAt' | 'receiptNumber'>) => Promise<Donation>;
  addMemberPayment: (payment: Omit<MemberPayment, 'id' | 'createdAt' | 'receiptNumber'>) => Promise<MemberPayment>;
  addEvent: (event: Omit<MandalEvent, 'id' | 'createdAt' | 'updatedAt' | 'rsvpCount'>) => Promise<void>;
  updateEvent: (id: string, data: Partial<MandalEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  recordRsvp: (rsvp: Omit<EventRsvp, 'id' | 'createdAt'>) => Promise<boolean>;

  // BUG 13 fix: viewCount is set internally, exclude it from the caller's required input
  addNotice: (notice: Omit<MandalNotice, 'id' | 'publishedAt' | 'viewCount'>) => Promise<void>;
  updateNotice: (id: string, data: Partial<MandalNotice>) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;

  addAlbum: (album: Omit<GalleryAlbum, 'id' | 'createdAt' | 'imageCount'>) => Promise<void>;
  addImage: (image: Omit<GalleryImage, 'id' | 'uploadedAt'>) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;

  addMember: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'memberNumber'>) => Promise<Member>;
  updateMember: (id: string, data: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;

  addSponsor: (sponsor: Omit<Sponsor, 'id' | 'createdAt'>) => Promise<void>;
  updateSponsor: (id: string, data: Partial<Sponsor>) => Promise<void>;
  deleteSponsor: (id: string) => Promise<void>;

  addCommitteeMember: (item: Omit<CommitteeMember, 'id'>) => Promise<void>;
  updateCommitteeMember: (id: string, data: Partial<CommitteeMember>) => Promise<void>;
  deleteCommitteeMember: (id: string) => Promise<void>;

  getFinancialMetrics: (fy?: string) => FinancialMetrics;
  getMemberSummary: (memberId: string, fy?: string) => MemberFinancialSummary;
}

const MandalContext = createContext<MandalContextType | undefined>(undefined);

export const MandalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Helper to safely parse localStorage (BUG 3 fix: prevent crash on corrupt data)
  function safeLocalParse<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : fallback;
    } catch {
      console.warn(`[MandalContext] Failed to parse localStorage key "${key}". Resetting to defaults.`);
      localStorage.removeItem(key);
      return fallback;
    }
  }

  // State with LocalStorage Persistence
  const [events, setEvents] = useState<MandalEvent[]>(() => safeLocalParse('dm_events', SEED_EVENTS));
  const [notices, setNotices] = useState<MandalNotice[]>(() => safeLocalParse('dm_notices', SEED_NOTICES));
  const [albums, setAlbums] = useState<GalleryAlbum[]>(() => safeLocalParse('dm_albums', SEED_ALBUMS));
  const [images, setImages] = useState<GalleryImage[]>(() => safeLocalParse('dm_images', SEED_IMAGES));
  const [committee, setCommittee] = useState<CommitteeMember[]>(() => safeLocalParse('dm_committee', SEED_COMMITTEE));
  const [members, setMembers] = useState<Member[]>(() => safeLocalParse('dm_members', SEED_MEMBERS));
  const [donations, setDonations] = useState<Donation[]>(() => safeLocalParse('dm_donations', SEED_DONATIONS));
  const [payments, setPayments] = useState<MemberPayment[]>(() => safeLocalParse('dm_payments', SEED_PAYMENTS));
  const [sponsors, setSponsors] = useState<Sponsor[]>(() => safeLocalParse('dm_sponsors', SEED_SPONSORS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => safeLocalParse('dm_audit_logs', []));

  // Sync to local storage
  useEffect(() => { localStorage.setItem('dm_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('dm_notices', JSON.stringify(notices)); }, [notices]);
  useEffect(() => { localStorage.setItem('dm_albums', JSON.stringify(albums)); }, [albums]);
  useEffect(() => { localStorage.setItem('dm_images', JSON.stringify(images)); }, [images]);
  useEffect(() => { localStorage.setItem('dm_committee', JSON.stringify(committee)); }, [committee]);
  useEffect(() => { localStorage.setItem('dm_members', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('dm_donations', JSON.stringify(donations)); }, [donations]);
  useEffect(() => { localStorage.setItem('dm_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('dm_sponsors', JSON.stringify(sponsors)); }, [sponsors]);
  useEffect(() => { localStorage.setItem('dm_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);

  // Record Audit Log Helper
  const logAction = useCallback((action: AuditActionType, targetCollection: string, targetId: string, details: Record<string, any>) => {
    const log: AuditLog = {
      id: 'log_' + Date.now(),
      actorUid: user?.uid || 'anonymous',
      actorName: user?.displayName || 'System',
      role: user?.role || 'guest',
      action,
      targetCollection,
      targetId,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [log, ...prev]);
  }, [user]);

  // Active Sponsors within Date Window
  const activeSponsors = sponsors.filter((sp) => {
    if (!sp.isActive) return false;
    const now = new Date().toISOString().split('T')[0];
    return now >= sp.activeFrom && now <= sp.activeTo;
  });

  // Actions
  const addDonation = async (input: Omit<Donation, 'id' | 'createdAt' | 'receiptNumber'>): Promise<Donation> => {
    const fy = getFinancialYear();
    // BUG 4 fix: use Date.now() to prevent receipt number collisions on deletion
    const receiptNumber = `DM/${fy}/DON-${1000 + Date.now() % 100000}`;
    const newDonation: Donation = {
      ...input,
      id: 'don_' + Date.now(),
      receiptNumber,
      createdAt: new Date().toISOString()
    };

    setDonations((prev) => [newDonation, ...prev]);
    logAction('donation_record', 'donations', newDonation.id, { amount: newDonation.amount, receiptNumber });
    return newDonation;
  };

  const addMemberPayment = async (input: Omit<MemberPayment, 'id' | 'createdAt' | 'receiptNumber'>): Promise<MemberPayment> => {
    const fy = input.financialYear || getFinancialYear();
    // BUG 4 fix: use Date.now() to prevent receipt number collisions on deletion
    const receiptNumber = `DM/${fy}/SUB-${2000 + Date.now() % 100000}`;
    const newPayment: MemberPayment = {
      ...input,
      id: 'pay_' + Date.now(),
      receiptNumber,
      createdAt: new Date().toISOString()
    };

    setPayments((prev) => [newPayment, ...prev]);
    logAction('payment_record', 'payments', newPayment.id, { amount: newPayment.amount, memberId: newPayment.memberId });
    return newPayment;
  };

  const addEvent = async (input: Omit<MandalEvent, 'id' | 'createdAt' | 'updatedAt' | 'rsvpCount'>) => {
    const newEvent: MandalEvent = {
      ...input,
      id: 'evt_' + Date.now(),
      rsvpCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEvents((prev) => [newEvent, ...prev]);
    logAction('event_create', 'events', newEvent.id, { title: newEvent.titleMarathi || newEvent.title });
  };

  const updateEvent = async (id: string, data: Partial<MandalEvent>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e)));
    logAction('event_update', 'events', id, data);
  };

  const deleteEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    logAction('event_delete', 'events', id, {});
  };

  const recordRsvp = async (rsvp: Omit<EventRsvp, 'id' | 'createdAt'>): Promise<boolean> => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === rsvp.eventId) {
          return { ...e, rsvpCount: e.rsvpCount + (rsvp.guestCount || 1) };
        }
        return e;
      })
    );
    return true;
  };

  const addNotice = async (input: Omit<MandalNotice, 'id' | 'publishedAt' | 'viewCount'>) => {
    const newNotice: MandalNotice = {
      ...input,
      id: 'not_' + Date.now(),
      publishedAt: new Date().toISOString(),
      viewCount: 0
    };
    setNotices((prev) => [newNotice, ...prev]);
    logAction('notice_publish', 'notices', newNotice.id, { title: newNotice.titleMarathi || newNotice.title });
  };

  const updateNotice = async (id: string, data: Partial<MandalNotice>) => {
    setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, ...data } : n)));
  };

  const deleteNotice = async (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    logAction('notice_delete', 'notices', id, {});
  };

  const addAlbum = async (input: Omit<GalleryAlbum, 'id' | 'createdAt' | 'imageCount'>) => {
    const newAlbum: GalleryAlbum = {
      ...input,
      id: 'alb_' + Date.now(),
      imageCount: 0,
      createdAt: new Date().toISOString()
    };
    setAlbums((prev) => [newAlbum, ...prev]);
  };

  const addImage = async (input: Omit<GalleryImage, 'id' | 'uploadedAt'>) => {
    const newImg: GalleryImage = {
      ...input,
      id: 'img_' + Date.now(),
      uploadedAt: new Date().toISOString()
    };
    setImages((prev) => [newImg, ...prev]);
    setAlbums((prev) => prev.map((a) => (a.id === input.albumId ? { ...a, imageCount: a.imageCount + 1 } : a)));
  };

  const deleteAlbum = async (id: string) => {
    setAlbums((prev) => prev.filter((a) => a.id !== id));
    setImages((prev) => prev.filter((i) => i.albumId !== id));
    logAction('gallery_delete', 'gallery_albums', id, {});
  };

  const addMember = async (input: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'memberNumber'>): Promise<Member> => {
    const currentYear = new Date().getFullYear();
    const count = members.length + 1;
    const memberNumber = `DM-${currentYear}-${String(count).padStart(3, '0')}`;
    const newMember: Member = {
      ...input,
      id: 'mem_' + Date.now(),
      memberNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setMembers((prev) => [newMember, ...prev]);
    logAction('member_create', 'members', newMember.id, { name: newMember.fullName, memberNumber });
    return newMember;
  };

  const updateMember = async (id: string, data: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m)));
    logAction('member_update', 'members', id, data);
  };

  const deleteMember = async (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    logAction('member_delete', 'members', id, {});
  };

  const addSponsor = async (input: Omit<Sponsor, 'id' | 'createdAt'>) => {
    const newSponsor: Sponsor = {
      ...input,
      id: 'sp_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setSponsors((prev) => [newSponsor, ...prev]);
  };

  const updateSponsor = async (id: string, data: Partial<Sponsor>) => {
    setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteSponsor = async (id: string) => {
    setSponsors((prev) => prev.filter((s) => s.id !== id));
  };

  const addCommitteeMember = async (item: Omit<CommitteeMember, 'id'>) => {
    const newItem: CommitteeMember = { ...item, id: 'comm_' + Date.now() };
    setCommittee((prev) => [...prev, newItem].sort((a, b) => a.hierarchyOrder - b.hierarchyOrder));
  };

  const updateCommitteeMember = async (id: string, data: Partial<CommitteeMember>) => {
    setCommittee((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c)).sort((a, b) => a.hierarchyOrder - b.hierarchyOrder)
    );
  };

  const deleteCommitteeMember = async (id: string) => {
    setCommittee((prev) => prev.filter((c) => c.id !== id));
  };

  // Financial Calculations
  const getMemberSummary = (memberId: string, fy: string = MANDAL_CONFIG.currentFinancialYear): MemberFinancialSummary => {
    const member = members.find((m) => m.id === memberId);
    const annualDue = member ? member.annualDueAmount || MANDAL_CONFIG.annualSubscriptionFee : MANDAL_CONFIG.annualSubscriptionFee;
    
    const memberPayments = payments.filter(
      (p) => p.memberId === memberId && p.financialYear === fy && p.paymentStatus === 'successful'
    );
    
    const totalPaid = memberPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const remainingDue = Math.max(0, annualDue - totalPaid);

    let status: DuesStatus = 'pending';
    if (totalPaid >= annualDue) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partial';
    }

    const lastPayment = memberPayments[memberPayments.length - 1];

    return {
      memberId,
      financialYear: fy,
      totalAnnualDue: annualDue,
      totalPaid,
      remainingDue,
      status,
      lastPaymentDate: lastPayment?.createdAt,
      lastReceiptNumber: lastPayment?.receiptNumber
    };
  };

  const getFinancialMetrics = (fy: string = MANDAL_CONFIG.currentFinancialYear): FinancialMetrics => {
    // BUG 9 fix: also filter donations by financial year (April to March)
    const [fyStartYear] = fy.split('-').map(Number);
    const fyStart = new Date(fyStartYear, 3, 1); // April 1
    const fyEnd = new Date(fyStartYear + 1, 2, 31, 23, 59, 59); // March 31

    const fyDonations = donations.filter((d) => {
      if (d.paymentStatus !== 'successful') return false;
      const date = new Date(d.createdAt);
      return date >= fyStart && date <= fyEnd;
    });
    const fyPayments = payments.filter((p) => p.financialYear === fy && p.paymentStatus === 'successful');

    const totalDonations = fyDonations.reduce((acc, curr) => acc + curr.amount, 0);
    const totalSubscriptions = fyPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const totalCollection = totalDonations + totalSubscriptions;

    let paidMembersCount = 0;
    let pendingMembersCount = 0;
    let pendingDues = 0;

    members.forEach((m) => {
      const summary = getMemberSummary(m.id, fy);
      if (summary.status === 'paid') {
        paidMembersCount++;
      } else {
        pendingMembersCount++;
        pendingDues += summary.remainingDue;
      }
    });

    const categoryBreakdown: Record<string, number> = {
      'वार्षिक वर्गणी (Subscriptions)': totalSubscriptions,
      'अन्नदान व महाप्रसाद': 0,
      'महाआरती देणगी': 0,
      'विशेष उत्सव प्रायोजकत्व': 0,
      'सर्वसाधारण देणगी': 0,
    };

    fyDonations.forEach((d) => {
      if (d.donationType === 'annadaan') categoryBreakdown['अन्नदान व महाप्रसाद'] += d.amount;
      else if (d.donationType === 'maharati') categoryBreakdown['महाआरती देणगी'] += d.amount;
      else if (d.donationType === 'special_utsav') categoryBreakdown['विशेष उत्सव प्रायोजकत्व'] += d.amount;
      else categoryBreakdown['सर्वसाधारण देणगी'] += d.amount;
    });

    // BUG 10 fix: compute real monthly trend from actual payment + donation data
    const MARATHI_MONTH_NAMES = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];
    // Financial year runs April (month 3) to March (month 2) of next year
    const fyMonthOrder = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2]; // Apr=3 ... Mar=2
    const monthlyMap: Record<number, number> = {};
    fyMonthOrder.forEach((m) => { monthlyMap[m] = 0; });

    [...fyDonations, ...fyPayments].forEach((txn) => {
      const month = new Date(txn.createdAt).getMonth();
      if (month in monthlyMap) monthlyMap[month] += txn.amount;
    });

    const monthlyTrend = fyMonthOrder.map((m) => ({
      month: MARATHI_MONTH_NAMES[m],
      amount: monthlyMap[m]
    }));

    return {
      financialYear: fy,
      totalCollection,
      totalDonations,
      totalSubscriptions,
      totalOther: 0,
      pendingDues,
      totalMembersCount: members.length,
      paidMembersCount,
      pendingMembersCount,
      successfulTxnCount: fyDonations.length + fyPayments.length,
      failedTxnCount: 0,
      categoryBreakdown,
      monthlyTrend
    };
  };

  return (
    <MandalContext.Provider
      value={{
        events,
        notices,
        albums,
        images,
        committee,
        members,
        donations,
        payments,
        sponsors,
        auditLogs,
        activeSponsors,
        addDonation,
        addMemberPayment,
        addEvent,
        updateEvent,
        deleteEvent,
        recordRsvp,
        addNotice,
        updateNotice,
        deleteNotice,
        addAlbum,
        addImage,
        deleteAlbum,
        addMember,
        updateMember,
        deleteMember,
        addSponsor,
        updateSponsor,
        deleteSponsor,
        addCommitteeMember,
        updateCommitteeMember,
        deleteCommitteeMember,
        getFinancialMetrics,
        getMemberSummary
      }}
    >
      {children}
    </MandalContext.Provider>
  );
};

export const useMandal = (): MandalContextType => {
  const context = useContext(MandalContext);
  if (!context) {
    throw new Error('useMandal must be used within a MandalProvider');
  }
  return context;
};
