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
import { Expense } from '../types/expense';
import { LiveStreamConfig, DEFAULT_LIVESTREAM_CONFIG } from '../types/livestream';
import {
  SEED_COMMITTEE,
  SEED_EVENTS,
  SEED_NOTICES,
  SEED_ALBUMS,
  SEED_IMAGES,
  SEED_MEMBERS,
  SEED_DONATIONS,
  SEED_PAYMENTS,
  SEED_SPONSORS,
  SEED_EXPENSES
} from '../utils/seedData';
import { MANDAL_CONFIG } from '../config/constants';
import { getFinancialYear } from '../utils/dateUtils';
import { useAuth } from './AuthContext';
import {
  subscribeToCollection,
  saveToFirestore,
  deleteFromFirestore,
  pushAllLocalDataToCloud,
  COLLECTIONS
} from '../services/firestoreSyncService';

export interface FinancialMetrics {
  financialYear: string;
  totalCollection: number;
  totalDonations: number;
  totalSubscriptions: number;
  totalOther: number;
  totalExpenses: number;
  netBalance: number;
  pendingDues: number;
  totalMembersCount: number;
  paidMembersCount: number;
  pendingMembersCount: number;
  successfulTxnCount: number;
  failedTxnCount: number;
  donorCount: number;
  expenseTxnCount: number;
  categoryBreakdown: any;
  expenseCategoryBreakdown: Record<string, number>;
  monthlyTrend: { month: string; amount: number }[];
  monthlyExpenseTrend: { month: string; amount: number }[];
}

export interface FestivalConfig {
  titleMarathi: string;
  titleEnglish: string;
  datesMarathi: string;
  datesEnglish: string;
  greeting: string;
  descriptionMarathi: string;
  descriptionEnglish: string;
  sliderIntervalSeconds?: number;
}

export interface HeroSlideItem {
  id: string;
  badge: string;
  titleMarathi: string;
  titleEnglish: string;
  highlightMarathi: string;
  highlightEnglish: string;
  descMarathi: string;
  descEnglish: string;
  gradient: string;
  btn1TextMarathi: string;
  btn1ActionKey: string;
  btn2TextMarathi: string;
  btn2ActionKey: string;
  accentColor: string;
  imageUrl?: string;
  bannerMode?: 'standard' | 'full_photo';
}

export const DEFAULT_FESTIVAL_CONFIG: FestivalConfig = {
  titleMarathi: 'सार्वजनिक बाल दुर्गा उत्सव मंडळ',
  titleEnglish: 'Sarvajanik Bal Durga Utsav Mandal',
  datesMarathi: '११ ऑक्टोबर ते २२ ऑक्टोबर २०२६',
  datesEnglish: '11 October to 22 October 2026',
  greeting: '॥ उदो बोला उदो अंबाबाई माउलीचा हो ॥',
  descriptionMarathi: '*भक्तीचा उत्सव, संस्कृतीचा अभिमान आणि सेवाभावाची नवी दिशा — चला, नवरात्रोत्सव एकत्र साजरा करूया!*',
  descriptionEnglish: 'A celebration of devotion, cultural pride, and community service. Join the grand festivities!',
  sliderIntervalSeconds: 5
};

