import { CalendarClock, CalendarDays, CreditCard, FileText, HandCoins, Home, Megaphone, Phone, Settings, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface SidebarNavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  disabled?: boolean
}

export interface SidebarNavSection {
  title: string
  items: SidebarNavItem[]
}

export const ADMIN_NAV_SECTIONS: SidebarNavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: Home },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
      { label: 'Events', href: '/admin/events', icon: CalendarDays },
      { label: 'Mass Times', href: '/admin/mass-times', icon: CalendarClock },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Mass Bookings', href: '/admin/mass-bookings', icon: FileText },
      { label: 'Donations', href: '/admin/donations', icon: HandCoins },
      { label: 'Payment Details', href: '/admin/payment-details', icon: CreditCard },
      { label: 'Contact Details', href: '/admin/contact-details', icon: Phone },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users & Admins', href: '/admin/users', icon: Users, badge: 'Soon', disabled: true },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
]
