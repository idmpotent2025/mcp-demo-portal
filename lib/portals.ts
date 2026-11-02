export type PortalSlug = 'bookkeeper' | 'autonavigator' | 'petadmin' | 'delegatedadmin'

export type Portal = {
  slug: PortalSlug
  label: string
  description: string
  mcpPath: string
  accent: string
  cardBg: string
  icon: string
  systemPrompt: string
  starterQuestions: string[]
}

export const PORTALS: Record<PortalSlug, Portal> = {
  bookkeeper: {
    slug: 'bookkeeper',
    label: 'Bookkeeper',
    description: 'Invoice management, member billing, and financial records',
    mcpPath: 'bookkeeper',
    accent: 'border-blue-500 hover:border-blue-400',
    cardBg: 'from-blue-950/40 to-gray-900',
    icon: '📒',
    systemPrompt: `You are a helpful bookkeeper AI assistant for a small business portal.
Available tools: listInvoices, addInvoice, deleteInvoice, payInvoice, rollbackDeleteInvoice, listMembers, addMember, removeMember.

Auth0 patterns demonstrated:
- listInvoices, addInvoice, listMembers, addMember: JWT bearer authentication
- deleteInvoice: CIBA push — sends a push notification to the user's Auth0 Guardian app for approval
- payInvoice: Token Vault — exchanges the user's token for a vaulted Google OAuth token to send a Gmail notification
- FGA: member management checks fine-grained authorization before adding/removing members

When users ask about invoices or members, use the available tools to fetch real data. Always confirm before destructive operations.`,
    starterQuestions: [
      'List all unpaid invoices',
      'Add a new invoice for Acme Corp for $1,250',
      'List current team members',
      'Delete invoice inv-003 — I want to see the CIBA push approval',
    ],
  },

  autonavigator: {
    slug: 'autonavigator',
    label: 'Auto Navigator',
    description: 'Search used cars, manage your wishlist, and apply for financing',
    mcpPath: 'autoMarket',
    accent: 'border-orange-500 hover:border-orange-400',
    cardBg: 'from-orange-950/40 to-gray-900',
    icon: '🚗',
    systemPrompt: `You are an Auto Navigator AI assistant for a used car marketplace (think CapitalOne Auto Navigator + Carvana).

Tools and their Auth0 patterns:
- searchCars, getCarDetails, autoMarketHelp: PUBLIC — no login required
- getWishlist: JWT bearer — reads the user's saved vehicles
- addToWishlist, removeFromWishlist: JWT + FGA — checks can_update on wishlist:default before modifying
- checkPreApproval: JWT + RFC 8693 On-Behalf-Of token exchange — swaps marketplace token for lender.autonav.com token with read:preapprovals scope
- submitLoanApplication: JWT + CIBA push — sends push notification to user's device to approve the loan submission
- scheduleTestDrive: JWT + Token Vault — Auth0 exchanges user's token for their vaulted Google OAuth token, then creates a Google Calendar event

For loan applications, let users know they'll receive a push notification to approve. For test drives, they need a connected Google account (Token Vault).`,
    starterQuestions: [
      'Search for used Honda Accords under $25,000',
      'Show me the details for the Tesla Model S',
      "What's in my wishlist?",
      'Check pre-approval for VIN 2HGFB2F5XEH123456 — I want to see the token exchange',
    ],
  },

  petadmin: {
    slug: 'petadmin',
    label: 'Pet Admin',
    description: 'Manage pet records, medications, and care schedules',
    mcpPath: 'petAdmin',
    accent: 'border-green-500 hover:border-green-400',
    cardBg: 'from-green-950/40 to-gray-900',
    icon: '🐾',
    systemPrompt: `You are a Pet Admin AI assistant for a pet care portal (PetSmart-style).

Use the available tools to manage pet records, medications, appointments, and refills. The tools demonstrate various Auth0 security patterns — JWT bearer, FGA, token exchange, and CIBA push for sensitive operations.

When managing medications or scheduling, confirm with users before any destructive actions. Some operations (like medication deletion) require CIBA push approval on the user's device.`,
    starterQuestions: [
      'What pets are registered?',
      'Show medications for all pets',
      'List upcoming appointments',
      "Request a refill for Max's medication",
    ],
  },

  delegatedadmin: {
    slug: 'delegatedadmin',
    label: 'Delegated Admin',
    description: 'Manage organization members, roles, and pending approvals',
    mcpPath: 'delegatedAdmin',
    accent: 'border-purple-500 hover:border-purple-400',
    cardBg: 'from-purple-950/40 to-gray-900',
    icon: '👥',
    systemPrompt: `You are a Delegated Admin AI assistant for an organization management portal.

All tools require a valid JWT with the org_admin role. Available operations: list members, invite new members, remove members, list pending approvals, approve or reject users.

Tools use Auth0 FGA to verify admin privileges before executing. Pending approval workflows demonstrate Auth0's organization invitation and approval flows.

When performing org management actions, confirm the intended change with the user before executing irreversible operations like member removal.`,
    starterQuestions: [
      'List all current organization members',
      'Show pending approval requests',
      'Invite user@example.com as a member',
      'Remove a member from the org',
    ],
  },
}

export function getPortal(slug: string): Portal | undefined {
  return PORTALS[slug as PortalSlug]
}

export function isValidPortal(slug: string): slug is PortalSlug {
  return slug in PORTALS
}

export const ALL_PORTALS = Object.values(PORTALS)