export const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 'slide-1',
    badge: '॥ उदो बोला उदो अंबाबाई माउलीचा हो ॥',
    titleMarathi: 'सार्वजनिक बाल दुर्गा उत्सव मंडळ',
    titleEnglish: 'Sarvajanik Bal Durga Utsav Mandal',
    highlightMarathi: '११ ऑक्टोबर ते २२ ऑक्टोबर २०२६ (शारदीय नवरात्रोत्सव)',
    highlightEnglish: '11 Oct to 22 Oct 2026 (Grand Celebration)',
    descMarathi: '*भक्तीचा उत्सव, संस्कृतीचा अभिमान आणि सेवाभावाची नवी दिशा — चला, नवरात्रोत्सव एकत्र साजरा करूया!*',
    descEnglish: 'A celebration of devotion, cultural pride, and community service. Join the grand festivities!',
    gradient: 'radial-gradient(circle at top right, #6F1616 0%, #871C1C 45%, #3D0505 100%)',
    btn1TextMarathi: '❤️ देवीचे दर्शन व देणगी',
    btn1ActionKey: 'donate',
    btn2TextMarathi: '📅 आजचे विशेष कार्यक्रम',
    btn2ActionKey: 'events',
    accentColor: '#FFB300'
  },
  {
    id: 'slide-2',
    badge: '॥ अखंड अन्नदान सेवा ॥',
    titleMarathi: 'दैनिक महाप्रसाद व अन्नदान वितरण',
    titleEnglish: 'Daily Mahaprasad & Community Kitchen',
    highlightMarathi: 'दररोज दुपारी १२:०० व सायं. ०७:३० वाजता',
    highlightEnglish: 'Everyday 12:00 PM & 07:30 PM',
    descMarathi: 'हजारो भाविकांसाठी शुद्ध सात्विक महाप्रसाद भोजन व्यवस्था. आपल्या शुभप्रसंगी अन्नदान सेवेत सहभाग नोंदवा.',
    descEnglish: 'Pure and hygienic community feast served to thousands of devotees daily. Contribute to Annadaan.',
    gradient: 'radial-gradient(circle at top right, #8C2205 0%, #A02808 45%, #420A00 100%)',
    btn1TextMarathi: '🍛 महाप्रसाद देणगी नोंदवा',
    btn1ActionKey: 'donate',
    btn2TextMarathi: 'ℹ️ मंडळाची संपूर्ण माहिती',
    btn2ActionKey: 'about',
    accentColor: '#FF7043'
  },
  {
    id: 'slide-3',
    badge: '॥ सर्वमंगल मांगल्ये शिवे सर्वार्थ साधिके ॥',
    titleMarathi: 'भव्य १०८ सुवर्ण दिव्यांची महाआरती',
    titleEnglish: 'Grand 108 Deepotsav & Maha Aarti',
    highlightMarathi: 'दररोज रात्री ०८:०० वाजता महाआरती व दांडिया',
    highlightEnglish: 'Every night 8:00 PM with Traditional Dhol-Tasha',
    descMarathi: 'दीपमाळांच्या मंगल प्रकाशात आणि पारंपरिक वाद्यांच्या गजरात संपन्न होणारा नयनरम्य महाआरती व दांडिया सोहळा.',
    descEnglish: 'Mesmerizing evening Aarti illuminated by 108 lamps, accompanied by rhythmic drums and devotional bliss.',
    gradient: 'radial-gradient(circle at top right, #5A0B2C 0%, #78103A 45%, #300316 100%)',
    btn1TextMarathi: '📸 उत्सव फोटो दालन पहा',
    btn1ActionKey: 'gallery',
    btn2TextMarathi: '📅 सर्व कार्यक्रम वेळापत्रक',
    btn2ActionKey: 'events',
    accentColor: '#F06292'
  },
  {
    id: 'slide-4',
    badge: '॥ डिजिटल दुर्गा मंडळ ॥',
    titleMarathi: 'स्मार्ट सभासद ओळखपत्र व ऑनलाईन वर्गणी',
    titleEnglish: 'Digital Smart Member ID Card & Portal',
    highlightMarathi: 'झटपट ओळखपत्र डाऊनलोड व SMS/WhatsApp पावती',
    highlightEnglish: 'Instant Digital ID & Automated Online Receipts',
    descMarathi: 'मंडळाचे अधिकृत सभासद व्हा, वार्षिक वर्गणी ऑनलाईन भरा आणि आपले डिजिटल ओळखपत्र घरबसल्या मिळवा.',
    descEnglish: 'Register as an official Mandal member, view your smart ID card and manage subscriptions effortlessly.',
    gradient: 'radial-gradient(circle at top right, #0C3E42 0%, #135A5E 45%, #052224 100%)',
    btn1TextMarathi: '🪪 सभासद पोर्टल व ओळखपत्र',
    btn1ActionKey: 'members',
    btn2TextMarathi: '📞 मंडळाशी संपर्क साधा',
    btn2ActionKey: 'contact',
    accentColor: '#26A69A'
  }
];

interface MandalContextType {
  events: MandalEvent[];
  notices: MandalNotice[];
  albums: GalleryAlbum[];
  images: GalleryImage[];
  committee: CommitteeMember[];
  members: Member[];
  donations: Donation[];
  payments: MemberPayment[];
  expenses: Expense[];
  sponsors: Sponsor[];
  auditLogs: AuditLog[];
  activeSponsors: Sponsor[];
  festivalConfig: FestivalConfig;
  heroSlides: HeroSlideItem[];
  liveStreamConfig: LiveStreamConfig;

