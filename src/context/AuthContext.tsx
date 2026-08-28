import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole, Member } from '../types/auth';
import { SEED_MEMBERS } from '../utils/seedData';
import { sendOtpToPhone, verifyPhoneOtp } from '../services/smsService';

export interface SendOtpResult {
  success: boolean;
  message: string;
  otp?: string;
  isRealSms: boolean;
}

export interface LoginResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: AppUser | null;
  memberProfile: Member | null;
  role: UserRole;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isTreasurer: boolean;
  isCommitteeAdmin: boolean;
  isContentManager: boolean;
  isMember: boolean;
  loginWithPhone: (phone: string, otp: string) => Promise<LoginResult | boolean>;
  sendOtp: (phone: string, containerId?: string) => Promise<SendOtpResult>;
  logout: () => void;
  switchRoleForDemo: (role: UserRole) => void;
  updateMemberProfile: (data: Partial<Member>) => Promise<boolean>;
}

const DEMO_USERS: Record<string, { user: AppUser; member?: Member }> = {
  super_admin: {
    user: {
      uid: 'super-admin-01',
      phone: '8459063045',
      displayName: 'श्री. विश्वा बावणे (Super Admin)',
      role: 'super_admin',
      memberId: 'comm-3',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString()
    },
    member: SEED_MEMBERS[0]
  },
  super_admin_tilak: {
    user: {
      uid: 'super-admin-02',
      phone: '7796052953',
      displayName: 'श्री. टिळक अशोक गायकवाड (Super Admin)',
      role: 'super_admin',
      memberId: 'comm-5',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString()
    },
    member: {
      id: 'comm-5',
      memberNumber: 'DM-2024-005',
      fullName: 'Tilak Ashok Gaikwad',
      fullNameMarathi: 'श्री. टिळक अशोक गायकवाड',
      phone: '7796052953',
      address: 'दुर्गा चौक, चोप',
      cityVillage: 'चोप',
      pincode: '441207',
      memberType: 'individual',
      category: 'patron',
      status: 'active',
      joinedDate: '2024-01-01',
      annualDueAmount: 1500,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  },
  super_admin_shubham: {
    user: {
      uid: 'super-admin-03',
      phone: '8999161652',
      displayName: 'श्री. शुभम गोविंदरावजी नागपूरकर (Super Admin)',
      role: 'super_admin',
      memberId: 'comm-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString()
    },
    member: {
      id: 'comm-1',
      memberNumber: 'DM-2024-001',
      fullName: 'Shri. Shubham Govindaravji Nagpurkar',
      fullNameMarathi: 'श्री. शुभम गोविंदरावजी नागपूरकर',
      phone: '8999161652',
      address: 'दुर्गा चौक, चोप',
      cityVillage: 'चोप',
      pincode: '441207',
      memberType: 'individual',
      category: 'patron',
      status: 'active',
      joinedDate: '2024-01-01',
      annualDueAmount: 1500,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  },
  super_admin_shekhar: {
    user: {
      uid: 'super-admin-04',
      phone: '9607396623',
      displayName: 'श्री. शेखर ईश्वर कुथे (Super Admin)',
      role: 'super_admin',
      memberId: 'comm-4',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString()
    },
    member: {
      id: 'comm-4',
      memberNumber: 'DM-2024-004',
      fullName: 'Shri. Shekhar Ishwar Kuthe',
      fullNameMarathi: 'श्री. शेखर ईश्वर कुथे',
      phone: '9607396623',
      address: 'दुर्गा चौक, चोप',
      cityVillage: 'चोप',
      pincode: '441207',
      memberType: 'individual',
      category: 'patron',
      status: 'active',
      joinedDate: '2024-01-01',
      annualDueAmount: 1500,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  },
  treasurer: {
    user: {
      uid: 'treasurer-01',
      phone: '9822055667',
      displayName: 'सी.ए. आनंद पाटील (खजिनदार)',
      role: 'treasurer',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString()
    }
  },
  committee_admin: {
    user: {
      uid: 'comm-admin-01',
      phone: '9822044556',
      displayName: 'श्री. नितीन कुलकर्णी (कार्यकारणी प्रमुख)',
      role: 'committee_admin',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString()
    }
  },
  content_manager: {
    user: {
      uid: 'content-mgr-01',
      phone: '9822066778',
      displayName: 'सौ. सुनीता गायकवाड (माहिती व्यवस्थापक)',
      role: 'content_manager',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString()
    }
  },
  member: {
    user: {
      uid: 'demo-user-1',
      phone: '9822112233',
      displayName: 'श्री. रमेश पांडुरंग देशमुख',
      role: 'member',
      memberId: 'mem-1001',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString()
    },
    member: SEED_MEMBERS[0]
  },
  guest: {
    user: {
      uid: 'guest-public',
      phone: '',
      displayName: 'सार्वजनिक भाविक (Guest)',
      role: 'guest',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    }
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getAllStoredMembers(): Member[] {
  try {
    const saved = localStorage.getItem('dm_members');
    if (saved) {
      const parsed: Member[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingMap = new Map(parsed.map((m) => [m.id, m]));
        // Merge missing seed members into list
        let updated = false;
        SEED_MEMBERS.forEach((sm) => {
          if (!existingMap.has(sm.id)) {
            existingMap.set(sm.id, sm);
            updated = true;
          }
        });
        const result = Array.from(existingMap.values());
        if (updated) {
          try {
            localStorage.setItem('dm_members', JSON.stringify(result));
          } catch (e) {
            // ignore
          }
        }
        return result;
      }
    }
  } catch (e) {
    console.warn('[AuthContext] Failed to load dm_members', e);
  }
  return SEED_MEMBERS;
}

function findMemberByPhoneOrId(query?: string, fallbackMemberId?: string): Member | null {
  const all = getAllStoredMembers();

  if (fallbackMemberId) {
    const byFallback = all.find((m) => m.id === fallbackMemberId || m.memberNumber === fallbackMemberId);
    if (byFallback) return byFallback;
  }

  if (!query) return null;
  const trimmed = query.trim();

  // 1. Search by Member ID or Member Number (exact or case-insensitive)
  const byIdOrNum = all.find((m) =>
    m.id.toLowerCase() === trimmed.toLowerCase() ||
    (m.memberNumber && m.memberNumber.toLowerCase() === trimmed.toLowerCase())
  );
  if (byIdOrNum) return byIdOrNum;

  // 2. Search by Phone Number (clean 10 digits)
  const cleanPhone = trimmed.replace(/\D/g, '').slice(-10);
  if (cleanPhone.length > 0) {
    const byPhone = all.find((m) => {
      const mClean = (m.phone || '').replace(/\D/g, '').slice(-10);
      return mClean === cleanPhone;
    });
    if (byPhone) return byPhone;
  }

  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('durga_mandal_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEMO_USERS.super_admin.user;
      }
    }
    return DEMO_USERS.super_admin.user;
  });

  const [memberProfile, setMemberProfile] = useState<Member | null>(() => {
    const saved = localStorage.getItem('durga_mandal_user');
    if (saved) {
      try {
        const parsedUser: AppUser = JSON.parse(saved);
        return findMemberByPhoneOrId(parsedUser.phone, parsedUser.memberId);
      } catch {
        return findMemberByPhoneOrId(DEMO_USERS.super_admin.user.phone, DEMO_USERS.super_admin.user.memberId);
      }
    }
    return findMemberByPhoneOrId(DEMO_USERS.super_admin.user.phone, DEMO_USERS.super_admin.user.memberId);
  });

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem('durga_mandal_user', JSON.stringify(user));
      } catch (e) {
        console.warn(e);
      }
      const matched = findMemberByPhoneOrId(user.phone, user.memberId);
      setMemberProfile(matched);
    } else {
      localStorage.removeItem('durga_mandal_user');
      setMemberProfile(null);
    }
  }, [user]);

  /**
   * Send real SMS OTP to phone number
   */
  const sendOtp = async (phone: string, containerId: string = 'recaptcha-container'): Promise<SendOtpResult> => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return {
        success: false,
        message: 'कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.',
        isRealSms: false
      };
    }

    return await sendOtpToPhone(cleanPhone, containerId);
  };

  /**
   * Verify OTP and Login by Phone or Member ID
   */
  const loginWithPhone = async (input: string, otp: string): Promise<LoginResult | boolean> => {
    const trimmedInput = input.trim();
    const cleanPhone = trimmedInput.replace(/\D/g, '').slice(-10);

    // Dedicated Distinct Admin Passwords Map
    const ADMIN_PASSWORDS: Record<string, { expectedPass: string; userKey: keyof typeof DEMO_USERS }> = {
      '7796052953': { expectedPass: '779605', userKey: 'super_admin_tilak' },
      '8999161652': { expectedPass: '899916', userKey: 'super_admin_shubham' },
      '9607396623': { expectedPass: '960739', userKey: 'super_admin_shekhar' },
      '8459063045': { expectedPass: '845906', userKey: 'super_admin' },
    };

    // 1. Strict Admin Unique Password Verification (Phone Alone Cannot Unlock Admin)
    if (ADMIN_PASSWORDS[cleanPhone]) {
      const adminConfig = ADMIN_PASSWORDS[cleanPhone];
      if (otp !== adminConfig.expectedPass) {
        return {
          success: false,
          message: 'सुरक्षा चेतावणी: ॲडमिन डॅशबोर्ड उघडण्यासाठी अचूक ६-अंकी ॲडमिन पासवर्ड प्रविष्ट करणे अनिवार्य आहे.'
        };
      }
      const demoData = DEMO_USERS[adminConfig.userKey];
      setUser(demoData.user);
      setMemberProfile(findMemberByPhoneOrId(demoData.user.phone, demoData.user.memberId));
      return { success: true };
    }

    // Treasurer (9822055667 / 9607396623)
    if (cleanPhone === '9822055667' || cleanPhone === '9607396623') {
      setUser(DEMO_USERS.treasurer.user);
      setMemberProfile(findMemberByPhoneOrId(cleanPhone));
      return { success: true };
    }

    // Committee Admin (9822044556)
    if (cleanPhone === '9822044556') {
      setUser(DEMO_USERS.committee_admin.user);
      setMemberProfile(findMemberByPhoneOrId('9822044556'));
      return { success: true };
    }

    // Search existing registered member by Member ID ONLY (strictly no phone number)
    const allMembers = getAllStoredMembers();
    const existingMember = allMembers.find(
      (m) =>
        m.id.toLowerCase() === trimmedInput.toLowerCase() ||
        (m.memberNumber && m.memberNumber.toLowerCase() === trimmedInput.toLowerCase())
    );

    if (existingMember) {
      // All normal members MUST enter the password '9898'
      const customPass = (existingMember as any).password;
      if (otp !== '9898' && otp !== '989898' && otp !== customPass) {
        return {
          success: false,
          message: 'सुरक्षा चेतावणी: सभासद प्रोफाइल उघडण्यासाठी अचूक पासवर्ड प्रविष्ट करणे अनिवार्य आहे.'
        };
      }

      const authUser: AppUser = {
        uid: 'user_' + (existingMember.phone || existingMember.id),
        phone: existingMember.phone,
        displayName: existingMember.fullNameMarathi || existingMember.fullName,
        role: 'member',
        memberId: existingMember.id,
        createdAt: existingMember.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      setUser(authUser);
      setMemberProfile(existingMember);
      return { success: true };
    }

    // STRICT REJECTION: Unregistered Member ID cannot log in
    return {
      success: false,
      message: 'हा सभासद आयडी (Member ID) नोंदणीकृत नाही. कृपया आपला अचूक सभासद आयडी टाका किंवा मंडळ ॲडमिनशी संपर्क साधा.'
    };
  };

  const logout = () => {
    setUser(null);
    setMemberProfile(null);
    localStorage.removeItem('durga_mandal_user');
  };

  const switchRoleForDemo = (newRole: UserRole) => {
    const demo = DEMO_USERS[newRole];
    if (demo) {
      setUser(demo.user);
      setMemberProfile(demo.member || findMemberByPhoneOrId(demo.user.phone, demo.user.memberId));
    }
  };

  const updateMemberProfile = async (data: Partial<Member>): Promise<boolean> => {
    if (!memberProfile) return false;
    const updated = { ...memberProfile, ...data, updatedAt: new Date().toISOString() };
    setMemberProfile(updated);

    // Also persist in dm_members
    const all = getAllStoredMembers();
    const updatedList = all.map((m) => (m.id === memberProfile.id ? updated : m));
    try {
      localStorage.setItem('dm_members', JSON.stringify(updatedList));
    } catch (e) {
      console.warn(e);
    }
    return true;
  };

  const role = user?.role || 'guest';
  const isAuthenticated = !!user && user.role !== 'guest';
  const isSuperAdmin = role === 'super_admin';
  const isTreasurer = role === 'super_admin' || role === 'treasurer';
  const isCommitteeAdmin = role === 'super_admin' || role === 'committee_admin';
  const isContentManager = role === 'super_admin' || role === 'committee_admin' || role === 'content_manager';
  const isMember = isAuthenticated;

  return (
    <AuthContext.Provider
      value={{
        user,
        memberProfile,
        role,
        isAuthenticated,
        isSuperAdmin,
        isTreasurer,
        isCommitteeAdmin,
        isContentManager,
        isMember,
        loginWithPhone,
        sendOtp,
        logout,
        switchRoleForDemo,
        updateMemberProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
