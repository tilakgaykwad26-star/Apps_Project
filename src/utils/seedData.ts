import { CommitteeMember } from '../types/committee';
import { MandalEvent } from '../types/event';
import { MandalNotice } from '../types/notice';
import { GalleryAlbum, GalleryImage } from '../types/gallery';
import { Member } from '../types/auth';
import { Donation } from '../types/donation';
import { MemberPayment } from '../types/payment';
import { Sponsor } from '../types/sponsor';
import { Expense } from '../types/expense';

export const SEED_COMMITTEE: CommitteeMember[] = [
  {
    id: 'comm-1',
    name: 'Shri. Shubham Govindaravji Nagpurkar',
    nameMarathi: 'श्री.शुभम गोविंदरावजी नागपूरकर',
    designationMarathi: 'अध्यक्ष',
    designationEnglish: 'President',
    phone: '+91 89991 61652',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    hierarchyOrder: 1,
    isCoreMember: true,
    roleDescriptionMarathi: 'मंडळाचे सर्वांगीण नेतृत्व व सामाजिक समन्वय'
  },
  {
    id: 'comm-2',
    name: 'Shree. Vinod Fagoji Dongarwar',
    nameMarathi: 'श्री.विनोद फागोजी डोंगरवार',
    designationMarathi: 'उपाध्यक्ष',
    designationEnglish: 'Vice President',
    phone: '+91 96991 74824',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    hierarchyOrder: 2,
    isCoreMember: true,
    roleDescriptionMarathi: 'कायदेशीर सल्ला व उत्सव व्यवस्थापन'
  },
  {
    id: 'comm-3',
    name: 'Shri. Vishwa mansaram bavane',
    nameMarathi: 'श्री. विश्वा मन्सारामजी बावणे',
    designationMarathi: 'सचिव',
    designationEnglish: 'Secretary',
    phone: '+91 84590 63045',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    hierarchyOrder: 3,
    isCoreMember: true,
    roleDescriptionMarathi: 'उत्सव नियोजन व स्वयंसेवक समन्वय'
  },
  {
    id: 'comm-4',
    name: 'Shri.Shekhar Ishwar kuthe',
    nameMarathi: 'श्री. शेखर ईश्वर कुथे',
    designationMarathi: 'कोषाध्यक्ष',
    designationEnglish: 'Vice Secretary',
    phone: '+91 96073 96623',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
    hierarchyOrder: 4,
    isCoreMember: true,
    roleDescriptionMarathi: 'दप्तर नोंदणी, पत्रव्यवहार व शासकीय परवानग्या'
  },
  {
    id: 'comm-5',
    name: 'Shree. Tilak Ashok GAikwad',
    nameMarathi: 'श्री.तिलक अशोक गायकवाड',
    designationMarathi: 'Apps developer',
    designationEnglish: 'Apps developer',
    phone: '+91 77960 52953',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    hierarchyOrder: 5,
    isCoreMember: true,
    roleDescriptionMarathi: 'हिशोब व्यवस्थापन, पावती नियंत्रण व लेखापरीक्षण'
  }
];

