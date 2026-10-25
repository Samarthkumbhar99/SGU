/**
 * SupplyShield Role-Based Access Control (RBAC) & Domain Configuration
 * 
 * Supports:
 * - Top Roles (Full overall accessibility): Admin, Distribution Manager, Operations Manager, Regional Distribution Director
 * - Retailer (Store POS, shelf stockouts, replenishment, store emergency rescue)
 * - Warehouse Manager / Controller (DC capacity, bay staging, outbound fleet manifests, dock schedules)
 * - Supply Chain Analyst (ML forecasting models, CP-SAT MILP solver diagnostics, disruption sandbox, reports)
 */

export const ROLE_GROUPS = {
  EXECUTIVE: 'executive',
  RETAILER: 'retailer',
  WAREHOUSE: 'warehouse',
  ANALYST: 'analyst',
}

export const TOP_ROLES = [
  'Admin',
  'Distribution Manager',
  'Operations Manager',
  'Regional Distribution Director',
  'Director',
]

/**
 * Checks if the role is a top-level role with overall accessibility
 */
export function isExecutiveRole(role) {
  if (!role) return false
  const r = String(role).trim()
  return TOP_ROLES.some((top) => top.toLowerCase() === r.toLowerCase()) || r.toLowerCase().includes('director') || r.toLowerCase().includes('admin')
}

/**
 * Normalizes any role string into one of the 4 core domain scopes
 */
export function getRoleScope(role) {
  if (!role) return ROLE_GROUPS.RETAILER
  const r = String(role).trim().toLowerCase()

  if (isExecutiveRole(role) || r.includes('operations manager') || r.includes('distribution manager')) {
    return ROLE_GROUPS.EXECUTIVE
  }
  if (r.includes('retail') || r.includes('store')) {
    return ROLE_GROUPS.RETAILER
  }
  if (r.includes('ware') || r.includes('controller') || r.includes('dc')) {
    return ROLE_GROUPS.WAREHOUSE
  }
  if (r.includes('analyst') || r.includes('planner') || r.includes('data')) {
    return ROLE_GROUPS.ANALYST
  }
  return ROLE_GROUPS.EXECUTIVE
}

/**
 * Returns role badge metadata (color, icon, short title)
 */
export function getRoleBadge(role) {
  const scope = getRoleScope(role)
  switch (scope) {
    case ROLE_GROUPS.RETAILER:
      return {
        scope,
        label: 'Retail Storefront Lead',
        shortLabel: 'Retailer',
        tagline: 'Store POS Demand & Local Shelf Telemetry',
        badgeColor: '#047857',
        badgeBg: '#ecfdf5',
        borderColor: '#a7f3d0',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pillColor: '#10b981',
        icon: 'Store',
      }
    case ROLE_GROUPS.WAREHOUSE:
      return {
        scope,
        label: 'Warehouse & DC Controller',
        shortLabel: 'Warehouse Hub',
        tagline: 'DC Bay Storage & Outbound Fleet Dispatch',
        badgeColor: '#1d4ed8',
        badgeBg: '#eff6ff',
        borderColor: '#bfdbfe',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        pillColor: '#2563eb',
        icon: 'Warehouse',
      }
    case ROLE_GROUPS.ANALYST:
      return {
        scope,
        label: 'Supply Chain Analyst',
        shortLabel: 'SC Analyst',
        tagline: 'ML Forecasting & CP-SAT Solver Analytics',
        badgeColor: '#7e22ce',
        badgeBg: '#faf5ff',
        borderColor: '#e9d5ff',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        pillColor: '#9333ea',
        icon: 'BarChart3',
      }
    case ROLE_GROUPS.EXECUTIVE:
    default:
      return {
        scope,
        label: 'Distribution Director',
        shortLabel: 'Director (Full Access)',
        tagline: 'Master Cross-Network Governance & Control',
        badgeColor: '#0369a1',
        badgeBg: '#f0f9ff',
        borderColor: '#bae6fd',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        pillColor: '#0284c7',
        icon: 'Crown',
      }
  }
}

/**
 * Checks if a given role is allowed to access a specific route
 */
export function canAccessRoute(role, path) {
  if (isExecutiveRole(role)) return true // Top role has unrestricted overall accessibility!

  const scope = getRoleScope(role)
  const normalizedPath = path.toLowerCase()

  // Common pages accessible to all logged-in roles
  if (
    normalizedPath === '/dashboard' ||
    normalizedPath === '/network-map' ||
    normalizedPath === '/inventory' ||
    normalizedPath === '/inventory-table' ||
    normalizedPath === '/rescue' ||
    normalizedPath === '/search' ||
    normalizedPath === '/profile' ||
    normalizedPath === '/onboarding' ||
    normalizedPath === '/settings' ||
    normalizedPath === '/report'
  ) {
    return true
  }

  // Deep MILP solver & Scenario History restricted to Analyst and Executive
  if (normalizedPath === '/optimization' || normalizedPath === '/scenarios') {
    return scope === ROLE_GROUPS.ANALYST || scope === ROLE_GROUPS.EXECUTIVE
  }

  // Deep Forecasting restricted to Analyst and Executive
  if (normalizedPath === '/forecasting') {
    return scope === ROLE_GROUPS.ANALYST || scope === ROLE_GROUPS.EXECUTIVE
  }

  // Billing and Enterprise Plans
  if (normalizedPath === '/plans') {
    return scope === ROLE_GROUPS.EXECUTIVE
  }

  return true
}

/**
 * Filters the sidebar navigation tree based on user role
 */
export function filterNavigationForRole(menuSections, role) {
  if (isExecutiveRole(role)) {
    // Top role gets all sections and all items!
    return menuSections
  }

  const scope = getRoleScope(role)

  return menuSections
    .map((section) => {
      const filteredChildren = (section.children || []).filter((item) => {
        return canAccessRoute(role, item.value)
      })

      if (filteredChildren.length === 0) return null
      return {
        ...section,
        children: filteredChildren,
      }
    })
    .filter(Boolean)
}
