import {
  LayoutDashboard, Users, Stethoscope, Wallet, UserCog, ScrollText,
} from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/treatments', label: 'Treatments', icon: Stethoscope },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/doctors', label: 'Doctors & Staff', icon: UserCog },
  { to: '/audit-log', label: 'Audit Log', icon: ScrollText },
];