  // CRUD Operations
  addDonation: (donation: Omit<Donation, 'id' | 'createdAt' | 'receiptNumber'>) => Promise<Donation>;
  updateDonation: (id: string, data: Partial<Donation>) => Promise<void>;
  deleteDonation: (id: string) => Promise<void>;
  addMemberPayment: (payment: Omit<MemberPayment, 'id' | 'createdAt' | 'receiptNumber'>) => Promise<MemberPayment>;
  updateMemberPayment: (id: string, data: Partial<MemberPayment>) => Promise<void>;
  deleteMemberPayment: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
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
  deleteImage: (id: string, albumId: string) => Promise<void>;
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
  resetCommitteeToDefaults: () => Promise<void>;

  updateFestivalConfig: (data: Partial<FestivalConfig>) => Promise<void>;
  addHeroSlide: (slide: Omit<HeroSlideItem, 'id'>) => Promise<HeroSlideItem>;
  updateHeroSlide: (id: string, data: Partial<HeroSlideItem>) => Promise<void>;
  deleteHeroSlide: (id: string) => Promise<void>;
  updateLiveStreamConfig: (data: Partial<LiveStreamConfig>) => Promise<void>;
  incrementPranam: () => Promise<void>;

  getFinancialMetrics: (fy?: string) => FinancialMetrics;
  getMemberSummary: (memberId: string, fy?: string) => MemberFinancialSummary;
  pushLocalDataToCloud: () => Promise<{ success: boolean; totalSynced: number; message: string }>;
}

const MandalContext = createContext<MandalContextType | undefined>(undefined);

