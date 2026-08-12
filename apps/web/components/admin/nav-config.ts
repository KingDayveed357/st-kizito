import { CalendarClock, CalendarDays, CreditCard, FileText, HandCoins, Home, Images, Megaphone, MessageSquareQuote, Phone, ScrollText, Settings, SlidersHorizontal, Users } from 'lucide-react'
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
      { label: 'Gallery', href: '/admin/gallery', icon: Images },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Mass Bookings', href: '/admin/mass-bookings', icon: FileText },
      { label: 'Sacramental Requests', href: '/admin/sacrament-requests', icon: ScrollText },
      { label: 'Donations', href: '/admin/donations', icon: HandCoins },
      { label: 'Feedback Inbox', href: '/admin/feedback', icon: MessageSquareQuote },
      { label: 'Payment Details', href: '/admin/payment-details', icon: CreditCard },
      { label: 'Contact Details', href: '/admin/contact-details', icon: Phone },
    ],
  },
  {
    title: 'Administration',
    items: [
      // No longer "Soon": the page now manages the real `admin_users` roster that `is_admin()`
      // checks, and it is the only way to grant portal access without writing SQL.
      { label: 'Users & Admins', href: '/admin/users', icon: Users },
      { label: 'Sacrament Config', href: '/admin/sacrament-config', icon: SlidersHorizontal },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
]
