export type TrustTier = 'Excellent' | 'Good' | 'Risky' | 'Unreliable';

export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  phone: string;
  trustScore: number;
  trustTier: TrustTier;
  paidOnTimePercent: number;
  winRate: number;
  totalContracts: number;
  wins: number;
  losses: number;
  pending: number;
  activeContracts?: number;
  disputes?: number;
  unpaidCount?: number;
  joinDate: string;
  badges: string[];
}

export interface Outcome {
  id: string;
  label: string;
  weight: number;
  entryCount: number;
  totalStake: number;
  percent: number;
}

export interface Contract {
  id: string;
  title: string;
  groupId: string;
  groupName: string;
  groupEmoji: string;
  status: 'open' | 'locked' | 'resolved';
  type: 'yes_no' | 'multi' | 'number' | 'time';
  creatorId: string;
  creatorName: string;
  outcomes: Outcome[];
  participantCount: number;
  stakeNote: string;
  entryDeadline: string;
  resolutionDeadline: string;
  winningOutcomeId?: string;
  rules?: string;
  source?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  activeContracts: number;
  totalContracts: number;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  name: string;
  avatar: string;
  trustScore: number;
  wins: number;
  rank: number;
}

export interface Payment {
  id: string;
  contractId: string;
  contractTitle: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: string;
  status: 'unpaid' | 'paid' | 'confirmed';
  dueDate: string;
  nudgeSentAt?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'contract_created' | 'entry_placed' | 'contract_resolved' | 'payment_confirmed' | 'badge_earned' | 'dispute_opened' | 'nudge_sent';
  actorName: string;
  actorAvatar: string;
  description: string;
  timestamp: string;
  contractId?: string;
  groupName?: string;
}

export interface TrustHistoryEntry {
  id: string;
  date: string;
  delta: number;
  reason: string;
  newScore: number;
}