export const MandalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Helper to safely parse localStorage
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

  function parseCommittee(): CommitteeMember[] {
    const loaded = safeLocalParse<CommitteeMember[]>('dm_committee', SEED_COMMITTEE);
    if (!Array.isArray(loaded) || loaded.length === 0) return SEED_COMMITTEE;
    return loaded.map((c) => {
      const seedMatch = SEED_COMMITTEE.find((s) => s.id === c.id);
      // If photo is missing or contains old broken/dark unsplash link, upgrade to clean seed photo
      if (!c.photoUrl || c.photoUrl.includes('ibb.co') || c.photoUrl.includes('photo-1519085360753-af0119f7cbe7') || c.photoUrl.includes('photo-1500648767791-00dcc994a43e?w=300')) {
        return seedMatch ? { ...c, photoUrl: seedMatch.photoUrl } : c;
      }
      return c;
    });
  }

  function parseEvents(): MandalEvent[] {
    const loaded = safeLocalParse<MandalEvent[]>('dm_events', SEED_EVENTS);
    if (!Array.isArray(loaded) || loaded.length === 0) return SEED_EVENTS;
    return loaded.map((e) => {
      const seedMatch = SEED_EVENTS.find((s) => s.id === e.id);
      if (!e.coverImageUrl || e.coverImageUrl.includes('photo-1567157577867-05ccb1388e66')) {
        return seedMatch ? { ...e, coverImageUrl: seedMatch.coverImageUrl } : e;
      }
      return e;
    });
  }

  function parseAlbums(): GalleryAlbum[] {
    const loaded = safeLocalParse<GalleryAlbum[]>('dm_albums', SEED_ALBUMS);
    if (!Array.isArray(loaded) || loaded.length === 0) return SEED_ALBUMS;
    return loaded.map((a) => {
      const seedMatch = SEED_ALBUMS.find((s) => s.id === a.id);
      if (!a.coverImageUrl || a.coverImageUrl.includes('photo-1567157577867-05ccb1388e66')) {
        return seedMatch ? { ...a, coverImageUrl: seedMatch.coverImageUrl } : a;
      }
      return a;
    });
  }

  function parseImages(): GalleryImage[] {
    const loaded = safeLocalParse<GalleryImage[]>('dm_images', SEED_IMAGES);
    if (!Array.isArray(loaded) || loaded.length === 0) return SEED_IMAGES;
    return loaded.map((img) => {
      const seedMatch = SEED_IMAGES.find((s) => s.id === img.id);
      if (!img.imageUrl || img.imageUrl.includes('photo-1567157577867-05ccb1388e66')) {
        return seedMatch ? { ...img, imageUrl: seedMatch.imageUrl, thumbnailUrl: seedMatch.thumbnailUrl } : img;
      }
      return img;
    });
  }

  function parseDonations(): Donation[] {
    const loaded = safeLocalParse<Donation[]>('dm_donations', []);
    if (!Array.isArray(loaded)) return [];
    const demoIds = new Set(['don-tilak-501', 'don-5001', 'don-5002', 'don-5003', 'don-5004']);
    return loaded.filter(
      (d) =>
        !demoIds.has(d.id) &&
        !d.receiptNumber?.includes('DON-1021') &&
        !d.receiptNumber?.includes('DON-1022') &&
        !d.receiptNumber?.includes('DON-1023') &&
        !d.receiptNumber?.includes('DON-1024') &&
        !d.receiptNumber?.includes('DON-18929')
    );
  }

  function parsePayments(): MemberPayment[] {
    const loaded = safeLocalParse<MemberPayment[]>('dm_payments', SEED_PAYMENTS);
    if (!Array.isArray(loaded)) return SEED_PAYMENTS;

    const memberFYTotals: Record<string, number> = {};
    const sanitized: MemberPayment[] = [];

    for (const p of loaded) {
      if (p.paymentType === 'annual_subscription') {
        const phoneKey = p.memberPhone ? p.memberPhone.replace(/\D/g, '').slice(-10) : '';
        const key = `${p.memberId || phoneKey}_${p.financialYear}`;
        const currentTotal = memberFYTotals[key] || 0;

        if (currentTotal >= 1500) {
          continue; // Filter out duplicate test entries exceeding annual subscription limit
        }

        memberFYTotals[key] = currentTotal + p.amount;
      }
      sanitized.push(p);
    }
    return sanitized;
  }

  // State with LocalStorage Persistence
  const [events, setEvents] = useState<MandalEvent[]>(() => parseEvents());
  const [notices, setNotices] = useState<MandalNotice[]>(() => safeLocalParse('dm_notices', SEED_NOTICES));
  const [albums, setAlbums] = useState<GalleryAlbum[]>(() => parseAlbums());
  const [images, setImages] = useState<GalleryImage[]>(() => parseImages());
  const [committee, setCommittee] = useState<CommitteeMember[]>(() => parseCommittee());
  const [members, setMembers] = useState<Member[]>(() => safeLocalParse('dm_members', SEED_MEMBERS));
  const [donations, setDonations] = useState<Donation[]>(() => parseDonations());
  const [payments, setPayments] = useState<MemberPayment[]>(() => parsePayments());
  const [expenses, setExpenses] = useState<Expense[]>(() => safeLocalParse('dm_expenses', SEED_EXPENSES));
  const [sponsors, setSponsors] = useState<Sponsor[]>(() => safeLocalParse('dm_sponsors', SEED_SPONSORS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => safeLocalParse('dm_audit_logs', []));
  const [festivalConfig, setFestivalConfig] = useState<FestivalConfig>(() => safeLocalParse('dm_festival_config', DEFAULT_FESTIVAL_CONFIG));
  const [heroSlides, setHeroSlides] = useState<HeroSlideItem[]>(() => safeLocalParse('dm_hero_slides', DEFAULT_HERO_SLIDES));
  const [liveStreamConfig, setLiveStreamConfig] = useState<LiveStreamConfig>(() => {
    const loaded = safeLocalParse<LiveStreamConfig>('dm_live_stream', DEFAULT_LIVESTREAM_CONFIG);
    if (loaded && loaded.youtubeUrl === 'https://www.youtube.com/watch?v=5Eqb_-j3FDA') {
      return { ...loaded, youtubeUrl: '' };
    }
    return loaded;
  });

  function safeLocalSet(key: string, data: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn(`[MandalContext] Could not save "${key}" to localStorage:`, err);
      try {
        localStorage.removeItem('dm_audit_logs');
        localStorage.setItem(key, JSON.stringify(data));
      } catch (err2) {
        console.error(`[MandalContext] Critical storage error for "${key}":`, err2);
      }
    }
  }

  // Sync to local storage
  useEffect(() => { safeLocalSet('dm_events', events); }, [events]);
  useEffect(() => { safeLocalSet('dm_notices', notices); }, [notices]);
  useEffect(() => { safeLocalSet('dm_albums', albums); }, [albums]);
  useEffect(() => { safeLocalSet('dm_images', images); }, [images]);
  useEffect(() => { safeLocalSet('dm_committee', committee); }, [committee]);
  useEffect(() => { safeLocalSet('dm_members', members); }, [members]);
  useEffect(() => { safeLocalSet('dm_donations', donations); }, [donations]);
  useEffect(() => { safeLocalSet('dm_payments', payments); }, [payments]);
  useEffect(() => { safeLocalSet('dm_expenses', expenses); }, [expenses]);
  useEffect(() => { safeLocalSet('dm_sponsors', sponsors); }, [sponsors]);
  useEffect(() => { safeLocalSet('dm_audit_logs', auditLogs); }, [auditLogs]);
  useEffect(() => { safeLocalSet('dm_festival_config', festivalConfig); }, [festivalConfig]);
  useEffect(() => { safeLocalSet('dm_hero_slides', heroSlides); }, [heroSlides]);
  useEffect(() => { safeLocalSet('dm_live_stream', liveStreamConfig); }, [liveStreamConfig]);

  // Real-time Firestore Subscriptions for PC-to-Mobile Live Sync
  useEffect(() => {
    const unsubDonations = subscribeToCollection<Donation>(COLLECTIONS.DONATIONS, (cloudItems) => {
      if (cloudItems && cloudItems.length > 0) setDonations(cloudItems);
    });
    const unsubMembers = subscribeToCollection<Member>(COLLECTIONS.MEMBERS, (cloudItems) => {
      if (cloudItems && cloudItems.length > 0) setMembers(cloudItems);
    });
    const unsubPayments = subscribeToCollection<MemberPayment>(COLLECTIONS.PAYMENTS, (cloudItems) => {
      if (cloudItems && cloudItems.length > 0) setPayments(cloudItems);
    });
    const unsubExpenses = subscribeToCollection<Expense>(COLLECTIONS.EXPENSES, (cloudItems) => {
      if (cloudItems && cloudItems.length > 0) setExpenses(cloudItems);
    });
    const unsubEvents = subscribeToCollection<MandalEvent>(COLLECTIONS.EVENTS, (cloudItems) => {
      if (cloudItems && cloudItems.length > 0) setEvents(cloudItems);
    });
    const unsubNotices = subscribeToCollection<MandalNotice>(COLLECTIONS.NOTICES, (cloudItems) => {
      if (cloudItems && cloudItems.length > 0) setNotices(cloudItems);
    });
    const unsubSponsors = subscribeToCollection<Sponsor>(COLLECTIONS.SPONSORS, (cloudItems) => {
      if (cloudItems && cloudItems.length > 0) setSponsors(cloudItems);
    });
    const unsubCommittee = subscribeToCollection<CommitteeMember>(COLLECTIONS.COMMITTEE, (cloudItems) => {
      if (cloudItems && cloudItems.length > 0) setCommittee(cloudItems);
    });
    const unsubLiveStream = subscribeToCollection<LiveStreamConfig>(COLLECTIONS.LIVE_STREAM, (cloudItems) => {
      if (cloudItems && cloudItems.length > 0) {
        const doc = cloudItems.find((item) => item.id === 'current') || cloudItems[cloudItems.length - 1];
        if (doc) setLiveStreamConfig(doc);
      }
    });

    return () => {
      unsubDonations();
      unsubMembers();
      unsubPayments();
      unsubExpenses();
      unsubEvents();
      unsubNotices();
      unsubSponsors();
      unsubCommittee();
      unsubLiveStream();
    };
  }, []);

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
    saveToFirestore(COLLECTIONS.DONATIONS, newDonation);
    return newDonation;
  };

  const updateDonation = async (id: string, data: Partial<Donation>) => {
    setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
    const target = donations.find((d) => d.id === id);
    if (target) saveToFirestore(COLLECTIONS.DONATIONS, { ...target, ...data });
  };

  const deleteDonation = async (id: string) => {
    setDonations((prev) => prev.filter((d) => d.id !== id));
    deleteFromFirestore(COLLECTIONS.DONATIONS, id);
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
    saveToFirestore(COLLECTIONS.PAYMENTS, newPayment);
    return newPayment;
  };

  const updateMemberPayment = async (id: string, data: Partial<MemberPayment>) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    logAction('payment_record' as any, 'payments', id, { action: 'update', data });
    const target = payments.find((p) => p.id === id);
    if (target) saveToFirestore(COLLECTIONS.PAYMENTS, { ...target, ...data });
  };

  const deleteMemberPayment = async (id: string) => {
    setPayments((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev.filter((p) => p.id !== id);

      const phoneKey = target.memberPhone ? target.memberPhone.replace(/\D/g, '').slice(-10) : '';

      return prev.filter((p) => {
        if (p.id === id) return false;
        if (p.paymentType === 'annual_subscription' && p.financialYear === target.financialYear) {
          const matchMember =
            (p.memberId && target.memberId && p.memberId === target.memberId) ||
            (phoneKey && p.memberPhone && p.memberPhone.replace(/\D/g, '').slice(-10) === phoneKey);
          if (matchMember) return false;
        }
        return true;
      });
    });
    logAction('payment_record' as any, 'payments', id, { action: 'delete' });
    deleteFromFirestore(COLLECTIONS.PAYMENTS, id);
  };

  const addExpense = async (input: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
    const fy = input.financialYear || getFinancialYear();
    const count = expenses.length + 1;
    const voucherNumber = input.voucherNumber || `VOUCH-${fy.split('-')[0]}/${String(count).padStart(2, '0')}`;
    const newExpense: Expense = {
      ...input,
      id: 'exp_' + Date.now(),
      voucherNumber,
      createdAt: new Date().toISOString()
    };

    setExpenses((prev) => [newExpense, ...prev]);
    logAction('donation_record' as any, 'expenses', newExpense.id, { amount: newExpense.amount, title: newExpense.title });
    saveToFirestore(COLLECTIONS.EXPENSES, newExpense);
    return newExpense;
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e)));
    const target = expenses.find((e) => e.id === id);
    if (target) saveToFirestore(COLLECTIONS.EXPENSES, { ...target, ...data });
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    deleteFromFirestore(COLLECTIONS.EXPENSES, id);
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

  const deleteImage = async (id: string, albumId: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    setAlbums((prev) => prev.map((a) => (a.id === albumId ? { ...a, imageCount: Math.max(0, a.imageCount - 1) } : a)));
    logAction('gallery_delete', 'gallery_images', id, { albumId });
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
    saveToFirestore(COLLECTIONS.MEMBERS, newMember);
    return newMember;
  };

  const updateMember = async (id: string, data: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m)));
    logAction('member_update', 'members', id, data);
    const target = members.find((m) => m.id === id);
    if (target) saveToFirestore(COLLECTIONS.MEMBERS, { ...target, ...data });
  };

  const deleteMember = async (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    logAction('member_delete', 'members', id, {});
    deleteFromFirestore(COLLECTIONS.MEMBERS, id);
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

  const resetCommitteeToDefaults = async () => {
    setCommittee(SEED_COMMITTEE);
    safeLocalSet('dm_committee', SEED_COMMITTEE);
  };

  const updateFestivalConfig = async (data: Partial<FestivalConfig>) => {
    setFestivalConfig((prev) => ({ ...prev, ...data }));
    logAction('settings_update', 'festival_config', 'main', data);
  };

  const updateHeroSlide = async (id: string, data: Partial<HeroSlideItem>) => {
    setHeroSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    logAction('settings_update', 'hero_slide', id, data);
  };

  // Financial Calculations
  const getMemberSummary = (memberId: string, fy: string = MANDAL_CONFIG.currentFinancialYear): MemberFinancialSummary => {
    const member = members.find((m) => m.id === memberId);
    const annualDue = member ? member.annualDueAmount || MANDAL_CONFIG.annualSubscriptionFee : MANDAL_CONFIG.annualSubscriptionFee;

    const memberPayments = payments.filter((p) => {
      if (p.financialYear !== fy) return false;
      if (p.memberId) {
        return p.memberId === memberId;
      }
      return Boolean(
        member &&
        p.memberPhone &&
        member.phone &&
        p.memberPhone.replace(/\D/g, '').slice(-10) === member.phone.replace(/\D/g, '').slice(-10)
      );
    });

    const successfulPayments = memberPayments.filter((p) => p.paymentStatus === 'successful');
    const pendingPayments = memberPayments.filter((p) => p.paymentStatus === 'pending');

    const rawTotalPaid = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const rawPendingPaid = pendingPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Subscription is capped at annualDue (max ₹1,500 per year)
    const totalPaid = Math.min(annualDue, rawTotalPaid);

    // Pending payments towards subscription are capped so total (totalPaid + pendingPaid) never exceeds annualDue (₹1,500 limit)
    const pendingPaid = Math.min(Math.max(0, annualDue - totalPaid), rawPendingPaid);

    // Remaining due only decreases as payments get VERIFIED (successful).
    // Pending payments do not reduce remainingDue until verified!
    const remainingDue = Math.max(0, annualDue - totalPaid);

    let status: DuesStatus = 'pending';
    if (totalPaid >= annualDue) {
      status = 'paid';
    } else if (pendingPaid > 0) {
      status = 'pending_verification';
    } else if (totalPaid > 0) {
      status = 'partial';
    }

    const lastPayment = memberPayments[memberPayments.length - 1];

    return {
      memberId,
      financialYear: fy,
      totalAnnualDue: annualDue,
      totalPaid,
      pendingPaid,
      remainingDue,
      status,
      lastPaymentDate: lastPayment?.createdAt,
      lastReceiptNumber: lastPayment?.receiptNumber
    };
  };

  const getFinancialMetrics = (fy: string = MANDAL_CONFIG.currentFinancialYear): FinancialMetrics => {
    const [fyStartYear] = fy.split('-').map(Number);
    const fyStart = new Date(fyStartYear, 3, 1); // April 1
    const fyEnd = new Date(fyStartYear + 1, 2, 31, 23, 59, 59); // March 31

    const fyDonations = donations.filter((d) => {
      if (d.paymentStatus !== 'successful') return false;
      if (!d.createdAt) return true;
      const date = new Date(d.createdAt);
      if (isNaN(date.getTime())) return true;
      return date >= fyStart && date <= fyEnd;
    });
    const fyPayments = payments.filter((p) => p.financialYear === fy && p.paymentStatus === 'successful');
    const fyExpenses = expenses.filter((e) => (e.financialYear === fy || getFinancialYear(new Date(e.date || e.createdAt)) === fy));

    const totalDonations = fyDonations.reduce((acc, curr) => acc + curr.amount, 0);
    const totalSubscriptions = members.reduce((acc, m) => acc + getMemberSummary(m.id, fy).totalPaid, 0);
    const totalCollection = totalDonations + totalSubscriptions;
    const totalExpenses = fyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalCollection - totalExpenses;

    const annualFee = MANDAL_CONFIG.annualSubscriptionFee || 1500;
    const activeMembers = members.filter((m) => m.status === 'active');
    const pendingDues = members.reduce((acc, m) => acc + getMemberSummary(m.id, fy).remainingDue, 0);

    const paidMemberIds = new Set(fyPayments.map((p) => p.memberId));
    const paidMembersCount = activeMembers.filter((m) => paidMemberIds.has(m.id)).length;
    const pendingMembersCount = Math.max(0, activeMembers.length - paidMembersCount);

    const categoryBreakdown: Record<string, number> = {
      'वार्षिक वर्गणी (Subscriptions)': totalSubscriptions,
      'अन्नदान व महाप्रसाद': 0,
      'महाआरती देणगी': 0,
      'विशेष उत्सव प्रायोजकत्व': 0,
      'सर्वसाधारण देणगी': 0
    };

    fyDonations.forEach((d) => {
      if (d.donationType === 'annadaan') categoryBreakdown['अन्नदान व महाप्रसाद'] += d.amount;
      else if (d.donationType === 'maharati') categoryBreakdown['महाआरती देणगी'] += d.amount;
      else if (d.donationType === 'special_utsav') categoryBreakdown['विशेष उत्सव प्रायोजकत्व'] += d.amount;
      else categoryBreakdown['सर्वसाधारण देणगी'] += d.amount;
    });

    const expenseCategoryBreakdown: Record<string, number> = {
      'मंडप व सजावट': 0,
      'विद्युत रोषणाई व ध्वनी': 0,
      'महाप्रसाद व अन्नदान': 0,
      'पूजा व होम-हवन': 0,
      'छपाई व प्रसिद्धी': 0,
      'सांस्कृतिक व बक्षीस': 0,
      'इतर प्रशासकीय खर्च': 0
    };

    fyExpenses.forEach((e) => {
      if (e.category === 'mandap_decoration') expenseCategoryBreakdown['मंडप व सजावट'] += e.amount;
      else if (e.category === 'sound_lighting') expenseCategoryBreakdown['विद्युत रोषणाई व ध्वनी'] += e.amount;
      else if (e.category === 'mahaprasad_food') expenseCategoryBreakdown['महाप्रसाद व अन्नदान'] += e.amount;
      else if (e.category === 'puja_havan') expenseCategoryBreakdown['पूजा व होम-हवन'] += e.amount;
      else if (e.category === 'printing_advertising') expenseCategoryBreakdown['छपाई व प्रसिद्धी'] += e.amount;
      else if (e.category === 'cultural_prizes') expenseCategoryBreakdown['सांस्कृतिक व बक्षीस'] += e.amount;
      else expenseCategoryBreakdown['इतर प्रशासकीय खर्च'] += e.amount;
    });

    const MARATHI_MONTH_NAMES = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
    const fyMonthOrder = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2];
    const monthlyMap: Record<number, number> = {};
    const monthlyExpenseMap: Record<number, number> = {};
    fyMonthOrder.forEach((m) => {
      monthlyMap[m] = 0;
      monthlyExpenseMap[m] = 0;
    });

    fyDonations.forEach((d) => {
      const month = new Date(d.createdAt || new Date()).getMonth();
      if (month in monthlyMap) monthlyMap[month] += d.amount;
    });

    members.forEach((m) => {
      const sum = getMemberSummary(m.id, fy);
      if (sum.totalPaid > 0) {
        const month = sum.lastPaymentDate ? new Date(sum.lastPaymentDate).getMonth() : new Date().getMonth();
        if (month in monthlyMap) monthlyMap[month] += sum.totalPaid;
      }
    });

    fyExpenses.forEach((exp) => {
      const month = new Date(exp.date || exp.createdAt).getMonth();
      if (month in monthlyExpenseMap) monthlyExpenseMap[month] += exp.amount;
    });

    const monthlyTrend = fyMonthOrder.map((m) => ({
      month: MARATHI_MONTH_NAMES[m],
      amount: monthlyMap[m]
    }));

    const monthlyExpenseTrend = fyMonthOrder.map((m) => ({
      month: MARATHI_MONTH_NAMES[m],
      amount: monthlyExpenseMap[m]
    }));

    const categoryBreakdownList = Object.entries(categoryBreakdown).map(([label, amount]) => ({
      category: label,
      label,
      amount,
      count: label === 'वार्षिक वर्गणी (Subscriptions)' ? fyPayments.length : fyDonations.length
    }));

    return {
      financialYear: fy,
      totalCollection,
      totalDonations,
      totalSubscriptions,
      totalOther: 0,
      totalExpenses,
      netBalance,
      pendingDues,
      totalMembersCount: members.length,
      paidMembersCount,
      pendingMembersCount,
      successfulTxnCount: fyDonations.length + fyPayments.length,
      failedTxnCount: 0,
      donorCount: fyDonations.length + paidMembersCount,
      expenseTxnCount: fyExpenses.length,
      categoryBreakdown: categoryBreakdownList,
      expenseCategoryBreakdown,
      monthlyTrend,
      monthlyExpenseTrend
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
        expenses,
        sponsors,
        auditLogs,
        activeSponsors,
        addDonation,
        updateDonation,
        deleteDonation,
        addMemberPayment,
        updateMemberPayment,
        deleteMemberPayment,
        addExpense,
        updateExpense,
        deleteExpense,
        addEvent,
        updateEvent,
        deleteEvent,
        recordRsvp,
        addNotice,
        updateNotice,
        deleteNotice,
        addAlbum,
        addImage,
        deleteImage,
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
        resetCommitteeToDefaults,
        festivalConfig,
        heroSlides,
        updateFestivalConfig,
        addHeroSlide: async (slideData: Omit<HeroSlideItem, 'id'>) => {
          const newSlide: HeroSlideItem = {
            ...slideData,
            id: `slide_${Date.now()}`
          };
          const updated = [...heroSlides, newSlide];
          setHeroSlides(updated);
          safeLocalSet('dm_hero_slides', updated);
          logAction('settings_update', 'dm_hero_slides', newSlide.id, newSlide);
          return newSlide;
        },
        updateHeroSlide: async (id: string, data: Partial<HeroSlideItem>) => {
          const updated = heroSlides.map((slide) => (slide.id === id ? { ...slide, ...data } : slide));
          setHeroSlides(updated);
          safeLocalSet('dm_hero_slides', updated);
          logAction('settings_update', 'dm_hero_slides', id, data);
        },
        deleteHeroSlide: async (id: string) => {
          const updated = heroSlides.filter((slide) => slide.id !== id);
          setHeroSlides(updated);
          safeLocalSet('dm_hero_slides', updated);
          logAction('settings_update', 'dm_hero_slides', id, { deleted: true });
        },
        liveStreamConfig,
        updateLiveStreamConfig: async (data: Partial<LiveStreamConfig>) => {
          const updated: LiveStreamConfig = {
            ...liveStreamConfig,
            ...data,
            id: 'current',
            updatedAt: new Date().toISOString()
          };
          setLiveStreamConfig(updated);
          safeLocalSet('dm_live_stream', updated);
          await saveToFirestore(COLLECTIONS.LIVE_STREAM, updated);
          logAction('settings_update', COLLECTIONS.LIVE_STREAM, 'current', data);
        },
        incrementPranam: async () => {
          const updated: LiveStreamConfig = {
            ...liveStreamConfig,
            pranamCount: (liveStreamConfig.pranamCount || 0) + 1
          };
          setLiveStreamConfig(updated);
          safeLocalSet('dm_live_stream', updated);
          await saveToFirestore(COLLECTIONS.LIVE_STREAM, updated);
        },
        getFinancialMetrics,
        getMemberSummary,
        pushLocalDataToCloud: async () => {
          return await pushAllLocalDataToCloud({
            members,
            donations,
            expenses,
            events,
            notices,
            sponsors,
            committee,
            payments
          });
        }
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
