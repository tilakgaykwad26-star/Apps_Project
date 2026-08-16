export type SponsorTier = 'title' | 'platinum' | 'gold' | 'silver' | 'associate';

export interface Sponsor {
  id: string;
  name: string;
  nameMarathi?: string;
  businessType?: string;
  logoUrl: string;
  bannerUrl?: string;
  linkUrl?: string;
  tier: SponsorTier;
  activeFrom: string; // ISO date YYYY-MM-DD
  activeTo: string;   // ISO date YYYY-MM-DD
  isActive: boolean;
  contactPerson?: string;
  contactPhone?: string;
  createdAt: string;
}