export const MOCK_USERS: User[] = [
  {
    id: 'user-001',
    name: 'Jordan Reyes',
    handle: '@jreyes',
    avatar: 'JR',
    phone: '+1 (555) 001-0001',
    trustScore: 847,
    trustTier: 'Excellent',
    paidOnTimePercent: 96,
    winRate: 68,
    totalContracts: 34,
    wins: 23,
    losses: 8,
    pending: 3,
    joinDate: 'Jan 2025',
    badges: ['Perfect Payer', '5-Win Streak', 'Top Predictor', 'Group Creator', 'Excellent Tier'],
  },
  {
    id: 'user-002',
    name: 'Maya Chen',
    handle: '@mayac',
    avatar: 'MC',
    phone: '+1 (555) 001-0002',
    trustScore: 712,
    trustTier: 'Good',
    paidOnTimePercent: 88,
    winRate: 55,
    totalContracts: 22,
    wins: 12,
    losses: 8,
    pending: 2,
    joinDate: 'Feb 2025',
    badges: ['Perfect Payer', 'Zero Disputes'],
  },
  {
    id: 'user-003',
    name: 'Dante Williams',
    handle: '@dantew',
    avatar: 'DW',
    phone: '+1 (555) 001-0003',
    trustScore: 531,
    trustTier: 'Good',
    paidOnTimePercent: 74,
    winRate: 44,
    totalContracts: 18,
    wins: 8,
    losses: 9,
    pending: 1,
    joinDate: 'Mar 2025',
    badges: ['Group Creator'],
  },
  {
    id: 'user-004',
    name: 'Priya Nair',
    handle: '@priyan',
    avatar: 'PN',
    phone: '+1 (555) 001-0004',
    trustScore: 390,
    trustTier: 'Risky',
    paidOnTimePercent: 62,
    winRate: 38,
    totalContracts: 13,
    wins: 5,
    losses: 7,
    pending: 1,
    joinDate: 'Apr 2025',
    badges: [],
  },
  {
    id: 'user-005',
    name: 'Sam Torres',
    handle: '@samtor',
    avatar: 'ST',
    phone: '+1 (555) 001-0005',
    trustScore: 290,
    trustTier: 'Unreliable',
    paidOnTimePercent: 48,
    winRate: 31,
    totalContracts: 10,
    wins: 3,
    losses: 6,
    pending: 1,
    joinDate: 'Apr 2025',
    badges: [],
  },
];

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'contract-001',
    title: 'Will the Lakers make the playoffs this season?',
    groupId: 'group-001',
    groupName: 'Hoops Squad',
    groupEmoji: '🏀',
    status: 'open',
    type: 'yes_no',
    creatorId: 'user-001',
    creatorName: 'Jordan Reyes',
    outcomes: [
      { id: 'out-001a', label: 'Yes', weight: 0, entryCount: 7, totalStake: 175, percent: 64 },
      { id: 'out-001b', label: 'No', weight: 120, entryCount: 4, totalStake: 100, percent: 36 },
    ],
    participantCount: 11,
    stakeNote: '$25 entry per person via Venmo',
    entryDeadline: '2026-05-10T23:59:00Z',
    resolutionDeadline: '2026-06-30T23:59:00Z',
    rules: 'Must make top 8 in Western Conference standings.',
    source: 'NBA official standings',
    createdAt: '2026-04-20T10:00:00Z',
  },
  {
    id: 'contract-002',
    title: 'Who wins the office trivia night on May 15th?',
    groupId: 'group-002',
    groupName: 'Work Crew',
    groupEmoji: '💼',
    status: 'locked',
    type: 'multi',
    creatorId: 'user-002',
    creatorName: 'Maya Chen',
    outcomes: [
      { id: 'out-002a', label: 'Team Alpha', weight: -110, entryCount: 5, totalStake: 125, percent: 42 },
      { id: 'out-002b', label: 'Team Beta', weight: 120, entryCount: 4, totalStake: 100, percent: 33 },
      { id: 'out-002c', label: 'Team Gamma', weight: 250, entryCount: 3, totalStake: 75, percent: 25 },
    ],
    participantCount: 12,
    stakeNote: '$25 entry via Cash App',
    entryDeadline: '2026-05-14T20:00:00Z',
    resolutionDeadline: '2026-05-15T23:59:00Z',
    createdAt: '2026-04-25T14:00:00Z',
  },
  {
    id: 'contract-003',
    title: 'Will BTC close above $75k by end of May?',
    groupId: 'group-003',
    groupName: 'Crypto Bros',
    groupEmoji: '₿',
    status: 'resolved',
    type: 'yes_no',
    creatorId: 'user-003',
    creatorName: 'Dante Williams',
    outcomes: [
      { id: 'out-003a', label: 'Yes', weight: 120, entryCount: 6, totalStake: 150, percent: 55 },
      { id: 'out-003b', label: 'No', weight: -110, entryCount: 5, totalStake: 125, percent: 45 },
    ],
    participantCount: 11,
    stakeNote: '$25 entry via Venmo',
    entryDeadline: '2026-05-01T23:59:00Z',
    resolutionDeadline: '2026-05-31T23:59:00Z',
    winningOutcomeId: 'out-003b',
    createdAt: '2026-04-15T09:00:00Z',
  },
  {
    id: 'contract-004',
    title: 'How many goals will Mbappe score in May?',
    groupId: 'group-001',
    groupName: 'Hoops Squad',
    groupEmoji: '🏀',
    status: 'open',
    type: 'number',
    creatorId: 'user-001',
    creatorName: 'Jordan Reyes',
    outcomes: [
      { id: 'out-004a', label: '0–2 goals', weight: -110, entryCount: 3, totalStake: 75, percent: 30 },
      { id: 'out-004b', label: '3–5 goals', weight: 0, entryCount: 5, totalStake: 125, percent: 50 },
      { id: 'out-004c', label: '6+ goals', weight: 250, entryCount: 2, totalStake: 50, percent: 20 },
    ],
    participantCount: 10,
    stakeNote: '$25 entry per person',
    entryDeadline: '2026-05-08T23:59:00Z',
    resolutionDeadline: '2026-05-31T23:59:00Z',
    createdAt: '2026-04-28T11:00:00Z',
  },
  {
    id: 'contract-005',
    title: 'Will the Fed cut rates in June meeting?',
    groupId: 'group-002',
    groupName: 'Work Crew',
    groupEmoji: '💼',
    status: 'open',
    type: 'yes_no',
    creatorId: 'user-002',
    creatorName: 'Maya Chen',
    outcomes: [
      { id: 'out-005a', label: 'Yes, cut', weight: 120, entryCount: 8, totalStake: 200, percent: 62 },
      { id: 'out-005b', label: 'No change', weight: -110, entryCount: 5, totalStake: 125, percent: 38 },
    ],
    participantCount: 13,
    stakeNote: '$25 entry via Venmo',
    entryDeadline: '2026-06-10T23:59:00Z',
    resolutionDeadline: '2026-06-12T23:59:00Z',
    createdAt: '2026-04-30T16:00:00Z',
  },
  {
    id: 'contract-006',
    title: 'Who finishes top of the BBQ cook-off?',
    groupId: 'group-003',
    groupName: 'Crypto Bros',
    groupEmoji: '₿',
    status: 'resolved',
    type: 'multi',
    creatorId: 'user-003',
    creatorName: 'Dante Williams',
    outcomes: [
      { id: 'out-006a', label: 'Jordan', weight: 0, entryCount: 4, totalStake: 100, percent: 40 },
      { id: 'out-006b', label: 'Maya', weight: 120, entryCount: 3, totalStake: 75, percent: 30 },
      { id: 'out-006c', label: 'Dante', weight: 250, entryCount: 3, totalStake: 75, percent: 30 },
    ],
    participantCount: 10,
    stakeNote: '$25 entry via Cash App',
    entryDeadline: '2026-04-20T18:00:00Z',
    resolutionDeadline: '2026-04-21T22:00:00Z',
    winningOutcomeId: 'out-006a',
    createdAt: '2026-04-10T12:00:00Z',
  },
];

