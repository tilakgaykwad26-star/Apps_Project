import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useMandal, HeroSlideItem } from '../context/MandalContext';
import { MANDAL_CONFIG } from '../config/constants';
import { UserRole, Member, MemberType, MemberCategory } from '../types/auth';
import { CommitteeMember } from '../types/committee';
import { formatIndianDate, formatMarathiDate, getAvailableFinancialYears, toMarathiDigits } from '../utils/dateUtils';
import { formatINR } from '../utils/currencyUtils';
import { exportDonationsCSV, exportExpensesCSV, exportMembersCSV, generateFinancialBalanceSheetPDF } from '../services/exportService';
import {
  generateDonationReceiptPDF,
  generateSubscriptionReceiptPDF,
  sendDonationReceiptWhatsApp,
  sendSubscriptionReceiptWhatsApp
} from '../services/receiptService';
import {
  sendBroadcastSms,
  sendEventNotificationSms,
  sendNoticeNotificationSms,
  formatEventNotificationMessage,
  formatNoticeNotificationMessage,
  getStoredFast2SmsKey,
  setStoredFast2SmsKey
} from '../services/smsService';
import { DonationType } from '../types/donation';
import { Expense, ExpenseCategory } from '../types/expense';
import { useNotification } from '../context/NotificationContext';
import { compressImageFile } from '../utils/imageUtils';
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
  Landmark,
  Send,
  Lock,
  ChevronRight,
  Filter,
  DollarSign,
  Upload,
  ArrowLeft,
  Camera,
  FolderOpen,
  Receipt,
  Wallet,
  TrendingDown,
  TrendingUp,
  Coins,
  FileText,
  Sparkles,
  Radio,
  MessageSquare,
  Share2,
  Smartphone,
  Key,
  CheckCircle2
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { extractYouTubeId } from '../types/livestream';