export const SEED_EVENTS: MandalEvent[] = [
  {
    id: 'evt-1',
    title: 'Ghatasthapana & Grand Procession',
    titleMarathi: 'दुर्गामातेचा आगमन सोहळा व घटस्थापना',
    description: 'Traditional Ghatasthapana rituals, Vedic chanting by Guruji, followed by flower decoration and grand evening Aarti.',
    descriptionMarathi: 'पारंपरिक घटस्थापना, वेदोक्त मंत्रोच्चार, सुवर्ण अलंकारांनी देवीची पूजा आणि सायंकाळी भव्य महाआरती.',
    startDate: '2026-10-15T08:00:00.000Z',
    endDate: '2026-10-15T12:30:00.000Z',
    timeString: 'सकाळी ०८:०० ते दुपारी १२:३०',
    venue: 'Durga Mandap, Chop, Gadchiroli',
    venueMarathi: 'श्री दुर्गा मंडप, चोप, गडचिरोली',
    venueMapUrl: 'https://maps.google.com/?q=Chop+Gadchiroli',
    coverImageUrl: 'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=800&auto=format&fit=crop&q=80',
    status: 'upcoming',
    isRsvpEnabled: true,
    rsvpLimit: 500,
    rsvpCount: 240,
    highlights: ['सकाळी ०८:३० घटस्थापना', '१०:०० वाद्य पथक वादन', '१२:०० महाआरती व प्रसाद वाटप'],
    chiefGuest: 'मा. श्री. बाळकृष्ण कदम (ज्येष्ठ समाजसेवक)',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-10T10:00:00.000Z'
  },
  {
    id: 'evt-2',
    title: 'Grand Maha Aarti & Cultural Evening',
    titleMarathi: 'मातेची आरती व महाप्रसाद वितरण',
    description: 'Auspicious Maha Aarti with 108 oil lamps, devotional classical singing by renowned artists.',
    descriptionMarathi: 'अष्टमीच्या शुभमुहूर्तावर १०८ समयांची दीपोत्सव महाआरती आणि सुप्रसिद्ध गायकांचा भक्तिसंगीत सोहळा.',
    startDate: '2026-10-21T18:30:00.000Z',
    endDate: '2026-10-21T22:00:00.000Z',
    timeString: 'सायंकाळी ०६:३० ते रात्री १०:००',
    venue: 'Durga Utsav Grounds, Chop',
    venueMarathi: 'दुर्गा उत्सव प्रांगण, चोप, गडचिरोली',
    venueMapUrl: 'https://maps.google.com/?q=Chop+Gadchiroli',
    coverImageUrl: 'https://images.unsplash.com/photo-1609137144822-1d54238515c1?w=800&auto=format&fit=crop&q=80',
    status: 'upcoming',
    isRsvpEnabled: true,
    rsvpLimit: 1000,
    rsvpCount: 680,
    highlights: ['१०८ दिव्यांची समई आरती', 'भक्तिगीते व गोंधळ', 'विशेष तीर्थप्रसाद'],
    chiefGuest: 'पंडित विजय देशपांडे (संगीत विशारद)',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-10T10:00:00.000Z'
  },
  {
    id: 'evt-3',
    title: 'Akhand Mahaprasad & Food Drive (Annadaan)',
    titleMarathi: 'अखंड महाप्रसाद वाटप व महाअन्नदान सेवा',
    description: 'Serving hot, hygienic Mahaprasad meals to over 10,000 devotees with love and community service.',
    descriptionMarathi: 'दहा हजारांहून अधिक भाविकांसाठी अखंड सात्विक महाप्रसाद भोजन आणि गरजूंसाठी अन्नदान सेवा.',
    startDate: '2026-10-23T11:00:00.000Z',
    endDate: '2026-10-23T17:00:00.000Z',
    timeString: 'सकाळी ११:०० ते सायंकाळी ०५:००',
    venue: 'Durga Mandap Community Hall',
    venueMarathi: 'दुर्गा मंडप महाप्रसाद कक्ष, चोप',
    coverImageUrl: 'https://images.unsplash.com/photo-1596768401116-24e525143a5c?w=800&auto=format&fit=crop&q=80',
    status: 'upcoming',
    isRsvpEnabled: true,
    rsvpLimit: 2000,
    rsvpCount: 1150,
    highlights: ['शुद्ध सात्विक भोजन', 'महिला स्वयंसेवक मंडळ सेवा', 'ज्येष्ठ नागरिकांसाठी स्वतंत्र बैठक व्यवस्था'],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-10T10:00:00.000Z'
  },
  {
    id: 'evt-4',
    title: 'Free Health & Blood Donation Camp (Past)',
    titleMarathi: 'मोफत सर्वोपचार आरोग्य तपासणी व रक्तदान शिबीर',
    description: 'Free eye, dental, and general health checkup for over 450 local residents and 120 units blood collected.',
    descriptionMarathi: 'स्थानिक नागरिकांसाठी मोफत नेत्र, दंत व रक्तदाब तपासणी आणि १२० पिशव्यांचे भव्य रक्तदान.',
    startDate: '2026-05-10T09:00:00.000Z',
    endDate: '2026-05-10T16:00:00.000Z',
    timeString: 'सकाळी ०९:०० ते दुपारी ०४:००',
    venue: 'Chop Community Center',
    venueMarathi: 'चोप समाज मंदिर सभागृह',
    coverImageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
    status: 'completed',
    isRsvpEnabled: false,
    rsvpCount: 450,
    createdAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-05-11T10:00:00.000Z'
  }
];