export const MOCK_GROUPS: Group[] = [
  {
    id: 'group-001',
    name: 'Hoops Squad',
    emoji: '🏀',
    memberCount: 8,
    activeContracts: 2,
    totalContracts: 12,
    createdAt: '2025-02-01',
    members: [
      { userId: 'user-001', name: 'Jordan Reyes', avatar: 'JR', trustScore: 847, wins: 23, rank: 1 },
      { userId: 'user-002', name: 'Maya Chen', avatar: 'MC', trustScore: 712, wins: 12, rank: 2 },
      { userId: 'user-003', name: 'Dante Williams', avatar: 'DW', trustScore: 531, wins: 8, rank: 3 },
      { userId: 'user-004', name: 'Priya Nair', avatar: 'PN', trustScore: 390, wins: 5, rank: 4 },
      { userId: 'user-005', name: 'Sam Torres', avatar: 'ST', trustScore: 290, wins: 3, rank: 5 },
    ],
  },
  {
    id: 'group-002',
    name: 'Work Crew',
    emoji: '💼',
    memberCount: 12,
    activeContracts: 2,
    totalContracts: 18,
    createdAt: '2025-03-15',
    members: [
      { userId: 'user-002', name: 'Maya Chen', avatar: 'MC', trustScore: 712, wins: 12, rank: 1 },
      { userId: 'user-001', name: 'Jordan Reyes', avatar: 'JR', trustScore: 847, wins: 23, rank: 2 },
      { userId: 'user-004', name: 'Priya Nair', avatar: 'PN', trustScore: 390, wins: 5, rank: 3 },
      { userId: 'user-005', name: 'Sam Torres', avatar: 'ST', trustScore: 290, wins: 3, rank: 4 },
    ],
  },
  {
    id: 'group-003',
    name: 'Crypto Bros',
    emoji: '₿',
    memberCount: 6,
    activeContracts: 0,
    totalContracts: 8,
    createdAt: '2025-04-01',
    members: [
      { userId: 'user-003', name: 'Dante Williams', avatar: 'DW', trustScore: 531, wins: 8, rank: 1 },
      { userId: 'user-001', name: 'Jordan Reyes', avatar: 'JR', trustScore: 847, wins: 23, rank: 2 },
      { userId: 'user-005', name: 'Sam Torres', avatar: 'ST', trustScore: 290, wins: 3, rank: 3 },
    ],
  },
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    contractId: 'contract-003',
    contractTitle: 'Will BTC close above $75k?',
    fromUserId: 'user-003',
    fromUserName: 'Dante Williams',
    toUserId: 'user-001',
    toUserName: 'Jordan Reyes',
    amount: '$25',
    status: 'unpaid',
    dueDate: '2026-05-07',
  },
  {
    id: 'pay-002',
    contractId: 'contract-006',
    contractTitle: 'BBQ cook-off winner',
    fromUserId: 'user-001',
    fromUserName: 'Jordan Reyes',
    toUserId: 'user-002',
    toUserName: 'Maya Chen',
    amount: '$50',
    status: 'paid',
    dueDate: '2026-04-28',
  },
  {
    id: 'pay-003',
    contractId: 'contract-006',
    contractTitle: 'BBQ cook-off winner',
    fromUserId: 'user-005',
    fromUserName: 'Sam Torres',
    toUserId: 'user-001',
    toUserName: 'Jordan Reyes',
    amount: '$25',
    status: 'confirmed',
    dueDate: '2026-04-28',
  },
];

