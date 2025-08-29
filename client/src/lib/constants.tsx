export const SERVICE_TIERS = {
  'table-top-small': {
    name: 'Table Top TV Installation (Up to 43")',
    price: 89,
    description: 'Basic table top installation for smaller TVs',
    icon: '📺',
    color: 'bg-blue-50 border-blue-200 text-blue-900',
  },
  'table-top-large': {
    name: 'Table Top TV Installation (43" and above)',
    price: 109,
    description: 'Table top installation for larger TVs',
    icon: '📺',
    color: 'bg-blue-50 border-blue-200 text-blue-900',
  },
  'bronze': {
    name: 'Bronze TV Mounting (up to 42")',
    price: 109,
    description: 'Fixed wall mounting for medium TVs',
    icon: '🥉',
    color: 'bg-amber-50 border-amber-200 text-amber-900',
  },
  'silver': {
    name: 'Silver TV Mounting (43-85")',
    price: 159,
    description: 'Tilting mount with cable management',
    icon: '🥈',
    color: 'bg-gray-50 border-gray-200 text-gray-900',
  },
  'silver-large': {
    name: 'Silver TV Mounting (85"+)',
    price: 259,
    description: 'Tilting mount for large TVs',
    icon: '🥈',
    color: 'bg-gray-50 border-gray-200 text-gray-900',
  },
  'gold': {
    name: 'Gold TV Mounting',
    price: 259,
    description: 'Full motion mount with premium features',
    icon: '🥇',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  },
  'gold-large': {
    name: 'Gold TV Mounting (85"+)',
    price: 359,
    description: 'Full motion mount for large TVs',
    icon: '🥇',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  },
} as const;

export const ADDON_SERVICES = {
  'cable-concealment': {
    name: 'Cable Concealment',
    description: 'Hide cables inside the wall for a clean look',
    price: 49,
    icon: '🔌',
  },
  'soundbar-install': {
    name: 'Soundbar Installation',
    description: 'Mount your soundbar below the TV',
    price: 39,
    icon: '🔊',
  },
  'calibration': {
    name: 'TV Calibration',
    description: 'Professional picture and sound optimization',
    price: 29,
    icon: '⚙️',
  },
} as const;

export const TV_SIZES = [
  { value: 32, label: '32"', category: 'Small' },
  { value: 43, label: '43"', category: 'Medium' },
  { value: 55, label: '55"', category: 'Large' },
  { value: 65, label: '65"', category: 'X-Large' },
  { value: 75, label: '75"', category: 'XX-Large' },
  { value: 85, label: '85"', category: 'Premium' },
] as const;

export const WALL_TYPES = [
  { value: 'drywall', label: 'Drywall', description: 'Most common interior wall type' },
  { value: 'concrete', label: 'Concrete', description: 'Solid masonry wall' },
  { value: 'brick', label: 'Brick', description: 'Traditional brick construction' },
  { value: 'other', label: 'Other', description: "We'll assess on-site" },
] as const;

export const MOUNT_TYPES = [
  {
    value: 'fixed',
    label: 'Fixed Mount',
    description: 'TV sits flat against the wall (most secure)',
    icon: '⬜',
  },
  {
    value: 'tilting',
    label: 'Tilting Mount',
    description: 'TV can tilt up and down for better viewing angles',
    icon: '📐',
  },
  {
    value: 'full-motion',
    label: 'Full Motion Mount',
    description: 'TV can swivel, tilt, and extend from wall',
    icon: '🔄',
  },
] as const;

export const TIME_SLOTS = [
  { value: '09:00', label: '9:00 AM - 11:00 AM' },
  { value: '11:00', label: '11:00 AM - 1:00 PM' },
  { value: '13:00', label: '1:00 PM - 3:00 PM' },
  { value: '15:00', label: '3:00 PM - 5:00 PM' },
  { value: '17:00', label: '5:00 PM - 7:00 PM' },
] as const;

export const BOOKING_STATUSES = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  assigned: { label: 'Assigned', color: 'bg-purple-100 text-purple-800' },
  in_progress: { label: 'In Progress', color: 'bg-orange-100 text-orange-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
} as const;
