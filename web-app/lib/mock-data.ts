export interface Announcement {
  id: string
  title: string
  content: string
  type: "liturgical" | "parish"
  createdAt: Date
  author: string
}

export interface Event {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  location: string
  capacity: number
  attendees: number
}

export interface MassTime {
  id: string
  day: string
  time: string
  type: string
}

export interface MassBooking {
  id: string
  userName: string
  intention: string
  massDate: Date
  status: "pending" | "approved" | "rejected"
  amount?: number
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "staff" | "parishioner"
  joinDate: Date
}

export interface ActivityLog {
  id: string
  action: string
  user: string
  timestamp: Date
  details?: string
}

// Mock Announcements
export const mockAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Palm Sunday Procession",
    content: "Join us for the annual Palm Sunday procession. We will gather at 9:00 AM for a blessed start to Holy Week.",
    type: "liturgical",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    author: "Fr. Joseph",
  },
  {
    id: "2",
    title: "Parish Fundraiser Success",
    content: "The annual Easter bake sale raised $3,500 for our youth ministry program. Thank you all for your generous support!",
    type: "parish",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    author: "Miriam",
  },
  {
    id: "3",
    title: "Reconciliation Hours Extended",
    content: "During Lent, confessions will be available Tuesday through Saturday from 4:00 to 6:00 PM.",
    type: "liturgical",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    author: "Fr. Joseph",
  },
]

// Mock Events
export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Holy Triduum Vigil",
    description: "The solemn celebration of the Easter Vigil with blessing of the fire and Easter candle lighting.",
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    location: "St. Kizito Church",
    capacity: 500,
    attendees: 340,
  },
  {
    id: "2",
    title: "Youth Ministry Retreat",
    description: "A weekend retreat for young adults featuring spiritual talks, team building, and fellowship.",
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
    location: "Mt. Carmel Retreat Center",
    capacity: 50,
    attendees: 38,
  },
  {
    id: "3",
    title: "Rosary Prayer Circle",
    description: "Gather for communal recitation of the rosary followed by light refreshments.",
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    location: "Parish Hall",
    capacity: 100,
    attendees: 42,
  },
]

// Mock Mass Times
export const mockMassTimes: MassTime[] = [
  { id: "1", day: "Sunday", time: "7:00 AM", type: "Low Mass" },
  { id: "2", day: "Sunday", time: "9:00 AM", type: "High Mass" },
  { id: "3", day: "Sunday", time: "11:00 AM", type: "Sung Mass" },
  { id: "4", day: "Sunday", time: "5:00 PM", type: "Vigil Mass" },
  { id: "5", day: "Monday", time: "8:00 AM", type: "Low Mass" },
  { id: "6", day: "Monday", time: "6:00 PM", type: "Evening Mass" },
  { id: "7", day: "Tuesday", time: "8:00 AM", type: "Low Mass" },
  { id: "8", day: "Tuesday", time: "6:00 PM", type: "Evening Mass" },
  { id: "9", day: "Wednesday", time: "8:00 AM", type: "Low Mass" },
  { id: "10", day: "Wednesday", time: "6:00 PM", type: "Evening Mass" },
  { id: "11", day: "Thursday", time: "8:00 AM", type: "Low Mass" },
  { id: "12", day: "Thursday", time: "6:00 PM", type: "Evening Mass" },
  { id: "13", day: "Friday", time: "8:00 AM", type: "Low Mass" },
  { id: "14", day: "Friday", time: "6:00 PM", type: "Evening Mass" },
  { id: "15", day: "Saturday", time: "8:00 AM", type: "Low Mass" },
  { id: "16", day: "Saturday", time: "5:00 PM", type: "Vigil Mass" },
]

// Mock Mass Bookings
export const mockMassBookings: MassBooking[] = [
  {
    id: "1",
    userName: "Margaret Smith",
    intention: "For the repose of the soul of John Smith (RIP)",
    massDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: "approved",
    amount: 25,
  },
  {
    id: "2",
    userName: "Thomas Joseph",
    intention: "Thanksgiving for safe travels",
    massDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: "pending",
    amount: 20,
  },
  {
    id: "3",
    userName: "Patricia Brown",
    intention: "For healing of Michael Brown",
    massDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "approved",
    amount: 30,
  },
  {
    id: "4",
    userName: "Robert Wilson",
    intention: "Happy birthday blessing for Sarah",
    massDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: "pending",
    amount: 15,
  },
]

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Fr. Joseph Williams",
    email: "fr.joseph@stkizito.com",
    role: "admin",
    joinDate: new Date("2022-01-15"),
  },
  {
    id: "2",
    name: "Miriam Santos",
    email: "miriam@stkizito.com",
    role: "staff",
    joinDate: new Date("2022-06-20"),
  },
  {
    id: "3",
    name: "David Chen",
    email: "david@stkizito.com",
    role: "staff",
    joinDate: new Date("2023-03-10"),
  },
  {
    id: "4",
    name: "Margaret Smith",
    email: "margaret.smith@email.com",
    role: "parishioner",
    joinDate: new Date("2023-09-05"),
  },
  {
    id: "5",
    name: "Thomas Joseph",
    email: "thomas.j@email.com",
    role: "parishioner",
    joinDate: new Date("2024-01-20"),
  },
]

// Mock Activity Log
export const mockActivityLog: ActivityLog[] = [
  {
    id: "1",
    action: "Created Announcement",
    user: "Miriam Santos",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    details: "Palm Sunday Procession",
  },
  {
    id: "2",
    action: "Approved Mass Booking",
    user: "Fr. Joseph Williams",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    details: "Margaret Smith - RIP John Smith",
  },
  {
    id: "3",
    action: "Updated Mass Times",
    user: "David Chen",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    details: "Tuesday Evening Mass rescheduled",
  },
  {
    id: "4",
    action: "Created Event",
    user: "Miriam Santos",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    details: "Holy Triduum Vigil",
  },
  {
    id: "5",
    action: "Added User",
    user: "Fr. Joseph Williams",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    details: "Thomas Joseph joined as parishioner",
  },
]