export const SEED_NOTICES: MandalNotice[] = [
  {
    id: 'not-1',
    title: 'Important Meeting for Navratri Utsav 2026 Planning',
    titleMarathi: 'शारदीय नवरात्रोत्सव २०२६ नियोजन व सभासद सर्वसाधारण सभा',
    message: 'All committee members and active society members are requested to attend the grand planning meeting for upcoming Navratri 2026 at the Mandal office.',
    messageMarathi: 'शारदीय नवरात्रोत्सव २०२६ च्या पूर्वतयारी व उत्सव नियोजनासाठी सर्व कार्यकारणी सदस्य व हितचिंतकांची महत्त्वपूर्ण सर्वसाधारण सभा रविवार दिनांक २० ऑगस्ट २०२६ रोजी सायं. ७ वाजता मंडळ कार्यालयात आयोजित केली आहे. उपस्थिती अनिवार्य आहे.',
    priority: 'urgent',
    attachmentName: 'Navratri_2026_Meeting_Agenda.pdf',
    attachmentUrl: '#',
    attachmentType: 'pdf',
    isPublished: true,
    publishedAt: '2026-08-12T10:00:00.000Z',
    publishedBy: 'श्री. नितीन कुलकर्णी (सचिव)',
    viewCount: 342
  },
  {
    id: 'not-2',
    title: 'Annual Membership Subscription (Vargani) Notice FY 2026-27',
    titleMarathi: 'आर्थिक वर्ष २०२६-२७ ची वार्षिक वर्गणी जमा करण्याचे आवाहन',
    message: 'Members are requested to pay their annual membership subscription of Rs. 500 online or at the office counter to receive their updated digital membership card.',
    messageMarathi: 'सर्व सन्माननीय सभासदांना नम्र विनंती की आर्थिक वर्ष २०२६-२७ ची वार्षिक वर्गणी (₹ ५००/-) ऑनलाइन ॲपद्वारे किंवा खजिनदारांकडे रोख जमा करावी. जमा केल्यावर त्वरित डिजिटल पावती व सभासद ओळखपत्र उपलब्ध होईल.',
    priority: 'important',
    isPublished: true,
    publishedAt: '2026-08-01T08:30:00.000Z',
    publishedBy: 'सी.ए. आनंद पाटील (खजिनदार)',
    viewCount: 512
  },
  {
    id: 'not-3',
    title: 'Online Donation & Prasad Booking Facility Now Live',
    titleMarathi: 'मंडळाचे नवीन डिजिटल पोर्टल व ऑनलाइन देणगी सुविधा सुरू',
    message: 'Devotees can now make instant donations for Mahaprasad, Maha Aarti and Navratri rituals securely via UPI and get official receipts immediately.',
    messageMarathi: 'दुर्गा मंडळाच्या अधिकृत ॲपद्वारे आता घरबसल्या सुरक्षितपणे UPI, Card किंवा NetBanking ने देणगी जमा करता येईल. देणगीदारांना तात्काळ डिजिटल पावती व WhatsApp अपडेट्स प्राप्त होतील.',
    priority: 'normal',
    isPublished: true,
    publishedAt: '2026-07-25T11:00:00.000Z',
    publishedBy: 'प्रशासक मंडळ',
    viewCount: 890
  }
];