export const AdminDashboardPage: React.FC = () => {
  const { language, t, isMarathi } = useLanguage();
  const { role, isSuperAdmin, isTreasurer, isCommitteeAdmin, isContentManager } = useAuth();
  const {
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
    addDonation,
    updateDonation,
    deleteDonation,
    addMemberPayment,
    updateMemberPayment,
    deleteMemberPayment,
    addMember,
    updateMember,
    deleteMember,
    addExpense,
    updateExpense,
    deleteExpense,
    addEvent,
    updateEvent,
    deleteEvent,
    addNotice,
    updateNotice,
    deleteNotice,
    addAlbum,
    addImage,
    deleteImage,
    deleteAlbum,
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
    addHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    liveStreamConfig,
    updateLiveStreamConfig,
    getFinancialMetrics,
    getMemberSummary
  } = useMandal();

  const { showSuccess, showError } = useNotification();

  // Add New Slide Modal State
  const [isAddSlideModalOpen, setIsAddSlideModalOpen] = useState(false);
  const [newSlideBannerMode, setNewSlideBannerMode] = useState<'standard' | 'full_photo'>('standard');
  const [newSlideTitleMarathi, setNewSlideTitleMarathi] = useState('');
  const [newSlideBadge, setNewSlideBadge] = useState('');
  const [newSlideHighlightMarathi, setNewSlideHighlightMarathi] = useState('');
  const [newSlideDescMarathi, setNewSlideDescMarathi] = useState('');
  const [newSlideBtn1Text, setNewSlideBtn1Text] = useState('❤️ देवीचे दर्शन व देणगी');
  const [newSlideBtn1ActionKey, setNewSlideBtn1ActionKey] = useState('donate');
  const [newSlideBtn2Text, setNewSlideBtn2Text] = useState('📅 आजचे विशेष कार्यक्रम');
  const [newSlideBtn2ActionKey, setNewSlideBtn2ActionKey] = useState('events');
  const [newSlideImageUrl, setNewSlideImageUrl] = useState('');
  const [isSavingNewSlide, setIsSavingNewSlide] = useState(false);

  // Live Stream Control States
  const [liveStreamTitle, setLiveStreamTitle] = useState(liveStreamConfig?.title || 'सार्वजनिक बाल दुर्गा उत्सव - थेट प्रक्षेपण (Live Stream)');
  const [liveStreamUrl, setLiveStreamUrl] = useState(liveStreamConfig?.youtubeUrl || '');
  const [liveStreamDesc, setLiveStreamDesc] = useState(liveStreamConfig?.description || 'मंडळाची दैनिक संध्या आरती व सांस्कृतिक कार्यक्रम थेट पहा.');
  const [isSavingLiveStream, setIsSavingLiveStream] = useState(false);

  useEffect(() => {
    if (liveStreamConfig) {
      if (liveStreamConfig.title) setLiveStreamTitle(liveStreamConfig.title);
      if (liveStreamConfig.youtubeUrl !== undefined) setLiveStreamUrl(liveStreamConfig.youtubeUrl);
      if (liveStreamConfig.description !== undefined) setLiveStreamDesc(liveStreamConfig.description);
    }
  }, [liveStreamConfig?.youtubeUrl, liveStreamConfig?.title, liveStreamConfig?.description]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedFY, setSelectedFY] = useState<string>(MANDAL_CONFIG.currentFinancialYear);

  // Search & Filters
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'paid' | 'pending' | 'partial'>('all');
  const [donationSearch, setDonationSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');

  // Modals
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState<ExpenseCategory>('mandap_decoration');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExpensePayee, setNewExpensePayee] = useState('');
  const [newExpensePhone, setNewExpensePhone] = useState('');
  const [newExpensePaymentMethod, setNewExpensePaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('upi');
  const [newExpenseVoucher, setNewExpenseVoucher] = useState('');
  const [newExpenseBillPreview, setNewExpenseBillPreview] = useState<string | null>(null);
  const [newExpenseNotes, setNewExpenseNotes] = useState('');

  // Edit Expense State
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpenseTitle, setEditExpenseTitle] = useState('');
  const [editExpenseCategory, setEditExpenseCategory] = useState<ExpenseCategory>('mandap_decoration');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseDate, setEditExpenseDate] = useState('');
  const [editExpensePayee, setEditExpensePayee] = useState('');
  const [editExpensePhone, setEditExpensePhone] = useState('');
  const [editExpensePaymentMethod, setEditExpensePaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('upi');
  const [editExpenseVoucher, setEditExpenseVoucher] = useState('');
  const [editExpenseBillPreview, setEditExpenseBillPreview] = useState<string | null>(null);
  const [editExpenseNotes, setEditExpenseNotes] = useState('');

  // View Bill Modal
  const [selectedBillPreview, setSelectedBillPreview] = useState<string | null>(null);

  // Add Jama / Donation Modal State
  const [incomeSearch, setIncomeSearch] = useState('');
  const [incomeCategoryFilter, setIncomeCategoryFilter] = useState<string>('all');
  const [isAddDonationModalOpen, setIsAddDonationModalOpen] = useState(false);
  const [newJamaDonorName, setNewJamaDonorName] = useState('');
  const [newJamaPhone, setNewJamaPhone] = useState('');
  const [newJamaAmount, setNewJamaAmount] = useState('');
  const [newJamaType, setNewJamaType] = useState<DonationType>('annadaan');
  const [newJamaPaymentMethod, setNewJamaPaymentMethod] = useState<'cash' | 'direct_upi' | 'bank_transfer' | 'cheque'>('cash');
  const [newJamaCity, setNewJamaCity] = useState('पुणे');
  const [newJamaPan, setNewJamaPan] = useState('');
  const [newJamaIsAnonymous, setNewJamaIsAnonymous] = useState(false);

  // Edit Jama Modal State
  const [isEditDonationModalOpen, setIsEditDonationModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<any>(null);
  const [editJamaDonorName, setEditJamaDonorName] = useState('');
  const [editJamaPhone, setEditJamaPhone] = useState('');
  const [editJamaAmount, setEditJamaAmount] = useState('');
  const [editJamaType, setEditJamaType] = useState<DonationType>('annadaan');
  const [editJamaPaymentMethod, setEditJamaPaymentMethod] = useState<'cash' | 'direct_upi' | 'bank_transfer' | 'cheque'>('cash');
  const [editJamaCity, setEditJamaCity] = useState('पुणे');
  const [editJamaPan, setEditJamaPan] = useState('');
  const [editJamaIsAnonymous, setEditJamaIsAnonymous] = useState(false);

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
  const [newEventCoverUrl, setNewEventCoverUrl] = useState('');
  const [newEventCoverPreview, setNewEventCoverPreview] = useState<string | null>(null);
  const [newEventChiefGuest, setNewEventChiefGuest] = useState('');
  const [newEventHighlights, setNewEventHighlights] = useState('');
  const [newEventMapUrl, setNewEventMapUrl] = useState('');
  const [sendSmsOnCreateEvent, setSendSmsOnCreateEvent] = useState(false);

  // Send Event SMS Notification State
  const [isSendEventSmsModalOpen, setIsSendEventSmsModalOpen] = useState(false);
  const [smsEventTarget, setSmsEventTarget] = useState<any>(null);
  const [smsRecipientType, setSmsRecipientType] = useState<'all_members' | 'all_donors' | 'custom_phones'>('all_members');
  const [smsCustomPhones, setSmsCustomPhones] = useState('');
  const [smsCustomNote, setSmsCustomNote] = useState('');
  const [smsApiKeyInput, setSmsApiKeyInput] = useState(() => getStoredFast2SmsKey());
  const [isSendingEventSms, setIsSendingEventSms] = useState(false);
  const [isSavedKeyBannerVisible, setIsSavedKeyBannerVisible] = useState(false);

  // Edit Event State
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventDesc, setEditEventDesc] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventTime, setEditEventTime] = useState('');
  const [editEventVenue, setEditEventVenue] = useState('');
  const [editEventStatus, setEditEventStatus] = useState<any>('upcoming');
  const [editEventRsvp, setEditEventRsvp] = useState(true);
  const [editEventCoverUrl, setEditEventCoverUrl] = useState('');
  const [editEventCoverPreview, setEditEventCoverPreview] = useState<string | null>(null);
  const [editEventChiefGuest, setEditEventChiefGuest] = useState('');
  const [editEventHighlights, setEditEventHighlights] = useState('');
  const [editEventMapUrl, setEditEventMapUrl] = useState('');

  const [isAddNoticeModalOpen, setIsAddNoticeModalOpen] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeMessage, setNewNoticeMessage] = useState('');
  const [newNoticePriority, setNewNoticePriority] = useState<any>('important');
  const [sendSmsOnCreateNotice, setSendSmsOnCreateNotice] = useState(false);

  const [isAddAlbumModalOpen, setIsAddAlbumModalOpen] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumYear, setNewAlbumYear] = useState('2026');
  const [newAlbumCover, setNewAlbumCover] = useState('https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop&q=80');

  // Photo Upload States
  const [selectedAlbumForPhotos, setSelectedAlbumForPhotos] = useState<any>(null);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);

  const [isAddSponsorModalOpen, setIsAddSponsorModalOpen] = useState(false);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorBusiness, setNewSponsorBusiness] = useState('');
  const [newSponsorTier, setNewSponsorTier] = useState<any>('gold');

  // Add Member Modal States
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberNameMarathi, setNewMemberNameMarathi] = useState('');
  const [newMemberNameEng, setNewMemberNameEng] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [newMemberCity, setNewMemberCity] = useState('चोप / गडचिरोली');
  const [newMemberPincode, setNewMemberPincode] = useState('441207');
  const [newMemberType, setNewMemberType] = useState<MemberType>('individual');
  const [newMemberCategory, setNewMemberCategory] = useState<MemberCategory>('annual');
  const [newMemberDueAmount, setNewMemberDueAmount] = useState<string>('1500');
  const [newMemberPhotoPreview, setNewMemberPhotoPreview] = useState<string>('');
  const [newMemberFamilyList, setNewMemberFamilyList] = useState<{ name: string; relation: string; age?: number }[]>([]);
  const [isSavingMember, setIsSavingMember] = useState(false);

  // Edit Member Modal States
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editMemberNameMarathi, setEditMemberNameMarathi] = useState('');
  const [editMemberNameEng, setEditMemberNameEng] = useState('');
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [editMemberEmail, setEditMemberEmail] = useState('');
  const [editMemberAddress, setEditMemberAddress] = useState('');
  const [editMemberCity, setEditMemberCity] = useState('');
  const [editMemberPincode, setEditMemberPincode] = useState('');
  const [editMemberType, setEditMemberType] = useState<MemberType>('individual');
  const [editMemberCategory, setEditMemberCategory] = useState<MemberCategory>('annual');
  const [editMemberDueAmount, setEditMemberDueAmount] = useState<string>('1500');
  const [editMemberPhotoPreview, setEditMemberPhotoPreview] = useState<string>('');
  const [editMemberFamilyList, setEditMemberFamilyList] = useState<{ name: string; relation: string; age?: number }[]>([]);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);

  // Committee Management States
  const [isEditCommitteeModalOpen, setIsEditCommitteeModalOpen] = useState(false);
  const [editingCommitteeMember, setEditingCommitteeMember] = useState<CommitteeMember | null>(null);
  const [committeeNameMarathi, setCommitteeNameMarathi] = useState('');
  const [committeeNameEng, setCommitteeNameEng] = useState('');
  const [committeeDesignationMarathi, setCommitteeDesignationMarathi] = useState('');
  const [committeeDesignationEng, setCommitteeDesignationEng] = useState('');
  const [committeePhone, setCommitteePhone] = useState('');
  const [committeeRoleDesc, setCommitteeRoleDesc] = useState('');
  const [committeePhotoPreview, setCommitteePhotoPreview] = useState('');
  const [isSavingCommittee, setIsSavingCommittee] = useState(false);

  const [isAddCommitteeModalOpen, setIsAddCommitteeModalOpen] = useState(false);
  const [newCommNameMarathi, setNewCommNameMarathi] = useState('');
  const [newCommNameEng, setNewCommNameEng] = useState('');
  const [newCommDesignationMarathi, setNewCommDesignationMarathi] = useState('');
  const [newCommDesignationEng, setNewCommDesignationEng] = useState('');
  const [newCommPhone, setNewCommPhone] = useState('');
  const [newCommRoleDesc, setNewCommRoleDesc] = useState('');
  const [newCommPhotoPreview, setNewCommPhotoPreview] = useState('');
  const [isCreatingCommittee, setIsCreatingCommittee] = useState(false);

  // Banner & Festival Settings States
  const [isEditSlideModalOpen, setIsEditSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlideItem | null>(null);
  const [slideBannerMode, setSlideBannerMode] = useState<'standard' | 'full_photo'>('standard');
  const [slideTitleMarathi, setSlideTitleMarathi] = useState('');
  const [slideBadge, setSlideBadge] = useState('');
  const [slideHighlightMarathi, setSlideHighlightMarathi] = useState('');
  const [slideDescMarathi, setSlideDescMarathi] = useState('');
  const [slideBtn1Text, setSlideBtn1Text] = useState('');
  const [slideBtn2Text, setSlideBtn2Text] = useState('');
  const [slideImageUrl, setSlideImageUrl] = useState('');
  const [isUploadingSlideImage, setIsUploadingSlideImage] = useState(false);
  const [isSavingSlide, setIsSavingSlide] = useState(false);

  // Festival Info Form State
  const [festTitleMarathi, setFestTitleMarathi] = useState(festivalConfig?.titleMarathi || 'सार्वजनिक बाल दुर्गा उत्सव मंडळ');
  const [festDatesMarathi, setFestDatesMarathi] = useState(festivalConfig?.datesMarathi || '११ ऑक्टोबर ते २२ ऑक्टोबर २०२६');
  const [festGreeting, setFestGreeting] = useState(festivalConfig?.greeting || '॥ उदो बोला उदो अंबाबाई माउलीचा हो ॥');
  const [festDescMarathi, setFestDescMarathi] = useState(festivalConfig?.descriptionMarathi || '*भक्तीचा उत्सव, संस्कृतीचा अभिमान आणि सेवाभावाची नवी दिशा — चला, नवरात्रोत्सव एकत्र साजरा करूया!*');
  const [festSliderSeconds, setFestSliderSeconds] = useState(festivalConfig?.sliderIntervalSeconds || 5);
  const [isSavingFestConfig, setIsSavingFestConfig] = useState(false);

  // Metrics
  const metrics = getFinancialMetrics(selectedFY);

  const pendingDonationsCount = donations.filter((d) => d.paymentStatus === 'pending').length;
  const pendingPaymentsCount = payments.filter((p) => p.paymentStatus === 'pending').length;
  const totalPendingCount = pendingDonationsCount + pendingPaymentsCount;

  // Tab definitions with RBAC permissions
  const tabs = [
    { key: 'overview', label: t.admin.tabs.overview, icon: LayoutDashboard, allowed: isTreasurer || isSuperAdmin },
    {
      key: 'income',
      label: totalPendingCount > 0 ? `जमा व्यवस्थापन (${totalPendingCount} प्रलंबित)` : 'जमा व्यवस्थापन (Income)',
      icon: Coins,
      badge: totalPendingCount > 0 ? totalPendingCount : undefined,
      allowed: isTreasurer || isSuperAdmin
    },
    { key: 'expenses', label: 'खर्च व्यवस्थापन (Expenses)', icon: Receipt, allowed: isTreasurer || isSuperAdmin },
    { key: 'members', label: `सभासद व्यवस्थापन (${members.length})`, icon: Users, allowed: isCommitteeAdmin || isSuperAdmin },
    { key: 'committee', label: 'कार्यकारणी मंडळ (Committee)', icon: Award, allowed: isCommitteeAdmin || isSuperAdmin },
    { key: 'banners', label: 'बॅनर व उत्सव (Banners)', icon: Sparkles, allowed: isContentManager || isSuperAdmin },
    {
      key: 'livestream',
      label: liveStreamConfig?.isLive ? '🔴 थेट प्रक्षेपण (LIVE)' : '📹 थेट प्रक्षेपण (Live Stream)',
      icon: Radio,
      allowed: isContentManager || isSuperAdmin
    },
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

    const currentSummary = getMemberSummary(selectedMemberForPayment.id, selectedFY);
    if (amount > currentSummary.remainingDue) {
      showError(`वर्गणी रक्कम बाकी रक्कमेपेक्षा (${formatINR(currentSummary.remainingDue)}) जास्त असू शकत नाही. वर्गणी मर्यादा ₹1,500 पर्यंत आहे.`);
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

  const handleEventCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 900, 0.75);
        if (isEdit) {
          setEditEventCoverPreview(compressed);
        } else {
          setNewEventCoverPreview(compressed);
        }
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (isEdit) {
            setEditEventCoverPreview(base64);
          } else {
            setNewEventCoverPreview(base64);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleOpenEditEvent = (evt: any) => {
    setEditingEvent(evt);
    setEditEventTitle(evt.titleMarathi || evt.title);
    setEditEventDesc(evt.descriptionMarathi || evt.description || '');
    setEditEventDate(evt.startDate ? evt.startDate.split('T')[0] : '');
    setEditEventTime(evt.timeString || 'सकाळी ०९:०० ते दुपारी १२:००');
    setEditEventVenue(evt.venueMarathi || evt.venue || 'श्री दुर्गा मंडप');
    setEditEventStatus(evt.status || 'upcoming');
    setEditEventRsvp(evt.isRsvpEnabled ?? true);
    setEditEventCoverUrl(evt.coverImageUrl || '');
    setEditEventCoverPreview(evt.coverImageUrl || null);
    setEditEventChiefGuest(evt.chiefGuest || '');
    setEditEventHighlights(evt.highlights ? evt.highlights.join('\n') : '');
    setEditEventMapUrl(evt.venueMapUrl || '');
    setIsEditEventModalOpen(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editEventTitle.trim()) return;

    try {
      const finalImage = editEventCoverPreview || editEventCoverUrl.trim() || editingEvent.coverImageUrl;
      const parsedHighlights = editEventHighlights
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean);

      await updateEvent(editingEvent.id, {
        title: editEventTitle.trim(),
        titleMarathi: editEventTitle.trim(),
        description: editEventDesc.trim(),
        descriptionMarathi: editEventDesc.trim(),
        startDate: editEventDate ? new Date(editEventDate).toISOString() : editingEvent.startDate,
        endDate: editEventDate ? new Date(editEventDate).toISOString() : editingEvent.endDate,
        timeString: editEventTime,
        venue: editEventVenue,
        venueMarathi: editEventVenue,
        status: editEventStatus,
        isRsvpEnabled: editEventRsvp,
        coverImageUrl: finalImage,
        chiefGuest: editEventChiefGuest.trim() || undefined,
        highlights: parsedHighlights.length > 0 ? parsedHighlights : undefined,
        venueMapUrl: editEventMapUrl.trim() || undefined
      });
      showSuccess('कार्यक्रम व माहिती यशस्वीरित्या अपडेट करण्यात आली!');
      setIsEditEventModalOpen(false);
      setEditingEvent(null);
    } catch (err) {
      showError('कार्यक्रम अपडेट करताना त्रुटी आली.');
    }
  };

  const handleOpenSendEventSms = (evt: any) => {
    setSmsEventTarget(evt);
    setSmsRecipientType('all_members');
    setSmsCustomPhones('');
    setSmsCustomNote('');
    setSmsApiKeyInput(getStoredFast2SmsKey());
    setIsSavedKeyBannerVisible(false);
    setIsSendEventSmsModalOpen(true);
  };

  const handleSaveFast2SmsKey = () => {
    setStoredFast2SmsKey(smsApiKeyInput);
    setIsSavedKeyBannerVisible(true);
    showSuccess('Fast2SMS API Key सेव्ह करण्यात आली!');
    setTimeout(() => setIsSavedKeyBannerVisible(false), 3000);
  };

  const handleSendEventSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsEventTarget) return;

    let targetPhones: string[] = [];

    if (smsRecipientType === 'all_members') {
      targetPhones = members.map((m) => m.phone).filter(Boolean);
    } else if (smsRecipientType === 'all_donors') {
      targetPhones = donations.map((d) => d.donorPhone).filter(Boolean);
    } else if (smsRecipientType === 'custom_phones') {
      targetPhones = smsCustomPhones
        .split(/[\n,;]+/)
        .map((p) => p.trim())
        .filter(Boolean);
    }

    if (targetPhones.length === 0) {
      showError('कृपया किमान एक वैध मोबाईल नंबर निवडा किंवा प्रविष्ट करा.');
      return;
    }

    setIsSendingEventSms(true);
    try {
      const eventDateStr = formatMarathiDate(smsEventTarget.startDate);
      const res = await sendEventNotificationSms({
        phones: targetPhones,
        eventTitle: smsEventTarget.titleMarathi || smsEventTarget.title,
        eventDate: eventDateStr,
        eventTime: smsEventTarget.timeString || '',
        eventVenue: smsEventTarget.venueMarathi || smsEventTarget.venue || '',
        chiefGuest: smsEventTarget.chiefGuest,
        customNote: smsCustomNote.trim() || undefined,
        mandalName: festivalConfig.titleMarathi || 'सार्वजनिक बाल दुर्गा उत्सव मंडळ'
      });

      if (res.success) {
        showSuccess(res.message);
        setIsSendEventSmsModalOpen(false);
      } else {
        showError(res.message || 'SMS पाठवताना त्रुटी आली.');
      }
    } catch (err) {
      showError('SMS पाठवताना अनपेक्षित त्रुटी आली.');
    } finally {
      setIsSendingEventSms(false);
    }
  };

  const handleInstant1ClickBroadcast = async (evt: any) => {
    const memberPhones = members.map((m) => m.phone).filter(Boolean);
    const eventDateStr = formatMarathiDate(evt.startDate);
    const eventTitle = evt.titleMarathi || evt.title;
    const msg = formatEventNotificationMessage({
      mandalName: festivalConfig.titleMarathi || 'सार्वजनिक बाल दुर्गा उत्सव मंडळ',
      title: eventTitle,
      dateStr: eventDateStr,
      timeStr: evt.timeString || '',
      venue: evt.venueMarathi || evt.venue || '',
      chiefGuest: evt.chiefGuest
    });

    // 1. Background SMS to all members
    if (memberPhones.length > 0) {
      sendBroadcastSms(memberPhones, msg).catch((err) => console.warn('[Instant Broadcast SMS]', err));
    }

    // 2. Add an instant In-App Notice so every member visiting the site/app immediately sees the alert
    try {
      await addNotice({
        title: `🚩 आगामी कार्यक्रम: ${eventTitle}`,
        titleMarathi: `🚩 आगामी कार्यक्रम: ${eventTitle}`,
        message: `${eventDateStr} रोजी ${evt.timeString || ''} वाजता ${evt.venueMarathi || evt.venue || ''} येथे '${eventTitle}' संपन्न होत आहे. सर्व भाविकांनी सपरिवार उपस्थित राहावे!`,
        priority: 'urgent',
        publishedBy: 'मंडळ व्यवस्थापन',
        isPublished: true,
        expiresAt: evt.startDate || new Date(Date.now() + 7 * 86400000).toISOString()
      });
    } catch (e) {
      console.warn('[Instant Notice]', e);
    }

    // 3. Open WhatsApp / Native Share with prefilled event message
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: eventTitle,
          text: msg
        });
      } catch (err) {
        window.open(waUrl, '_blank');
      }
    } else {
      window.open(waUrl, '_blank');
    }

    showSuccess(`⚡ '${eventTitle}' ची सूचना एका क्लिकमध्ये सर्व ${memberPhones.length} सदस्यांना पाठवली गेली!`);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    try {
      const finalImage = newEventCoverPreview || newEventCoverUrl.trim() || 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop&q=80';
      const parsedHighlights = newEventHighlights
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean);

      const eventPayload = {
        title: newEventTitle.trim(),
        titleMarathi: newEventTitle.trim(),
        description: newEventDesc.trim() || 'शारदीय नवरात्रोत्सव विशेष कार्यक्रम',
        descriptionMarathi: newEventDesc.trim() || 'शारदीय नवरात्रोत्सव विशेष कार्यक्रम',
        startDate: newEventDate ? new Date(newEventDate).toISOString() : new Date().toISOString(),
        endDate: newEventDate ? new Date(newEventDate).toISOString() : new Date().toISOString(),
        timeString: newEventTime,
        venue: newEventVenue,
        venueMarathi: newEventVenue,
        coverImageUrl: finalImage,
        status: 'upcoming' as const,
        isRsvpEnabled: newEventRsvp,
        rsvpLimit: 500,
        chiefGuest: newEventChiefGuest.trim() || undefined,
        highlights: parsedHighlights.length > 0 ? parsedHighlights : undefined,
        venueMapUrl: newEventMapUrl.trim() || undefined
      };

      await addEvent(eventPayload);
      showSuccess('नवीन कार्यक्रम यशस्वीरित्या जोडला गेला!');

      // Auto-send SMS notification if checked
      if (sendSmsOnCreateEvent) {
        const memberPhones = members.map((m) => m.phone).filter(Boolean);
        if (memberPhones.length > 0) {
          sendEventNotificationSms({
            phones: memberPhones,
            eventTitle: eventPayload.titleMarathi,
            eventDate: formatMarathiDate(eventPayload.startDate),
            eventTime: eventPayload.timeString,
            eventVenue: eventPayload.venueMarathi,
            chiefGuest: eventPayload.chiefGuest,
            mandalName: festivalConfig.titleMarathi || 'सार्वजनिक बाल दुर्गा उत्सव मंडळ'
          }).then((smsRes) => {
            if (smsRes.success) {
              showSuccess(`📢 ${memberPhones.length} सदस्यांना कार्यक्रमाचा SMS पाठवला!`);
            }
          });
        }
      }

      setIsAddEventModalOpen(false);
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventCoverUrl('');
      setNewEventCoverPreview(null);
      setNewEventChiefGuest('');
      setNewEventHighlights('');
      setNewEventMapUrl('');
      setSendSmsOnCreateEvent(false);
    } catch (err) {
      showError('कार्यक्रम जोडताना त्रुटी आली.');
    }
  };

  const handleInstantNoticeBroadcast = async (n: any) => {
    const memberPhones = members.map((m) => m.phone).filter(Boolean);
    const noticeTitle = n.titleMarathi || n.title;
    const noticeMsg = n.messageMarathi || n.message;
    const smsText = formatNoticeNotificationMessage({
      mandalName: festivalConfig?.titleMarathi || 'सार्वजनिक बाल दुर्गा उत्सव मंडळ',
      title: noticeTitle,
      message: noticeMsg,
      priority: n.priority
    });

    // 1. Background SMS to all members
    if (memberPhones.length > 0) {
      sendBroadcastSms(memberPhones, smsText).catch((err) => console.warn('[Instant Notice SMS]', err));
    }

    // 2. Open WhatsApp Share
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(smsText)}`;
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: noticeTitle,
          text: smsText
        });
      } catch (err) {
        window.open(waUrl, '_blank');
      }
    } else {
      window.open(waUrl, '_blank');
    }

    showSuccess(`⚡ '${noticeTitle}' ची सूचना एका क्लिकमध्ये सर्व ${memberPhones.length} सदस्यांना SMS द्वारे पाठवली गेली!`);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim()) return;

    try {
      const noticePayload = {
        title: newNoticeTitle.trim(),
        titleMarathi: newNoticeTitle.trim(),
        message: newNoticeMessage.trim(),
        messageMarathi: newNoticeMessage.trim(),
        priority: newNoticePriority,
        isPublished: true,
        publishedBy: 'प्रशासक मंडळ'
      };

      await addNotice(noticePayload);

      // Auto-send Real SMS notification to all registered members if checked
      if (sendSmsOnCreateNotice) {
        const memberPhones = members.map((m) => m.phone).filter(Boolean);
        if (memberPhones.length > 0) {
          sendNoticeNotificationSms({
            phones: memberPhones,
            noticeTitle: noticePayload.titleMarathi,
            noticeMessage: noticePayload.messageMarathi,
            priority: noticePayload.priority,
            mandalName: festivalConfig?.titleMarathi || 'सार्वजनिक बाल दुर्गा उत्सव मंडळ'
          }).then((smsRes) => {
            if (smsRes.success) {
              showSuccess(`📢 सर्व ${smsRes.recipientCount || memberPhones.length} नोंदणीकृत सभासदांना थेट Real SMS पाठवला!`);
            } else {
              showError(smsRes.message || 'SMS पाठवताना त्रुटी आली.');
            }
          }).catch((err) => {
            console.warn('[Notice Real SMS Error]', err);
          });
        }
      }

      showSuccess('सूचना प्रसिद्ध करण्यात आली!');
      setIsAddNoticeModalOpen(false);
      setNewNoticeTitle('');
      setNewNoticeMessage('');
      setSendSmsOnCreateNotice(false);
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

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 1200, 0.75);
        setNewPhotoPreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAlbumCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 800, 0.75);
        setNewAlbumCover(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewAlbumCover(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbumForPhotos) return;
    const finalUrl = newPhotoPreview || newPhotoUrl.trim() || 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop&q=80';
    try {
      await addImage({
        albumId: selectedAlbumForPhotos.id,
        imageUrl: finalUrl,
        captionMarathi: newPhotoCaption.trim() || undefined,
        sortOrder: 0
      });
      showSuccess('फोटो यशस्वीरित्या अल्बममध्ये जोडला गेला!');
      setNewPhotoUrl('');
      setNewPhotoCaption('');
      setNewPhotoPreview(null);
      setIsAddPhotoModalOpen(false);
    } catch (err) {
      showError('फोटो जोडताना त्रुटी आली.');
    }
  };

  const handleExpenseBillFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 800, 0.75);
        if (isEdit) {
          setEditExpenseBillPreview(compressed);
        } else {
          setNewExpenseBillPreview(compressed);
        }
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (isEdit) {
            setEditExpenseBillPreview(base64);
          } else {
            setNewExpenseBillPreview(base64);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleMemberPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('कृपया वैध इमेज (JPG/PNG) फाईल निवडा.');
        return;
      }
      try {
        const compressed = await compressImageFile(file, 800, 0.75);
        setNewMemberPhotoPreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewMemberPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberNameMarathi.trim() && !newMemberNameEng.trim()) {
      showError('कृपया सभासदाचे नाव प्रविष्ट करा.');
      return;
    }
    const cleanPhone = newMemberPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      showError('कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.');
      return;
    }

    const exists = members.some((m) => (m.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
    if (exists) {
      showError('हा मोबाईल नंबर आधीच दुसऱ्या सभासदाच्या नावावर नोंदणीकृत आहे.');
      return;
    }

    setIsSavingMember(true);
    try {
      const validFamily = newMemberFamilyList.filter((f) => f.name.trim().length > 0);
      const fee = parseInt(newMemberDueAmount, 10) || 1500;

      const created = await addMember({
        fullName: newMemberNameEng.trim() || newMemberNameMarathi.trim(),
        fullNameMarathi: newMemberNameMarathi.trim() || newMemberNameEng.trim(),
        phone: cleanPhone,
        email: newMemberEmail.trim() || undefined,
        address: newMemberAddress.trim() || 'स्थानिक पत्ता',
        cityVillage: newMemberCity.trim() || 'चोप / गडचिरोली',
        pincode: newMemberPincode.trim() || '441207',
        memberType: newMemberType,
        category: newMemberCategory,
        familyMembers: newMemberType === 'family' ? validFamily : undefined,
        photoUrl: newMemberPhotoPreview || undefined,
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0],
        annualDueAmount: fee
      });

      showSuccess(`नवीन सभासद ${created.fullNameMarathi} (${created.memberNumber}) यशस्वीरित्या जोडला गेला!`);
      setIsAddMemberModalOpen(false);

      // Reset form
      setNewMemberNameMarathi('');
      setNewMemberNameEng('');
      setNewMemberPhone('');
      setNewMemberEmail('');
      setNewMemberAddress('');
      setNewMemberCity('चोप / गडचिरोली');
      setNewMemberPincode('441207');
      setNewMemberType('individual');
      setNewMemberCategory('annual');
      setNewMemberDueAmount('1500');
      setNewMemberPhotoPreview('');
      setNewMemberFamilyList([]);
    } catch (err) {
      showError('सभासद जोडताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsSavingMember(false);
    }
  };

  const openEditMemberModal = (m: Member) => {
    setEditingMember(m);
    setEditMemberNameMarathi(m.fullNameMarathi || m.fullName);
    setEditMemberNameEng(m.fullName || '');
    setEditMemberPhone(m.phone || '');
    setEditMemberEmail(m.email || '');
    setEditMemberAddress(m.address || '');
    setEditMemberCity(m.cityVillage || 'चोप / गडचिरोली');
    setEditMemberPincode(m.pincode || '441207');
    setEditMemberType(m.memberType || 'individual');
    setEditMemberCategory(m.category || 'annual');
    setEditMemberDueAmount(String(m.annualDueAmount || 1500));
    setEditMemberPhotoPreview(m.photoUrl || '');
    setEditMemberFamilyList(m.familyMembers || []);
    setIsEditMemberModalOpen(true);
  };

  const handleEditMemberPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('कृपया वैध इमेज (JPG/PNG) फाईल निवडा.');
        return;
      }
      try {
        const compressed = await compressImageFile(file, 800, 0.75);
        setEditMemberPhotoPreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditMemberPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleUpdateMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editMemberNameMarathi.trim() && !editMemberNameEng.trim()) {
      showError('कृपया सभासदाचे नाव प्रविष्ट करा.');
      return;
    }
    const cleanPhone = editMemberPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      showError('कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.');
      return;
    }

    setIsUpdatingMember(true);
    try {
      const validFamily = editMemberFamilyList.filter((f) => f.name.trim().length > 0);
      const fee = parseInt(editMemberDueAmount, 10) || 1500;

      await updateMember(editingMember.id, {
        fullName: editMemberNameEng.trim() || editMemberNameMarathi.trim(),
        fullNameMarathi: editMemberNameMarathi.trim() || editMemberNameEng.trim(),
        phone: cleanPhone,
        email: editMemberEmail.trim() || undefined,
        address: editMemberAddress.trim() || 'स्थानिक पत्ता',
        cityVillage: editMemberCity.trim() || 'चोप / गडचिरोली',
        pincode: editMemberPincode.trim() || '441207',
        memberType: editMemberType,
        category: editMemberCategory,
        familyMembers: editMemberType === 'family' ? validFamily : undefined,
        photoUrl: editMemberPhotoPreview || undefined,
        annualDueAmount: fee
      });

      showSuccess(`सभासद ${editMemberNameMarathi} ची माहिती यशस्वीरित्या अद्ययावत केली!`);
      setIsEditMemberModalOpen(false);
      setEditingMember(null);
    } catch (err) {
      showError('माहिती अद्ययावत करताना त्रुटी आली.');
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const openEditCommitteeModal = (c: CommitteeMember) => {
    setEditingCommitteeMember(c);
    setCommitteeNameMarathi(c.nameMarathi || c.name);
    setCommitteeNameEng(c.name || '');
    setCommitteeDesignationMarathi(c.designationMarathi || '');
    setCommitteeDesignationEng(c.designationEnglish || '');
    setCommitteePhone(c.phone || '');
    setCommitteeRoleDesc(c.roleDescriptionMarathi || '');
    setCommitteePhotoPreview(c.photoUrl || '');
    setIsEditCommitteeModalOpen(true);
  };

  const handleCommitteePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('कृपया वैध इमेज (JPG/PNG) फाईल निवडा.');
        return;
      }
      try {
        const compressed = await compressImageFile(file, 600, 0.8);
        if (isEdit) {
          setCommitteePhotoPreview(compressed);
        } else {
          setNewCommPhotoPreview(compressed);
        }
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          if (isEdit) setCommitteePhotoPreview(res);
          else setNewCommPhotoPreview(res);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleUpdateCommitteeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommitteeMember) return;
    if (!committeeNameMarathi.trim()) {
      showError('कृपया नाव प्रविष्ट करा.');
      return;
    }
    setIsSavingCommittee(true);
    try {
      await updateCommitteeMember(editingCommitteeMember.id, {
        nameMarathi: committeeNameMarathi.trim(),
        name: committeeNameEng.trim() || committeeNameMarathi.trim(),
        designationMarathi: committeeDesignationMarathi.trim() || 'कार्यकारणी सदस्य',
        designationEnglish: committeeDesignationEng.trim() || 'Committee Member',
        phone: committeePhone.trim(),
        roleDescriptionMarathi: committeeRoleDesc.trim() || undefined,
        photoUrl: committeePhotoPreview || editingCommitteeMember.photoUrl
      });
      showSuccess(`${committeeNameMarathi} यांची माहिती व फोटो यशस्वीरित्या बदलला!`);
      setIsEditCommitteeModalOpen(false);
      setEditingCommitteeMember(null);
    } catch {
      showError('माहिती बदलताना त्रुटी आली.');
    } finally {
      setIsSavingCommittee(false);
    }
  };

  const handleCreateCommitteeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommNameMarathi.trim()) {
      showError('कृपया नाव प्रविष्ट करा.');
      return;
    }
    setIsCreatingCommittee(true);
    try {
      await addCommitteeMember({
        nameMarathi: newCommNameMarathi.trim(),
        name: newCommNameEng.trim() || newCommNameMarathi.trim(),
        designationMarathi: newCommDesignationMarathi.trim() || 'कार्यकारणी सदस्य',
        designationEnglish: newCommDesignationEng.trim() || 'Committee Member',
        phone: newCommPhone.trim() || '+91 00000 00000',
        photoUrl: newCommPhotoPreview || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        hierarchyOrder: committee.length + 1,
        isCoreMember: true,
        roleDescriptionMarathi: newCommRoleDesc.trim() || undefined
      });
      showSuccess(`नवीन पदाधिकारी ${newCommNameMarathi} यशस्वीरित्या जोडले!`);
      setIsAddCommitteeModalOpen(false);
      setNewCommNameMarathi('');
      setNewCommNameEng('');
      setNewCommDesignationMarathi('');
      setNewCommDesignationEng('');
      setNewCommPhone('');
      setNewCommRoleDesc('');
      setNewCommPhotoPreview('');
    } catch {
      showError('नोंद करताना त्रुटी आली.');
    } finally {
      setIsCreatingCommittee(false);
    }
  };

  const handleSlideImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingSlideImage(true);
      try {
        const compressed = await compressImageFile(file, 1200, 0.8);
        setSlideImageUrl(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSlideImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingSlideImage(false);
      }
    }
  };

  const openEditSlideModal = (s: HeroSlideItem) => {
    setEditingSlide(s);
    setSlideBannerMode(s.bannerMode || 'standard');
    setSlideTitleMarathi(s.titleMarathi);
    setSlideBadge(s.badge);
    setSlideHighlightMarathi(s.highlightMarathi);
    setSlideDescMarathi(s.descMarathi);
    setSlideBtn1Text(s.btn1TextMarathi);
    setSlideBtn2Text(s.btn2TextMarathi);
    setSlideImageUrl(s.imageUrl || '');
    setIsEditSlideModalOpen(true);
  };

  const handleUpdateSlideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;
    setIsSavingSlide(true);
    try {
      await updateHeroSlide(editingSlide.id, {
        titleMarathi: slideTitleMarathi.trim() || 'उत्सव बॅनर',
        badge: slideBadge.trim(),
        highlightMarathi: slideHighlightMarathi.trim(),
        descMarathi: slideDescMarathi.trim(),
        btn1TextMarathi: slideBtn1Text.trim(),
        btn2TextMarathi: slideBtn2Text.trim(),
        imageUrl: slideImageUrl.trim() || undefined,
        bannerMode: slideBannerMode
      });
      showSuccess('स्लाईड माहिती व बॅनर यशस्वीरित्या बदलले!');
      setIsEditSlideModalOpen(false);
      setEditingSlide(null);
    } catch {
      showError('स्लाईड बदलताना त्रुटी आली.');
    } finally {
      setIsSavingSlide(false);
    }
  };

  const handleCreateSlideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlideTitleMarathi.trim()) {
      showError('कृपया स्लाईडचे शीर्षक प्रविष्ट करा.');
      return;
    }
    setIsSavingNewSlide(true);
    try {
      await addHeroSlide({
        badge: newSlideBadge.trim() || '॥ उत्सव सोहळा ॥',
        titleMarathi: newSlideTitleMarathi.trim(),
        titleEnglish: newSlideTitleMarathi.trim(),
        highlightMarathi: newSlideHighlightMarathi.trim(),
        highlightEnglish: newSlideHighlightMarathi.trim(),
        descMarathi: newSlideDescMarathi.trim(),
        descEnglish: newSlideDescMarathi.trim(),
        gradient: 'radial-gradient(circle at top right, #8C2205 0%, #A02808 45%, #420A00 100%)',
        btn1TextMarathi: newSlideBtn1Text.trim() || '❤️ देणगी नोंदवा',
        btn1ActionKey: newSlideBtn1ActionKey,
        btn2TextMarathi: newSlideBtn2Text.trim() || '📅 वेळापत्रक',
        btn2ActionKey: newSlideBtn2ActionKey,
        accentColor: '#FFD54F',
        imageUrl: newSlideImageUrl.trim() || undefined,
        bannerMode: newSlideBannerMode
      });
      showSuccess('नवीन स्लाईड / बॅनर यशस्वीरित्या जोडला गेला!');
      setIsAddSlideModalOpen(false);

      // Reset form
      setNewSlideTitleMarathi('');
      setNewSlideBadge('');
      setNewSlideHighlightMarathi('');
      setNewSlideDescMarathi('');
      setNewSlideImageUrl('');
    } catch {
      showError('स्लाईड जोडताना त्रुटी आली.');
    } finally {
      setIsSavingNewSlide(false);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (confirm('खात्री करा: ही स्लाईड / बॅनर डिलीट करायचा आहे का?')) {
      try {
        await deleteHeroSlide(id);
        showSuccess('स्लाईड यशस्वीरित्या डिलीट केली!');
      } catch {
        showError('स्लाईड डिलीट करताना त्रुटी आली.');
      }
    }
  };

  const handleApplySliderSpeed = async (seconds: number) => {
    const sec = Math.max(0, Math.min(60, seconds));
    setFestSliderSeconds(sec);
    try {
      await updateFestivalConfig({ sliderIntervalSeconds: sec });
      if (sec === 0) {
        showSuccess('बॅनर ऑटो-स्क्रोल बंद केले! आता बॅनर फक्त मॅन्युअली फिरेल.');
      } else {
        showSuccess(`बॅनर स्लायडर वेळ ${sec} सेकंद सेट झाली!`);
      }
    } catch {
      showError('स्लायडर वेळ बदलताना त्रुटी आली.');
    }
  };

  const handleSaveFestivalConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFestConfig(true);
    try {
      const seconds = Math.max(0, Math.min(60, Number(festSliderSeconds)));
      await updateFestivalConfig({
        titleMarathi: festTitleMarathi.trim(),
        datesMarathi: festDatesMarathi.trim(),
        greeting: festGreeting.trim(),
        descriptionMarathi: festDescMarathi.trim(),
        sliderIntervalSeconds: seconds
      });
      // Also sync the 1st slide title and dates
      await updateHeroSlide('slide-1', {
        titleMarathi: festTitleMarathi.trim(),
        highlightMarathi: festDatesMarathi.trim(),
        badge: festGreeting.trim()
      });
      if (seconds === 0) {
        showSuccess('उत्सव माहिती सेव्ह केली व बॅनर ऑटो-स्क्रोल बंद ठेवले!');
      } else {
        showSuccess(`उत्सव माहिती व स्लायडर वेळ (${seconds} सेकंद) यशस्वीरित्या सेव्ह केली!`);
      }
    } catch {
      showError('माहिती सेव्ह करताना त्रुटी आली.');
    } finally {
      setIsSavingFestConfig(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(newExpenseAmount, 10);
    if (!newExpenseTitle.trim() || !amount || amount <= 0) {
      showError('कृपया वैध शीर्षक व रक्कम प्रविष्ट करा.');
      return;
    }

    const categoryLabels: Record<ExpenseCategory, string> = {
      mandap_decoration: 'मंडप व सजावट',
      sound_lighting: 'विद्युत रोषणाई व ध्वनी',
      mahaprasad_food: 'महाप्रसाद व अन्नदान',
      puja_havan: 'पूजा व होम-हवन',
      printing_advertising: 'छपाई व प्रसिद्धी',
      cultural_prizes: 'सांस्कृतिक व बक्षीस',
      administrative_misc: 'प्रशासकीय खर्च',
      other: 'इतर किरकोळ खर्च'
    };

    try {
      await addExpense({
        financialYear: selectedFY,
        title: newExpenseTitle.trim(),
        titleMarathi: newExpenseTitle.trim(),
        category: newExpenseCategory,
        categoryMarathi: categoryLabels[newExpenseCategory] || 'खर्च',
        amount,
        date: newExpenseDate ? new Date(newExpenseDate).toISOString() : new Date().toISOString(),
        payeeName: newExpensePayee.trim() || 'अधिकृत देयक',
        payeePhone: newExpensePhone.trim() || undefined,
        paymentMethod: newExpensePaymentMethod,
        voucherNumber: newExpenseVoucher.trim() || undefined,
        billReceiptUrl: newExpenseBillPreview || undefined,
        recordedBy: 'admin',
        recordedByName: 'खजिनदार (Admin)',
        notes: newExpenseNotes.trim() || undefined
      });

      showSuccess('खर्चाची नोंद यशस्वीरित्या जमा-खर्च वहीत झाली!');
      setIsAddExpenseModalOpen(false);
      setNewExpenseTitle('');
      setNewExpenseAmount('');
      setNewExpensePayee('');
      setNewExpensePhone('');
      setNewExpenseVoucher('');
      setNewExpenseBillPreview(null);
      setNewExpenseNotes('');
    } catch (err) {
      showError('खर्च नोंदवताना त्रुटी आली.');
    }
  };

  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setEditExpenseTitle(exp.titleMarathi || exp.title);
    setEditExpenseCategory(exp.category);
    setEditExpenseAmount(String(exp.amount));
    setEditExpenseDate(exp.date ? exp.date.split('T')[0] : '');
    setEditExpensePayee(exp.payeeName || '');
    setEditExpensePhone(exp.payeePhone || '');
    setEditExpensePaymentMethod(exp.paymentMethod);
    setEditExpenseVoucher(exp.voucherNumber || '');
    setEditExpenseBillPreview(exp.billReceiptUrl || null);
    setEditExpenseNotes(exp.notes || '');
    setIsEditExpenseModalOpen(true);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const amount = parseInt(editExpenseAmount, 10);
    if (!editExpenseTitle.trim() || !amount || amount <= 0) {
      showError('कृपया वैध शीर्षक व रक्कम प्रविष्ट करा.');
      return;
    }

    const categoryLabels: Record<ExpenseCategory, string> = {
      mandap_decoration: 'मंडप व सजावट',
      sound_lighting: 'विद्युत रोषणाई व ध्वनी',
      mahaprasad_food: 'महाप्रसाद व अन्नदान',
      puja_havan: 'पूजा व होम-हवन',
      printing_advertising: 'छपाई व प्रसिद्धी',
      cultural_prizes: 'सांस्कृतिक व बक्षीस',
      administrative_misc: 'प्रशासकीय खर्च',
      other: 'इतर किरकोळ खर्च'
    };

    try {
      await updateExpense(editingExpense.id, {
        title: editExpenseTitle.trim(),
        titleMarathi: editExpenseTitle.trim(),
        category: editExpenseCategory,
        categoryMarathi: categoryLabels[editExpenseCategory] || 'खर्च',
        amount,
        date: editExpenseDate ? new Date(editExpenseDate).toISOString() : editingExpense.date,
        payeeName: editExpensePayee.trim() || editingExpense.payeeName,
        payeePhone: editExpensePhone.trim() || undefined,
        paymentMethod: editExpensePaymentMethod,
        voucherNumber: editExpenseVoucher.trim() || editingExpense.voucherNumber,
        billReceiptUrl: editExpenseBillPreview || undefined,
        notes: editExpenseNotes.trim() || undefined
      });

      showSuccess('खर्च यशस्वीरित्या अपडेट करण्यात आला!');
      setIsEditExpenseModalOpen(false);
      setEditingExpense(null);
    } catch (err) {
      showError('खर्च अपडेट करताना त्रुटी आली.');
    }
  };

  const handleAddOfflineDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(newJamaAmount, 10);
    if (!amount || amount < 1) {
      showError('कृपया वैध रक्कम प्रविष्ट करा.');
      return;
    }
    if (!newJamaIsAnonymous && !newJamaDonorName.trim()) {
      showError('कृपया देणगीदाराचे नाव प्रविष्ट करा.');
      return;
    }

    const typeLabels: Record<string, string> = {
      annadaan: 'अन्नदान व महाप्रसाद',
      maharati: 'महाआरती देणगी',
      special_utsav: 'विशेष उत्सव प्रायोजकत्व',
      murti_decoration: 'मूर्ती शृंगार व अलंकार',
      general: 'सर्वसाधारण देणगी / जमा'
    };

    try {
      const savedDonation = await addDonation({
        amount,
        donorName: newJamaIsAnonymous ? 'Anonymous Devotee' : newJamaDonorName.trim(),
        donorPhone: newJamaPhone.trim() || '9999999999',
        donorPan: newJamaPan.trim().toUpperCase() || undefined,
        donorCity: newJamaCity.trim() || 'पुणे',
        donationType: newJamaType,
        donationTypeMarathi: typeLabels[newJamaType] || 'देणगी / जमा',
        paymentMethod: newJamaPaymentMethod as any,
        paymentStatus: 'successful',
        isAnonymous: newJamaIsAnonymous
      });

      showSuccess(`₹ ${amount} ची जमा नोंद झाली! पावती क्र: ${savedDonation.receiptNumber}`);
      setIsAddDonationModalOpen(false);
      setNewJamaDonorName('');
      setNewJamaPhone('');
      setNewJamaAmount('');
      setNewJamaPan('');
      setNewJamaIsAnonymous(false);

      // Auto trigger PDF download
      const doc = generateDonationReceiptPDF(savedDonation);
      doc.save(`Receipt_${savedDonation.receiptNumber.replace(/\//g, '_')}.pdf`);
    } catch (err) {
      showError('जमा नोंदवताना त्रुटी आली.');
    }
  };

  const handleOpenEditDonation = (d: any) => {
    setEditingDonation(d);
    setEditJamaDonorName(d.donorName || '');
    setEditJamaPhone(d.donorPhone || '');
    setEditJamaAmount(String(d.amount));
    setEditJamaType(d.donationType);
    setEditJamaPaymentMethod((d.paymentMethod as any) || 'cash');
    setEditJamaCity(d.donorCity || 'पुणे');
    setEditJamaPan(d.donorPan || '');
    setEditJamaIsAnonymous(d.isAnonymous || false);
    setIsEditDonationModalOpen(true);
  };

  const handleUpdateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDonation) return;
    const amount = parseInt(editJamaAmount, 10);
    if (!amount || amount < 1) {
      showError('कृपया वैध रक्कम प्रविष्ट करा.');
      return;
    }

    const typeLabels: Record<string, string> = {
      annadaan: 'अन्नदान व महाप्रसाद',
      maharati: 'महाआरती देणगी',
      special_utsav: 'विशेष उत्सव प्रायोजकत्व',
      murti_decoration: 'मूर्ती शृंगार व अलंकार',
      general: 'सर्वसाधारण देणगी / जमा'
    };

    try {
      await updateDonation(editingDonation.id, {
        amount,
        donorName: editJamaIsAnonymous ? 'Anonymous Devotee' : editJamaDonorName.trim(),
        donorPhone: editJamaPhone.trim() || '9999999999',
        donorPan: editJamaPan.trim().toUpperCase() || undefined,
        donorCity: editJamaCity.trim() || 'पुणे',
        donationType: editJamaType,
        donationTypeMarathi: typeLabels[editJamaType] || 'देणगी / जमा',
        paymentMethod: editJamaPaymentMethod as any,
        isAnonymous: editJamaIsAnonymous
      });

      showSuccess('जमा नोंद यशस्वीरित्या बदलण्यात आली!');
      setIsEditDonationModalOpen(false);
      setEditingDonation(null);
    } catch (err) {
      showError('जमा नोंद अपडेट करताना त्रुटी आली.');
    }
  };

  const handleVerifyDonation = async (d: any) => {
    try {
      await updateDonation(d.id, { paymentStatus: 'successful' });
      const verified = { ...d, paymentStatus: 'successful' };
      showSuccess(`₹ ${d.amount} ची देणगी पडताळणी यशस्वी! WhatsApp वर पावती पाठवली जात आहे.`);

      const doc = generateDonationReceiptPDF(verified);
      doc.save(`Receipt_${d.receiptNumber.replace(/\//g, '_')}.pdf`);

      setTimeout(() => {
        sendDonationReceiptWhatsApp(verified);
      }, 500);
    } catch (e) {
      showError('पडताळणी करताना त्रुटी आली.');
    }
  };

  const handleRejectDonation = async (d: any) => {
    if (confirm(`खात्री करा: "${d.donorName}" यांची ₹ ${d.amount} ची देणगी नोंद बँक खात्यात पैसे जमा न झाल्यामुळे नाकारायची (Reject) आहे का?`)) {
      try {
        await deleteDonation(d.id);
        showSuccess('देणगी नोंद यशस्वीरीत्या नाकारली.');
      } catch (e) {
        showError('देणगी नाकारताना त्रुटी आली.');
      }
    }
  };

  const handleVerifyMemberPayment = async (p: any) => {
    try {
      await updateMemberPayment(p.id, { paymentStatus: 'successful' });
      const verified = { ...p, paymentStatus: 'successful' as const };
      showSuccess(`₹ ${p.amount} ची वर्गणी पडताळणी यशस्वी! WhatsApp वर पावती पाठवली जात आहे.`);

      const doc = generateSubscriptionReceiptPDF(verified);
      doc.save(`Receipt_${p.receiptNumber.replace(/\//g, '_')}.pdf`);

      setTimeout(() => {
        sendSubscriptionReceiptWhatsApp(verified);
      }, 500);
    } catch (e) {
      showError('वर्गणी पडताळणी करताना त्रुटी आली.');
    }
  };

  const handleRejectMemberPayment = async (p: any) => {
    if (confirm(`खात्री करा: "${p.memberName}" यांची ₹ ${p.amount} ची ऑनलाईन वर्गणी नोंद नाकारायची (Reject) आहे का?`)) {
      try {
        await deleteMemberPayment(p.id);
        showSuccess('वर्गणी नोंद यशस्वीरीत्या नाकारली.');
      } catch (e) {
        showError('वर्गणी नाकारताना त्रुटी आली.');
      }
    }
  };

  const handleDownloadPDFReceipt = (d: any) => {
    try {
      const doc = generateDonationReceiptPDF(d);
      doc.save(`Receipt_${d.receiptNumber ? d.receiptNumber.replace(/\//g, '_') : 'Donation'}.pdf`);
      showSuccess('पावती (PDF) डाउनलोड झाली!');
    } catch (err) {
      showError('पावती डाउनलोड करताना त्रुटी आली.');
    }
  };

  const handleExportBalanceSheet = () => {
    try {
      const doc = generateFinancialBalanceSheetPDF(selectedFY, donations, payments, metrics);
      doc.save(`Durga_Mandal_Financial_Audit_FY_${selectedFY}.pdf`);
      showSuccess('आर्थिक अहवाल (PDF Balance Sheet) तयार झाला!');
    } catch (err) {
      showError('अहवाल तयार करताना त्रुटी आली.');
    }
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
          {/* Pending Verifications Quick Approval Banner */}
          {donations.filter((d) => d.paymentStatus === 'pending').length > 0 && (
            <div className="card" style={{
              border: '2px solid #F59E0B',
              backgroundColor: '#FEF3C7',
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#D97706', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    ⏳
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: '#92400E', margin: 0, fontWeight: 800 }}>
                      पडताळणी प्रलंबित देणग्या ({donations.filter((d) => d.paymentStatus === 'pending').length})
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#B45309' }}>
                      बँक खात्यात पैसे जमा झाल्याची खात्री करून एका क्लिकवर पडताळणी पूर्ण करा व WhatsApp पावती पाठवा.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {donations.filter((d) => d.paymentStatus === 'pending').map((p) => (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #FDE68A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: '#1F2937', fontSize: '0.98rem' }}>
                        {p.donorName} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>({p.donorPhone})</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#4B5563', marginTop: '2px' }}>
                        प्रकार: <strong>{p.donationTypeMarathi || p.donationType}</strong> | पावती: <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{p.receiptNumber}</code>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#871C1C' }}>
                        {formatINR(p.amount)}
                      </div>

                      <button
                        onClick={() => handleVerifyDonation(p)}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: '#16A34A',
                          borderColor: '#16A34A',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          gap: '6px',
                          padding: '6px 12px'
                        }}
                      >
                        <CheckCircle size={15} />
                        <span>पडताळणी पूर्ण करा व WhatsApp पावती पाठवा</span>
                      </button>

                      <button
                        onClick={() => handleRejectDonation(p)}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: '#EF4444',
                          borderColor: '#EF4444',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          padding: '6px 10px'
                        }}
                      >
                        नाकारा (Reject)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

            <div className="card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>एकूण खर्च (Total Expenses)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '4px' }}>
                {formatINR(metrics.totalExpenses)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {metrics.expenseTxnCount} नोंदवलेले खर्च बिल
              </div>
            </div>

            {/* 3. Net Balance (शिल्लक निधी) */}
            <div className="card" style={{ borderLeft: `4px solid ${metrics.netBalance >= 0 ? '#059669' : 'var(--color-danger)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>शिल्लक निधी (Net Balance)</div>
                <Landmark size={18} color={metrics.netBalance >= 0 ? '#059669' : 'var(--color-danger)'} />
              </div>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: metrics.netBalance >= 0 ? '#059669' : 'var(--color-danger)',
                marginTop: '4px'
              }}>
                {formatINR(metrics.netBalance)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                बँक खाते + रोख शिल्लक
              </div>
            </div>

            {/* 4. Subscription Collected & Pending Dues */}
            <div className="card" style={{ borderLeft: '4px solid var(--color-saffron-500)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>वर्गणी जमा व बाकी</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#FEF3C7', padding: '3px 9px', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                  <Users size={15} color="#D97706" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400E' }}>
                    {members.length} सभासद
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>जमा</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                    {formatINR(metrics.totalSubscriptions)}
                  </div>
                </div>
                <div style={{ height: '28px', width: '1px', backgroundColor: 'var(--color-border)' }}></div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>बाकी</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-danger)' }}>
                    {formatINR(metrics.pendingDues)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                उत्सव {selectedFY} ची सभासद वर्गणी
              </div>
            </div>
          </div>

          {/* Graphical Analytics & Breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-lg)'
          }}>
            {/* Monthly Trend */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-maroon-800)', marginBottom: 'var(--space-md)', fontWeight: 700 }}>
                📊 मासिक जमा व खर्च तुलना ({selectedFY})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                {/* Income Column */}
                <div>
                  <h3 style={{ fontSize: '0.92rem', color: '#059669', marginBottom: '10px', fontWeight: 700 }}>🟢 मासिक जमा (Income)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {metrics.monthlyTrend.slice(3, 9).map((m) => (
                      <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                        <span style={{ width: '65px', fontWeight: 600 }}>{m.month}:</span>
                        <div style={{ flex: 1, height: '16px', backgroundColor: 'var(--color-surface-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, Math.max(0, (m.amount / 30000) * 100))}%`, height: '100%', backgroundColor: 'var(--color-saffron-500)' }} />
                        </div>
                        <span style={{ width: '75px', textAlign: 'right', fontWeight: 700, color: 'var(--color-maroon-800)' }}>{formatINR(m.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expense Column */}
                <div>
                  <h3 style={{ fontSize: '0.92rem', color: 'var(--color-danger)', marginBottom: '10px', fontWeight: 700 }}>🔴 मासिक खर्च (Expenses)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {metrics.monthlyExpenseTrend.slice(3, 9).map((m) => (
                      <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                        <span style={{ width: '65px', fontWeight: 600 }}>{m.month}:</span>
                        <div style={{ flex: 1, height: '16px', backgroundColor: '#FEE2E2', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, Math.max(0, (m.amount / 30000) * 100))}%`, height: '100%', backgroundColor: 'var(--color-danger)' }} />
                        </div>
                        <span style={{ width: '75px', textAlign: 'right', fontWeight: 700, color: 'var(--color-danger)' }}>{formatINR(m.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Income Category Breakdown */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-maroon-800)', marginBottom: 'var(--space-md)', fontWeight: 700 }}>
                🏷️ जमा प्रकारानुसार विभागणी (Donation Breakdown)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {metrics.categoryBreakdown.map((c: any) => (
                  <div key={c.category} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600 }}>{c.label}</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-maroon-800)' }}>
                        {formatINR(c.amount)} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({c.count})</span>
                      </span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--color-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${metrics.totalCollection > 0 ? (c.amount / metrics.totalCollection) * 100 : 0}%`,
                        height: '100%',
                        backgroundColor: 'var(--color-maroon-600)'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: INCOME / JAMA MANAGER (जमा व्यवस्थापन) */}
      {activeTab === 'income' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Header Controls & Filters */}
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
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => setIncomeCategoryFilter('all')}
                className={`btn btn-sm ${incomeCategoryFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ backgroundColor: incomeCategoryFilter === 'all' ? '#059669' : undefined, borderColor: incomeCategoryFilter === 'all' ? '#059669' : undefined }}
              >
                सर्व जमा ({donations.length})
              </button>
              <button
                onClick={() => setIncomeCategoryFilter('pending')}
                className={`btn btn-sm ${incomeCategoryFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  backgroundColor: incomeCategoryFilter === 'pending' ? '#D97706' : '#FEF3C7',
                  borderColor: '#D97706',
                  color: incomeCategoryFilter === 'pending' ? '#FFFFFF' : '#92400E',
                  fontWeight: 700
                }}
              >
                ⏳ प्रलंबित पडताळणी ({donations.filter((d) => d.paymentStatus === 'pending').length})
              </button>
              <button
                onClick={() => setIncomeCategoryFilter('annadaan')}
                className={`btn btn-sm ${incomeCategoryFilter === 'annadaan' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ backgroundColor: incomeCategoryFilter === 'annadaan' ? '#059669' : undefined, borderColor: incomeCategoryFilter === 'annadaan' ? '#059669' : undefined }}
              >
                अन्नदान व महाप्रसाद
              </button>
              <button
                onClick={() => setIncomeCategoryFilter('maharati')}
                className={`btn btn-sm ${incomeCategoryFilter === 'maharati' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ backgroundColor: incomeCategoryFilter === 'maharati' ? '#059669' : undefined, borderColor: incomeCategoryFilter === 'maharati' ? '#059669' : undefined }}
              >
                महाआरती देणगी
              </button>
              <button
                onClick={() => setIncomeCategoryFilter('special_utsav')}
                className={`btn btn-sm ${incomeCategoryFilter === 'special_utsav' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ backgroundColor: incomeCategoryFilter === 'special_utsav' ? '#059669' : undefined, borderColor: incomeCategoryFilter === 'special_utsav' ? '#059669' : undefined }}
              >
                विशेष प्रायोजकत्व
              </button>
              <button
                onClick={() => setIncomeCategoryFilter('general')}
                className={`btn btn-sm ${incomeCategoryFilter === 'general' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ backgroundColor: incomeCategoryFilter === 'general' ? '#059669' : undefined, borderColor: incomeCategoryFilter === 'general' ? '#059669' : undefined }}
              >
                सर्वसाधारण जमा
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="नाव, मोबाईल किंवा पावती क्र. शोधा..."
                  value={incomeSearch}
                  onChange={(e) => setIncomeSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '32px', minHeight: '36px', fontSize: '0.85rem', width: '220px' }}
                />
              </div>

              {/* Export Income CSV */}
              <button
                onClick={() => {
                  const filtered = donations
                    .filter((d) => d.paymentStatus === 'successful')
                    .filter((d) => incomeCategoryFilter === 'all' || d.donationType === incomeCategoryFilter);
                  exportDonationsCSV(filtered);
                }}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px' }}
              >
                <FileSpreadsheet size={14} />
                <span>जमा CSV</span>
              </button>

              {/* Add Jama Button */}
              <button
                onClick={() => setIsAddDonationModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px', backgroundColor: '#059669', borderColor: '#059669' }}
              >
                <Plus size={14} />
                <span>+ नवीन जमा नोंदवा</span>
              </button>
            </div>
          </div>

          {/* Income Total Summary Bar */}
          {(() => {
            const currentIncome = donations
              .filter((d) => {
                if (incomeCategoryFilter === 'pending') return d.paymentStatus === 'pending';
                if (incomeCategoryFilter === 'all') return true;
                return d.donationType === incomeCategoryFilter;
              })
              .filter((d) => {
                if (!incomeSearch.trim()) return true;
                const q = incomeSearch.toLowerCase();
                return (
                  (d.donorName && d.donorName.toLowerCase().includes(q)) ||
                  (d.donorPhone && d.donorPhone.includes(q)) ||
                  (d.receiptNumber && d.receiptNumber.toLowerCase().includes(q)) ||
                  (d.donationTypeMarathi && d.donationTypeMarathi.includes(q))
                );
              });

            const totalFilterAmount = currentIncome.reduce((sum, d) => sum + d.amount, 0);

            return (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Coins size={18} color="#059669" />
                    <span style={{ fontSize: '0.9rem', color: '#065F46', fontWeight: 600 }}>
                      निवडलेल्या प्रवर्गातील एकूण जमा निधी (FY {selectedFY}):
                    </span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
                    {formatINR(totalFilterAmount)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#6B7280' }}>({currentIncome.length} पावत्या)</span>
                  </div>
                </div>

                {/* Income Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--color-maroon-50)', borderBottom: '2px solid var(--color-maroon-100)', textAlign: 'left' }}>
                          <th style={{ padding: '12px 14px' }}>पावती क्र. व दिनांक</th>
                          <th style={{ padding: '12px 14px' }}>जमा तपशील व प्रवर्ग</th>
                          <th style={{ padding: '12px 14px' }}>देणगीदार / व्यक्तीचे नाव</th>
                          <th style={{ padding: '12px 14px' }}>पेमेंट व स्थिती</th>
                          <th style={{ padding: '12px 14px', textAlign: 'right' }}>रक्कम (₹)</th>
                          <th style={{ padding: '12px 14px', textAlign: 'center' }}>डिजिटल पावती</th>
                          <th style={{ padding: '12px 14px', textAlign: 'center' }}>कृती / पडताळणी</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentIncome.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>
                              कोणत्याही जमा नोंदी आढळल्या नाहीत. नवीन जमा नोंदवण्यासाठी वर दिलेल्या <strong>'+ नवीन जमा नोंदवा'</strong> बटणावर क्लिक करा.
                            </td>
                          </tr>
                        ) : (
                          currentIncome.map((d) => {
                            const isPending = d.paymentStatus === 'pending';
                            return (
                              <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: isPending ? '#FEFCE8' : undefined }}>
                                {/* Receipt & Date */}
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--color-maroon-800)', fontFamily: 'monospace' }}>
                                    {d.receiptNumber}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                    {formatIndianDate(d.createdAt)}
                                  </div>
                                </td>

                                {/* Title & Category */}
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                    {d.donationTypeMarathi || d.donationType}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                    {d.donorCity || 'पुणे'}
                                  </div>
                                </td>

                                {/* Donor Name & Phone */}
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--color-maroon-800)' }}>
                                    {d.isAnonymous ? 'गुप्त दान' : d.donorName}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                    <a
                                      href={`tel:${(d.donorPhone || '').replace(/\D/g, '')}`}
                                      style={{
                                        color: 'var(--color-maroon-700)',
                                        textDecoration: 'none',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                      title="थेट कॉल करा (Direct Call)"
                                    >
                                      <span>📞</span>
                                      <span>{d.donorPhone}</span>
                                    </a>
                                  </div>
                                </td>

                                {/* Payment Method & Status */}
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                    {d.paymentMethod === 'upi' ? '💳 UPI / QR' : d.paymentMethod === 'bank_transfer' ? '🏦 Bank' : '💵 Cash'}
                                  </div>
                                  <div style={{ marginTop: '2px' }}>
                                    {isPending ? (
                                      <span style={{ fontSize: '0.72rem', backgroundColor: '#FEF08A', color: '#854D0E', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                        ⏳ पडताळणी बाकी
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.72rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                        ✓ प्राप्त झाले
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Amount */}
                                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                                  {formatINR(d.amount)}
                                </td>

                                {/* PDF Receipt */}
                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                  <button
                                    onClick={() => handleDownloadPDFReceipt(d)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                                    title="पावती डाउनलोड करा (PDF)"
                                  >
                                    <Download size={13} />
                                    <span>पावती</span>
                                  </button>
                                </td>

                                {/* Actions */}
                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    {isPending ? (
                                      <>
                                        <button
                                          onClick={() => handleVerifyDonation(d)}
                                          className="btn btn-primary btn-sm"
                                          style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px', backgroundColor: '#16A34A', borderColor: '#16A34A' }}
                                          title="पडताळणी करा & WhatsApp पाठवा"
                                        >
                                          <CheckCircle size={13} />
                                          <span>पडताळणी करा & WhatsApp</span>
                                        </button>
                                        <button
                                          onClick={() => handleRejectDonation(d)}
                                          className="btn btn-secondary btn-sm"
                                          style={{ color: 'var(--color-danger)', padding: '4px 8px' }}
                                          title="नाकारा (पैसे आले नाहीत)"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => sendDonationReceiptWhatsApp(d)}
                                          className="btn btn-secondary btn-sm"
                                          style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px', color: '#16A34A', borderColor: '#16A34A' }}
                                          title="WhatsApp वर पुन्हा पावती पाठवा"
                                        >
                                          <span>📲 WhatsApp</span>
                                        </button>
                                        <button
                                          onClick={() => handleOpenEditDonation(d)}
                                          className="btn btn-secondary btn-sm"
                                          style={{ padding: '4px 8px' }}
                                          title="जमा नोंद संपादित करा"
                                        >
                                          <Edit size={14} color="var(--color-maroon-700)" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (confirm(`तुम्हाला "${d.donorName}" यांची ₹ ${d.amount} ची जमा नोंद नक्की हटवायची आहे का?`)) {
                                              deleteDonation(d.id);
                                              showSuccess('जमा नोंद यशस्वीरित्या हटवली गेली.');
                                            }
                                          }}
                                          className="btn btn-secondary btn-sm"
                                          style={{ padding: '4px 8px', color: 'var(--color-danger)' }}
                                          title="जमा नोंद हटवा"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}


      {/* 5. TAB: EXPENSE MANAGER (जमा-खर्च नोंदवही) */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Header Controls & Filters */}
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
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => setExpenseCategoryFilter('all')}
                className={`btn btn-sm ${expenseCategoryFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              >
                सर्व खर्च ({expenses.filter((e) => e.financialYear === selectedFY).length})
              </button>
              <button
                onClick={() => setExpenseCategoryFilter('mandap_decoration')}
                className={`btn btn-sm ${expenseCategoryFilter === 'mandap_decoration' ? 'btn-primary' : 'btn-secondary'}`}
              >
                डेकोरेशन व डीजे खर्च
              </button>
              <button
                onClick={() => setExpenseCategoryFilter('sound_lighting')}
                className={`btn btn-sm ${expenseCategoryFilter === 'sound_lighting' ? 'btn-primary' : 'btn-secondary'}`}
              >
                सर्व किराणा खर्च
              </button>
              <button
                onClick={() => setExpenseCategoryFilter('mahaprasad_food')}
                className={`btn btn-sm ${expenseCategoryFilter === 'mahaprasad_food' ? 'btn-primary' : 'btn-secondary'}`}
              >
                काला व महाप्रसाद खर्च
              </button>
              <button
                onClick={() => setExpenseCategoryFilter('printing_advertising')}
                className={`btn btn-sm ${expenseCategoryFilter === 'printing_advertising' ? 'btn-primary' : 'btn-secondary'}`}
              >
                इतर/क्षुल्लक खर्च
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="शीर्षक, व्हाउचर किंवा देयक व्यक्ती शोधा..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '32px', minHeight: '36px', fontSize: '0.85rem', width: '220px' }}
                />
              </div>

              {/* Export Expenses CSV */}
              <button
                onClick={() => {
                  const filtered = expenses
                    .filter((e) => e.financialYear === selectedFY)
                    .filter((e) => expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter);
                  exportExpensesCSV(filtered);
                }}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px' }}
              >
                <FileSpreadsheet size={14} />
                <span>खर्च CSV</span>
              </button>

              {/* Add Expense Button */}
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px', backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              >
                <Plus size={14} />
                <span>+ नवीन खर्च नोंदवा</span>
              </button>
            </div>
          </div>

          {/* Expenses Total Summary Bar */}
          {(() => {
            const currentExpenses = expenses
              .filter((e) => e.financialYear === selectedFY)
              .filter((e) => expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter)
              .filter((e) => {
                if (!expenseSearch.trim()) return true;
                const q = expenseSearch.toLowerCase();
                return (
                  (e.title && e.title.toLowerCase().includes(q)) ||
                  (e.titleMarathi && e.titleMarathi.includes(q)) ||
                  (e.payeeName && e.payeeName.toLowerCase().includes(q)) ||
                  (e.voucherNumber && e.voucherNumber.toLowerCase().includes(q))
                );
              });

            const totalFilterAmount = currentExpenses.reduce((sum, e) => sum + e.amount, 0);

            return (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Receipt size={18} color="var(--color-danger)" />
                    <span style={{ fontSize: '0.9rem', color: '#991B1B', fontWeight: 600 }}>
                      निवडलेल्या प्रवर्गातील एकूण खर्च (FY {selectedFY}):
                    </span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-danger)' }}>
                    {formatINR(totalFilterAmount)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#6B7280' }}>({currentExpenses.length} व्हाउचर्स)</span>
                  </div>
                </div>

                {/* Expenses Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--color-maroon-50)', borderBottom: '2px solid var(--color-maroon-100)', textAlign: 'left' }}>
                          <th style={{ padding: '12px 14px' }}>व्हाउचर व दिनांक</th>
                          <th style={{ padding: '12px 14px' }}>खर्चाचा तपशील व प्रवर्ग</th>
                          <th style={{ padding: '12px 14px' }}>देयक व्यक्ती / फर्म</th>
                          <th style={{ padding: '12px 14px' }}>पेमेंट पद्धत</th>
                          <th style={{ padding: '12px 14px', textAlign: 'right' }}>रक्कम (₹)</th>
                          <th style={{ padding: '12px 14px', textAlign: 'center' }}>बिल / पावती</th>
                          <th style={{ padding: '12px 14px', textAlign: 'center' }}>कृती</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentExpenses.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>
                              कोणत्याही खर्चाची नोंद आढळली नाही. नवीन खर्च नोंदवण्यासाठी वर दिलेल्या <strong>'+ नवीन खर्च नोंदवा'</strong> बटणावर क्लिक करा.
                            </td>
                          </tr>
                        ) : (
                          currentExpenses.map((exp) => (
                            <tr key={exp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              {/* Voucher & Date */}
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--color-maroon-800)', fontFamily: 'monospace' }}>
                                  {exp.voucherNumber || 'N/A'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                  {formatIndianDate(exp.date || exp.createdAt)}
                                </div>
                              </td>

                              {/* Title & Category */}
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                  {exp.titleMarathi || exp.title}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                  <span className="badge badge-maroon" style={{ fontSize: '0.7rem' }}>
                                    {exp.categoryMarathi || exp.category}
                                  </span>
                                  {exp.notes && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                      • {exp.notes}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Payee / Vendor */}
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 600 }}>{exp.payeeName}</div>
                                {exp.payeePhone && (
                                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                    {exp.payeePhone}
                                  </div>
                                )}
                              </td>

                              {/* Payment Method */}
                              <td style={{ padding: '12px 14px' }}>
                                <span className="badge badge-gold" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                  {exp.paymentMethod === 'bank_transfer' ? 'बँक ट्रान्सफर' : exp.paymentMethod === 'upi' ? 'UPI / QR' : exp.paymentMethod === 'cheque' ? 'धनादेश (Cheque)' : 'रोख (Cash)'}
                                </span>
                              </td>

                              {/* Amount */}
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-danger)' }}>
                                {formatINR(exp.amount)}
                              </td>

                              {/* Bill Receipt Preview */}
                              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                {exp.billReceiptUrl ? (
                                  <button
                                    onClick={() => setSelectedBillPreview(exp.billReceiptUrl!)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                                    title="बिल / पावती पहा"
                                  >
                                    <Eye size={13} />
                                    <span>पावती</span>
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>-</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button
                                    onClick={() => handleOpenEditExpense(exp)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '4px 8px' }}
                                    title="खर्च संपादित करा"
                                  >
                                    <Edit size={14} color="var(--color-maroon-700)" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`तुम्हाला "${exp.title}" हा ₹ ${exp.amount} चा खर्च नक्की हटवायचा आहे का?`)) {
                                        deleteExpense(exp.id);
                                        showSuccess('खर्च यशस्वीरित्या हटवला गेला.');
                                      }
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '4px 8px', color: 'var(--color-danger)' }}
                                    title="खर्च हटवा"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
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
                वर्गणी पूर्ण ({members.filter((m) => getMemberSummary(m.id, selectedFY).status === 'paid').length})
              </button>
              <button
                onClick={() => setMemberStatusFilter('pending')}
                className={`btn btn-sm ${memberStatusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ color: memberStatusFilter !== 'pending' ? 'var(--color-danger)' : undefined }}
              >
                वर्गणी बाकी ({members.filter((m) => getMemberSummary(m.id, selectedFY).remainingDue > 0).length})
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
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{
                  gap: '6px',
                  fontWeight: 700,
                  backgroundColor: 'var(--color-maroon-700)',
                  borderColor: 'var(--color-maroon-700)',
                  color: '#ffffff',
                  boxShadow: '0 2px 6px rgba(135, 28, 28, 0.25)'
                }}
              >
                <Plus size={16} />
                <span>+ नवीन सभासद जोडा</span>
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
                      if (memberStatusFilter === 'pending') return sum.remainingDue > 0;
                      if (memberStatusFilter === 'paid') return sum.status === 'paid';
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
                          <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)' }}>
                            <a
                              href={`tel:${(m.phone || '').replace(/\D/g, '')}`}
                              style={{
                                color: 'var(--color-maroon-700)',
                                textDecoration: 'none',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="थेट कॉल करा (Direct Call)"
                            >
                              <span>📞</span>
                              <span>+91 {m.phone}</span>
                            </a>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span className="badge badge-maroon" style={{ fontSize: '0.72rem' }}>
                              {m.memberType === 'family' ? 'कुटुंब' : 'वैयक्तिक'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {sum.status === 'paid' ? (
                              <span className="badge badge-success">✓ भरली ({formatINR(sum.totalPaid)})</span>
                            ) : sum.status === 'pending_verification' ? (
                              <span className="badge badge-warning" style={{ backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#F59E0B' }}>
                                ⏳ पडताळणी प्रलंबित (बाकी {formatINR(sum.remainingDue)})
                              </span>
                            ) : (
                              <span className="badge badge-danger">बाकी {formatINR(sum.remainingDue)}</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              {(() => {
                                if (sum.status !== 'paid') {
                                  const pendingPayment = payments.find((p) => {
                                    if (p.paymentStatus !== 'pending') return false;
                                    if (p.memberId) return p.memberId === m.id;
                                    return Boolean(m.phone && p.memberPhone && p.memberPhone.replace(/\D/g, '').slice(-10) === m.phone.replace(/\D/g, '').slice(-10));
                                  });
                                  if (pendingPayment) {
                                    return (
                                      <button
                                        onClick={() => handleVerifyMemberPayment(pendingPayment)}
                                        className="btn btn-sm"
                                        style={{
                                          fontSize: '0.78rem',
                                          gap: '4px',
                                          backgroundColor: '#16A34A',
                                          borderColor: '#16A34A',
                                          color: '#FFFFFF',
                                          fontWeight: 800,
                                          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                                        }}
                                        title="बँक खात्यात जमा पडताळणी करा व WhatsApp पावती पाठवा"
                                      >
                                        <CheckCircle size={13} />
                                        <span>⏳ वर्गणी पडताळणी करा ({formatINR(pendingPayment.amount)})</span>
                                      </button>
                                    );
                                  }
                                }

                                if (sum.remainingDue > 0) {
                                  return (
                                    <button
                                      onClick={() => {
                                        setSelectedMemberForPayment(m);
                                        setPaymentAmountInput(String(sum.remainingDue || MANDAL_CONFIG.annualSubscriptionFee));
                                        setIsAddPaymentModalOpen(true);
                                      }}
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.78rem', gap: '4px' }}
                                      title="Record Offline Payment"
                                    >
                                      <DollarSign size={13} color="#2E7D32" />
                                      <span>वर्गणी जमा</span>
                                    </button>
                                  );
                                }
                                return null;
                              })()}
                              <button
                                onClick={() => openEditMemberModal(m)}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  fontSize: '0.78rem',
                                  gap: '4px',
                                  color: 'var(--color-maroon-800)',
                                  backgroundColor: 'var(--color-maroon-50)',
                                  borderColor: 'var(--color-maroon-200)'
                                }}
                                title="सभासद माहिती दुरुस्त करा (Edit Member)"
                              >
                                <Edit size={13} />
                                <span>दुरुस्त करा</span>
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

      {/* 4.5 TAB: COMMITTEE & TRUSTEES MANAGEMENT */}
      {activeTab === 'committee' && (
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
            <div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)', margin: 0 }}>
                मानद विश्वस्त व कार्यकारणी मंडळ व्यवस्थापन
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
                येथून आपण मंडळाचे अध्यक्ष, सचिव व सर्व पदाधिकाऱ्यांचे नाव, पद, फोन व फोटो थेट बदलू शकता.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('खात्री करा: सर्व कार्यकारणी सदस्यांचे मूळ हाय-रिझोल्युशन फोटो व माहिती रिफ्रेश करायची आहे का?')) {
                    await resetCommitteeToDefaults();
                    showSuccess('सर्व पदाधिकाऱ्यांचे मूळ फोटो यशस्वीरित्या रिफ्रेश केले!');
                  }
                }}
                className="btn btn-secondary btn-sm"
                style={{
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  backgroundColor: '#ffffff',
                  borderColor: 'var(--color-maroon-200)',
                  color: 'var(--color-maroon-800)'
                }}
                title="मूळ फोटो रिस्टोअर करा"
              >
                <span>🔄 मूळ फोटो रिफ्रेश करा</span>
              </button>

              <button
                onClick={() => setIsAddCommitteeModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{
                  gap: '6px',
                  fontWeight: 700,
                  backgroundColor: 'var(--color-maroon-700)',
                  borderColor: 'var(--color-maroon-700)',
                  color: '#ffffff',
                  boxShadow: '0 2px 6px rgba(135, 28, 28, 0.25)'
                }}
              >
                <Plus size={16} />
                <span>+ नवीन पदाधिकारी जोडा</span>
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-md)'
          }}>
            {committee.map((c) => (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '3px solid var(--color-gold-500)',
                    backgroundColor: 'var(--color-maroon-50)'
                  }}>
                    <img
                      src={c.photoUrl}
                      alt={c.nameMarathi}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-maroon-800)', lineHeight: 1.3 }}>
                      {c.nameMarathi}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-saffron-600)', marginTop: '2px' }}>
                      {c.designationMarathi}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      मोबाईल: {c.phone}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                  <button
                    onClick={() => openEditCommitteeModal(c)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontSize: '0.8rem',
                      gap: '4px',
                      color: 'var(--color-maroon-800)',
                      backgroundColor: 'var(--color-maroon-50)',
                      borderColor: 'var(--color-maroon-200)',
                      fontWeight: 600
                    }}
                  >
                    <Edit size={14} />
                    <span>फोटो व माहिती बदला</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`खात्री करा: ${c.nameMarathi} यांना कार्यकारणीतून हटवायचे आहे का?`)) {
                        deleteCommitteeMember(c.id);
                        showSuccess('पदाधिकारी यशस्वीरित्या हटवले.');
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px' }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4.6 TAB: BANNERS & FESTIVAL SETTINGS */}
      {activeTab === 'banners' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* Section 1: Main Festival Header Configuration */}
          <div className="card card-maroon-accent">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-md)' }}>
              <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--color-maroon-50)', color: 'var(--color-maroon-700)' }}>
                <Sparkles size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)', margin: 0 }}>
                  मुख्य उत्सव व बॅनर माहिती (Festival & Banner Settings)
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                  येथून आपण होमपेजवरील मुख्य उत्सवाचे नाव, तारखा, ब्रीदवाक्य व संदेश थेट बदलू शकता.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveFestivalConfig} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label form-label-required">उत्सवाचे मुख्य नाव / मंडळ शीर्षक</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={festTitleMarathi}
                    onChange={(e) => setFestTitleMarathi(e.target.value)}
                    placeholder="उदा. सार्वजनिक बाल दुर्गा उत्सव मंडळ"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label form-label-required">उत्सव कालावधी व तारखा</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={festDatesMarathi}
                    onChange={(e) => setFestDatesMarathi(e.target.value)}
                    placeholder="उदा. ११ ऑक्टोबर ते २२ ऑक्टोबर २०२६"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">मंत्र / ब्रीदवाक्य (Top Badge Greeting)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={festGreeting}
                    onChange={(e) => setFestGreeting(e.target.value)}
                    placeholder="उदा. ॥ उदो बोला उदो अंबाबाई माउलीचा हो ॥"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">मुख्य संदेश (Description)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={festDescMarathi}
                    onChange={(e) => setFestDescMarathi(e.target.value)}
                    placeholder="उदा. *भक्तीचा उत्सव, संस्कृतीचा अभिमान आणि सेवाभावाची नवी दिशा...*"
                  />
                </div>
              </div>

              {/* Slider Auto-Scroll Time Controller */}
              <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700, color: 'var(--color-maroon-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⏱️ बॅनर फिरण्याचा वेळ / ऑटो-स्लाईडर स्पीड (Auto-scroll Time)</span>
                  </label>
                  <span
                    className={`badge ${festSliderSeconds === 0 ? 'badge-danger' : 'badge-gold'}`}
                    style={{ fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    {festSliderSeconds === 0 ? '🔴 ऑटो-स्क्रोल सध्या बंद आहे (Manual Mode)' : `🟢 चालू: ${festSliderSeconds} सेकंद`}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                  होमपेजवरील बॅनर आपोआप फिरावा की बंद ठेवावा ते ठरवा. (बंद केल्यास युझर बाण किंवा डॉट्सनेच स्लाईड्स बदलू शकतील).
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Preset Buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleApplySliderSpeed(0)}
                      className={`btn btn-sm ${festSliderSeconds === 0 ? 'btn-danger' : 'btn-secondary'}`}
                      style={{
                        fontSize: '0.78rem',
                        padding: '4px 12px',
                        backgroundColor: festSliderSeconds === 0 ? 'var(--color-danger)' : '#fff',
                        borderColor: festSliderSeconds === 0 ? 'var(--color-danger)' : 'var(--color-border)',
                        color: festSliderSeconds === 0 ? '#fff' : 'var(--color-danger)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="बॅनरचे आपोआप फिरणे बंद करा"
                    >
                      ⏸️ ऑटो-स्क्रोल बंद (OFF)
                    </button>

                    {[
                      { sec: 3, label: '⚡ ३ सेकंद (Fast)' },
                      { sec: 5, label: '⏱️ ५ सेकंद (Normal)' },
                      { sec: 7, label: '🕊️ ७ सेकंद (Smooth)' },
                      { sec: 10, label: '🐢 १० सेकंद (Slow)' },
                    ].map((preset) => (
                      <button
                        key={preset.sec}
                        type="button"
                        onClick={() => handleApplySliderSpeed(preset.sec)}
                        className={`btn btn-sm ${festSliderSeconds === preset.sec ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          fontSize: '0.78rem',
                          padding: '4px 12px',
                          backgroundColor: festSliderSeconds === preset.sec ? 'var(--color-maroon-700)' : '#fff',
                          borderColor: festSliderSeconds === preset.sec ? 'var(--color-maroon-700)' : 'var(--color-border)',
                          color: festSliderSeconds === preset.sec ? '#fff' : 'var(--color-text-primary)',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Number Input & Apply Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>किंवा:</span>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      className="form-input"
                      style={{ width: '70px', padding: '4px 8px', fontSize: '0.85rem', textAlign: 'center' }}
                      value={festSliderSeconds}
                      onChange={(e) => setFestSliderSeconds(Math.max(0, Math.min(60, parseInt(e.target.value, 10) || 0)))}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>सेकंद</span>
                    <button
                      type="button"
                      onClick={() => handleApplySliderSpeed(festSliderSeconds)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: 'var(--color-gold-50)', borderColor: 'var(--color-gold-500)', color: 'var(--color-maroon-900)' }}
                    >
                      लागू करा (Apply)
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
                <button
                  type="submit"
                  disabled={isSavingFestConfig}
                  className="btn btn-primary"
                  style={{
                    backgroundColor: 'var(--color-maroon-700)',
                    borderColor: 'var(--color-maroon-700)',
                    fontWeight: 700,
                    padding: '8px 24px'
                  }}
                >
                  {isSavingFestConfig ? 'जतन होत आहे...' : 'बदल जतन करा (Save Festival Info)'}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Manage All Hero Slides */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: 'var(--space-md)' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)', margin: 0 }}>
                  होमपेज ऑटो-स्लायडर स्लाईड्स ({heroSlides?.length || 0})
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                  होमपेजवर फिरणाऱ्या प्रत्येक स्लाईडचा मजकूर, फोटो आणि बटने येथून मॅनेज किंवा नवीन जोडा.
                </p>
              </div>

              <button
                onClick={() => setIsAddSlideModalOpen(true)}
                className="btn btn-saffron"
                style={{ fontWeight: 700, gap: '6px', fontSize: '0.9rem' }}
              >
                <Plus size={16} />
                <span>➕ नवीन स्लाईड / बॅनर जोडा</span>
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-md)'
            }}>
              {heroSlides?.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    borderLeft: `4px solid ${slide.accentColor || 'var(--color-maroon-700)'}`
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                        स्लाईड #{idx + 1}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        {slide.badge}
                      </span>
                    </div>

                    {slide.imageUrl ? (
                      <div style={{
                        width: '100%',
                        height: '140px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        marginBottom: '10px',
                        border: '1px solid var(--color-gold-500)',
                        backgroundColor: '#1a1a1a',
                        position: 'relative'
                      }}>
                        <img
                          src={slide.imageUrl}
                          alt={slide.titleMarathi}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          backgroundColor: slide.bannerMode === 'full_photo' ? 'var(--color-saffron-600)' : 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}>
                          {slide.bannerMode === 'full_photo' ? '🖼️ केवळ पूर्ण फोटो बॅनर' : '📷 बॅकग्राउंड फोटो जोडला आहे'}
                        </span>
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-surface-subtle)',
                        marginBottom: '10px',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Camera size={14} />
                        <span>सध्या फोटो जोडलेला नाही (Standard Theme)</span>
                      </div>
                    )}

                    <h3 style={{ fontSize: '1.05rem', color: 'var(--color-maroon-800)', marginBottom: '4px', lineHeight: 1.3 }}>
                      {slide.titleMarathi}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-saffron-600)', fontWeight: 600, marginBottom: '6px' }}>
                      {slide.highlightMarathi}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      {slide.descMarathi}
                    </p>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                      <span className="badge badge-maroon" style={{ fontSize: '0.72rem' }}>
                        बटण १: {slide.btn1TextMarathi}
                      </span>
                      <span className="badge badge-saffron" style={{ fontSize: '0.72rem' }}>
                        बटण २: {slide.btn2TextMarathi}
                      </span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {slide.id !== 'slide-1' ? (
                      <button
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="btn btn-danger btn-sm"
                        style={{ fontSize: '0.78rem', gap: '4px', padding: '4px 10px' }}
                      >
                        <Trash2 size={13} />
                        <span>डिलीट</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        मुख्य मुख्य स्लाईड
                      </span>
                    )}

                    <button
                      onClick={() => openEditSlideModal(slide)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.8rem',
                        gap: '4px',
                        color: 'var(--color-maroon-800)',
                        backgroundColor: 'var(--color-maroon-50)',
                        borderColor: 'var(--color-maroon-200)',
                        fontWeight: 600
                      }}
                    >
                      <Edit size={14} />
                      <span>ही स्लाईड बदला</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4.6.1 TAB: LIVE STREAM CONTROL */}
      {activeTab === 'livestream' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          <div className="card" style={{
            border: liveStreamConfig?.isLive ? '2px solid #EF4444' : '1px solid var(--color-border)',
            backgroundColor: liveStreamConfig?.isLive ? '#FEF2F2' : 'var(--color-surface)',
            padding: 'var(--space-xl)',
            borderRadius: 'var(--radius-xl)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: liveStreamConfig?.isLive ? '#DC2626' : '#6B7280',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: liveStreamConfig?.isLive ? '0 0 20px rgba(220, 38, 38, 0.4)' : 'none'
                }}>
                  <Radio size={24} className={liveStreamConfig?.isLive ? 'animate-pulse' : ''} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.3rem', color: liveStreamConfig?.isLive ? '#991B1B' : 'var(--color-maroon-800)', margin: 0, fontWeight: 800 }}>
                      थेट प्रक्षेपण नियंत्रण (Live Telecast Control)
                    </h2>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      backgroundColor: liveStreamConfig?.isLive ? '#DC2626' : '#E5E7EB',
                      color: liveStreamConfig?.isLive ? '#FFFFFF' : '#374151'
                    }}>
                      {liveStreamConfig?.isLive ? '🔴 LIVE Broadcast चालू आहे' : '⚪ प्रक्षेपण बंद (OFF)'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
                    येथून YouTube Live ची लिंक टाका आणि सर्व भाविकांसाठी थेट आरती / कार्यक्रम ॲपमध्ये सुरू करा.
                  </p>
                </div>
              </div>

              {/* Master Toggle Button */}
              <button
                type="button"
                onClick={async () => {
                  const nextState = !liveStreamConfig?.isLive;
                  await updateLiveStreamConfig({
                    isLive: nextState,
                    youtubeUrl: liveStreamUrl.trim(),
                    title: liveStreamTitle.trim() || 'सार्वजनिक बाल दुर्गा उत्सव - थेट प्रक्षेपण',
                    description: liveStreamDesc.trim()
                  });
                  if (nextState) {
                    showSuccess('🔴 थेट प्रक्षेपण यशस्वीरित्या सुरू झाले! सर्व सभासदांना Home Page वर दिसेल.');
                  } else {
                    showSuccess('थेट प्रक्षेपण बंद करण्यात आले.');
                  }
                }}
                className={`btn ${liveStreamConfig?.isLive ? 'btn-danger' : 'btn-saffron'} btn-lg`}
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: liveStreamConfig?.isLive ? '0 4px 14px rgba(220, 38, 38, 0.4)' : '0 4px 14px rgba(245, 158, 11, 0.3)'
                }}
              >
                {liveStreamConfig?.isLive ? '⏹️ Live Stream बंद करा' : '🔴 LIVE Streaming चालू करा'}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingLiveStream(true);
              try {
                await updateLiveStreamConfig({
                  isLive: liveStreamConfig?.isLive ?? true,
                  title: liveStreamTitle.trim() || 'सार्वजनिक बाल दुर्गा उत्सव - थेट प्रक्षेपण',
                  youtubeUrl: liveStreamUrl.trim(),
                  description: liveStreamDesc.trim()
                });
                showSuccess('थेट प्रक्षेपणाची माहिती यशस्वीरित्या सेव्ह केली!');
              } catch {
                showError('माहिती सेव्ह करताना त्रुटी आली.');
              } finally {
                setIsSavingLiveStream(false);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--color-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                    YouTube Live Video Link किंवा Video ID <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setLiveStreamUrl('https://www.youtube.com/watch?v=5Eqb_-j3FDA')}
                      style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 600, cursor: 'pointer' }}
                    >
                      🚩 दुर्गा आरती (Demo 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveStreamUrl('https://www.youtube.com/watch?v=l_98vK52f44')}
                      style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 600, cursor: 'pointer' }}
                    >
                      🔱 जय अंबे गौरी (Demo 2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveStreamUrl('')}
                      style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', border: '1px solid #FECACA', backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 600, cursor: 'pointer' }}
                    >
                      🧹 लिंक साफ करा
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. https://www.youtube.com/watch?v=VIDEO_ID किंवा https://youtu.be/VIDEO_ID"
                  value={liveStreamUrl}
                  onChange={(e) => setLiveStreamUrl(e.target.value)}
                  required
                  style={{ fontSize: '0.92rem' }}
                />
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  समर्थित लिंक्स: <code>youtube.com/watch?v=...</code>, <code>youtu.be/...</code>, <code>youtube.com/live/...</code>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  थेट प्रक्षेपणाचे नाव (Stream Title)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. शारदीय नवरात्रोत्सव - दैनिक संध्या महाआरती सोहळा"
                  value={liveStreamTitle}
                  onChange={(e) => setLiveStreamTitle(e.target.value)}
                  style={{ fontSize: '0.92rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  तपशील / वर्णन (Description - optional)
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g. मंडळाची दैनिक महाआरती व दीपप्रज्वलन सोहळा थेट पहा."
                  value={liveStreamDesc}
                  onChange={(e) => setLiveStreamDesc(e.target.value)}
                  style={{ fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🙏 एकूण प्रणाम / नमन संख्या: <strong>{liveStreamConfig?.pranamCount || 0}</strong></span>
                </div>

                <button
                  type="submit"
                  className="btn btn-saffron"
                  disabled={isSavingLiveStream}
                  style={{ fontWeight: 700, padding: '8px 20px' }}
                >
                  {isSavingLiveStream ? 'सेव्ह होत आहे...' : '💾 सेव्ह करा व अपडेट करा'}
                </button>
              </div>
            </form>

            {/* Instant Preview Box */}
            {liveStreamUrl && (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--color-maroon-800)', marginBottom: '10px', fontWeight: 700 }}>
                  📺 थेट प्रक्षेपण पूर्वदृश्य (Live Player Preview)
                </h4>
                {extractYouTubeId(liveStreamUrl) ? (
                  <div style={{ width: '100%', maxWidth: '640px', aspectRatio: '16/9', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--color-gold-500)', boxShadow: 'var(--shadow-md)' }}>
                    <iframe
                      key={extractYouTubeId(liveStreamUrl) || 'preview'}
                      src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(liveStreamUrl)}?autoplay=0&rel=0`}
                      title="Preview"
                      className="w-full h-full border-0"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                ) : (
                  <div style={{ padding: '16px', backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '8px', color: '#B45309', fontSize: '0.88rem' }}>
                    ⚠️ कृपया वैध YouTube लिंक प्रविष्ट करा. Video ID सापडला नाही.
                  </div>
                )}
              </div>
            )}
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

          {/* Pending Online Subscription Payments Alert */}
          {pendingPaymentsCount > 0 && (
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={22} color="#D97706" />
                <div>
                  <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.95rem' }}>
                    ⏳ {pendingPaymentsCount} ऑनलाईन वर्गणी नोंदी बँक पडताळणीसाठी प्रलंबित आहेत!
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#B45309', marginTop: '2px' }}>
                    सभासदांनी QR कोड द्वारे भरलेली वर्गणी बँकेत प्राप्त झाल्याची पडताळणी करून '✓ पडताळणी व अप्रूव्ह' वर क्लिक करा. अप्रूव्ह होताच सभासदाला WhatsApp वर अधिकृत पावतीचा मेसेज पाठवला जाईल.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-maroon-50)', borderBottom: '2px solid var(--color-maroon-100)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>पावती क्र.</th>
                    <th style={{ padding: '10px 14px' }}>दिनांक</th>
                    <th style={{ padding: '10px 14px' }}>सभासद नाव व फोन</th>
                    <th style={{ padding: '10px 14px' }}>रक्कम</th>
                    <th style={{ padding: '10px 14px' }}>माध्यम व स्थिती</th>
                    <th style={{ padding: '10px 14px' }}>नोंदणी</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>पावती व कृती</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const isPending = p.paymentStatus === 'pending';
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: isPending ? '#FEFCE8' : undefined }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, fontFamily: 'monospace' }}>{p.receiptNumber}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>{formatIndianDate(p.createdAt)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{p.memberName}</div>
                          {p.memberPhone && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                              <a href={`tel:${p.memberPhone.replace(/\D/g, '')}`} style={{ color: 'var(--color-maroon-700)', textDecoration: 'none', fontWeight: 600 }}>
                                📞 +91 {p.memberPhone}
                              </a>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: isPending ? '#D97706' : 'var(--color-success)' }}>{formatINR(p.amount)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {isPending ? (
                            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span>⏳</span> पडताळणी प्रलंबित ({p.paymentMethod.toUpperCase()})
                            </span>
                          ) : (
                            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span>✓</span> यशस्वी ({p.paymentMethod.toUpperCase()})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{p.recordedByName || p.recordedBy}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleVerifyMemberPayment(p)}
                                  className="btn btn-sm"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px', backgroundColor: '#059669', borderColor: '#059669', color: '#ffffff', fontWeight: 700 }}
                                  title="बँक भरणा पडताळणी करा व अप्रूव्ह करून WhatsApp वर पावती पाठवा"
                                >
                                  <CheckCircle size={13} />
                                  <span>✓ पडताळणी व अप्रूव्ह करा</span>
                                </button>
                                <button
                                  onClick={() => handleRejectMemberPayment(p)}
                                  className="btn btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px', backgroundColor: '#DC2626', borderColor: '#DC2626', color: '#ffffff' }}
                                  title="नोंद नाकारा (Reject)"
                                >
                                  <span>✕ नाकारा</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    const doc = generateSubscriptionReceiptPDF(p);
                                    doc.save(`Receipt_${p.receiptNumber.replace(/\//g, '_')}.pdf`);
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                                  title="PDF पावती डाऊनलोड करा"
                                >
                                  <Download size={12} />
                                  <span>PDF</span>
                                </button>
                                <button
                                  onClick={() => sendSubscriptionReceiptWhatsApp(p)}
                                  className="btn btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px', backgroundColor: '#25D366', borderColor: '#25D366', color: '#ffffff', fontWeight: 700 }}
                                  title="सभासदाला WhatsApp वर पावती पाठवा"
                                >
                                  <Send size={12} />
                                  <span>WhatsApp</span>
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`पावती क्र. ${p.receiptNumber} (${p.memberName} - ${formatINR(p.amount)}) ही वर्गणी नोंद हटवायची आहे का?`)) {
                                      deleteMemberPayment(p.id);
                                      showSuccess(`पावती क्र. ${p.receiptNumber} यशस्वीरित्या हटवली गेली.`);
                                    }
                                  }}
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px', backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                                  title="नोंद हटवा (Delete)"
                                >
                                  <Trash2 size={13} />
                                  <span>हटवा</span>
                                </button>
                              </>
                            )}
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

      {/* 6. TAB 4: DONATIONS LEDGER */}
      {activeTab === 'donations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)' }}>
              सर्व देणग्यांची नोंदवही (Donation Ledger)
            </h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => exportDonationsCSV(donations)}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px' }}
              >
                <Download size={14} />
                <span>{t.admin.actions.exportCsv}</span>
              </button>

              {/* Add Jama / Donation button */}
              <button
                onClick={() => setIsAddDonationModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px', backgroundColor: '#059669', borderColor: '#059669' }}
              >
                <Plus size={14} />
                <span>+ नवीन जमा / देणगी नोंदवा</span>
              </button>
            </div>
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
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>पावती व कृती</th>
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
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => {
                              const doc = generateDonationReceiptPDF(d);
                              doc.save(`Donation_${d.receiptNumber.replace(/\//g, '_')}.pdf`);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                            title="PDF पावती डाऊनलोड करा"
                          >
                            <Download size={12} />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`पावती क्र. ${d.receiptNumber} (${d.donorName} - ${formatINR(d.amount)}) ही देणगी नोंद हटवायची आहे का?`)) {
                                deleteDonation(d.id);
                                showSuccess(`देणगी नोंद पावती क्र. ${d.receiptNumber} हटवली गेली.`);
                              }
                            }}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px', backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                            title="नोंद हटवा (Delete)"
                          >
                            <Trash2 size={13} />
                            <span>हटवा</span>
                          </button>
                        </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border)', backgroundColor: '#f0f0f0' }}>
                    <img src={evt.coverImageUrl} alt={evt.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-maroon-800)' }}>
                      {isMarathi ? evt.titleMarathi || evt.title : evt.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {formatMarathiDate(evt.startDate)} | {evt.timeString} | {isMarathi ? evt.venueMarathi || evt.venue : evt.venue}
                    </div>
                    <span className={`badge ${evt.status === 'completed' ? 'badge-secondary' : evt.status === 'ongoing' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem', marginTop: '4px', display: 'inline-block' }}>
                      {evt.status === 'upcoming' ? 'आगामी (Upcoming)' : evt.status === 'ongoing' ? 'सुरू (Ongoing)' : 'पूर्ण (Completed)'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge badge-maroon" style={{ fontSize: '0.75rem' }}>
                    {toMarathiDigits(evt.rsvpCount)} RSVPs
                  </span>
                  <button
                    onClick={() => handleInstant1ClickBroadcast(evt)}
                    className="btn btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #E65100 0%, #D97706 100%)',
                      color: '#ffffff',
                      padding: '7px 14px',
                      gap: '6px',
                      fontSize: '0.83rem',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 2px 6px rgba(230, 81, 0, 0.35)',
                      cursor: 'pointer'
                    }}
                    title="एका क्लिकमध्ये SMS + WhatsApp + ॲप सूचना सर्व सदस्यांना पाठवा"
                  >
                    <Sparkles size={14} />
                    <span>⚡ १-क्लिक सर्व सदस्यांना पाठवा ({members.length})</span>
                  </button>
                  <button
                    onClick={() => handleOpenSendEventSms(evt)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      padding: '6px 11px',
                      gap: '5px',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                    title="कस्टम SMS पर्याय निवडा"
                  >
                    <MessageSquare size={14} />
                    <span>कस्टम SMS</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditEvent(evt)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px', gap: '4px', fontSize: '0.82rem' }}
                    title="माहिती व फोटो बदला"
                  >
                    <Edit size={15} />
                    <span>संपादित करा</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t.admin.actions.confirmDelete)) {
                        deleteEvent(evt.id);
                        showSuccess('कार्यक्रम हटवला गेला.');
                      }
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--color-danger)', padding: '6px 10px' }}
                    title="हटवा"
                  >
                    <Trash2 size={15} />
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
              <div key={n.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '14px 18px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${n.priority === 'urgent' ? 'badge-danger' : n.priority === 'important' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.72rem' }}>
                      {n.priority.toUpperCase()}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--color-maroon-800)' }}>
                      {isMarathi ? n.titleMarathi || n.title : n.title}
                    </span>
                  </div>
                  {n.message && (
                    <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginTop: '4px', whiteSpace: 'pre-line', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isMarathi ? n.messageMarathi || n.message : n.message}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    दिनांक: {formatIndianDate(n.publishedAt)} | प्रसिद्धी: {n.publishedBy}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleInstantNoticeBroadcast(n)}
                    className="btn btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #E65100 0%, #D97706 100%)',
                      color: '#ffffff',
                      padding: '7px 14px',
                      gap: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 2px 6px rgba(230, 81, 0, 0.3)',
                      cursor: 'pointer'
                    }}
                    title="एका क्लिकमध्ये Real SMS सर्व सदस्यांना पाठवा"
                  >
                    <Sparkles size={14} />
                    <span>⚡ १-क्लिक SMS सर्व सदस्यांना ({members.filter(m => m.phone).length})</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      formatNoticeNotificationMessage({
                        mandalName: festivalConfig?.titleMarathi || 'सार्वजनिक बाल दुर्गा उत्सव मंडळ',
                        title: n.titleMarathi || n.title,
                        message: n.messageMarathi || n.message,
                        priority: n.priority
                      })
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{
                      backgroundColor: '#25D366',
                      borderColor: '#25D366',
                      color: '#ffffff',
                      fontWeight: 700,
                      gap: '4px',
                      padding: '6px 10px',
                      fontSize: '0.8rem'
                    }}
                    title="WhatsApp वर शेअर करा"
                  >
                    <Send size={13} />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      if (confirm(t.admin.actions.confirmDelete)) {
                        deleteNotice(n.id);
                        showSuccess('सूचना हटवली गेली.');
                      }
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--color-danger)', padding: '6px 10px' }}
                    title="सूचना हटवा"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. TAB 7: GALLERY MANAGER */}
      {activeTab === 'gallery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {selectedAlbumForPhotos ? (
            /* Photos Inside Selected Album View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setSelectedAlbumForPhotos(null)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <ArrowLeft size={16} />
                    <span>सर्व अल्बम (All Albums)</span>
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)', margin: 0 }}>
                      📂 {isMarathi ? selectedAlbumForPhotos.titleMarathi || selectedAlbumForPhotos.title : selectedAlbumForPhotos.title}
                    </h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      वर्ष {selectedAlbumForPhotos.year} | {images.filter((img) => img.albumId === selectedAlbumForPhotos.id).length} फोटो
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setNewPhotoUrl('');
                    setNewPhotoCaption('');
                    setNewPhotoPreview(null);
                    setIsAddPhotoModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Camera size={16} />
                  <span>+ फोटो जोडा (Add Photo)</span>
                </button>
              </div>

              {/* Photos Grid */}
              {images.filter((img) => img.albumId === selectedAlbumForPhotos.id).length === 0 ? (
                <div className="card" style={{ padding: '40px 20px', textAlign: 'center', border: '2px dashed var(--color-border)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🖼️</div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--color-maroon-800)', marginBottom: '6px' }}>या अल्बममध्ये अद्याप कोणतेही फोटो नाहीत</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
                    उत्सवाचे सुंदर क्षणचित्रे जोडण्यासाठी खालील '+ फोटो जोडा' बटणावर क्लिक करून फोटो अपलोड करा.
                  </p>
                  <button
                    onClick={() => {
                      setNewPhotoUrl('');
                      setNewPhotoCaption('');
                      setNewPhotoPreview(null);
                      setIsAddPhotoModalOpen(true);
                    }}
                    className="btn btn-primary"
                    style={{ margin: '0 auto', gap: '6px' }}
                  >
                    <Upload size={16} />
                    <span>+ फोटो अपलोड करा</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {images
                    .filter((img) => img.albumId === selectedAlbumForPhotos.id)
                    .map((img) => (
                      <div
                        key={img.id}
                        className="card interactive-hover-lift"
                        style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}
                      >
                        <div style={{ height: '150px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                          <img
                            src={img.imageUrl}
                            alt={img.captionMarathi || 'उत्सव फोटो'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        {img.captionMarathi && (
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {img.captionMarathi}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '4px' }}>
                          <button
                            onClick={() => {
                              if (confirm('हा फोटो हटवायचा आहे का?')) {
                                deleteImage(img.id, selectedAlbumForPhotos.id);
                                showSuccess('फोटो हटवला गेला.');
                              }
                            }}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                          >
                            <Trash2 size={13} />
                            <span>हटवा</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            /* All Albums View */
            <>
              <div className="flex-between">
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)', margin: 0 }}>
                    फोटो दालन व्यवस्थापन (Gallery Albums)
                  </h2>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    अल्बममधील फोटो जोडण्यासाठी किंवा पाहण्यासाठी संबंधित अल्बमवर क्लिक करा.
                  </div>
                </div>
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
                  <div
                    key={alb.id}
                    className="card interactive-hover-lift"
                    style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border)' }}>
                        <img src={alb.coverImageUrl} alt={alb.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--color-maroon-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isMarathi ? alb.titleMarathi || alb.title : alb.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          वर्ष {alb.year} | <strong style={{ color: 'var(--color-saffron-600)' }}>{images.filter((i) => i.albumId === alb.id).length} फोटो</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                      <button
                        onClick={() => setSelectedAlbumForPhotos(alb)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, gap: '6px', fontSize: '0.82rem', justifyContent: 'center' }}
                      >
                        <Camera size={14} />
                        <span>फोटो जोडा / व्यवस्थापित करा</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t.admin.actions.confirmDelete)) {
                            deleteAlbum(alb.id);
                            showSuccess('अल्बम हटवला गेला.');
                          }
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--color-danger)', padding: '6px 10px' }}
                        title="अल्बम हटवा"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
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
                सभासद क्र.: {selectedMemberForPayment.memberNumber} | मोबाईल:{' '}
                <a
                  href={`tel:${(selectedMemberForPayment.phone || '').replace(/\D/g, '')}`}
                  style={{ color: 'var(--color-maroon-700)', textDecoration: 'none', fontWeight: 700 }}
                  title="थेट कॉल करा"
                >
                  📞 +91 {selectedMemberForPayment.phone}
                </a>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">
                वर्गणी रक्कम (₹) [कमाल बाकी: {formatINR(getMemberSummary(selectedMemberForPayment.id, selectedFY).remainingDue)}]
              </label>
              <input
                type="number"
                required
                min={10}
                max={getMemberSummary(selectedMemberForPayment.id, selectedFY).remainingDue || 1500}
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

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">स्थळ (Venue)</label>
              <input
                type="text"
                className="form-input"
                value={newEventVenue}
                onChange={(e) => setNewEventVenue(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">प्रमुख उपस्थिती / मान्यवर (Chief Guest)</label>
              <input
                type="text"
                className="form-input"
                placeholder="उदा. मा. श्री. बाळकृष्ण कदम (ज्येष्ठ समाजसेवक)"
                value={newEventChiefGuest}
                onChange={(e) => setNewEventChiefGuest(e.target.value)}
              />
            </div>
          </div>

          {/* Highlights */}
          <div className="form-group">
            <label className="form-label">कार्यक्रमाची प्रमुख वैशिष्ट्ये (Highlights - प्रत्येक मुद्दा नवीन ओळीत)</label>
            <textarea
              rows={3}
              className="form-textarea"
              placeholder={'सकाळी ०८:३० घटस्थापना\n१०:०० वाद्य पथक वादन\n१२:०० महाआरती व प्रसाद वाटप'}
              value={newEventHighlights}
              onChange={(e) => setNewEventHighlights(e.target.value)}
            />
            <span className="form-hint">प्रत्येक वैशिष्ट्य नवीन ओळीत (Enter दाबून) लिहा.</span>
          </div>

          <div className="form-group">
            <label className="form-label">नकाशा लिंक (Google Maps Link)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://maps.google.com/?q=Chop+Gadchiroli"
              value={newEventMapUrl}
              onChange={(e) => setNewEventMapUrl(e.target.value)}
            />
          </div>

          {/* Event Cover Photo Upload */}
          <div className="form-group">
            <label className="form-label">कार्यक्रमाचा फोटो निवडा (Cover Photo)</label>
            <input
              type="file"
              accept="image/*"
              className="form-input"
              onChange={(e) => handleEventCoverFileChange(e, false)}
            />
            <span className="form-hint">पर्यायी: संगणक किंवा मोबाईलवरून फोटो निवडा.</span>
          </div>

          <div className="form-group">
            <label className="form-label">किंवा फोटो URL (Image Link)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={newEventCoverUrl}
              onChange={(e) => {
                setNewEventCoverUrl(e.target.value);
                setNewEventCoverPreview(e.target.value);
              }}
            />
          </div>

          {newEventCoverPreview && (
            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>फोटो पूर्वावलोकन (Preview):</div>
              <img
                src={newEventCoverPreview}
                alt="Preview"
                style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
            </div>
          )}

          <div style={{
            padding: '10px 14px',
            backgroundColor: '#F0FDFA',
            border: '1px solid #99F6E4',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <input
              type="checkbox"
              id="sendSmsCheckbox"
              checked={sendSmsOnCreateEvent}
              onChange={(e) => setSendSmsOnCreateEvent(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0D9488' }}
            />
            <label htmlFor="sendSmsCheckbox" style={{ cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#0F766E' }}>
              📢 कार्यक्रम प्रसिद्ध होताच सर्व सदस्यांना ({members.length}) थेट SMS सूचना पाठवा
            </label>
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

      {/* Modal: Edit Event & Photo */}
      <Modal
        isOpen={isEditEventModalOpen}
        onClose={() => {
          setIsEditEventModalOpen(false);
          setEditingEvent(null);
        }}
        title="कार्यक्रम व फोटो संपादित करा (Edit Event & Photo)"
      >
        <form onSubmit={handleUpdateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label form-label-required">कार्यक्रमाचे नाव (मराठी)</label>
            <input
              type="text"
              required
              className="form-input"
              value={editEventTitle}
              onChange={(e) => setEditEventTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">तपशील व वर्णन</label>
            <textarea
              rows={3}
              className="form-textarea"
              value={editEventDesc}
              onChange={(e) => setEditEventDesc(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">दिनांक</label>
              <input
                type="date"
                className="form-input"
                value={editEventDate}
                onChange={(e) => setEditEventDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">वेळ</label>
              <input
                type="text"
                className="form-input"
                value={editEventTime}
                onChange={(e) => setEditEventTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">स्थळ (Venue)</label>
              <input
                type="text"
                className="form-input"
                value={editEventVenue}
                onChange={(e) => setEditEventVenue(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">स्थिती (Status)</label>
              <select
                className="form-select"
                value={editEventStatus}
                onChange={(e) => setEditEventStatus(e.target.value)}
              >
                <option value="upcoming">आगामी (Upcoming)</option>
                <option value="ongoing">सुरू (Ongoing)</option>
                <option value="completed">पूर्ण (Completed)</option>
                <option value="cancelled">रद्द (Cancelled)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">प्रमुख उपस्थिती / मान्यवर (Chief Guest)</label>
              <input
                type="text"
                className="form-input"
                placeholder="उदा. मा. श्री. बाळकृष्ण कदम (ज्येष्ठ समाजसेवक)"
                value={editEventChiefGuest}
                onChange={(e) => setEditEventChiefGuest(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">नकाशा लिंक (Google Maps Link)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://maps.google.com/?q=Chop+Gadchiroli"
                value={editEventMapUrl}
                onChange={(e) => setEditEventMapUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Highlights */}
          <div className="form-group">
            <label className="form-label">कार्यक्रमाची प्रमुख वैशिष्ट्ये (Highlights - प्रत्येक मुद्दा नवीन ओळीत)</label>
            <textarea
              rows={3}
              className="form-textarea"
              placeholder={'सकाळी ०८:३० घटस्थापना\n१०:०० वाद्य पथक वादन\n१२:०० महाआरती व प्रसाद वाटप'}
              value={editEventHighlights}
              onChange={(e) => setEditEventHighlights(e.target.value)}
            />
            <span className="form-hint">प्रत्येक वैशिष्ट्य नवीन ओळीत (Enter दाबून) लिहा.</span>
          </div>

          {/* Photo Editing for Event */}
          <div className="card" style={{ padding: '12px', backgroundColor: 'var(--color-maroon-50)', border: '1px solid var(--color-maroon-100)' }}>
            <h4 style={{ fontSize: '0.92rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
              📸 कार्यक्रमाचा फोटो बदला (Change Event Photo)
            </h4>

            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label">१. नवीन फोटो निवडा (संगणक / फोनवरून)</label>
              <input
                type="file"
                accept="image/*"
                className="form-input"
                onChange={(e) => handleEventCoverFileChange(e, true)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">२. किंवा वेब इमेज लिंक (URL) टाका</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={editEventCoverUrl}
                onChange={(e) => {
                  setEditEventCoverUrl(e.target.value);
                  setEditEventCoverPreview(e.target.value);
                }}
              />
            </div>

            {editEventCoverPreview && (
              <div style={{ textAlign: 'center', marginTop: '8px', padding: '6px', backgroundColor: '#fff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>सध्याचा फोटो (Current / Selected Photo):</div>
                <img
                  src={editEventCoverPreview}
                  alt="Cover Preview"
                  style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setIsEditEventModalOpen(false);
                setEditingEvent(null);
              }}
              className="btn btn-secondary"
            >
              {t.admin.actions.cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              बदल जतन करा (Save Changes)
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Send Event SMS Notification */}
      <Modal
        isOpen={isSendEventSmsModalOpen}
        onClose={() => {
          setIsSendEventSmsModalOpen(false);
          setSmsEventTarget(null);
        }}
        title="📢 कार्यक्रम SMS सूचना पाठवा (Send Event SMS Broadcast)"
      >
        {smsEventTarget && (
          <form onSubmit={handleSendEventSmsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Event Summary Card */}
            <div style={{
              backgroundColor: 'var(--color-maroon-50)',
              border: '1px solid var(--color-maroon-200)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px'
            }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-maroon-800)', marginBottom: '4px' }}>
                🚩 {smsEventTarget.titleMarathi || smsEventTarget.title}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <span>📅 <strong>दिनांक:</strong> {formatMarathiDate(smsEventTarget.startDate)}</span>
                <span>⏰ <strong>वेळ:</strong> {smsEventTarget.timeString}</span>
                <span>📍 <strong>स्थळ:</strong> {smsEventTarget.venueMarathi || smsEventTarget.venue}</span>
              </div>
              {smsEventTarget.chiefGuest && (
                <div style={{ fontSize: '0.82rem', color: '#15803D', marginTop: '4px', fontWeight: 600 }}>
                  👥 प्रमुख उपस्थिती: {smsEventTarget.chiefGuest}
                </div>
              )}
            </div>

            {/* Recipient Target Selection */}
            <div className="form-group">
              <label className="form-label form-label-required" style={{ fontWeight: 700 }}>
                प्राप्तकर्ता गट निवडा (Target Recipients):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '6px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  border: smsRecipientType === 'all_members' ? '2px solid var(--color-maroon-700)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: smsRecipientType === 'all_members' ? 'var(--color-maroon-50)' : '#fff',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="smsRecipient"
                    checked={smsRecipientType === 'all_members'}
                    onChange={() => setSmsRecipientType('all_members')}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>👥 सर्व नोंदणीकृत सदस्य</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({members.filter(m => m.phone).length} मोबाईल नंबर)</div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  border: smsRecipientType === 'all_donors' ? '2px solid var(--color-maroon-700)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: smsRecipientType === 'all_donors' ? 'var(--color-maroon-50)' : '#fff',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="smsRecipient"
                    checked={smsRecipientType === 'all_donors'}
                    onChange={() => setSmsRecipientType('all_donors')}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>❤️ सर्व देणगीदार</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({donations.filter(d => d.donorPhone).length} मोबाईल नंबर)</div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  border: smsRecipientType === 'custom_phones' ? '2px solid var(--color-maroon-700)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: smsRecipientType === 'custom_phones' ? 'var(--color-maroon-50)' : '#fff',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="smsRecipient"
                    checked={smsRecipientType === 'custom_phones'}
                    onChange={() => setSmsRecipientType('custom_phones')}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>✏️ विशिष्ट मोबाईल नंबर</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>कस्टम नंबर प्रविष्ट करा</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Custom Phone Numbers Input */}
            {smsRecipientType === 'custom_phones' && (
              <div className="form-group">
                <label className="form-label form-label-required">मोबाईल नंबर (प्रत्येक नंबर नवीन ओळीत किंवा स्वल्पविरामाने वेगळा करा)</label>
                <textarea
                  rows={3}
                  required
                  className="form-textarea"
                  placeholder={'9822012345\n9423012345\n8888012345'}
                  value={smsCustomPhones}
                  onChange={(e) => setSmsCustomPhones(e.target.value)}
                />
              </div>
            )}

            {/* Custom Note or Additional Announcement */}
            <div className="form-group">
              <label className="form-label">विशेष सूचना किंवा टीप (पर्यायी)</label>
              <input
                type="text"
                className="form-input"
                placeholder="उदा. महाप्रसाद वाटप दुपारी ०१:०० वाजता सुरू होईल."
                value={smsCustomNote}
                onChange={(e) => setSmsCustomNote(e.target.value)}
              />
            </div>

            {/* Live Message Preview */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                  📱 SMS संदेश पूर्वदृश्य (Message Preview):
                </label>
                <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                  {smsRecipientType === 'all_members'
                    ? `${members.filter(m => m.phone).length} सदस्यांना जाणार`
                    : smsRecipientType === 'all_donors'
                    ? `${donations.filter(d => d.donorPhone).length} देणगीदारांना जाणार`
                    : `${smsCustomPhones.split(/[\n,;]+/).filter((p) => p.trim().length >= 10).length} नंबरना जाणार`}
                </span>
              </div>
              <div style={{
                backgroundColor: '#1E293B',
                color: '#E2E8F0',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                border: '1px solid #334155'
              }}>
                {formatEventNotificationMessage({
                  mandalName: festivalConfig.titleMarathi || 'सार्वजनिक बाल दुर्गा उत्सव मंडळ',
                  title: smsEventTarget.titleMarathi || smsEventTarget.title,
                  dateStr: formatMarathiDate(smsEventTarget.startDate),
                  timeStr: smsEventTarget.timeString || '',
                  venue: smsEventTarget.venueMarathi || smsEventTarget.venue || '',
                  chiefGuest: smsEventTarget.chiefGuest,
                  customNote: smsCustomNote.trim() || undefined
                })}
              </div>
            </div>

            {/* Fast2SMS API Key Section */}
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)' }}>
                  <Key size={14} color="#D97706" /> Fast2SMS Live SMS API Key (पर्यायी / Real SMS Gateway):
                </span>
                {smsApiKeyInput ? (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>🟢 Real SMS Active</span>
                ) : (
                  <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>⚪ Simulated Mode</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  className="form-input"
                  style={{ fontSize: '0.82rem', padding: '6px 10px', height: '34px' }}
                  placeholder="Fast2SMS API Key प्रविष्ट करा..."
                  value={smsApiKeyInput}
                  onChange={(e) => setSmsApiKeyInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleSaveFast2SmsKey}
                  className="btn btn-secondary btn-sm"
                  style={{ height: '34px', padding: '0 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                >
                  की जतन करा
                </button>
              </div>
              {isSavedKeyBannerVisible && (
                <div style={{ color: '#16A34A', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
                  ✓ API Key यशस्वीरित्या जतन झाली!
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {/* WhatsApp Share Button */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  formatEventNotificationMessage({
                    mandalName: festivalConfig.titleMarathi || 'सार्वजनिक बाल दुर्गा उत्सव मंडळ',
                    title: smsEventTarget.titleMarathi || smsEventTarget.title,
                    dateStr: formatMarathiDate(smsEventTarget.startDate),
                    timeStr: smsEventTarget.timeString || '',
                    venue: smsEventTarget.venueMarathi || smsEventTarget.venue || '',
                    chiefGuest: smsEventTarget.chiefGuest,
                    customNote: smsCustomNote.trim() || undefined
                  })
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  borderColor: '#25D366',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  gap: '6px'
                }}
              >
                <Share2 size={16} />
                <span>WhatsApp वर शेअर करा</span>
              </a>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSendEventSmsModalOpen(false);
                    setSmsEventTarget(null);
                  }}
                  className="btn btn-secondary"
                >
                  {t.admin.actions.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSendingEventSms}
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#0D9488',
                    borderColor: '#0D9488',
                    fontWeight: 700,
                    gap: '6px'
                  }}
                >
                  <Smartphone size={16} />
                  <span>{isSendingEventSms ? 'SMS पाठवत आहे...' : '📲 SMS ब्रॉडकास्ट पाठवा'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
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

          {/* Real SMS Broadcast Checkbox for Registered Members */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#F0FDFA',
            border: '1px solid #99F6E4',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <label htmlFor="sendNoticeSmsCheckbox" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              margin: 0
            }}>
              <input
                type="checkbox"
                id="sendNoticeSmsCheckbox"
                checked={sendSmsOnCreateNotice}
                onChange={(e) => setSendSmsOnCreateNotice(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0D9488' }}
              />
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F766E' }}>
                📢 सर्व नोंदणीकृत सभासदांना थेट Real SMS पाठवा ({members.filter(m => m.phone).length} सभासद)
              </span>
            </label>
            <div style={{ fontSize: '0.78rem', color: '#0D9488', paddingLeft: '28px' }}>
              हा पर्याय निवडल्यास ही सूचना प्रसिद्ध होताच सर्व नोंदणीकृत सभासदांच्या मोबाईल नंबरवर थेट Real SMS पाठवला जाईल.
            </div>
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

          <div className="form-group">
            <label className="form-label">कव्हर फोटो निवडा (Cover Image)</label>
            <input
              type="file"
              accept="image/*"
              className="form-input"
              onChange={handleAlbumCoverFileChange}
            />
            <span className="form-hint">पर्यायी: संगणकावरून कव्हर फोटो निवडा.</span>
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

      {/* Modal: Add Photo to Album */}
      <Modal
        isOpen={isAddPhotoModalOpen}
        onClose={() => {
          setIsAddPhotoModalOpen(false);
          setNewPhotoPreview(null);
        }}
        title={`फोटो जोडा — ${selectedAlbumForPhotos ? (selectedAlbumForPhotos.titleMarathi || selectedAlbumForPhotos.title) : 'अल्बम'}`}
      >
        <form onSubmit={handleAddPhotoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label form-label-required">१. फोटो निवडा (संगणक / फोनवरून)</label>
            <input
              type="file"
              accept="image/*"
              className="form-input"
              onChange={handlePhotoFileChange}
            />
          </div>

          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            — किंवा वेब इमेज लिंक (URL) टाका —
          </div>

          <div className="form-group">
            <label className="form-label">२. फोटो URL (Image Link)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={newPhotoUrl}
              onChange={(e) => {
                setNewPhotoUrl(e.target.value);
                setNewPhotoPreview(e.target.value);
              }}
            />
          </div>

          {newPhotoPreview && (
            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>फोटो पूर्वावलोकन (Preview):</div>
              <img
                src={newPhotoPreview}
                alt="Preview"
                style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">फोटोचे शीर्षक / कॅप्शन (मराठी)</label>
            <input
              type="text"
              className="form-input"
              placeholder="उदा. महाआरती सोहळा क्षणचित्रे"
              value={newPhotoCaption}
              onChange={(e) => setNewPhotoCaption(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={() => {
                setIsAddPhotoModalOpen(false);
                setNewPhotoPreview(null);
              }}
              className="btn btn-secondary"
            >
              {t.admin.actions.cancel}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newPhotoPreview && !newPhotoUrl}
            >
              <Upload size={16} />
              <span>फोटो अपलोड करा</span>
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

      {/* Modal: Add Expense */}
      <Modal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        title="नवीन खर्च नोंदवा (Record Expense Voucher)"
      >
        <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label form-label-required">खर्चाचे नाव / शीर्षक</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="उदा. मंडप उभारणी पहिला हप्ता / महाप्रसाद किराणा"
              value={newExpenseTitle}
              onChange={(e) => setNewExpenseTitle(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">खर्च प्रवर्ग (Category)</label>
              <select
                className="form-select"
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value as ExpenseCategory)}
              >
                <option value="mandap_decoration">मंडप व सजावट</option>
                <option value="sound_lighting">विद्युत रोषणाई व ध्वनी</option>
                <option value="mahaprasad_food">महाप्रसाद व अन्नदान</option>
                <option value="puja_havan">पूजा, होम-हवन व साहित्य</option>
                <option value="printing_advertising">छपाई, बॅनर व जाहिरात</option>
                <option value="cultural_prizes">सांस्कृतिक व बक्षीस वितरण</option>
                <option value="administrative_misc">प्रशासकीय व इतर खर्च</option>
                <option value="other">इतर किरकोळ खर्च</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">खर्च रक्कम (₹)</label>
              <input
                type="number"
                required
                min={1}
                className="form-input"
                placeholder="उदा. १५०००"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">दिनांक</label>
              <input
                type="date"
                required
                className="form-input"
                value={newExpenseDate}
                onChange={(e) => setNewExpenseDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">पेमेंट पद्धत</label>
              <select
                className="form-select"
                value={newExpensePaymentMethod}
                onChange={(e) => setNewExpensePaymentMethod(e.target.value as any)}
              >
                <option value="upi">UPI / QR (PhonePe/GPay)</option>
                <option value="bank_transfer">बँक ट्रान्सफर (NEFT/RTGS)</option>
                <option value="cash">रोख (Cash)</option>
                <option value="cheque">धनादेश (Cheque)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">देयक व्यक्ती / फर्मचे नाव</label>
              <input
                type="text"
                className="form-input"
                placeholder="उदा. माऊली डेकोरेटर्स / श्री किराणा"
                value={newExpensePayee}
                onChange={(e) => setNewExpensePayee(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">संपर्क फोन नंबर</label>
              <input
                type="tel"
                maxLength={10}
                className="form-input"
                placeholder="१० अंकी मोबाईल नंबर"
                value={newExpensePhone}
                onChange={(e) => setNewExpensePhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">व्हाउचर किंवा बिल नंबर (ऐच्छिक)</label>
            <input
              type="text"
              className="form-input"
              placeholder="उदा. VOUCH-2026/05 किंवा बिल क्र. ४८२"
              value={newExpenseVoucher}
              onChange={(e) => setNewExpenseVoucher(e.target.value)}
            />
          </div>

          {/* Bill Receipt File Picker */}
          <div className="form-group">
            <label className="form-label">बिल किंवा देयक पावती फोटो (Bill / Receipt Photo)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleExpenseBillFileChange(e, false)}
                className="form-input"
                style={{ padding: '6px' }}
              />
              {newExpenseBillPreview && (
                <div style={{ position: 'relative', width: '120px', height: '90px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--color-gold-500)' }}>
                  <img src={newExpenseBillPreview} alt="Bill Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => setNewExpenseBillPreview(null)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">शेरा / तपशील (Notes)</label>
            <textarea
              rows={2}
              className="form-textarea"
              placeholder="खर्चाविषयी अधिक माहिती..."
              value={newExpenseNotes}
              onChange={(e) => setNewExpenseNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
            <button type="button" onClick={() => setIsAddExpenseModalOpen(false)} className="btn btn-secondary">
              {t.admin.actions.cancel}
            </button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
              खर्च जतन करा
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Expense */}
      <Modal
        isOpen={isEditExpenseModalOpen}
        onClose={() => {
          setIsEditExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        title="खर्च दुरुस्त / संपादित करा (Edit Expense)"
      >
        <form onSubmit={handleUpdateExpense} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label form-label-required">खर्चाचे नाव / शीर्षक</label>
            <input
              type="text"
              required
              className="form-input"
              value={editExpenseTitle}
              onChange={(e) => setEditExpenseTitle(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">खर्च प्रवर्ग (Category)</label>
              <select
                className="form-select"
                value={editExpenseCategory}
                onChange={(e) => setEditExpenseCategory(e.target.value as ExpenseCategory)}
              >
                <option value="mandap_decoration">मंडप व सजावट</option>
                <option value="sound_lighting">विद्युत रोषणाई व ध्वनी</option>
                <option value="mahaprasad_food">महाप्रसाद व अन्नदान</option>
                <option value="puja_havan">पूजा, होम-हवन व साहित्य</option>
                <option value="printing_advertising">छपाई, बॅनर व जाहिरात</option>
                <option value="cultural_prizes">सांस्कृतिक व बक्षीस वितरण</option>
                <option value="administrative_misc">प्रशासकीय व इतर खर्च</option>
                <option value="other">इतर किरकोळ खर्च</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">खर्च रक्कम (₹)</label>
              <input
                type="number"
                required
                min={1}
                className="form-input"
                value={editExpenseAmount}
                onChange={(e) => setEditExpenseAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">दिनांक</label>
              <input
                type="date"
                required
                className="form-input"
                value={editExpenseDate}
                onChange={(e) => setEditExpenseDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">पेमेंट पद्धत</label>
              <select
                className="form-select"
                value={editExpensePaymentMethod}
                onChange={(e) => setEditExpensePaymentMethod(e.target.value as any)}
              >
                <option value="upi">UPI / QR (PhonePe/GPay)</option>
                <option value="bank_transfer">बँक ट्रान्सफर (NEFT/RTGS)</option>
                <option value="cash">रोख (Cash)</option>
                <option value="cheque">धनादेश (Cheque)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">देयक व्यक्ती / फर्मचे नाव</label>
              <input
                type="text"
                className="form-input"
                value={editExpensePayee}
                onChange={(e) => setEditExpensePayee(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">संपर्क फोन नंबर</label>
              <input
                type="tel"
                maxLength={10}
                className="form-input"
                value={editExpensePhone}
                onChange={(e) => setEditExpensePhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">व्हाउचर किंवा बिल नंबर</label>
            <input
              type="text"
              className="form-input"
              value={editExpenseVoucher}
              onChange={(e) => setEditExpenseVoucher(e.target.value)}
            />
          </div>

          {/* Edit Bill Receipt File */}
          <div className="form-group">
            <label className="form-label">बिल किंवा देयक पावती फोटो</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleExpenseBillFileChange(e, true)}
                className="form-input"
                style={{ padding: '6px' }}
              />
              {editExpenseBillPreview && (
                <div style={{ position: 'relative', width: '120px', height: '90px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--color-gold-500)' }}>
                  <img src={editExpenseBillPreview} alt="Bill Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => setEditExpenseBillPreview(null)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">शेरा / तपशील</label>
            <textarea
              rows={2}
              className="form-textarea"
              value={editExpenseNotes}
              onChange={(e) => setEditExpenseNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
            <button
              type="button"
              onClick={() => {
                setIsEditExpenseModalOpen(false);
                setEditingExpense(null);
              }}
              className="btn btn-secondary"
            >
              {t.admin.actions.cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              बदल जतन करा
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Full Bill Receipt Photo */}
      <Modal
        isOpen={Boolean(selectedBillPreview)}
        onClose={() => setSelectedBillPreview(null)}
        title="देयक पावती / बिल (Expense Voucher Receipt)"
      >
        {selectedBillPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', alignItems: 'center' }}>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', width: '100%', textAlign: 'center' }}>
              <img
                src={selectedBillPreview}
                alt="Bill Receipt Full Preview"
                style={{ maxWidth: '100%', height: 'auto', display: 'inline-block' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                onClick={() => setSelectedBillPreview(null)}
                className="btn btn-secondary"
              >
                बंद करा (Close)
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Add Jama / Offline Donation */}
      <Modal
        isOpen={isAddDonationModalOpen}
        onClose={() => setIsAddDonationModalOpen(false)}
        title="नवीन जमा / देणगी नोंदवा (Record Income / Donation)"
      >
        <form onSubmit={handleAddOfflineDonation} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label form-label-required">देणगीदार / व्यक्तीचे नाव</label>
            <input
              type="text"
              required={!newJamaIsAnonymous}
              disabled={newJamaIsAnonymous}
              className="form-input"
              placeholder="उदा. श्री. राहुल सुरेश पाटील"
              value={newJamaDonorName}
              onChange={(e) => setNewJamaDonorName(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">जमा / देणगी प्रकार</label>
              <select
                className="form-select"
                value={newJamaType}
                onChange={(e) => setNewJamaType(e.target.value as DonationType)}
              >
                <option value="annadaan">अन्नदान व महाप्रसाद</option>
                <option value="maharati">महाआरती देणगी</option>
                <option value="special_utsav">विशेष उत्सव प्रायोजकत्व</option>
                <option value="murti_decoration">मूर्ती शृंगार व अलंकार</option>
                <option value="general">सर्वसाधारण देणगी / जमा निधी</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">जमा रक्कम (₹)</label>
              <input
                type="number"
                required
                min={1}
                className="form-input"
                placeholder="उदा. ५००१"
                value={newJamaAmount}
                onChange={(e) => setNewJamaAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">मोबाईल नंबर (WhatsApp पावतीसाठी)</label>
              <input
                type="tel"
                maxLength={10}
                required
                className="form-input"
                placeholder="१० अंकी मोबाईल नंबर"
                value={newJamaPhone}
                onChange={(e) => setNewJamaPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">पेमेंट प्रकार (Payment Mode)</label>
              <select
                className="form-select"
                value={newJamaPaymentMethod}
                onChange={(e) => setNewJamaPaymentMethod(e.target.value as any)}
              >
                <option value="cash">रोख (Cash)</option>
                <option value="direct_upi">UPI / PhonePe / GPay</option>
                <option value="bank_transfer">बँक ट्रान्सफर (NEFT/RTGS)</option>
                <option value="cheque">धनादेश (Cheque)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">गाव / शहर</label>
              <input
                type="text"
                className="form-input"
                placeholder="उदा. चोप / गडचिरोली / पुणे"
                value={newJamaCity}
                onChange={(e) => setNewJamaCity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">पॅन नंबर (PAN - ऐच्छिक)</label>
              <input
                type="text"
                maxLength={10}
                className="form-input"
                placeholder="उदा. ABCDE1234F"
                value={newJamaPan}
                onChange={(e) => setNewJamaPan(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Anonymous checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <input
              type="checkbox"
              id="adminJamaAnonymousCheck"
              checked={newJamaIsAnonymous}
              onChange={(e) => setNewJamaIsAnonymous(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#059669' }}
            />
            <label htmlFor="adminJamaAnonymousCheck" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
              गुप्त दान म्हणून नोंदवा (Keep Contributor Anonymous)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
            <button type="button" onClick={() => setIsAddDonationModalOpen(false)} className="btn btn-secondary">
              {t.admin.actions.cancel}
            </button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669', borderColor: '#059669' }}>
              जमा नोंदवा व PDF पावती द्या
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Jama / Donation */}
      <Modal
        isOpen={isEditDonationModalOpen}
        onClose={() => {
          setIsEditDonationModalOpen(false);
          setEditingDonation(null);
        }}
        title="जमा नोंद दुरुस्त / संपादित करा (Edit Income Record)"
      >
        <form onSubmit={handleUpdateDonation} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label form-label-required">देणगीदार / व्यक्तीचे नाव</label>
            <input
              type="text"
              required={!editJamaIsAnonymous}
              disabled={editJamaIsAnonymous}
              className="form-input"
              value={editJamaDonorName}
              onChange={(e) => setEditJamaDonorName(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">जमा / देणगी प्रकार</label>
              <select
                className="form-select"
                value={editJamaType}
                onChange={(e) => setEditJamaType(e.target.value as DonationType)}
              >
                <option value="annadaan">अन्नदान व महाप्रसाद</option>
                <option value="maharati">महाआरती देणगी</option>
                <option value="special_utsav">विशेष उत्सव प्रायोजकत्व</option>
                <option value="murti_decoration">मूर्ती शृंगार व अलंकार</option>
                <option value="general">सर्वसाधारण देणगी / जमा निधी</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">जमा रक्कम (₹)</label>
              <input
                type="number"
                required
                min={1}
                className="form-input"
                value={editJamaAmount}
                onChange={(e) => setEditJamaAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">मोबाईल नंबर</label>
              <input
                type="tel"
                maxLength={10}
                required
                className="form-input"
                value={editJamaPhone}
                onChange={(e) => setEditJamaPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">पेमेंट प्रकार (Payment Mode)</label>
              <select
                className="form-select"
                value={editJamaPaymentMethod}
                onChange={(e) => setEditJamaPaymentMethod(e.target.value as any)}
              >
                <option value="cash">रोख (Cash)</option>
                <option value="direct_upi">UPI / PhonePe / GPay</option>
                <option value="bank_transfer">बँक ट्रान्सफर (NEFT/RTGS)</option>
                <option value="cheque">धनादेश (Cheque)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">गाव / शहर</label>
              <input
                type="text"
                className="form-input"
                value={editJamaCity}
                onChange={(e) => setEditJamaCity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">पॅन नंबर (PAN - ऐच्छिक)</label>
              <input
                type="text"
                maxLength={10}
                className="form-input"
                value={editJamaPan}
                onChange={(e) => setEditJamaPan(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Anonymous checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <input
              type="checkbox"
              id="adminEditJamaAnonymousCheck"
              checked={editJamaIsAnonymous}
              onChange={(e) => setEditJamaIsAnonymous(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#059669' }}
            />
            <label htmlFor="adminEditJamaAnonymousCheck" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
              गुप्त दान म्हणून नोंदवा (Keep Contributor Anonymous)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
            <button
              type="button"
              onClick={() => {
                setIsEditDonationModalOpen(false);
                setEditingDonation(null);
              }}
              className="btn btn-secondary"
            >
              {t.admin.actions.cancel}
            </button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669', borderColor: '#059669' }}>
              बदल जतन करा
            </button>
          </div>
        </form>
      </Modal>

      {/* Add New Member Modal */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="नवीन सभासद नोंदणी — Add New Mandal Member"
        maxWidth="680px"
      >
        <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">सभासदाचे पूर्ण नाव (मराठीत)</label>
              <input
                type="text"
                required
                className="form-input"
                value={newMemberNameMarathi}
                onChange={(e) => setNewMemberNameMarathi(e.target.value)}
                placeholder="उदा. श्री. गणेश रामचंद्र पाटील"
              />
            </div>
            <div className="form-group">
              <label className="form-label">पूर्ण नाव (इंग्रजीत - Optional)</label>
              <input
                type="text"
                className="form-input"
                value={newMemberNameEng}
                onChange={(e) => setNewMemberNameEng(e.target.value)}
                placeholder="उदा. Shri. Ganesh R. Patil"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">१० अंकी मोबाईल नंबर (लॉगिनसाठी)</label>
              <input
                type="tel"
                required
                maxLength={10}
                className="form-input"
                value={newMemberPhone}
                onChange={(e) => setNewMemberPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="९८xxxxxxxx"
              />
            </div>
            <div className="form-group">
              <label className="form-label">ईमेल आयडी (ऐच्छिक)</label>
              <input
                type="email"
                className="form-input"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="name@email.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">पत्ता (Address)</label>
            <input
              type="text"
              required
              className="form-input"
              value={newMemberAddress}
              onChange={(e) => setNewMemberAddress(e.target.value)}
              placeholder="घर क्र., गल्ली, परिसर"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">गाव / शहर</label>
              <input
                type="text"
                className="form-input"
                value={newMemberCity}
                onChange={(e) => setNewMemberCity(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">पिनकोड</label>
              <input
                type="text"
                maxLength={6}
                className="form-input"
                value={newMemberPincode}
                onChange={(e) => setNewMemberPincode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">सभासद प्रकार</label>
              <select
                className="form-input"
                value={newMemberType}
                onChange={(e) => setNewMemberType(e.target.value as any)}
              >
                <option value="individual">वैयक्तिक (Individual)</option>
                <option value="family">कुटुंब (Family)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">वर्गणी वर्गवारी</label>
              <select
                className="form-input"
                value={newMemberCategory}
                onChange={(e) => setNewMemberCategory(e.target.value as any)}
              >
                <option value="annual">वार्षिक (Annual)</option>
                <option value="life">आजीवन (Life Member)</option>
                <option value="patron">आश्रयदाते (Patron)</option>
                <option value="honorary">मानद / प्रतिष्ठित (Honorary)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">वार्षिक वर्गणी शुल्क (₹)</label>
              <input
                type="number"
                min="0"
                required
                className="form-input"
                value={newMemberDueAmount}
                onChange={(e) => setNewMemberDueAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="form-group">
            <label className="form-label">सभासद फोटो (ID Card Photo - ऐच्छिक)</label>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {newMemberPhotoPreview ? (
                <img
                  src={newMemberPhotoPreview}
                  alt="Member Preview"
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-maroon-700)' }}
                />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--color-maroon-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-maroon-700)', fontWeight: 700 }}>
                  <Users size={24} />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleMemberPhotoFileChange}
                className="form-input"
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Family members dynamic rows if family memberType */}
          {newMemberType === 'family' && (
            <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>कुटुंबातील इतर सदस्य:</span>
                <button
                  type="button"
                  onClick={() => setNewMemberFamilyList((prev) => [...prev, { name: '', relation: 'कुटुंब सदस्य' }])}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                >
                  + सदस्य जोडा
                </button>
              </div>
              {newMemberFamilyList.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    placeholder="सदस्याचे नाव"
                    value={f.name}
                    onChange={(e) => {
                      const updated = [...newMemberFamilyList];
                      updated[i].name = e.target.value;
                      setNewMemberFamilyList(updated);
                    }}
                    className="form-input"
                    style={{ flex: 2, fontSize: '0.82rem' }}
                  />
                  <input
                    type="text"
                    placeholder="नाते (उदा. पत्नी, मुलगा)"
                    value={f.relation}
                    onChange={(e) => {
                      const updated = [...newMemberFamilyList];
                      updated[i].relation = e.target.value;
                      setNewMemberFamilyList(updated);
                    }}
                    className="form-input"
                    style={{ flex: 1.5, fontSize: '0.82rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setNewMemberFamilyList((prev) => prev.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
            <button
              type="button"
              onClick={() => setIsAddMemberModalOpen(false)}
              className="btn btn-secondary"
            >
              {t.admin.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={isSavingMember}
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--color-maroon-700)', borderColor: 'var(--color-maroon-700)', fontWeight: 700 }}
            >
              {isSavingMember ? 'नोंदणी होत आहे...' : '+ सभासद नोंदणी पूर्ण करा'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditMemberModalOpen}
        onClose={() => {
          setIsEditMemberModalOpen(false);
          setEditingMember(null);
        }}
        title={`सभासद माहिती दुरुस्ती — ${editingMember?.memberNumber || ''}`}
        maxWidth="680px"
      >
        <form onSubmit={handleUpdateMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">सभासदाचे पूर्ण नाव (मराठीत)</label>
              <input
                type="text"
                required
                className="form-input"
                value={editMemberNameMarathi}
                onChange={(e) => setEditMemberNameMarathi(e.target.value)}
                placeholder="उदा. श्री. गणेश रामचंद्र पाटील"
              />
            </div>
            <div className="form-group">
              <label className="form-label">पूर्ण नाव (इंग्रजीत - Optional)</label>
              <input
                type="text"
                className="form-input"
                value={editMemberNameEng}
                onChange={(e) => setEditMemberNameEng(e.target.value)}
                placeholder="उदा. Shri. Ganesh R. Patil"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">१० अंकी मोबाईल नंबर</label>
              <input
                type="tel"
                required
                maxLength={10}
                className="form-input"
                value={editMemberPhone}
                onChange={(e) => setEditMemberPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="९८xxxxxxxx"
              />
            </div>
            <div className="form-group">
              <label className="form-label">ईमेल आयडी (ऐच्छिक)</label>
              <input
                type="email"
                className="form-input"
                value={editMemberEmail}
                onChange={(e) => setEditMemberEmail(e.target.value)}
                placeholder="name@email.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">पत्ता (Address)</label>
            <input
              type="text"
              required
              className="form-input"
              value={editMemberAddress}
              onChange={(e) => setEditMemberAddress(e.target.value)}
              placeholder="घर क्र., गल्ली, परिसर"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">गाव / शहर</label>
              <input
                type="text"
                className="form-input"
                value={editMemberCity}
                onChange={(e) => setEditMemberCity(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">पिनकोड</label>
              <input
                type="text"
                maxLength={6}
                className="form-input"
                value={editMemberPincode}
                onChange={(e) => setEditMemberPincode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">सभासद प्रकार</label>
              <select
                className="form-input"
                value={editMemberType}
                onChange={(e) => setEditMemberType(e.target.value as any)}
              >
                <option value="individual">वैयक्तिक (Individual)</option>
                <option value="family">कुटुंब (Family)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">वर्गणी वर्गवारी</label>
              <select
                className="form-input"
                value={editMemberCategory}
                onChange={(e) => setEditMemberCategory(e.target.value as any)}
              >
                <option value="annual">वार्षिक (Annual)</option>
                <option value="life">आजीवन (Life Member)</option>
                <option value="patron">आश्रयदाते (Patron)</option>
                <option value="honorary">मानद / प्रतिष्ठित (Honorary)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">वार्षिक वर्गणी शुल्क (₹)</label>
              <input
                type="number"
                min="0"
                required
                className="form-input"
                value={editMemberDueAmount}
                onChange={(e) => setEditMemberDueAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="form-group">
            <label className="form-label">सभासद फोटो (ID Card Photo)</label>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {editMemberPhotoPreview ? (
                <img
                  src={editMemberPhotoPreview}
                  alt="Member Preview"
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-maroon-700)' }}
                />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--color-maroon-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-maroon-700)', fontWeight: 700 }}>
                  <Users size={24} />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleEditMemberPhotoFileChange}
                className="form-input"
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Family members dynamic rows if family memberType */}
          {editMemberType === 'family' && (
            <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>कुटुंबातील इतर सदस्य:</span>
                <button
                  type="button"
                  onClick={() => setEditMemberFamilyList((prev) => [...prev, { name: '', relation: 'कुटुंब सदस्य' }])}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                >
                  + सदस्य जोडा
                </button>
              </div>
              {editMemberFamilyList.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    placeholder="सदस्याचे नाव"
                    value={f.name}
                    onChange={(e) => {
                      const updated = [...editMemberFamilyList];
                      updated[i].name = e.target.value;
                      setEditMemberFamilyList(updated);
                    }}
                    className="form-input"
                    style={{ flex: 2, fontSize: '0.82rem' }}
                  />
                  <input
                    type="text"
                    placeholder="नाते (उदा. पत्नी, मुलगा)"
                    value={f.relation}
                    onChange={(e) => {
                      const updated = [...editMemberFamilyList];
                      updated[i].relation = e.target.value;
                      setEditMemberFamilyList(updated);
                    }}
                    className="form-input"
                    style={{ flex: 1.5, fontSize: '0.82rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditMemberFamilyList((prev) => prev.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
            <button
              type="button"
              onClick={() => {
                setIsEditMemberModalOpen(false);
                setEditingMember(null);
              }}
              className="btn btn-secondary"
            >
              {t.admin.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={isUpdatingMember}
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--color-maroon-700)', borderColor: 'var(--color-maroon-700)', fontWeight: 700 }}
            >
              {isUpdatingMember ? 'बदल जतन होत आहेत...' : 'बदल जतन करा (Save Changes)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Committee Member & Photo Modal */}
      <Modal
        isOpen={isEditCommitteeModalOpen}
        onClose={() => {
          setIsEditCommitteeModalOpen(false);
          setEditingCommitteeMember(null);
        }}
        title={`पदाधिकारी माहिती व फोटो दुरुस्ती — ${editingCommitteeMember?.nameMarathi || ''}`}
        maxWidth="620px"
      >
        <form onSubmit={handleUpdateCommitteeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Photo Upload Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: 'var(--color-maroon-50)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-maroon-100)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              border: '3px solid var(--color-gold-500)',
              backgroundColor: '#fff'
            }}>
              <img
                src={committeePhotoPreview || editingCommitteeMember?.photoUrl}
                alt="Committee Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ fontWeight: 700, color: 'var(--color-maroon-800)', marginBottom: '4px' }}>
                📸 नवीन फोटो निवडा (Upload Photo / Image URL):
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label
                  className="btn btn-secondary btn-sm"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: '#ffffff',
                    borderColor: 'var(--color-maroon-300)',
                    color: 'var(--color-maroon-800)',
                    fontWeight: 600,
                    gap: '6px',
                    fontSize: '0.82rem'
                  }}
                >
                  <Upload size={14} />
                  <span>डिव्हाइसमधून निवडा</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCommitteePhotoFileChange(e, true)}
                    hidden
                  />
                </label>

                {committeePhotoPreview && (
                  <button
                    type="button"
                    onClick={() => setCommitteePhotoPreview('')}
                    className="btn btn-danger btn-sm"
                    style={{ fontSize: '0.78rem', padding: '4px 8px', gap: '4px' }}
                    title="फोटो काढून टाका"
                  >
                    <Trash2 size={12} />
                    <span>काढून टाका</span>
                  </button>
                )}
              </div>

              <input
                type="text"
                className="form-input"
                style={{ marginTop: '8px', fontSize: '0.82rem' }}
                value={committeePhotoPreview.startsWith('data:') ? '(डिव्हाइसमधून फोटो निवडला आहे)' : committeePhotoPreview}
                onChange={(e) => setCommitteePhotoPreview(e.target.value)}
                placeholder="किंवा थेट फोटो लिंक (https://...)"
                disabled={committeePhotoPreview.startsWith('data:')}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">पूर्ण नाव (मराठीत)</label>
              <input
                type="text"
                required
                className="form-input"
                value={committeeNameMarathi}
                onChange={(e) => setCommitteeNameMarathi(e.target.value)}
                placeholder="उदा. श्री. शुभम गोविंदरावजी नागपूरकर"
              />
            </div>
            <div className="form-group">
              <label className="form-label">पूर्ण नाव (इंग्रजीत - Optional)</label>
              <input
                type="text"
                className="form-input"
                value={committeeNameEng}
                onChange={(e) => setCommitteeNameEng(e.target.value)}
                placeholder="Shri. Shubham G. Nagpurkar"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">मंडळातील पद (Designation)</label>
              <input
                type="text"
                required
                className="form-input"
                value={committeeDesignationMarathi}
                onChange={(e) => setCommitteeDesignationMarathi(e.target.value)}
                placeholder="उदा. अध्यक्ष, उपाध्यक्ष, सचिव, खजिनदार"
              />
            </div>
            <div className="form-group">
              <label className="form-label">मोबाईल नंबर (कॉलसाठी)</label>
              <input
                type="text"
                className="form-input"
                value={committeePhone}
                onChange={(e) => setCommitteePhone(e.target.value)}
                placeholder="+91 89991 61652"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">जबाबदारी / कार्याचे संक्षिप्त वर्णन (ऐच्छिक)</label>
            <input
              type="text"
              className="form-input"
              value={committeeRoleDesc}
              onChange={(e) => setCommitteeRoleDesc(e.target.value)}
              placeholder="उदा. मंडळाचे सर्वांगीण नेतृत्व व सामाजिक समन्वय"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
            <button
              type="button"
              onClick={() => {
                setIsEditCommitteeModalOpen(false);
                setEditingCommitteeMember(null);
              }}
              className="btn btn-secondary"
            >
              {t.admin.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={isSavingCommittee}
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--color-maroon-700)', borderColor: 'var(--color-maroon-700)', fontWeight: 700 }}
            >
              {isSavingCommittee ? 'बदल जतन होत आहेत...' : 'बदल व फोटो जतन करा (Save Changes)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add New Committee Member Modal */}
      <Modal
        isOpen={isAddCommitteeModalOpen}
        onClose={() => setIsAddCommitteeModalOpen(false)}
        title="नवीन कार्यकारणी पदाधिकारी जोडा"
        maxWidth="620px"
      >
        <form onSubmit={handleCreateCommitteeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Photo Upload Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: 'var(--color-maroon-50)',
            padding: '14px',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              border: '2px solid var(--color-gold-500)',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {newCommPhotoPreview ? (
                <img src={newCommPhotoPreview} alt="New Member" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Users size={32} color="var(--color-maroon-700)" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ fontWeight: 700, color: 'var(--color-maroon-800)', marginBottom: '4px' }}>
                📸 फोटो निवडा (Upload Photo):
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleCommitteePhotoFileChange(e, false)}
                className="form-input"
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">पूर्ण नाव (मराठीत)</label>
              <input
                type="text"
                required
                className="form-input"
                value={newCommNameMarathi}
                onChange={(e) => setNewCommNameMarathi(e.target.value)}
                placeholder="उदा. श्री. गणेश पाटील"
              />
            </div>
            <div className="form-group">
              <label className="form-label">पूर्ण नाव (इंग्रजीत - Optional)</label>
              <input
                type="text"
                className="form-input"
                value={newCommNameEng}
                onChange={(e) => setNewCommNameEng(e.target.value)}
                placeholder="Ganesh Patil"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">मंडळातील पद (Designation)</label>
              <input
                type="text"
                required
                className="form-input"
                value={newCommDesignationMarathi}
                onChange={(e) => setNewCommDesignationMarathi(e.target.value)}
                placeholder="उदा. सल्लागार, सहसचिव"
              />
            </div>
            <div className="form-group">
              <label className="form-label">मोबाईल नंबर</label>
              <input
                type="text"
                className="form-input"
                value={newCommPhone}
                onChange={(e) => setNewCommPhone(e.target.value)}
                placeholder="+91 98xxxxxxxx"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">जबाबदारी / कार्याचे संक्षिप्त वर्णन (ऐच्छिक)</label>
            <input
              type="text"
              className="form-input"
              value={newCommRoleDesc}
              onChange={(e) => setNewCommRoleDesc(e.target.value)}
              placeholder="उदा. मंडप व डेकोरेशन प्रमुख"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
            <button
              type="button"
              onClick={() => setIsAddCommitteeModalOpen(false)}
              className="btn btn-secondary"
            >
              {t.admin.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={isCreatingCommittee}
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--color-maroon-700)', borderColor: 'var(--color-maroon-700)', fontWeight: 700 }}
            >
              {isCreatingCommittee ? 'नोंद होत आहे...' : '+ पदाधिकारी जोडा'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Hero Slide Modal */}
      <Modal
        isOpen={isEditSlideModalOpen}
        onClose={() => {
          setIsEditSlideModalOpen(false);
          setEditingSlide(null);
        }}
        title={`बॅनर स्लाईड माहिती बदला — ${editingSlide?.id || ''}`}
        maxWidth="620px"
      >
        <form onSubmit={handleUpdateSlideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Banner Display Mode Selector */}
          <div className="form-group" style={{ backgroundColor: 'var(--color-maroon-50)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-maroon-200)' }}>
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
              बॅनरचा प्रकार निवडा (Choose Banner Style):
            </label>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: slideBannerMode === 'standard' ? 700 : 500, fontSize: '0.88rem' }}>
                <input
                  type="radio"
                  name="bannerMode"
                  value="standard"
                  checked={slideBannerMode === 'standard'}
                  onChange={() => setSlideBannerMode('standard')}
                />
                <span>📝 मजकूर + बॅकग्राउंड (Standard)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: slideBannerMode === 'full_photo' ? 700 : 500, fontSize: '0.88rem', color: 'var(--color-saffron-600)' }}>
                <input
                  type="radio"
                  name="bannerMode"
                  value="full_photo"
                  checked={slideBannerMode === 'full_photo'}
                  onChange={() => setSlideBannerMode('full_photo')}
                />
                <span>🖼️ केवळ पूर्ण फोटो / पोस्टर बॅनर (Plain Full Photo)</span>
              </label>
            </div>
            {slideBannerMode === 'full_photo' && (
              <p style={{ fontSize: '0.78rem', color: 'var(--color-maroon-800)', marginTop: '8px', marginBottom: 0, fontWeight: 600 }}>
                ✨ या मोडमध्ये होमपेजवर कोणताही मजकूर किंवा काळा थर न येता, तुमचा पूर्ण डिझाइन केलेला पोस्टर फोटो स्वच्छ दिसेल!
              </p>
            )}
          </div>

          {/* If Plain Full Photo mode is active, put the Photo Upload at top */}
          {slideBannerMode === 'full_photo' ? (
            <div className="form-group" style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--color-saffron-500)' }}>
              <label className="form-label form-label-required" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--color-maroon-800)', marginBottom: '4px' }}>
                <Camera size={16} color="var(--color-saffron-600)" />
                <span>पूर्ण बॅनर फोटो निवडा (Select Full Banner Image)</span>
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                उत्सवाचा संपूर्ण डिझाइन केलेला पोस्टर फोटो अपलोड करा.
              </p>

              {/* Photo Preview */}
              {slideImageUrl && (
                <div style={{ position: 'relative', marginBottom: '12px', width: 'fit-content' }}>
                  <div style={{
                    width: '320px',
                    height: '160px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '2px solid var(--color-gold-500)',
                    boxShadow: 'var(--shadow-md)',
                    backgroundColor: '#1a1a1a'
                  }}>
                    <img
                      src={slideImageUrl}
                      alt="Banner Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSlideImageUrl('')}
                    className="btn btn-danger btn-sm"
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}
                    title="फोटो काढून टाका"
                  >
                    <Trash2 size={12} />
                    <span>फोटो हटवा</span>
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <label
                  className="btn btn-primary btn-sm"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: 'var(--color-saffron-600)',
                    borderColor: 'var(--color-saffron-600)',
                    fontWeight: 700,
                    gap: '6px'
                  }}
                >
                  <Upload size={14} />
                  <span>{isUploadingSlideImage ? 'अपलोड होत आहे...' : '📸 कॉम्प्युटर/मोबाईलमधून फोटो निवडा'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSlideImageFileChange}
                    hidden
                    disabled={isUploadingSlideImage}
                  />
                </label>

                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>किंवा</span>

                <input
                  type="text"
                  className="form-input"
                  style={{ flex: '1', minWidth: '220px', fontSize: '0.85rem' }}
                  value={slideImageUrl.startsWith('data:') ? '(डिव्हाइसमधून फोटो निवडला आहे)' : slideImageUrl}
                  onChange={(e) => setSlideImageUrl(e.target.value)}
                  placeholder="किंवा फोटो लिंक (https://...)"
                  disabled={slideImageUrl.startsWith('data:')}
                />
              </div>
            </div>
          ) : null}

          <div className="form-group">
            <label className="form-label">{slideBannerMode === 'full_photo' ? 'मंत्र / ब्रीदवाक्य (ऐच्छिक)' : 'मंत्र / ब्रीदवाक्य (Top Badge)'}</label>
            <input
              type="text"
              className="form-input"
              value={slideBadge}
              onChange={(e) => setSlideBadge(e.target.value)}
              placeholder="उदा. ॥ उदो बोला उदो अंबाबाई माउलीचा हो ॥"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{slideBannerMode === 'full_photo' ? 'स्लाईड शीर्षक / ओळख (Title)' : 'स्लाईड मुख्य शीर्षक (Title) *'}</label>
            <input
              type="text"
              required={slideBannerMode !== 'full_photo'}
              className="form-input"
              value={slideTitleMarathi}
              onChange={(e) => setSlideTitleMarathi(e.target.value)}
              placeholder="उदा. दैनिक महाप्रसाद व अन्नदान वितरण"
            />
          </div>

          {/* Text & Content fields (Shown primarily for standard mode, optional for full_photo) */}
          {slideBannerMode === 'standard' && (
            <>
              <div className="form-group">
                <label className="form-label">ठळक वैशिष्ट्य / तारीख व वेळ (Highlight)</label>
                <input
                  type="text"
                  className="form-input"
                  value={slideHighlightMarathi}
                  onChange={(e) => setSlideHighlightMarathi(e.target.value)}
                  placeholder="उदा. दररोज दुपारी १२:०० व सायं. ०७:३० वाजता"
                />
              </div>

              <div className="form-group">
                <label className="form-label">वर्णन / संदेश (Description)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={slideDescMarathi}
                  onChange={(e) => setSlideDescMarathi(e.target.value)}
                  placeholder="स्लाईडवरील संपूर्ण संदेश प्रविष्ट करा..."
                />
              </div>

              {/* Banner Photo / Image Section for Standard Mode */}
              <div className="form-group" style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--color-maroon-800)', marginBottom: '4px' }}>
                  <Camera size={16} color="var(--color-saffron-600)" />
                  <span>बॅकग्राउंड फोटो (Optional Background Image)</span>
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                  मजकुराच्या बॅकग्राउंडसाठी देवीचा किंवा उत्सवाचा फोटो जोडा.
                </p>

                {/* Photo Preview if present */}
                {slideImageUrl && (
                  <div style={{ position: 'relative', marginBottom: '12px', width: 'fit-content' }}>
                    <div style={{
                      width: '260px',
                      height: '145px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '2px solid var(--color-gold-500)',
                      boxShadow: 'var(--shadow-sm)',
                      backgroundColor: '#1a1a1a'
                    }}>
                      <img
                        src={slideImageUrl}
                        alt="Banner Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSlideImageUrl('')}
                      className="btn btn-danger btn-sm"
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                      }}
                      title="फोटो काढून टाका"
                    >
                      <Trash2 size={12} />
                      <span>फोटो हटवा</span>
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                  <label
                    className="btn btn-secondary btn-sm"
                    style={{
                      cursor: 'pointer',
                      backgroundColor: '#ffffff',
                      borderColor: 'var(--color-maroon-300)',
                      color: 'var(--color-maroon-800)',
                      fontWeight: 600,
                      gap: '6px'
                    }}
                  >
                    <Upload size={14} />
                    <span>{isUploadingSlideImage ? 'अपलोड होत आहे...' : '📸 डिव्हाइसमधून फोटो निवडा'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSlideImageFileChange}
                      hidden
                      disabled={isUploadingSlideImage}
                    />
                  </label>

                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>किंवा</span>

                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: '1', minWidth: '220px', fontSize: '0.85rem' }}
                    value={slideImageUrl.startsWith('data:') ? '(डिव्हाइसमधून फोटो निवडला आहे)' : slideImageUrl}
                    onChange={(e) => setSlideImageUrl(e.target.value)}
                    placeholder="किंवा फोटो URL (https://...)"
                    disabled={slideImageUrl.startsWith('data:')}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">बटण १ मजकूर</label>
                  <input
                    type="text"
                    className="form-input"
                    value={slideBtn1Text}
                    onChange={(e) => setSlideBtn1Text(e.target.value)}
                    placeholder="उदा. ❤️ देणगी द्या"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">बटण २ मजकूर</label>
                  <input
                    type="text"
                    className="form-input"
                    value={slideBtn2Text}
                    onChange={(e) => setSlideBtn2Text(e.target.value)}
                    placeholder="उदा. 📅 कार्यक्रम पहा"
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
            <button
              type="button"
              onClick={() => {
                setIsEditSlideModalOpen(false);
                setEditingSlide(null);
              }}
              className="btn btn-secondary"
            >
              {t.admin.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={isSavingSlide}
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--color-maroon-700)', borderColor: 'var(--color-maroon-700)', fontWeight: 700 }}
            >
              {isSavingSlide ? 'बदल जतन होत आहेत...' : 'बदल जतन करा (Save Slide)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add New Hero Slide Modal */}
      <Modal
        isOpen={isAddSlideModalOpen}
        onClose={() => setIsAddSlideModalOpen(false)}
        title="➕ नवीन स्लाईड / बॅनर जोडा (Add New Banner Slide)"
        maxWidth="620px"
      >
        <form onSubmit={handleCreateSlideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Banner Display Mode Selector */}
          <div className="form-group" style={{ backgroundColor: 'var(--color-maroon-50)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-maroon-200)' }}>
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
              बॅनरचा प्रकार निवडा (Choose Banner Style):
            </label>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: newSlideBannerMode === 'standard' ? 700 : 500, fontSize: '0.88rem' }}>
                <input
                  type="radio"
                  name="newBannerMode"
                  value="standard"
                  checked={newSlideBannerMode === 'standard'}
                  onChange={() => setNewSlideBannerMode('standard')}
                />
                <span>📝 मजकूर + बॅकग्राउंड (Standard)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: newSlideBannerMode === 'full_photo' ? 700 : 500, fontSize: '0.88rem', color: 'var(--color-saffron-600)' }}>
                <input
                  type="radio"
                  name="newBannerMode"
                  value="full_photo"
                  checked={newSlideBannerMode === 'full_photo'}
                  onChange={() => setNewSlideBannerMode('full_photo')}
                />
                <span>🖼️ केवळ पूर्ण फोटो / पोस्टर बॅनर (Plain Full Photo)</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">स्लाईड मुख्य शीर्षक (Title) *</label>
            <input
              type="text"
              required
              className="form-input"
              value={newSlideTitleMarathi}
              onChange={(e) => setNewSlideTitleMarathi(e.target.value)}
              placeholder="उदा. महाप्रसाद व अन्नदान सेवा / सांस्कृतिक कार्यक्रम"
            />
          </div>

          <div className="form-group">
            <label className="form-label">मंत्र / ब्रीदवाक्य (Top Badge)</label>
            <input
              type="text"
              className="form-input"
              value={newSlideBadge}
              onChange={(e) => setNewSlideBadge(e.target.value)}
              placeholder="उदा. ॥ उदो बोला उदो अंबाबाई माउलीचा हो ॥"
            />
          </div>

          <div className="form-group">
            <label className="form-label">ठळक वैशिष्ट्य / तारीख व वेळ (Highlight)</label>
            <input
              type="text"
              className="form-input"
              value={newSlideHighlightMarathi}
              onChange={(e) => setNewSlideHighlightMarathi(e.target.value)}
              placeholder="उदा. ११ ऑक्टोबर ते २२ ऑक्टोबर २०२६ (विशेष सोहळा)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">वर्णन / संदेश (Description)</label>
            <textarea
              className="form-input"
              rows={3}
              value={newSlideDescMarathi}
              onChange={(e) => setNewSlideDescMarathi(e.target.value)}
              placeholder="स्लाईडवरील संदेश प्रविष्ट करा..."
            />
          </div>

          {/* Photo Upload */}
          <div className="form-group" style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--color-maroon-800)', marginBottom: '4px' }}>
              <Camera size={16} color="var(--color-saffron-600)" />
              <span>बॅनर फोटो निवडा (Upload Banner Image)</span>
            </label>

            {newSlideImageUrl && (
              <div style={{ position: 'relative', marginBottom: '12px', width: 'fit-content' }}>
                <div style={{
                  width: '260px',
                  height: '145px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '2px solid var(--color-gold-500)',
                  boxShadow: 'var(--shadow-sm)',
                  backgroundColor: '#1a1a1a'
                }}>
                  <img
                    src={newSlideImageUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setNewSlideImageUrl('')}
                  className="btn btn-danger btn-sm"
                  style={{ position: 'absolute', top: '6px', right: '6px', padding: '4px 8px', fontSize: '0.72rem' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <label
                className="btn btn-secondary btn-sm"
                style={{ cursor: 'pointer', backgroundColor: '#ffffff', borderColor: 'var(--color-maroon-300)', color: 'var(--color-maroon-800)', fontWeight: 600, gap: '6px' }}
              >
                <Upload size={14} />
                <span>📸 कॉम्प्युटर/मोबाईलमधून फोटो निवडा</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const compressed = await compressImageFile(file, 1200, 0.8);
                        setNewSlideImageUrl(compressed);
                      } catch {
                        const reader = new FileReader();
                        reader.onloadend = () => setNewSlideImageUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }
                  }}
                  hidden
                />
              </label>

              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>किंवा</span>

              <input
                type="text"
                className="form-input"
                style={{ flex: '1', minWidth: '220px', fontSize: '0.85rem' }}
                value={newSlideImageUrl.startsWith('data:') ? '(डिव्हाइसमधून फोटो निवडला आहे)' : newSlideImageUrl}
                onChange={(e) => setNewSlideImageUrl(e.target.value)}
                placeholder="किंवा फोटो URL (https://...)"
                disabled={newSlideImageUrl.startsWith('data:')}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">बटण १ मजकूर</label>
              <input
                type="text"
                className="form-input"
                value={newSlideBtn1Text}
                onChange={(e) => setNewSlideBtn1Text(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">बटण १ लिंक/कृती</label>
              <select
                className="form-select"
                value={newSlideBtn1ActionKey}
                onChange={(e) => setNewSlideBtn1ActionKey(e.target.value)}
              >
                <option value="donate">❤️ देणगी (Donate Page)</option>
                <option value="events">📅 कार्यक्रम (Events Page)</option>
                <option value="gallery">📸 फोटो गॅलरी (Gallery Page)</option>
                <option value="members">🪪 सभासद पोर्टल (Members)</option>
                <option value="about">ℹ️ मंडळाची माहिती (About)</option>
                <option value="contact">📞 संपर्क (Contact)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">बटण २ मजकूर</label>
              <input
                type="text"
                className="form-input"
                value={newSlideBtn2Text}
                onChange={(e) => setNewSlideBtn2Text(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">बटण २ लिंक/कृती</label>
              <select
                className="form-select"
                value={newSlideBtn2ActionKey}
                onChange={(e) => setNewSlideBtn2ActionKey(e.target.value)}
              >
                <option value="events">📅 कार्यक्रम (Events Page)</option>
                <option value="donate">❤️ देणगी (Donate Page)</option>
                <option value="gallery">📸 फोटो गॅलरी (Gallery Page)</option>
                <option value="members">🪪 सभासद पोर्टल (Members)</option>
                <option value="about">ℹ️ मंडळाची माहिती (About)</option>
                <option value="contact">📞 संपर्क (Contact)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
            <button
              type="button"
              onClick={() => setIsAddSlideModalOpen(false)}
              className="btn btn-secondary"
            >
              {t.admin.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={isSavingNewSlide}
              className="btn btn-saffron"
              style={{ fontWeight: 700, padding: '8px 20px' }}
            >
              {isSavingNewSlide ? 'सेव्ह होत आहे...' : '➕ नवीन स्લાઈड सेव्ह करा'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
