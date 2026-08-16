import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole, Member } from '../types/auth';
import { SEED_MEMBERS } from '../utils/seedData';

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
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>;
  sendOtp: (phone: string) => Promise<boolean>;
  logout: () => void;
  switchRoleForDemo: (role: UserRole) => void;
  updateMemberProfile: (data: Partial<Member>) => Promise<boolean>;
}

const DEMO_USERS: Record<UserRole, { user: AppUser; member?: Member }> = {
  super_admin: {
    user: {
      uid: 'super-admin-01',
      phone: '9822000001',
      displayName: 'श्री. राजेश शिंदे (Super Admin)',
      role: 'super_admin',
      memberId: 'mem-1001',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString()
    },
    member: SEED_MEMBERS[0]
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
    // Default to Super Admin for complete out-of-the-box exploration
    return DEMO_USERS.super_admin.user;
  });

  const [memberProfile, setMemberProfile] = useState<Member | null>(() => {
    return SEED_MEMBERS[0];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('durga_mandal_user', JSON.stringify(user));
      // Link member if applicable
      const matched = SEED_MEMBERS.find((m) => m.phone === user.phone || m.id === user.memberId);
      setMemberProfile(matched || (user.role === 'member' ? SEED_MEMBERS[0] : null));
    } else {
      localStorage.removeItem('durga_mandal_user');
      setMemberProfile(null);
    }
  }, [user]);

  const sendOtp = async (phone: string): Promise<boolean> => {
    // In demo environment with Firebase Phone Auth simulation:
    console.log(`[AuthService] Generated 6-digit OTP 123456 for ${phone}`);
    return true;
  };

  const loginWithPhone = async (phone: string, otp: string): Promise<boolean> => {
    // In demo mode only accept the hardcoded OTP '123456'
    if (otp === '123456') {
      const cleanPhone = phone.replace(/\D/g, '');

      // Check if phone matches predefined admin roles
      if (cleanPhone === '9822000001' || cleanPhone.includes('000001')) {
        setUser(DEMO_USERS.super_admin.user);
        setMemberProfile(DEMO_USERS.super_admin.member || SEED_MEMBERS[0]);
        return true;
      }
      if (cleanPhone === '9822055667') {
        setUser(DEMO_USERS.treasurer.user);
        return true;
      }
      if (cleanPhone === '9822044556') {
        setUser(DEMO_USERS.committee_admin.user);
        return true;
      }

      const existingMember = SEED_MEMBERS.find((m) => m.phone.includes(cleanPhone));
      
      const newUser: AppUser = {
        uid: 'user_' + cleanPhone,
        phone: cleanPhone,
        displayName: existingMember ? existingMember.fullNameMarathi || existingMember.fullName : `सदस्य (${cleanPhone})`,
        role: 'member',
        memberId: existingMember ? existingMember.id : undefined,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      
      setUser(newUser);
      if (existingMember) {
        setMemberProfile(existingMember);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    // Setting user to null triggers the useEffect to remove the localStorage item
    setUser(null);
    setMemberProfile(null);
  };

  const switchRoleForDemo = (newRole: UserRole) => {
    const demo = DEMO_USERS[newRole];
    setUser(demo.user);
    setMemberProfile(demo.member || null);
  };

  const updateMemberProfile = async (data: Partial<Member>): Promise<boolean> => {
    if (!memberProfile) return false;
    const updated = { ...memberProfile, ...data, updatedAt: new Date().toISOString() };
    setMemberProfile(updated);
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