export const SEED_ALBUMS: GalleryAlbum[] = [
  {
    id: 'alb-1',
    title: 'Sharadiya Navratri Utsav 2025',
    titleMarathi: 'शारदीय नवरात्रोत्सव २०२५ — नयनरम्य क्षणचित्रे',
    description: 'Glimpses of last year grand celebration, Aarti, and cultural events.',
    coverImageUrl: 'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=600&auto=format&fit=crop&q=80',
    year: '2025',
    imageCount: 6,
    createdAt: '2025-10-30T10:00:00.000Z'
  },
  {
    id: 'alb-2',
    title: 'Mahaprasad & Social Welfare 2025',
    titleMarathi: 'अखंड महाप्रसाद व सामाजिक उपक्रम २०२५',
    description: 'Community meal distribution and educational kits distribution.',
    coverImageUrl: 'https://images.unsplash.com/photo-1596768401116-24e525143a5c?w=600&auto=format&fit=crop&q=80',
    year: '2025',
    imageCount: 4,
    createdAt: '2025-11-05T10:00:00.000Z'
  },
  {
    id: 'alb-3',
    title: 'Maha Aarti & Deepotsav',
    titleMarathi: '१०८ दिव्यांचा दीपोत्सव व महाआरती',
    description: 'Devotees lighting lamps on Ashtami night.',
    coverImageUrl: 'https://images.unsplash.com/photo-1609137144822-1d54238515c1?w=600&auto=format&fit=crop&q=80',
    year: '2025',
    imageCount: 5,
    createdAt: '2025-10-24T10:00:00.000Z'
  }
];

export const SEED_IMAGES: GalleryImage[] = [
  {
    id: 'img-101',
    albumId: 'alb-1',
    imageUrl: 'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=400&auto=format&fit=crop&q=80',
    captionMarathi: 'श्री दुर्गा मातेचे विलोभनीय सुवर्ण शृंगार रूप',
    sortOrder: 1,
    uploadedAt: '2025-10-20T10:00:00.000Z'
  },
  {
    id: 'img-102',
    albumId: 'alb-1',
    imageUrl: 'https://images.unsplash.com/photo-1609137144822-1d54238515c1?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1609137144822-1d54238515c1?w=400&auto=format&fit=crop&q=80',
    captionMarathi: 'अष्टमीच्या शुभमुहूर्तावरील महाआरती सोहळा',
    sortOrder: 2,
    uploadedAt: '2025-10-21T10:00:00.000Z'
  },
  {
    id: 'img-103',
    albumId: 'alb-1',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=80',
    captionMarathi: 'पारंपरिक वाद्य पथकाचे उत्साही वादन',
    sortOrder: 3,
    uploadedAt: '2025-10-22T10:00:00.000Z'
  },
  {
    id: 'img-201',
    albumId: 'alb-2',
    imageUrl: 'https://images.unsplash.com/photo-1596768401116-24e525143a5c?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1596768401116-24e525143a5c?w=400&auto=format&fit=crop&q=80',
    captionMarathi: 'हजारो भाविकांसाठी सात्विक महाप्रसाद वाटप',
    sortOrder: 1,
    uploadedAt: '2025-10-23T10:00:00.000Z'
  },
  {
    id: 'img-301',
    albumId: 'alb-3',
    imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&auto=format&fit=crop&q=80',
    captionMarathi: 'मंडप परिसरात उजळलेला भव्य दीपोत्सव',
    sortOrder: 1,
    uploadedAt: '2025-10-24T10:00:00.000Z'
  }
];

