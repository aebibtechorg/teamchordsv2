import { apiFetch } from "./api"

export type ChatwootConfig = {
  enabled: boolean
  baseUrl?: string | null
  websiteToken?: string | null
  position?: string | null
  hideMessageBubble?: boolean | null
  locale?: string | null
}

export type AdminBootstrap = {
  auth0Domain?: string | null
  auth0ClientId?: string | null
  auth0Audience?: string | null
  customerAppUrl?: string | null
  chatwoot: ChatwootConfig
}

export type AdminUserProfile = {
  id: string
  email?: string | null
  emailVerified?: boolean | null
  auth0UserId?: string | null
  name?: string | null
  givenName?: string | null
  familyName?: string | null
  picture?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type AdminClaim = {
  type: string
  value: string
}

export type AdminSession = {
  isPlatformAdmin: boolean
  isSupport: boolean
  roles: Array<string>
  user?: AdminUserProfile | null
  claims: Array<AdminClaim>
}

export type AdminSummary = {
  organizationCount: number
  paidOrganizationCount: number
  activeSubscriptionCount: number
  userCount: number
  membershipCount: number
  adminMembershipCount: number
}

export type AdminOrganization = {
  id: string
  ownerUserId?: string | null
  name?: string | null
  createdAt: string
  updatedAt?: string | null
  plan: string
  subscriptionStatus: string
  planExpiresAt?: string | null
  memberCount: number
  adminCount: number
}

export type AdminMember = {
  userId: string
  name?: string | null
  email?: string | null
  picture?: string | null
  role: string
  joinedAt: string
}

export type AdminOrganizationsResponse = {
  items: Array<AdminOrganization>
  total: number
  page: number
  pageSize: number
}

export type AdminMembersResponse = {
  items: Array<AdminMember>
  total: number
  page: number
  pageSize: number
}

export type LoadOrganizationsParams = {
  name?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export type LoadMembersParams = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

function resolveBaseUrl() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin
  }

  return 'http://localhost'
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = new URL(path, resolveBaseUrl())
  const response = await apiFetch(url, init)

  const payload = await response.text()
  if (!response.ok) {
    throw new Error(payload || `${response.status} ${response.statusText}`)
  }

  return (payload ? JSON.parse(payload) : null) as T
}

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    search.set(key, String(value))
  })
  return search.toString()
}

export function getCustomerAppUrl(path = '/') {
  const origin = resolveBaseUrl()
  const url = new URL(origin)
  const host = url.hostname

  if (host === 'admin') {
    url.hostname = 'localhost'
  } else if (host.startsWith('admin.')) {
    url.hostname = host.replace(/^admin\./, '')
  }

  url.pathname = path.startsWith('/') ? path : `/${path}`
  return url.toString()
}

export async function loadAdminBootstrap() {
  return requestJson<AdminBootstrap>('/api/admin/config')
}

export async function loadAdminSession() {
  return requestJson<AdminSession>('/api/admin/me')
}

export async function loadAdminSummary() {
  return requestJson<AdminSummary>('/api/admin/summary')
}

export async function loadOrganizations(params: LoadOrganizationsParams = {}) {
  const search = buildSearchParams(params)
  return requestJson<AdminOrganizationsResponse>(
    search ? `/api/admin/organizations?${search}` : '/api/admin/organizations',
  )
}

export async function loadOrganizationMembers(
  organizationId: string,
  params: LoadMembersParams = {},
) {
  const search = buildSearchParams(params)
  const path = `/api/admin/organizations/${organizationId}/members`
  return requestJson<AdminMembersResponse>(search ? `${path}?${search}` : path)
}