export const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: 'act-001',
    type: 'entry_placed',
    actorName: 'Maya Chen',
    actorAvatar: 'MC',
    description: 'picked "Team Alpha" in Who wins office trivia?',
    timestamp: '2026-05-04T21:00:00Z',
    contractId: 'contract-002',
    groupName: 'Work Crew',
  },
  {
    id: 'act-002',
    type: 'contract_resolved',
    actorName: 'Dante Williams',
    actorAvatar: 'DW',
    description: 'resolved "Will BTC close above $75k?" — No wins',
    timestamp: '2026-05-04T18:30:00Z',
    contractId: 'contract-003',
    groupName: 'Crypto Bros',
  },
  {
    id: 'act-003',
    type: 'payment_confirmed',
    actorName: 'Sam Torres',
    actorAvatar: 'ST',
    description: 'confirmed $25 payment to Jordan Reyes',
    timestamp: '2026-05-04T15:00:00Z',
    contractId: 'contract-006',
    groupName: 'Hoops Squad',
  },
  {
    id: 'act-004',
    type: 'badge_earned',
    actorName: 'Jordan Reyes',
    actorAvatar: 'JR',
    description: 'earned the "5-Win Streak" badge 🏆',
    timestamp: '2026-05-03T20:00:00Z',
  },
  {
    id: 'act-005',
    type: 'contract_created',
    actorName: 'Jordan Reyes',
    actorAvatar: 'JR',
    description: 'created "Will the Lakers make the playoffs?"',
    timestamp: '2026-05-03T10:00:00Z',
    contractId: 'contract-001',
    groupName: 'Hoops Squad',
  },
  {
    id: 'act-006',
    type: 'nudge_sent',
    actorName: 'Jordan Reyes',
    actorAvatar: 'JR',
    description: 'nudged Dante Williams to pay $25',
    timestamp: '2026-05-02T14:00:00Z',
    contractId: 'contract-003',
  },
  {
    id: 'act-007',
    type: 'dispute_opened',
    actorName: 'Priya Nair',
    actorAvatar: 'PN',
    description: 'opened a dispute on "BBQ cook-off winner"',
    timestamp: '2026-05-01T09:00:00Z',
    contractId: 'contract-006',
  },
];

export const MOCK_TRUST_HISTORY: TrustHistoryEntry[] = [
  { id: 'th-001', date: '2026-05-04', delta: 15, reason: 'Won contract: Lakers playoffs', newScore: 847 },
  { id: 'th-002', date: '2026-05-03', delta: 10, reason: 'Payment confirmed on time', newScore: 832 },
  { id: 'th-003', date: '2026-04-30', delta: -30, reason: 'Payment overdue >7 days', newScore: 822 },
  { id: 'th-004', date: '2026-04-28', delta: 20, reason: 'Dispute resolved in your favor', newScore: 852 },
  { id: 'th-005', date: '2026-04-22', delta: 15, reason: 'Won contract: BBQ cook-off', newScore: 832 },
  { id: 'th-006', date: '2026-04-15', delta: 10, reason: 'Payment confirmed on time', newScore: 817 },
  { id: 'th-007', date: '2026-04-10', delta: -50, reason: 'Dispute lost', newScore: 807 },
  { id: 'th-008', date: '2026-04-05', delta: 15, reason: 'Won contract: Fed rate decision', newScore: 857 },
];

export const CURRENT_USER = MOCK_USERS[0];