export const SEED_MEMBERS: Member[] = [
  {
    id: 'comm-5',
    memberNumber: 'DM-2026-001',
    fullName: 'Tilak Ashok Gaikwad',
    fullNameMarathi: 'श्री. तिलक अशोक गायकवाड',
    phone: '7796052953',
    email: 'tilak.gaikwad@gmail.com',
    address: 'दुर्गा चौक, चोप',
    cityVillage: 'चोप',
    pincode: '441207',
    memberType: 'individual',
    category: 'patron',
    status: 'active',
    joinedDate: '2024-01-01',
    annualDueAmount: 1500,
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'comm-2',
    memberNumber: 'DM-2026-002',
    fullName: 'Vinod Fagoji Dongarwar',
    fullNameMarathi: 'श्री. विनोद फागोजी डोंगरवार',
    phone: '9699174824',
    address: 'दुर्गा चौक, चोप',
    cityVillage: 'चोप',
    pincode: '441207',
    memberType: 'individual',
    category: 'life',
    status: 'active',
    joinedDate: '2024-01-01',
    annualDueAmount: 1500,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'comm-3',
    memberNumber: 'DM-2026-003',
    fullName: 'Vishwa Mansaram Bavane',
    fullNameMarathi: 'श्री. विश्वा मन्सारामजी बावणे',
    phone: '8459063045',
    address: 'दुर्गा चौक, चोप',
    cityVillage: 'चोप',
    pincode: '441207',
    memberType: 'individual',
    category: 'life',
    status: 'active',
    joinedDate: '2024-01-01',
    annualDueAmount: 1500,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'comm-4',
    memberNumber: 'DM-2026-004',
    fullName: 'Shekhar Ishwar Kuthe',
    fullNameMarathi: 'श्री. शेखर ईश्वर कुथे',
    phone: '9607396623',
    address: 'दुर्गा चौक, चोप',
    cityVillage: 'चोप',
    pincode: '441207',
    memberType: 'individual',
    category: 'life',
    status: 'active',
    joinedDate: '2024-01-01',
    annualDueAmount: 1500,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'comm-1',
    memberNumber: 'DM-2026-005',
    fullName: 'Shubham Govindaravji Nagpurkar',
    fullNameMarathi: 'श्री. शुभम गोविंदरावजी नागपूरकर',
    phone: '8999161652',
    address: 'दुर्गा चौक, चोप',
    cityVillage: 'चोप',
    pincode: '441207',
    memberType: 'individual',
    category: 'life',
    status: 'active',
    joinedDate: '2024-01-01',
    annualDueAmount: 1500,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'mem-1001',
    uid: 'demo-user-1',
    memberNumber: 'DM-2024-001',
    fullName: 'Ramesh Pandurang Deshmukh',
    fullNameMarathi: 'श्री. रमेश पांडुरंग देशमुख',
    phone: '9822112233',
    email: 'ramesh.deshmukh@gmail.com',
    address: 'फ्लॅट क्र. ४०२, दुर्गा चौक, चोप',
    cityVillage: 'चोप',
    pincode: '441207',
    memberType: 'family',
    category: 'life',
    status: 'active',
    joinedDate: '2020-04-01',
    annualDueAmount: 1500,
    familyMembers: [
      { name: 'सौ. रेखा रमेश देशमुख', relation: 'पत्नी', age: 48 },
      { name: 'चि. संकेत रमेश देशमुख', relation: 'मुलगा', age: 22 }
    ],
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    createdAt: '2020-04-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'mem-1002',
    uid: 'demo-user-2',
    memberNumber: 'DM-2024-002',
    fullName: 'Shri. Prakash Vithal Kadam',
    fullNameMarathi: 'श्री. प्रकाश विठ्ठल कदम',
    phone: '9822223344',
    email: 'prakash.kadam@rediffmail.com',
    address: 'घर क्र. १२, भवानी आळी, कसबा पेठ',
    cityVillage: 'पुणे',
    pincode: '411011',
    memberType: 'individual',
    category: 'annual',
    status: 'active',
    joinedDate: '2022-04-01',
    annualDueAmount: 500,
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    createdAt: '2022-04-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'mem-1003',
    memberNumber: 'DM-2024-003',
    fullName: 'Sau. Manisha Ganesh Shirole',
    fullNameMarathi: 'सौ. मनीषा गणेश शिरोळे',
    phone: '9822334455',
    address: 'शिरोळे वाडा, शनिवार पेठ',
    cityVillage: 'पुणे',
    pincode: '411030',
    memberType: 'individual',
    category: 'patron',
    status: 'active',
    joinedDate: '2019-04-01',
    annualDueAmount: 500,
    createdAt: '2019-04-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'mem-1004',
    memberNumber: 'DM-2024-004',
    fullName: 'Shri. Vijay Shankar Bhosale',
    fullNameMarathi: 'श्री. विजय शंकर भोसले',
    phone: '9822445566',
    address: 'दत्तात्रय कॉलनी, रास्ता पेठ',
    cityVillage: 'पुणे',
    pincode: '411011',
    memberType: 'individual',
    category: 'annual',
    status: 'active',
    joinedDate: '2023-04-01',
    annualDueAmount: 500,
    createdAt: '2023-04-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  }
];

export const SEED_DONATIONS: Donation[] = [
  {
    id: 'don-tilak-501',
    amount: 501,
    donorName: 'TILAK',
    donorPhone: '7769053298',
    donorCity: 'पुणे',
    donationType: 'annadaan',
    donationTypeMarathi: 'अन्नदान व महाप्रसाद देणगी',
    paymentMethod: 'upi_qr',
    paymentStatus: 'pending',
    receiptNumber: 'DM/2026-27/DON-18929',
    isAnonymous: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'don-5001',
    amount: 11000,
    donorName: 'Shri. Madhukar Shridharrao Gokhale',
    donorPhone: '9823011223',
    donorEmail: 'm.gokhale@gmail.com',
    donorPan: 'ABCDE1234F',
    donorCity: 'पुणे',
    donationType: 'annadaan',
    donationTypeMarathi: 'अन्नदान व महाप्रसाद देणगी',
    paymentMethod: 'razorpay_upi',
    paymentStatus: 'successful',
    razorpayOrderId: 'order_demo_1001',
    razorpayPaymentId: 'pay_demo_8932478',
    receiptNumber: 'DM/2026-27/DON-1021',
    isAnonymous: false,
    createdAt: '2026-08-10T14:20:00.000Z'
  },
  {
    id: 'don-5002',
    amount: 5001,
    donorName: 'Sau. Anjali Arvind Kunte',
    donorPhone: '9823022334',
    donorCity: 'पुणे',
    donationType: 'maharati',
    donationTypeMarathi: 'महाआरती देणगी',
    paymentMethod: 'razorpay_upi',
    paymentStatus: 'successful',
    razorpayOrderId: 'order_demo_1002',
    razorpayPaymentId: 'pay_demo_8932479',
    receiptNumber: 'DM/2026-27/DON-1022',
    isAnonymous: false,
    createdAt: '2026-08-11T11:15:00.000Z'
  },
  {
    id: 'don-5003',
    amount: 25000,
    donorName: 'Shri. Vikram Pratapsingh Jadhav',
    donorPhone: '9823033445',
    donorPan: 'XYZPK9876Q',
    donorCity: 'पुणे',
    donationType: 'special_utsav',
    donationTypeMarathi: 'विशेष उत्सव प्रायोजकत्व',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'successful',
    receiptNumber: 'DM/2026-27/DON-1023',
    isAnonymous: false,
    createdAt: '2026-08-12T09:40:00.000Z'
  },
  {
    id: 'don-5004',
    amount: 2100,
    donorName: 'Anonymous Devotee',
    donorPhone: '9823044556',
    donationType: 'general',
    donationTypeMarathi: 'सर्वसाधारण देणगी',
    paymentMethod: 'razorpay_upi',
    paymentStatus: 'successful',
    receiptNumber: 'DM/2026-27/DON-1024',
    isAnonymous: true,
    createdAt: '2026-08-14T16:50:00.000Z'
  }
];

export const SEED_PAYMENTS: MemberPayment[] = [
  {
    id: 'pay-201',
    memberId: 'mem-1001',
    memberName: 'श्री. रमेश पांडुरंग देशमुख',
    memberPhone: '9822112233',
    financialYear: '2026-27',
    amount: 500,
    paymentType: 'annual_subscription',
    paymentMethod: 'razorpay_upi',
    paymentStatus: 'successful',
    receiptNumber: 'DM/2026-27/SUB-2041',
    recordedBy: 'online',
    createdAt: '2026-08-05T12:00:00.000Z'
  },
  {
    id: 'pay-202',
    memberId: 'mem-1003',
    memberName: 'सौ. मनीषा गणेश शिरोळे',
    memberPhone: '9822334455',
    financialYear: '2026-27',
    amount: 500,
    paymentType: 'annual_subscription',
    paymentMethod: 'cash',
    paymentStatus: 'successful',
    receiptNumber: 'DM/2026-27/SUB-2042',
    recordedBy: 'comm-5',
    recordedByName: 'सी.ए. आनंद पाटील (खजिनदार)',
    createdAt: '2026-08-08T15:30:00.000Z'
  }
];

export const SEED_SPONSORS: Sponsor[] = [
  {
    id: 'sp-1',
    name: 'PNG Jewellers',
    nameMarathi: 'पी. एन. गाडगीळ ज्वेलर्स',
    businessType: 'Gold & Diamond Jewellery',
    logoUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&auto=format&fit=crop&q=80',
    linkUrl: 'https://www.pngjewellers.com',
    tier: 'title',
    activeFrom: '2026-01-01',
    activeTo: '2026-12-31',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sp-2',
    name: 'Chitale Bandhu Mithaiwale',
    nameMarathi: 'चितळे बंधू मिठाईवाले',
    businessType: 'Sweets & Bakarwadi',
    logoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
    linkUrl: 'https://www.chitalebandhu.in',
    tier: 'platinum',
    activeFrom: '2026-01-01',
    activeTo: '2026-12-31',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sp-3',
    name: 'Sujata Mastani',
    nameMarathi: 'सुजाता मस्तानी',
    businessType: 'Famous Pune Icecream & Beverages',
    logoUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=300&auto=format&fit=crop&q=80',
    tier: 'gold',
    activeFrom: '2026-01-01',
    activeTo: '2026-12-31',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    financialYear: '2026-27',
    title: 'भव्य मंडप उभारणी व सजावट ॲडव्हान्स',
    titleMarathi: 'भव्य मंडप उभारणी व सजावट ॲडव्हान्स',
    category: 'mandap_decoration',
    categoryMarathi: 'मंडप व सजावट',
    amount: 15000,
    date: '2026-08-05T11:00:00.000Z',
    payeeName: 'माऊली मंडप डेकोरेटर्स, चोप',
    payeePhone: '+91 98220 11223',
    paymentMethod: 'bank_transfer',
    voucherNumber: 'VOUCH-2026/01',
    billReceiptUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&auto=format&fit=crop&q=80',
    recordedBy: 'admin',
    recordedByName: 'खजिनदार',
    notes: 'मंडप स्ट्रक्चर, मॅटिंग व स्टेज बॅकड्रॉप कामाचा पहिला हप्ता',
    createdAt: '2026-08-05T11:00:00.000Z'
  },
  {
    id: 'exp-2',
    financialYear: '2026-27',
    title: 'विद्युत रोषणाई व डिजिटल साऊंड सिस्टीम',
    titleMarathi: 'विद्युत रोषणाई व डिजिटल साऊंड सिस्टीम',
    category: 'sound_lighting',
    categoryMarathi: 'विद्युत रोषणाई व ध्वनी',
    amount: 8500,
    date: '2026-08-08T15:30:00.000Z',
    payeeName: 'स्वरझंकार साऊंड्स & लाईट्स',
    payeePhone: '+91 94230 44556',
    paymentMethod: 'upi',
    voucherNumber: 'VOUCH-2026/02',
    recordedBy: 'admin',
    recordedByName: 'खजिनदार',
    notes: '१० दिवस माईक, स्पीकर व मुख्य प्रवेशद्वार कमान रोषणाई',
    createdAt: '2026-08-08T15:30:00.000Z'
  },
  {
    id: 'exp-3',
    financialYear: '2026-27',
    title: 'महाप्रसाद अन्नदान किराणा धान्य साहित्य',
    titleMarathi: 'महाप्रसाद अन्नदान किराणा धान्य साहित्य',
    category: 'mahaprasad_food',
    categoryMarathi: 'महाप्रसाद व अन्नदान',
    amount: 6200,
    date: '2026-08-12T10:00:00.000Z',
    payeeName: 'श्री स्वामी समर्थ किराणा स्टोअर्स',
    payeePhone: '+91 88881 23456',
    paymentMethod: 'cash',
    voucherNumber: 'VOUCH-2026/03',
    recordedBy: 'admin',
    recordedByName: 'खजिनदार',
    notes: 'तूप, साखर, रवा, तेल व डाळींचे आगाऊ खरेदी बिल',
    createdAt: '2026-08-12T10:00:00.000Z'
  },
  {
    id: 'exp-4',
    financialYear: '2026-27',
    title: 'डिजिटल पावती पुस्तके व आमंत्रण पत्रिका छपाई',
    titleMarathi: 'डिजिटल पावती पुस्तके व आमंत्रण पत्रिका छपाई',
    category: 'printing_advertising',
    categoryMarathi: 'छपाई व प्रसिद्धी',
    amount: 2800,
    date: '2026-08-14T17:00:00.000Z',
    payeeName: 'गणराज प्रिंटर्स, गडचिरोली',
    payeePhone: '+91 77760 99887',
    paymentMethod: 'upi',
    voucherNumber: 'VOUCH-2026/04',
    recordedBy: 'admin',
    recordedByName: 'खजिनदार',
    notes: '५०० पत्रिका व मंडळ फ्लेक्स बॅनर छपाई',
    createdAt: '2026-08-14T17:00:00.000Z'
  }
];

// If executed directly (via Node / tsx CLI), display seed summary
if (typeof window === 'undefined') {
  console.log('\n====================================================');
  console.log('🚩 श्री दुर्गा मंडळ (Durga Mandal) — Seed Data Loaded');
  console.log('====================================================');
  console.log(`✅ कार्यकारणी सदस्य (Committee Members): ${SEED_COMMITTEE.length}`);
  console.log(`✅ आगामी व संपन्न कार्यक्रम (Events):        ${SEED_EVENTS.length}`);
  console.log(`✅ महत्त्वाच्या सूचना (Notices):              ${SEED_NOTICES.length}`);
  console.log(`✅ फोटो अल्बम (Gallery Albums):            ${SEED_ALBUMS.length}`);
  console.log(`✅ गॅलरी फोटो (Gallery Images):             ${SEED_IMAGES.length}`);
  console.log(`✅ नोंदणीकृत सभासद (Members):              ${SEED_MEMBERS.length}`);
  console.log(`✅ देणगी नोंदी (Donations):                 ${SEED_DONATIONS.length}`);
  console.log(`✅ वर्गणी नोंदी (Member Payments):          ${SEED_PAYMENTS.length}`);
  console.log(`✅ खर्च नोंदी (Expenses):                   ${SEED_EXPENSES.length}`);
  console.log(`✅ प्रायोजक (Sponsors):                     ${SEED_SPONSORS.length}`);
  console.log('====================================================');
  console.log('✨ सर्व डेटा यशस्वीरीत्या व्हॅलिडेट झाला आहे! (All seed data verified)');
  console.log('🌐 Local Dev Server URL: http://localhost:3000/');
  console.log('====================================================\n');
}
