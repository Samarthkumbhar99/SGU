import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const { Map, Marker, Popup, NavigationControl, ScaleControl, LngLatBounds } = maplibregl
import { MapboxOverlay } from '@deck.gl/mapbox'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { ArcLayer } from '@deck.gl/layers'
import syntheticDemandPoints from './syntheticDemandPoints.json'
import distributionNetworkData from './distributionNetwork3D.json'
import {
  RotateCcw,
  AlertCircle,
  Layers,
  Flame,
  Navigation,
  Compass,
  Building2,
  MapPin,
  ExternalLink,
  Truck,
  Route,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  GripVertical,
  Zap,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react'
import { getInventoryScale } from '../../utils/inventoryScale.js'
import InventoryShelfModal from '../../components/ui/InventoryShelfModal.jsx'

// Open-access vector basemap style (OpenFreeMap Liberty - OpenMapTiles vector tiles)
const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

// Fallback raster style in case WebGL or vector style has networking constraints
const FALLBACK_RASTER_STYLE = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

// Crisp inline SVGs for HTML map markers
const WAREHOUSE_ICON_SVG = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/>
    <path d="M6 18h12"/>
    <path d="M6 14h12"/>
    <rect width="12" height="12" x="6" y="10"/>
  </svg>
`

const STORE_ICON_SVG = `
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
    <path d="M2 7h20"/>
  </svg>
`

// Accessible, contrast-checked color palette (RGBA & Hex)
export const PALETTE = {
  dcHub: [37, 99, 235, 240], // Royal Blue #2563eb
  healthy: [16, 185, 129, 230], // Emerald Green #10b981
  warning: [245, 158, 11, 240], // Amber Warning #f59e0b
  critical: [239, 68, 68, 250], // Crimson Red #ef4444
  demandHigh: [244, 63, 94, 240], // Coral Rose #f43f5e
  demandMedium: [249, 115, 22, 230], // Amber Orange #f97316
  demandLow: [14, 165, 233, 220], // Sky Blue #0ea5e9
}

// ==============================================================================
// Verified Dataset Clusters (Targeting ONLY the 15 Dataset Facilities in India)
// ==============================================================================
export const DATASET_CLUSTERS = {
  north: {
    id: 'north',
    label: 'Delhi NCR Hub & 4 Stores',
    shortLabel: 'Delhi Hub',
    icon: '🏙️',
    count: 5,
    region: 'North',
    center: [77.195, 28.585],
    zoom: 11.2,
    pitch: 56,
    bearing: -22,
    description: 'Delhi Central DC (Okhla) & Retail Stores in Saket, Connaught Place, Noida, Gurgaon CyberHub',
  },
  central: {
    id: 'central',
    label: 'Mumbai Hub & 4 Stores',
    shortLabel: 'Mumbai Hub',
    icon: '🏙️',
    count: 5,
    region: 'Central',
    center: [72.89, 19.12],
    zoom: 11.2,
    pitch: 56,
    bearing: -22,
    description: 'Mumbai Regional DC (Bhiwandi) & Retail Stores in Bandra, Navi Mumbai, Powai, Thane West',
  },
  south: {
    id: 'south',
    label: 'Bangalore Hub & 4 Stores',
    shortLabel: 'Bangalore Hub',
    icon: '🏙️',
    count: 5,
    region: 'South',
    center: [77.65, 12.95],
    zoom: 11.2,
    pitch: 56,
    bearing: -22,
    description: 'Bangalore Regional DC (Peenya) & Retail Stores in Indiranagar, Koramangala, Whitefield, Jayanagar',
  },
  all: {
    id: 'all',
    label: 'All 15 Facilities',
    shortLabel: 'All Facilities',
    icon: '🌐',
    count: 15,
    region: 'All',
    center: [78.96, 20.59],
    zoom: 4.9,
    pitch: 48,
    bearing: -18,
    description: 'National overview: 3 Regional DCs & 12 Retail Storehouses across India',
  },
}

/**
 * Creates closed rectangular polygon coordinates [ [lng, lat], ... ]
 */
export function createRect(centerLng, centerLat, widthLng, heightLat) {
  const halfW = widthLng / 2
  const halfH = heightLat / 2
  return [
    [centerLng - halfW, centerLat - halfH],
    [centerLng + halfW, centerLat - halfH],
    [centerLng + halfW, centerLat + halfH],
    [centerLng - halfW, centerLat + halfH],
    [centerLng - halfW, centerLat - halfH],
  ]
}

/**
 * Computes architectural dimensions and height tiers based on the active map zoom.
 */
export function getScaleForZoom(zoom) {
  if (zoom >= 13) {
    return {
      sizeDeg: 0.0032, // ~350m
      dcHeight: 380,
      dcWingHeight: 220,
      dcTowerHeight: 580,
      storeHeight: 260,
      storeCanopyHeight: 110,
      storeRoofHeight: 320,
    }
  } else if (zoom >= 10) {
    return {
      sizeDeg: 0.0085, // ~900m
      dcHeight: 1200,
      dcWingHeight: 700,
      dcTowerHeight: 1850,
      storeHeight: 800,
      storeCanopyHeight: 350,
      storeRoofHeight: 980,
    }
  } else if (zoom >= 7) {
    return {
      sizeDeg: 0.024, // ~2.6km
      dcHeight: 4800,
      dcWingHeight: 3000,
      dcTowerHeight: 7600,
      storeHeight: 3400,
      storeCanopyHeight: 1500,
      storeRoofHeight: 4200,
    }
  } else {
    // Zoom < 7 (National overview across India)
    return {
      sizeDeg: 0.09, // ~10km
      dcHeight: 75000,
      dcWingHeight: 45000,
      dcTowerHeight: 115000,
      storeHeight: 48000,
      storeCanopyHeight: 22000,
      storeRoofHeight: 58000,
    }
  }
}

/**
 * Resolves node display coordinates.
 * At regional zoom (zoom < 7.2), gently disperses stores in orbit around their
 * regional DC hub so all 3 DCs and 12 Stores are clearly visible and clickable.
 * At street zoom (zoom >= 7.2), transitions smoothly to exact canonical coordinates.
 */
export function getNodeDisplayCoordinates(node, currentZoom = 5) {
  if (!node || !Array.isArray(node.coordinates) || node.coordinates.length < 2) {
    return [75.29, 20.81]
  }
  if (node.type === 'Warehouse') {
    return node.coordinates
  }
  if (currentZoom >= 7.2) {
    return node.coordinates
  }

  const storeRadialOffsets = {
    // North Region (Delhi DC [77.1025, 28.7041])
    'STORE-01': [0.44, -0.42],
    'Store S-01 (South Delhi)': [0.44, -0.42],
    'STORE-06': [0.12, 0.52],
    'Store S-06 (Connaught Place)': [0.12, 0.52],
    'STORE-09': [0.65, 0.12],
    'Store S-09 (Noida Sec-18)': [0.65, 0.12],
    'STORE-11': [-0.52, -0.25],
    'Store S-11 (Gurgaon CyberHub)': [-0.52, -0.25],

    // Central Region (Mumbai DC [72.8777, 19.076])
    'STORE-02': [-0.48, -0.38],
    'Store S-02 (West Mumbai)': [-0.48, -0.38],
    'STORE-04': [0.48, -0.32],
    'Store S-04 (Navi Mumbai)': [0.48, -0.32],
    'STORE-08': [-0.32, 0.45],
    'Store S-08 (Powai)': [-0.32, 0.45],
    'STORE-10': [0.42, 0.45],
    'Store S-10 (Thane West)': [0.42, 0.45],

    // South Region (Bangalore DC [77.5946, 12.9716])
    'STORE-03': [0.55, 0.18],
    'Store S-03 (Indiranagar)': [0.55, 0.18],
    'STORE-05': [0.22, -0.46],
    'Store S-05 (Koramangala)': [0.22, -0.46],
    'STORE-07': [0.68, 0.45],
    'Store S-07 (Whitefield)': [0.68, 0.45],
    'STORE-12': [-0.45, -0.38],
    'Store S-12 (Jayanagar)': [-0.45, -0.38],
  }

  const offset = storeRadialOffsets[node.code] || storeRadialOffsets[node.id]
  if (!offset) {
    return node.coordinates
  }

  const factor = Math.max(0, Math.min(1, (7.2 - currentZoom) / 2.0))

  const dcCoordinates =
    node.region === 'North'
      ? [77.1025, 28.7041]
      : node.region === 'Central'
      ? [72.8777, 19.076]
      : [77.5946, 12.9716]

  const dispersedLng = dcCoordinates[0] + offset[0]
  const dispersedLat = dcCoordinates[1] + offset[1]

  return [
    Number((node.coordinates[0] * (1 - factor) + dispersedLng * factor).toFixed(6)),
    Number((node.coordinates[1] * (1 - factor) + dispersedLat * factor).toFixed(6)),
  ]
}

/**
 * Computes shortest road transport path between two geographic coordinates.
 * Fetches highway turn-by-turn geometry, real road distance, and travel duration from OSRM.
 * Falls back to high-fidelity highway-curved waypoints if network constraints occur.
 */
export async function calculateShortestRoadPath(originCoords, destCoords) {
  if (!originCoords || !destCoords || originCoords.length < 2 || destCoords.length < 2) {
    return null
  }

  const [lng1, lat1] = originCoords
  const [lng2, lat2] = destCoords
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const response = await fetch(osrmUrl, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const distanceKm = Number((route.distance / 1000).toFixed(1))
        const durationSec = route.duration
        const hours = Math.floor(durationSec / 3600)
        const mins = Math.round((durationSec % 3600) / 60)

        const durationFormatted =
          hours > 0 ? `${hours} hr${hours > 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}` : `${mins} mins`

        return {
          coordinates: route.geometry.coordinates,
          distanceKm,
          durationFormatted,
          durationSec,
          type: 'osrm_road',
        }
      }
    }
  } catch (err) {
    console.warn('[ShortestPath] OSRM live routing notice:', err)
  }

  // Realistic Fallback Highway Roadway Path
  return generateFallbackHighwayRoute(originCoords, destCoords)
}

/**
 * Generates realistic highway road path with corridor curves when OSRM is offline.
 */
export function generateFallbackHighwayRoute(originCoords, destCoords) {
  const [lng1, lat1] = originCoords
  const [lng2, lat2] = destCoords

  const toRad = (x) => (x * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const directDistanceKm = R * c

  // Highway roadway distance is typically ~1.22x direct displacement
  const roadDistanceKm = Number((directDistanceKm * 1.22).toFixed(1))

  // Commercial logistics freight speed: ~48 km/h average on Indian highways
  const totalHours = roadDistanceKm / 48
  const hours = Math.floor(totalHours)
  const mins = Math.round((totalHours - hours) * 60)
  const durationFormatted =
    hours > 0 ? `${hours} hr${hours > 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}` : `${mins} mins`

  const steps = Math.max(16, Math.min(60, Math.round(roadDistanceKm / 1.8)))
  const coordinates = []

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    let curLng = lng1 + (lng2 - lng1) * t
    let curLat = lat1 + (lat2 - lat1) * t

    const perpLng = -(lat2 - lat1)
    const perpLat = lng2 - lng1
    const perpMag = Math.sqrt(perpLng * perpLng + perpLat * perpLat) || 1
    const normalizedPerpLng = perpLng / perpMag
    const normalizedPerpLat = perpLat / perpMag

    const arcDeviation = Math.sin(t * Math.PI) * 0.018 * (directDistanceKm > 80 ? 1.8 : 0.6)
    const waveDeviation = Math.sin(t * Math.PI * 4) * 0.0035

    curLng += normalizedPerpLng * (arcDeviation + waveDeviation)
    curLat += normalizedPerpLat * (arcDeviation + waveDeviation)

    coordinates.push([Number(curLng.toFixed(6)), Number(curLat.toFixed(6))])
  }

  return {
    coordinates,
    distanceKm: roadDistanceKm,
    durationFormatted,
    durationSec: Math.round(totalHours * 3600),
    type: 'highway_road_modeled',
  }
}

/**
 * Automatically identifies all candidate Warehouses and DCs for a low-stock/risky store,
 * calculates real road paths, ranks by shortest distance, and computes estimations
 * (Distance, Time, Stock Needed, Transport Cost in INR, Tolls, Fuel, and CO2).
 */
export async function planRescueRoutesForStore(storeNode, allNodes) {
  if (!storeNode || !allNodes || allNodes.length === 0) return null

  const warehouses = allNodes.filter(
    (n) => n.type === 'Warehouse' && n.id !== storeNode.id && Array.isArray(n.coordinates)
  )
  if (warehouses.length === 0) return null

  const candidatePromises = warehouses.map(async (wh) => {
    const route = await calculateShortestRoadPath(wh.coordinates, storeNode.coordinates)
    if (!route) return null

    // Commercial Logistics Estimations in INR
    const estimatedCostINR = Math.round(1850 + route.distanceKm * 24.5)
    const estimatedTollINR = Math.round(route.distanceKm * 3.6)
    const estimatedFuelINR = Math.round((route.distanceKm / 4.2) * 94)
    const co2Kg = Number((route.distanceKm * 0.16 * 2.2).toFixed(1))

    // Stock allocation
    const targetSupply = Math.round((storeNode.weeklyDemand || 2600) * 2)
    const currentStock = storeNode.stockOnHand || 0
    const unitsNeeded = Math.max(250, targetSupply - currentStock)

    return {
      warehouse: wh,
      store: storeNode,
      route,
      distanceKm: route.distanceKm,
      durationFormatted: route.durationFormatted,
      durationSec: route.durationSec,
      coordinates: route.coordinates,
      estimatedCostINR,
      estimatedTollINR,
      estimatedFuelINR,
      co2Kg,
      unitsNeeded,
      unitsAvailable: wh.stockOnHand || 60000,
      daysProtected: 14,
    }
  })

  const candidates = (await Promise.all(candidatePromises)).filter(Boolean)
  candidates.sort((a, b) => a.distanceKm - b.distanceKm)

  if (candidates.length === 0) return null

  return {
    targetStore: storeNode,
    primary: candidates[0],
    alternatives: candidates.slice(1),
    allCandidates: candidates,
  }
}

/**
 * Generates photorealistic 3D architectural house/warehouse polygons ONLY for the dataset points.
 * Regional DCs feature a 4-part complex (Logistics Hall, Cross-Dock Wing, Operations Tower, Ground Apron).
 * Retail Stores feature a 3-part commercial house (Main Storehouse, Portico Pavilion, Royal Blue Roof Crown).
 */
export function generateDataset3DHousesGeoJSON(nodes = [], zoom = 11.2) {
  const scale = getScaleForZoom(zoom)
  const features = []

  nodes.forEach((node) => {
    if (!node || !Array.isArray(node.coordinates) || node.coordinates.length < 2) return

    const displayCoords = getNodeDisplayCoordinates(node, zoom)
    const [lng, lat] = displayCoords

    if (node.type === 'Warehouse') {
      // 1. Main Logistics Fulfillment Hall (Royal Blue landmark facade)
      features.push({
        type: 'Feature',
        properties: {
          ...node,
          part: 'hall',
          partName: 'Main Fulfillment Hall',
          height: scale.dcHeight,
          base_height: 0,
          color: '#2563eb', // Royal Blue
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            createRect(lng - scale.sizeDeg * 0.2, lat - scale.sizeDeg * 0.1, scale.sizeDeg * 1.2, scale.sizeDeg * 0.9),
          ],
        },
      })

      // 2. Cross-Dock Logistics Wing (Deep Royal Blue)
      features.push({
        type: 'Feature',
        properties: {
          ...node,
          part: 'wing',
          partName: 'Cross-Dock Sorting Wing',
          height: scale.dcWingHeight,
          base_height: 0,
          color: '#1d4ed8', // Deep Royal Blue
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            createRect(lng + scale.sizeDeg * 0.55, lat - scale.sizeDeg * 0.15, scale.sizeDeg * 0.65, scale.sizeDeg * 0.6),
          ],
        },
      })

      // 3. Operations Control Tower (Vibrant Sky Blue landmark tower matching reference photo)
      features.push({
        type: 'Feature',
        properties: {
          ...node,
          part: 'tower',
          partName: 'Operations Control Tower',
          height: scale.dcTowerHeight,
          base_height: 0,
          color: '#3b82f6', // Cobalt/Vibrant Blue
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            createRect(lng - scale.sizeDeg * 0.6, lat + scale.sizeDeg * 0.35, scale.sizeDeg * 0.4, scale.sizeDeg * 0.4),
          ],
        },
      })

      // 4. Logistics Ground Staging Apron
      features.push({
        type: 'Feature',
        properties: {
          ...node,
          part: 'yard',
          partName: 'Logistics Staging Apron',
          height: Math.max(8, scale.dcHeight * 0.05),
          base_height: 0,
          color: '#475569', // Slate tarmac
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            createRect(lng, lat, scale.sizeDeg * 1.9, scale.sizeDeg * 1.6),
          ],
        },
      })
    } else {
      // Retail Storehouse: 3 architectural parts
      const storeColor =
        node.status === 'Critical Stockout' || node.riskLevel === 'Critical'
          ? '#ef4444' // Crimson Red
          : node.status === 'Low Stock' || node.riskLevel === 'Warning'
          ? '#f59e0b' // Amber
          : '#10b981' // Emerald Green

      // 1. Main Storehouse Building
      features.push({
        type: 'Feature',
        properties: {
          ...node,
          part: 'store',
          partName: 'Retail Distribution House',
          height: scale.storeHeight,
          base_height: 0,
          color: storeColor,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            createRect(lng, lat, scale.sizeDeg * 0.85, scale.sizeDeg * 0.85),
          ],
        },
      })

      // 2. Storefront Portico / Entrance Pavilion
      features.push({
        type: 'Feature',
        properties: {
          ...node,
          part: 'canopy',
          partName: 'Storefront Entrance Portico',
          height: scale.storeCanopyHeight,
          base_height: 0,
          color: '#94a3b8', // Steel slate
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            createRect(lng, lat - scale.sizeDeg * 0.55, scale.sizeDeg * 0.75, scale.sizeDeg * 0.4),
          ],
        },
      })

      // 3. Architectural Roof Crown (Royal Blue roof crown matching reference simulation)
      features.push({
        type: 'Feature',
        properties: {
          ...node,
          part: 'roof',
          partName: 'Architectural Roof Crown',
          height: scale.storeRoofHeight,
          base_height: scale.storeHeight,
          color: '#2563eb', // Royal Blue roof
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            createRect(lng, lat, scale.sizeDeg * 0.45, scale.sizeDeg * 0.45),
          ],
        },
      })
    }
  })

  return {
    type: 'FeatureCollection',
    features,
  }
}

// Backward compatibility exports
export const DEFAULT_NETWORK_NODES = (distributionNetworkData.nodes || []).slice(0, 7)
export function calculateColumnElevation() { return 50000 }
export function calculateColumnColor(node) {
  if (!node) return PALETTE.healthy
  if (node.type === 'Warehouse') return PALETTE.dcHub
  if (node.status === 'Critical Stockout' || node.riskLevel === 'Critical') return PALETTE.critical
  if (node.status === 'Low Stock' || node.riskLevel === 'Warning') return PALETTE.warning
  return PALETTE.healthy
}

export default function SupplyShieldMap({
  height = '480px',
  nodes = distributionNetworkData.nodes || [],
  selectedNodeId,
  onNodeSelect,
  activeRescueStore = null,
  className = '',
  initialShowHeatmap = false,
  initialShowArcs = false,
  initial3D = true,
  initialShowPins = false,
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const overlayRef = useRef(null)
  const routeMarkersRef = useRef([])

  // Shortest Road Path State
  const [routeOrigin, setRouteOrigin] = useState(null)
  const [routeDest, setRouteDest] = useState(null)
  const [routeData, setRouteData] = useState(null)
  const [isRouteLoading, setIsRouteLoading] = useState(false)
  const [showRoutePlanner, setShowRoutePlanner] = useState(false)
  const [routeError, setRouteError] = useState(null)
  const [cardOffset, setCardOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ startX: 0, startY: 0, initialOffsetX: 0, initialOffsetY: 0 })

  // Store Emergency Rescue State
  const [rescuePlan, setRescuePlan] = useState(null)
  const [selectedRescueIndex, setSelectedRescueIndex] = useState(0)

  // Active Cluster: 'north' (Delhi Hub) | 'central' (Mumbai Hub) | 'south' (Bangalore Hub) | 'all' (All 15 Facilities)
  const [activeCluster, setActiveCluster] = useState('north')

  // Map state
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(null)
  const [mapZoom, setMapZoom] = useState(DATASET_CLUSTERS.north.zoom)
  const [, setActivePopupNode] = useState(null)
  const [hoverInfo, setHoverInfo] = useState(null)
  const [inspectingNode, setInspectingNode] = useState(null)

  // Layer and UX Controls
  const [is3D, setIs3D] = useState(initial3D)
  const [show3DHouses, setShow3DHouses] = useState(true)
  const [showArcs, setShowArcs] = useState(initialShowArcs)
  const [showHeatmap, setShowHeatmap] = useState(initialShowHeatmap)
  const [showPins, setShowPins] = useState(initialShowPins)

  // Canonical dataset from distributionNetwork3D.json (ONLY dataset facilities)
  const networkNodes = useMemo(() => {
    return nodes && nodes.length > 0 ? nodes : distributionNetworkData.nodes || []
  }, [nodes])

  const networkLanes = useMemo(() => distributionNetworkData.lanes || [], [])

  // Switch to a specific dataset cluster with smooth 3D perspective camera transition
  const handleSelectCluster = useCallback((clusterKey) => {
    setActiveCluster(clusterKey)
    const map = mapInstanceRef.current
    if (!map) return

    const cluster = DATASET_CLUSTERS[clusterKey] || DATASET_CLUSTERS.north

    map.flyTo({
      center: cluster.center,
      zoom: cluster.zoom,
      pitch: is3D ? cluster.pitch : 0,
      bearing: is3D ? cluster.bearing : 0,
      duration: 1600,
      essential: true,
    })
  }, [is3D])

  // Reset view to current cluster's perspective
  const handleResetView = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return
    const cluster = DATASET_CLUSTERS[activeCluster] || DATASET_CLUSTERS.north

    map.flyTo({
      center: cluster.center,
      zoom: cluster.zoom,
      pitch: is3D ? cluster.pitch : 0,
      bearing: is3D ? cluster.bearing : 0,
      duration: 1200,
      essential: true,
    })
  }, [activeCluster, is3D])

  // Toggle 3D Perspective Tilt (56° / 0°)
  const handleToggle3D = useCallback(() => {
    const map = mapInstanceRef.current
    const nextIs3D = !is3D
    setIs3D(nextIs3D)

    if (map) {
      const cluster = DATASET_CLUSTERS[activeCluster] || DATASET_CLUSTERS.north
      map.easeTo({
        pitch: nextIs3D ? cluster.pitch : 0,
        bearing: nextIs3D ? cluster.bearing : 0,
        duration: 1100,
      })
    }
  }, [is3D, activeCluster])

  // Toggle 3D Houses Layer
  const handleToggleHouses = useCallback(() => {
    const nextHouses = !show3DHouses
    setShow3DHouses(nextHouses)

    const map = mapInstanceRef.current
    if (map && map.getLayer('dataset-3d-houses-layer')) {
      try {
        map.setLayoutProperty('dataset-3d-houses-layer', 'visibility', nextHouses ? 'visible' : 'none')
      } catch (err) {
        console.warn('Notice toggling house layer visibility:', err)
      }
    }
  }, [show3DHouses])

  // Trigger road calculation between two nodes
  const calculateRouteBetweenNodes = useCallback(async (origin, dest) => {
    if (!origin || !dest) return
    setIsRouteLoading(true)
    setRouteError(null)

    try {
      const originCoords = origin.coordinates
      const destCoords = dest.coordinates

      const result = await calculateShortestRoadPath(originCoords, destCoords)
      if (result) {
        setRouteData({
          ...result,
          originName: origin.name,
          destName: dest.name,
          originType: origin.type,
          destType: dest.type,
        })
      } else {
        setRouteError('Could not calculate road route.')
      }
    } catch (e) {
      console.error('Failed to calculate shortest road route:', e)
      setRouteError('Road path computation error.')
    } finally {
      setIsRouteLoading(false)
    }
  }, [])

  // Clear shortest road route
  const handleClearRoute = useCallback(() => {
    setRouteOrigin(null)
    setRouteDest(null)
    setRouteData(null)
    setRouteError(null)
    setIsRouteLoading(false)
    setCardOffset({ x: 0, y: 0 })
    setRescuePlan(null)
    setSelectedRescueIndex(0)

    // Remove route markers
    routeMarkersRef.current.forEach((m) => m.remove())
    routeMarkersRef.current = []

    const map = mapInstanceRef.current
    if (map) {
      if (map.getSource('shortest-road-route-source')) {
        try {
          map.getSource('shortest-road-route-source').setData({
            type: 'FeatureCollection',
            features: [],
          })
        } catch (err) {
          // ignore
        }
      }
      if (map.getSource('alternative-road-routes-source')) {
        try {
          map.getSource('alternative-road-routes-source').setData({
            type: 'FeatureCollection',
            features: [],
          })
        } catch (err) {
          // ignore
        }
      }
    }
  }, [])

  // Trigger emergency rescue for low-stock / risky store
  const triggerStoreRescue = useCallback(
    async (storeNode) => {
      if (!storeNode) return
      setIsRouteLoading(true)
      setRouteError(null)

      try {
        const plan = await planRescueRoutesForStore(storeNode, networkNodes)
        if (plan && plan.primary) {
          setRescuePlan(plan)
          setSelectedRescueIndex(0)
          setRouteOrigin(plan.primary.warehouse)
          setRouteDest(storeNode)
          setRouteData({
            ...plan.primary,
            originName: plan.primary.warehouse.name,
            destName: storeNode.name,
            originType: plan.primary.warehouse.type,
            destType: storeNode.type,
            isRescue: true,
          })
          setShowRoutePlanner(true)
        } else {
          setRouteError('No suitable supplying warehouses found.')
        }
      } catch (err) {
        console.error('Failed to plan rescue routes:', err)
        setRouteError('Emergency rescue route planning failed.')
      } finally {
        setIsRouteLoading(false)
      }
    },
    [networkNodes]
  )

  // Choose an alternative supply warehouse path
  const handleSelectRescueAlternative = useCallback(
    (index) => {
      if (!rescuePlan || !rescuePlan.allCandidates || !rescuePlan.allCandidates[index]) return
      const chosen = rescuePlan.allCandidates[index]
      setSelectedRescueIndex(index)
      setRouteOrigin(chosen.warehouse)
      setRouteDest(rescuePlan.targetStore)
      setRouteData({
        ...chosen,
        originName: chosen.warehouse.name,
        destName: rescuePlan.targetStore.name,
        originType: chosen.warehouse.type,
        destType: rescuePlan.targetStore.type,
        isRescue: true,
      })
    },
    [rescuePlan]
  )

  // Auto-trigger rescue if activeRescueStore prop is passed
  useEffect(() => {
    if (activeRescueStore) {
      triggerStoreRescue(activeRescueStore)
    }
  }, [activeRescueStore, triggerStoreRescue])

  // Expose global rescue & 3D shelf inspector triggers for marker popups
  useEffect(() => {
    window.__triggerStoreRescue = (nodeId) => {
      const target = networkNodes.find((n) => n.id === nodeId || n.code === nodeId)
      if (target) {
        triggerStoreRescue(target)
      }
    }
    window.__openInventoryInspector = (nodeId) => {
      const target = networkNodes.find((n) => n.id === nodeId || n.code === nodeId)
      if (target) {
        setInspectingNode(target)
      }
    }
    return () => {
      delete window.__triggerStoreRescue
      delete window.__openInventoryInspector
    }
  }, [networkNodes, triggerStoreRescue])

  // Handle clicking any node (3D house or HTML pin)
  const handleNodeClick = useCallback(
    (nodeOrProps) => {
      const node =
        networkNodes.find(
          (n) => n.id === nodeOrProps.id || n.code === nodeOrProps.code || n.name === nodeOrProps.name
        ) || nodeOrProps

      // Always maintain existing onNodeSelect
      if (onNodeSelect) {
        onNodeSelect(node)
      }

      // Shortest road route sequential selection
      if (!routeOrigin) {
        setRouteOrigin(node)
        setRouteDest(null)
        setRouteData(null)
      } else if (routeOrigin && !routeDest) {
        if (node.id !== routeOrigin.id) {
          setRouteDest(node)
          calculateRouteBetweenNodes(routeOrigin, node)
        }
      } else {
        if (node.id !== routeOrigin.id) {
          setRouteDest(node)
          calculateRouteBetweenNodes(routeOrigin, node)
        } else {
          setRouteDest(null)
          setRouteData(null)
        }
      }
    },
    [networkNodes, onNodeSelect, routeOrigin, routeDest, calculateRouteBetweenNodes]
  )

  // Drag handlers for movable route card
  const handleDragStart = useCallback(
    (e) => {
      if (e.target.closest('button') || e.target.closest('select')) return
      e.preventDefault()
      setIsDragging(true)
      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialOffsetX: cardOffset.x,
        initialOffsetY: cardOffset.y,
      }
    },
    [cardOffset]
  )

  const handleTouchStart = useCallback(
    (e) => {
      if (e.target.closest('button') || e.target.closest('select')) return
      if (e.touches && e.touches.length > 0) {
        setIsDragging(true)
        dragStartRef.current = {
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          initialOffsetX: cardOffset.x,
          initialOffsetY: cardOffset.y,
        }
      }
    },
    [cardOffset]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragStartRef.current.startX
      const dy = e.clientY - dragStartRef.current.startY
      setCardOffset({
        x: dragStartRef.current.initialOffsetX + dx,
        y: dragStartRef.current.initialOffsetY + dy,
      })
    }

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const dx = e.touches[0].clientX - dragStartRef.current.startX
        const dy = e.touches[0].clientY - dragStartRef.current.startY
        setCardOffset({
          x: dragStartRef.current.initialOffsetX + dx,
          y: dragStartRef.current.initialOffsetY + dy,
        })
      }
    }

    const handleDragEnd = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleDragEnd)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleDragEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging])

  // Initialize MapLibre GL map and deck.gl MapboxOverlay
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    let map = null

    try {
      const initialCluster = DATASET_CLUSTERS.north

      map = new Map({
        container: mapContainerRef.current,
        style: BASEMAP_STYLE_URL,
        center: initialCluster.center,
        zoom: initialCluster.zoom,
        minZoom: 3,
        maxZoom: 18,
        pitch: is3D ? initialCluster.pitch : 0,
        bearing: is3D ? initialCluster.bearing : 0,
        attributionControl: false,
      })

      // Add navigation controls (zoom in/out, pitch/rotation compass)
      map.addControl(new NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right')

      // Add scale indicator
      map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left')

      // Initialize deck.gl MapboxOverlay bridge (MapLibre IControl)
      const overlay = new MapboxOverlay({
        layers: [],
      })
      map.addControl(overlay)
      overlayRef.current = overlay

      map.on('zoomend', () => {
        const currentZoom = map.getZoom()
        setMapZoom(currentZoom)
        // Refresh GeoJSON polygon scale dynamically on zoom change
        try {
          const source = map.getSource('dataset-3d-houses-source')
          if (source) {
            source.setData(generateDataset3DHousesGeoJSON(networkNodes, currentZoom))
          }
        } catch (e) {
          // ignore
        }
      })

      map.on('load', () => {
        try {
          map.resize()
          setMapZoom(map.getZoom())
          if (overlayRef.current?._updateContainerSize) {
            overlayRef.current._updateContainerSize()
          }
          if (overlayRef.current?._updateViewState) {
            overlayRef.current._updateViewState()
          }
        } catch (e) {
          console.warn('[SupplyShieldMap] Overlay resize notice:', e)
        }

        // Hide all generic OSM vector building extrusions so ONLY the dataset points appear in 3D
        try {
          const style = map.getStyle()
          if (style && style.layers) {
            style.layers.forEach((layer) => {
              if (
                layer.id === 'building-3d' ||
                layer.id === 'building' ||
                layer.id === 'building-top' ||
                (typeof layer.id === 'string' && layer.id.includes('building')) ||
                layer['source-layer'] === 'building' ||
                layer['source-layer'] === 'buildings'
              ) {
                map.setLayoutProperty(layer.id, 'visibility', 'none')
              }
            })
          }
        } catch (hErr) {
          console.warn('Notice: Error hiding generic OSM buildings:', hErr)
        }

        // Photorealistic directional sunlight for 3D architectural facets and roof shading
        try {
          map.setLight({
            anchor: 'viewport',
            color: '#ffffff',
            intensity: 0.52,
            position: [1.2, 210, 36],
          })
        } catch (lErr) {
          // ignore lighting error if unsupported
        }

        // Add custom GeoJSON source for 3D architectural houses of ONLY the dataset points
        try {
          map.addSource('dataset-3d-houses-source', {
            type: 'geojson',
            data: generateDataset3DHousesGeoJSON(networkNodes, map.getZoom()),
          })

          map.addLayer({
            id: 'dataset-3d-houses-layer',
            type: 'fill-extrusion',
            source: 'dataset-3d-houses-source',
            layout: {
              visibility: show3DHouses ? 'visible' : 'none',
            },
            paint: {
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'base_height'],
              'fill-extrusion-opacity': 0.95,
            },
          })

          // Interactive click and hover on 3D houses
          map.on('click', 'dataset-3d-houses-layer', (e) => {
            if (e.features && e.features.length > 0) {
              const props = e.features[0].properties
              handleNodeClick(props)

              const targetNode =
                networkNodes.find(
                  (n) => n.id === props.id || n.code === props.code || n.name === props.name
                ) || props

              const content = buildNodePopupHtml(targetNode)
              const housePopup = new Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false,
                maxWidth: '320px',
              })
                .setLngLat(e.lngLat)
                .setHTML(content)
                .addTo(map)

              housePopup.on('open', () => {
                const dom = housePopup.getElement()
                if (dom) {
                  const rescueBtn = dom.querySelector('.ss-popup-rescue-btn')
                  if (rescueBtn) {
                    rescueBtn.onclick = (ev) => {
                      ev.stopPropagation()
                      triggerStoreRescue(targetNode)
                      housePopup.remove()
                    }
                  }
                  const inspectBtn = dom.querySelector('.ss-popup-inspect-btn')
                  if (inspectBtn) {
                    inspectBtn.onclick = (ev) => {
                      ev.stopPropagation()
                      setInspectingNode(targetNode)
                    }
                  }
                }
              })
            }
          })

          map.on('mousemove', 'dataset-3d-houses-layer', (e) => {
            if (e.features && e.features.length > 0) {
              map.getCanvas().style.cursor = 'pointer'
              const props = e.features[0].properties
              setHoverInfo({
                type: 'house',
                x: e.point.x,
                y: e.point.y,
                data: props,
              })
            }
          })

          map.on('mouseleave', 'dataset-3d-houses-layer', () => {
            map.getCanvas().style.cursor = ''
            setHoverInfo(null)
          })
        } catch (geoErr) {
          console.error('Error adding dataset 3D houses layer:', geoErr)
        }

        // Add custom GeoJSON source and layers for Shortest Road Transport Route
        try {
          map.addSource('shortest-road-route-source', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          })

          // Outer glowing casing layer
          map.addLayer({
            id: 'shortest-road-route-casing',
            type: 'line',
            source: 'shortest-road-route-source',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#0f172a',
              'line-width': 8.5,
              'line-opacity': 0.85,
            },
          })

          // Inner vibrant road line
          map.addLayer({
            id: 'shortest-road-route-line',
            type: 'line',
            source: 'shortest-road-route-source',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#06b6d4',
              'line-width': 5,
              'line-opacity': 0.98,
            },
          })
        } catch (routeErr) {
          console.warn('Notice adding shortest road route layer:', routeErr)
        }

        // Add custom GeoJSON source and layer for Alternative Rescue Road Routes
        try {
          map.addSource('alternative-road-routes-source', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          })

          map.addLayer({
            id: 'alternative-road-routes-line',
            type: 'line',
            source: 'alternative-road-routes-source',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#a855f7', // Distinct dashed purple line for alternative routes
              'line-width': 4,
              'line-dasharray': [2.5, 2],
              'line-opacity': 0.85,
            },
          })

          // Interactive click on alternative route line to choose and activate it
          map.on('click', 'alternative-road-routes-line', (e) => {
            if (e.features && e.features.length > 0) {
              const candidateIdx = e.features[0].properties?.candidateIndex
              if (typeof candidateIdx === 'number') {
                handleSelectRescueAlternative(candidateIdx)
              }
            }
          })

          map.on('mouseenter', 'alternative-road-routes-line', () => {
            map.getCanvas().style.cursor = 'pointer'
          })

          map.on('mouseleave', 'alternative-road-routes-line', () => {
            map.getCanvas().style.cursor = ''
          })
        } catch (altErr) {
          console.warn('Notice adding alternative road routes layer:', altErr)
        }

        setMapLoaded(true)
      })

      map.on('error', (e) => {
        if (e && e.error && e.error.message && e.error.message.includes('style')) {
          console.warn('Vector style error, attempting fallback raster style:', e.error)
          try {
            map.setStyle(FALLBACK_RASTER_STYLE)
          } catch (fallbackErr) {
            setMapError('Failed to load map style.')
          }
        }
      })

      mapInstanceRef.current = map
    } catch (err) {
      console.error('MapLibre GL JS initialization error:', err)
      setMapError(err.message || 'WebGL is not supported or failed to initialize.')
    }

    // Cleanup on unmount
    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      routeMarkersRef.current.forEach((m) => m.remove())
      routeMarkersRef.current = []

      if (overlayRef.current) {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.removeControl(overlayRef.current)
          } catch (e) {
            // ignore
          }
        }
        try {
          overlayRef.current.finalize()
        } catch (e) {
          // ignore
        }
        overlayRef.current = null
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [networkNodes, onNodeSelect])

  // Synchronize deck.gl layers (HeatmapLayer & ArcLayer) via MapboxOverlay
  useEffect(() => {
    if (!overlayRef.current || !mapLoaded) return

    try {
      const layers = []

      // 1. Synthetic Demand Heatmap
      if (showHeatmap && Array.isArray(syntheticDemandPoints) && syntheticDemandPoints.length > 0) {
        layers.push(
          new HeatmapLayer({
            id: 'synthetic-demo-demand-heatmap',
            data: syntheticDemandPoints,
            getPosition: (d) => d.coordinates,
            getWeight: (d) => d.demand,
            radiusPixels: 38,
            intensity: 1.15,
            threshold: 0.04,
            aggregation: 'SUM',
            colorRange: [
              [56, 189, 248, 50],   // Soft sky blue (Low demand ~500 u/wk)
              [59, 130, 246, 120],  // Blue (Moderate demand ~1.2k u/wk)
              [234, 179, 8, 175],   // Amber (Elevated demand ~2.2k u/wk)
              [249, 115, 22, 225],  // Orange (High demand ~3.0k u/wk)
              [239, 68, 68, 255],   // Vivid Red (Peak cluster ~3.6k u/wk)
            ],
            opacity: 0.78,
            pickable: false,
          })
        )
      }

      // 2. Shipment Arcs (DC -> Store Transport Lanes across India)
      if (showArcs && Array.isArray(networkLanes) && networkLanes.length > 0) {
        layers.push(
          new ArcLayer({
            id: 'distribution-shipment-arcs-3d',
            data: networkLanes,
            getSourcePosition: (d) => {
              const srcNode = networkNodes.find((n) => n.id === d.sourceId || n.code === d.sourceId)
              return getNodeDisplayCoordinates(
                srcNode || { coordinates: d.sourceCoordinates, type: 'Warehouse', region: 'Central' },
                mapZoom
              )
            },
            getTargetPosition: (d) => {
              const tgtNode = networkNodes.find((n) => n.id === d.targetId || n.code === d.targetId)
              return getNodeDisplayCoordinates(
                tgtNode || { coordinates: d.targetCoordinates, type: 'Store', region: 'Central' },
                mapZoom
              )
            },
            getSourceColor: (d) =>
              d.status === 'disrupted'
                ? [239, 68, 68, 240] // Crimson red for disrupted corridor
                : [37, 99, 235, 190], // Royal blue for DC origin
            getTargetColor: (d) =>
              d.status === 'disrupted'
                ? [239, 68, 68, 255]
                : [16, 185, 129, 210], // Emerald green for store destination
            getWidth: (d) => (d.status === 'disrupted' ? 4.5 : Math.max(2, Math.min(5, (d.capacityPerDay || 1000) / 1200))),
            getHeight: 0.35,
            getTilt: 12,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 120],
            updateTriggers: {
              getSourcePosition: [mapZoom],
              getTargetPosition: [mapZoom],
            },
            onHover: (info) => {
              if (info.object) {
                setHoverInfo({
                  type: 'arc',
                  x: info.x,
                  y: info.y,
                  data: info.object,
                })
              } else {
                setHoverInfo(null)
              }
            },
          })
        )
      }

      if (overlayRef.current?._updateContainerSize) {
        overlayRef.current._updateContainerSize()
      }
      overlayRef.current.setProps({ layers })
    } catch (err) {
      console.error('Error updating deck.gl 3D overlay layers:', err)
    }
  }, [showArcs, showHeatmap, mapLoaded, networkNodes, networkLanes, mapZoom])

  // Build high-definition 3D shelf visualizer popup HTML (Levels 1 to 7 scale)
  const buildNodePopupHtml = useCallback((node, customBgColor) => {
    const isStore =
      node.type === 'Retail Store' ||
      node.type === 'Store' ||
      String(node.name || '').toLowerCase().includes('store')

    const inv = getInventoryScale(node)
    const statusColor = customBgColor || inv.barColor

    const rescueBtnHtml = isStore
      ? `
        <button
          type="button"
          class="ss-popup-rescue-btn"
          data-node-id="${node.id}"
          onclick="window.__triggerStoreRescue && window.__triggerStoreRescue('${node.id}')"
          style="
            width: 100%;
            margin-top: 8px;
            margin-bottom: 6px;
            padding: 7px 10px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #ffffff;
            border: none;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.2px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
          "
        >
          <span>⚡</span>
          <span>Auto-Rescue Store (Shortest Path)</span>
        </button>
      `
      : ''

    return `
      <div style="font-family: inherit; padding: 4px 2px; min-width: 255px; max-width: 290px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
          <span style="font-size: 12.5px; font-weight: 800; color: #0f172a; line-height: 1.2;">${node.name}</span>
          <span style="font-size: 9px; font-weight: 700; background: ${inv.badgeBg}; color: ${inv.badgeColor}; border: 1px solid ${inv.borderColor}; padding: 1px 6px; border-radius: 4px; white-space: nowrap;">
            ${inv.shortLabel}
          </span>
        </div>
        <div style="font-size: 10px; color: #64778b; margin-bottom: 6px; line-height: 1.3;">
          ${node.address || 'Supply Chain Logistics Facility'}
        </div>

        <!-- 3D Inventory Shelf Visualizer Card (1.png to 7.png Scale) -->
        <div style="position: relative; margin-bottom: 8px; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1; background: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
          <img
            src="${inv.imageSrc}"
            alt="${inv.title}"
            style="width: 100%; height: 130px; object-fit: contain; display: block; background: #ffffff;"
            onerror="if(!this.dataset.triedFallback){this.dataset.triedFallback='1';this.src='${inv.fallbackImageSrc}'}"
          />
          <div style="position: absolute; top: 6px; left: 6px; display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 9.5px; font-weight: 800; background: rgba(15, 23, 42, 0.92); color: #ffffff; padding: 2px 7px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.3);">
              Shelf Scale ${inv.scale}/7
            </span>
            <span style="font-size: 9px; font-weight: 700; background: ${inv.badgeBg}; color: ${inv.badgeColor}; border: 1px solid ${inv.borderColor}; padding: 1px 5px; border-radius: 4px;">
              ${inv.percent}% Full
            </span>
          </div>
          <button
            type="button"
            class="ss-popup-inspect-btn"
            data-node-id="${node.id}"
            onclick="window.__openInventoryInspector && window.__openInventoryInspector('${node.id}')"
            style="position: absolute; bottom: 6px; right: 6px; font-size: 9px; font-weight: 700; background: rgba(15, 23, 42, 0.9); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); padding: 3px 8px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 3px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"
          >
            <span>🔍</span>
            <span>Inspect 3D Shelf</span>
          </button>
        </div>

        <!-- 7-Level Scale Meter -->
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 9px; color: #64748b; font-weight: 600; margin-bottom: 3px;">
            <span>1 (Empty)</span>
            <span style="font-weight: 800; color: ${inv.barColor};">${inv.shortLabel} (${inv.scale}/7)</span>
            <span>7 (Full)</span>
          </div>
          <div style="display: flex; gap: 3px;">
            ${[1, 2, 3, 4, 5, 6, 7]
              .map(
                (lvl) => `
              <div style="flex: 1; height: 5px; border-radius: 2px; background: ${
                lvl <= inv.scale ? inv.barColor : '#e2e8f0'
              };"></div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Facility Inventory Telemetry Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 11px; margin-bottom: 6px; background: #f8fafc; padding: 6px 8px; border-radius: 6px; border: 1px solid #f1f5f9;">
          <div>
            <span style="color: #64778b; font-size: 10px;">Type:</span>
            <strong style="display: block; color: #17324d;">${node.type}</strong>
          </div>
          <div>
            <span style="color: #64778b; font-size: 10px;">Stock On-Hand:</span>
            <strong style="display: block; color: #17324d;">${inv.stockOnHand.toLocaleString()} u</strong>
          </div>
          <div>
            <span style="color: #64778b; font-size: 10px;">Max Capacity:</span>
            <strong style="display: block; color: #17324d;">${inv.capacity.toLocaleString()} u</strong>
          </div>
          <div>
            <span style="color: #64778b; font-size: 10px;">Status:</span>
            <span style="display: inline-block; font-weight: 700; color: ${statusColor};">${node.status || inv.shortLabel}</span>
          </div>
        </div>

        ${rescueBtnHtml}

        <div style="font-size: 9px; color: #94a3b8; font-style: italic; border-top: 1px solid #e2e8f0; padding-top: 4px; display: flex; justify-content: space-between;">
          <span>Lat: ${node.coordinates[1].toFixed(4)}, Lng: ${node.coordinates[0].toFixed(4)}</span>
          <span>Buffer: ${node.daysOfSupply ? node.daysOfSupply + 'd' : 'Active'}</span>
        </div>
      </div>
    `
  }, [])

  // Render or update MapLibre HTML markers when showPins is active
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapLoaded) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    if (!showPins) return

    const sortedNodes = [...networkNodes].sort((a, b) => {
      if (a.type === 'Warehouse' && b.type !== 'Warehouse') return 1
      if (a.type !== 'Warehouse' && b.type === 'Warehouse') return -1
      return 0
    })

    sortedNodes.forEach((node) => {
      if (
        !Array.isArray(node.coordinates) ||
        node.coordinates.length !== 2 ||
        isNaN(node.coordinates[0]) ||
        isNaN(node.coordinates[1])
      ) {
        return
      }

      const isWarehouse = node.type === 'Warehouse'
      const isSelected = selectedNodeId === node.id || selectedNodeId === node.shortCode

      const displayCoords = getNodeDisplayCoordinates(node, mapZoom)

      const el = document.createElement('div')
      el.className = 'ss-map-marker'
      el.style.cursor = 'pointer'
      el.style.display = 'flex'
      el.style.flexDirection = 'column'
      el.style.alignItems = 'center'
      el.style.zIndex = isSelected ? '25' : isWarehouse ? '16' : '8'
      el.style.transform = isSelected ? 'scale(1.15)' : 'scale(1)'
      el.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), z-index 0.1s ease'

      el.addEventListener('mouseenter', () => {
        el.style.zIndex = '30'
        el.style.transform = 'scale(1.15)'
      })
      el.addEventListener('mouseleave', () => {
        el.style.zIndex = isSelected ? '25' : isWarehouse ? '16' : '8'
        el.style.transform = isSelected ? 'scale(1.15)' : 'scale(1)'
      })

      const bgColor = isWarehouse
        ? '#2563eb'
        : node.status === 'Critical Stockout' || node.riskLevel === 'Critical'
        ? '#ef4444'
        : node.status === 'Low Stock' || node.riskLevel === 'Warning'
        ? '#f59e0b'
        : '#10b981'

      const iconSvg = isWarehouse ? WAREHOUSE_ICON_SVG : STORE_ICON_SVG
      const sizePx = isWarehouse ? '24px' : '18px'

      el.innerHTML = `
        <div style="
          width: ${sizePx};
          height: ${sizePx};
          border-radius: ${isWarehouse ? '6px' : '4px'};
          background: ${bgColor};
          border: 1.5px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        ">
          ${iconSvg}
        </div>
        <div style="
          margin-top: 2px;
          background: rgba(15, 23, 42, 0.88);
          color: #ffffff;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 3px;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
        ">
          ${node.shortCode || node.name}
        </div>
      `

      const popupContent = buildNodePopupHtml(node, bgColor)

      const popup = new Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '320px',
      }).setHTML(popupContent)

      popup.on('open', () => {
        const dom = popup.getElement()
        if (dom) {
          const rescueBtn = dom.querySelector('.ss-popup-rescue-btn')
          if (rescueBtn) {
            rescueBtn.onclick = (ev) => {
              ev.stopPropagation()
              triggerStoreRescue(node)
              popup.remove()
            }
          }
          const inspectBtn = dom.querySelector('.ss-popup-inspect-btn')
          if (inspectBtn) {
            inspectBtn.onclick = (ev) => {
              ev.stopPropagation()
              setInspectingNode(node)
            }
          }
        }
      })

      const marker = new Marker({ element: el })
        .setLngLat(displayCoords)
        .setPopup(popup)
        .addTo(map)

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setActivePopupNode(node)
        handleNodeClick(node)
      })

      markersRef.current.push(marker)
    })
  }, [networkNodes, selectedNodeId, onNodeSelect, mapLoaded, mapZoom, showPins, handleNodeClick])

  // Synchronize shortest road path GeoJSON line layer with MapLibre
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapLoaded) return

    try {
      const source = map.getSource('shortest-road-route-source')
      if (source) {
        if (routeData && Array.isArray(routeData.coordinates) && routeData.coordinates.length > 0) {
          source.setData({
            type: 'Feature',
            properties: {
              distanceKm: routeData.distanceKm,
              duration: routeData.durationFormatted,
            },
            geometry: {
              type: 'LineString',
              coordinates: routeData.coordinates,
            },
          })

          // Dynamically fit map camera to road route bounds with generous padding
          const bounds = new LngLatBounds()
          routeData.coordinates.forEach((coord) => bounds.extend(coord))
          map.fitBounds(bounds, {
            padding: { top: 90, bottom: 90, left: 90, right: 90 },
            maxZoom: 13.5,
            duration: 1200,
          })
        } else {
          source.setData({
            type: 'FeatureCollection',
            features: [],
          })
        }
      }
    } catch (err) {
      console.warn('Notice updating shortest road path layer:', err)
    }
  }, [routeData, mapLoaded])

  // Synchronize alternative rescue road routes with MapLibre (dashed lines for alternative hubs)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapLoaded) return

    try {
      const source = map.getSource('alternative-road-routes-source')
      if (source) {
        if (rescuePlan && rescuePlan.allCandidates && rescuePlan.allCandidates.length > 1) {
          const altFeatures = rescuePlan.allCandidates
            .map((cand, idx) => {
              // The currently selected route is already rendered on the primary cyan layer
              if (idx === selectedRescueIndex) return null
              if (!cand.coordinates || cand.coordinates.length < 2) return null
              return {
                type: 'Feature',
                properties: {
                  candidateIndex: idx,
                  name: cand.warehouse.name,
                  distanceKm: cand.distanceKm,
                  duration: cand.durationFormatted,
                  estimatedCostINR: cand.estimatedCostINR,
                },
                geometry: {
                  type: 'LineString',
                  coordinates: cand.coordinates,
                },
              }
            })
            .filter(Boolean)

          source.setData({
            type: 'FeatureCollection',
            features: altFeatures,
          })
        } else {
          source.setData({
            type: 'FeatureCollection',
            features: [],
          })
        }
      }
    } catch (err) {
      console.warn('Notice updating alternative road routes layer:', err)
    }
  }, [rescuePlan, selectedRescueIndex, mapLoaded])

  // Synchronize Point A (Origin) and Point B (Destination) glowing markers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapLoaded) return

    routeMarkersRef.current.forEach((m) => m.remove())
    routeMarkersRef.current = []

    if (routeOrigin && Array.isArray(routeOrigin.coordinates) && routeOrigin.coordinates.length >= 2) {
      const el = document.createElement('div')
      el.className = 'ss-route-origin-pin'
      el.style.display = 'flex'
      el.style.flexDirection = 'column'
      el.style.alignItems = 'center'
      el.style.zIndex = '35'
      el.style.cursor = 'pointer'
      el.innerHTML = `
        <div style="
          background: #10b981;
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 9999px;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.5);
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        ">
          <span>🟢 A (Origin)</span>
        </div>
        <div style="
          width: 2px;
          height: 10px;
          background: #10b981;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
      `
      const marker = new Marker({ element: el })
        .setLngLat(getNodeDisplayCoordinates(routeOrigin, mapZoom))
        .addTo(map)
      routeMarkersRef.current.push(marker)
    }

    if (routeDest && Array.isArray(routeDest.coordinates) && routeDest.coordinates.length >= 2) {
      const el = document.createElement('div')
      el.className = 'ss-route-dest-pin'
      el.style.display = 'flex'
      el.style.flexDirection = 'column'
      el.style.alignItems = 'center'
      el.style.zIndex = '35'
      el.style.cursor = 'pointer'
      el.innerHTML = `
        <div style="
          background: #ef4444;
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 9999px;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.5);
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        ">
          <span>🏁 B (Destination)</span>
        </div>
        <div style="
          width: 2px;
          height: 10px;
          background: #ef4444;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
      `
      const marker = new Marker({ element: el })
        .setLngLat(getNodeDisplayCoordinates(routeDest, mapZoom))
        .addTo(map)
      routeMarkersRef.current.push(marker)
    }
  }, [routeOrigin, routeDest, mapLoaded, mapZoom])

  return (
    <div
      className={`ss-map-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        backgroundColor: '#f1f5f9',
      }}
    >
      {/* MapLibre DOM container */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', outline: 'none' }}
        tabIndex={0}
        aria-label="Interactive 3D SupplyChain Distribution Map"
      />

      {/* Loading Overlay */}
      {!mapLoaded && !mapError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(248, 250, 252, 0.85)',
            backdropFilter: 'blur(3px)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            Rendering 3D Facility Houses Simulation...
          </span>
        </div>
      )}

      {/* Error Banner */}
      {mapError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            padding: '20px',
            textAlign: 'center',
            zIndex: 20,
          }}
        >
          <AlertCircle size={32} color="#d94b50" style={{ marginBottom: '10px' }} />
          <h4 style={{ margin: '0 0 6px', color: '#17324d', fontSize: '15px', fontWeight: 700 }}>
            Map Engine Notice
          </h4>
          <p style={{ margin: 0, color: '#64778b', fontSize: '13px', maxWidth: '380px' }}>
            {mapError}
          </p>
        </div>
      )}

      {/* Top Controls Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 5,
          maxWidth: 'calc(100% - 70px)',
        }}
      >
        {/* Row 1: Dataset Facility Cluster Selectors */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(6px)',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '2px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            }}
          >
            {Object.values(DATASET_CLUSTERS).map((cluster) => {
              const isActive = activeCluster === cluster.id
              return (
                <button
                  key={cluster.id}
                  type="button"
                  onClick={() => handleSelectCluster(cluster.id)}
                  title={cluster.description}
                  style={{
                    backgroundColor: isActive ? '#2563eb' : 'transparent',
                    color: isActive ? '#ffffff' : '#334155',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{cluster.icon}</span>
                  <span>{cluster.shortLabel}</span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                      color: isActive ? '#ffffff' : '#64748b',
                      fontWeight: 700,
                    }}
                  >
                    {cluster.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Reset View Button */}
          <button
            type="button"
            onClick={handleResetView}
            className="btn btn-secondary"
            title="Reset Perspective to Active Cluster"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(4px)',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>

        {/* Row 2: Visualization Layer Toggles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {/* 3D Tilt View Toggle */}
          <button
            type="button"
            onClick={handleToggle3D}
            title="Toggle 3D Perspective Tilt"
            aria-pressed={is3D}
            style={{
              backgroundColor: is3D ? '#0f172a' : 'rgba(255, 255, 255, 0.95)',
              color: is3D ? '#38bdf8' : '#1e293b',
              border: is3D ? '1px solid #38bdf8' : '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '5px 11px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Compass size={14} color={is3D ? '#38bdf8' : '#64748b'} />
            <span>3D Tilt View</span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
                backgroundColor: is3D ? 'rgba(56, 189, 248, 0.2)' : '#e2e8f0',
                color: is3D ? '#38bdf8' : '#475569',
              }}
            >
              {is3D ? '56°' : '2D'}
            </span>
          </button>

          {/* 3D Houses Toggle */}
          <button
            type="button"
            onClick={handleToggleHouses}
            title="Toggle 3D Facility Houses Simulation Layer"
            aria-pressed={show3DHouses}
            style={{
              backgroundColor: show3DHouses ? '#2563eb' : 'rgba(255, 255, 255, 0.95)',
              color: show3DHouses ? '#ffffff' : '#1e293b',
              border: show3DHouses ? '1px solid #2563eb' : '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '5px 11px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={14} color={show3DHouses ? '#93c5fd' : '#2563eb'} />
            <span>3D Houses</span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
                backgroundColor: show3DHouses ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: show3DHouses ? '#ffffff' : '#475569',
              }}
            >
              {show3DHouses ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Shipment Arcs Toggle */}
          <button
            type="button"
            onClick={() => setShowArcs((prev) => !prev)}
            title="Toggle Shipment Arcs (DC -> Store Transport Routes)"
            aria-pressed={showArcs}
            style={{
              backgroundColor: showArcs ? '#0284c7' : 'rgba(255, 255, 255, 0.95)',
              color: showArcs ? '#ffffff' : '#1e293b',
              border: showArcs ? '1px solid #0284c7' : '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '5px 11px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Navigation size={13} color={showArcs ? '#bae6fd' : '#0284c7'} />
            <span>Shipment Arcs</span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
                backgroundColor: showArcs ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: showArcs ? '#ffffff' : '#475569',
              }}
            >
              {showArcs ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Demand Heatmap Toggle */}
          <button
            type="button"
            onClick={() => setShowHeatmap((prev) => !prev)}
            title="Toggle Synthetic Demand Heatmap"
            aria-pressed={showHeatmap}
            style={{
              backgroundColor: showHeatmap ? '#ea580c' : 'rgba(255, 255, 255, 0.95)',
              color: showHeatmap ? '#ffffff' : '#1e293b',
              border: showHeatmap ? '1px solid #ea580c' : '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '5px 11px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Flame size={14} color={showHeatmap ? '#fde047' : '#ea580c'} />
            <span>Demand Heatmap</span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
                backgroundColor: showHeatmap ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: showHeatmap ? '#ffffff' : '#475569',
              }}
            >
              {showHeatmap ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Facility Pins Toggle */}
          <button
            type="button"
            onClick={() => setShowPins((prev) => !prev)}
            title="Toggle 2D Facility Marker Badges"
            aria-pressed={showPins}
            style={{
              backgroundColor: showPins ? '#475569' : 'rgba(255, 255, 255, 0.95)',
              color: showPins ? '#ffffff' : '#1e293b',
              border: showPins ? '1px solid #475569' : '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '5px 11px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <MapPin size={13} color={showPins ? '#cbd5e1' : '#64748b'} />
            <span>Pins</span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
                backgroundColor: showPins ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: showPins ? '#ffffff' : '#475569',
              }}
            >
              {showPins ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Shortest Road Path Planner Toggle */}
          <button
            type="button"
            onClick={() => setShowRoutePlanner((prev) => !prev)}
            title="Shortest road transport route between two facilities"
            aria-pressed={showRoutePlanner || Boolean(routeData)}
            style={{
              backgroundColor: showRoutePlanner || routeData ? '#0284c7' : 'rgba(255, 255, 255, 0.95)',
              color: showRoutePlanner || routeData ? '#ffffff' : '#1e293b',
              border: showRoutePlanner || routeData ? '1px solid #0284c7' : '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '5px 11px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Route size={14} color={showRoutePlanner || routeData ? '#ffffff' : '#0284c7'} />
            <span>Shortest Road Path</span>
            {routeData ? (
              <span
                style={{
                  fontSize: '9.5px',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 800,
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                }}
              >
                {routeData.distanceKm} km
              </span>
            ) : (
              <span
                style={{
                  fontSize: '9.5px',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  backgroundColor: showRoutePlanner ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: showRoutePlanner ? '#ffffff' : '#475569',
                }}
              >
                {routeOrigin && !routeDest ? 'Pick Dest' : 'Road'}
              </span>
            )}
          </button>
        </div>

        {/* Row 3: Interactive Route Planning Bar */}
        {(showRoutePlanner || routeOrigin || routeData) && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.97)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '6px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>
              <Truck size={14} />
              <span>Route:</span>
            </div>

            {/* Origin Dropdown */}
            <select
              value={routeOrigin?.id || ''}
              onChange={(e) => {
                const node = networkNodes.find((n) => n.id === e.target.value)
                setRouteOrigin(node || null)
                if (node && routeDest) {
                  calculateRouteBetweenNodes(node, routeDest)
                }
              }}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #94a3b8',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                fontWeight: 600,
                maxWidth: '180px',
              }}
            >
              <option value="">🟢 Select Origin A...</option>
              {networkNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>

            {/* Swap Button */}
            <button
              type="button"
              onClick={() => {
                const temp = routeOrigin
                setRouteOrigin(routeDest)
                setRouteDest(temp)
                if (routeDest && temp) {
                  calculateRouteBetweenNodes(routeDest, temp)
                }
              }}
              title="Swap Origin and Destination"
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '3px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ArrowLeftRight size={12} color="#475569" />
            </button>

            {/* Destination Dropdown */}
            <select
              value={routeDest?.id || ''}
              onChange={(e) => {
                const node = networkNodes.find((n) => n.id === e.target.value)
                setRouteDest(node || null)
                if (routeOrigin && node) {
                  calculateRouteBetweenNodes(routeOrigin, node)
                }
              }}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #94a3b8',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                fontWeight: 600,
                maxWidth: '180px',
              }}
            >
              <option value="">🏁 Select Destination B...</option>
              {networkNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>

            {/* Auto-Rescue Low-Stock Store Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', borderLeft: '1px solid #cbd5e1', paddingLeft: '8px' }}>
              <select
                value={rescuePlan?.targetStore?.id || ''}
                onChange={(e) => {
                  const target = networkNodes.find((n) => n.id === e.target.value)
                  if (target) {
                    triggerStoreRescue(target)
                  }
                }}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #ef4444',
                  backgroundColor: '#fef2f2',
                  color: '#b91c1c',
                  fontWeight: 700,
                  cursor: 'pointer',
                  maxWidth: '190px',
                }}
              >
                <option value="">⚡ Auto-Rescue Risky Store...</option>
                {networkNodes
                  .filter((n) => n.type === 'Retail Store')
                  .sort((a, b) => (a.status === 'Critical Stockout' ? -1 : 1))
                  .map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.status || 'Active'})
                    </option>
                  ))}
              </select>
            </div>

            {/* Loading Indicator */}
            {isRouteLoading && (
              <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                Computing Road Path...
              </span>
            )}

            {/* Close Shortest Path Button */}
            {(routeOrigin || routeDest || routeData) && (
              <button
                type="button"
                onClick={handleClearRoute}
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fca5a5',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: 'auto',
                }}
                title="Close shortest path and reset route"
              >
                <X size={13} />
                Close Shortest Path
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Hover Tooltip (Interactive on 3D Houses & Arcs) */}
      {hoverInfo && hoverInfo.data && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(hoverInfo.x + 14, window.innerWidth - 340)}px`,
            top: `${Math.max(12, hoverInfo.y - 12)}px`,
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '11px',
            pointerEvents: 'none',
            zIndex: 30,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.18)',
            minWidth: '240px',
            maxWidth: '320px',
          }}
        >
          {hoverInfo.type === 'house' ? (
            <div>
              {/* Header: Facility Name and Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 800, fontSize: '12px', color: '#f8fafc' }}>
                  {hoverInfo.data.name}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor:
                      hoverInfo.data.type === 'Warehouse'
                        ? '#2563eb'
                        : hoverInfo.data.riskLevel === 'Critical'
                        ? '#ef4444'
                        : hoverInfo.data.riskLevel === 'Warning'
                        ? '#f59e0b'
                        : '#10b981',
                  }}
                >
                  {hoverInfo.data.type === 'Warehouse' ? 'Regional DC' : 'Retail Store'}
                </span>
              </div>

              {/* Subtitle: Architectural Part & Address */}
              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '6px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>{hoverInfo.data.partName || '3D Complex'}</span>
                {' • '}
                <span>{hoverInfo.data.address || `${hoverInfo.data.region} Region`}</span>
              </div>

              {/* Stock and Status Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  padding: '6px',
                  borderRadius: '6px',
                  marginBottom: '6px',
                }}
              >
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Stock On-Hand:</span>
                  <div style={{ fontWeight: 700, color: '#e2e8f0' }}>
                    {(hoverInfo.data.stockOnHand || 0).toLocaleString()} units
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Weekly Demand:</span>
                  <div style={{ fontWeight: 700, color: '#e2e8f0' }}>
                    {(hoverInfo.data.weeklyDemand || 0).toLocaleString()} u/wk
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Storage Capacity:</span>
                  <div style={{ fontWeight: 700, color: '#e2e8f0' }}>
                    {(hoverInfo.data.capacity || 0).toLocaleString()} units
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Days of Supply:</span>
                  <div
                    style={{
                      fontWeight: 700,
                      color:
                        hoverInfo.data.riskLevel === 'Critical'
                          ? '#f87171'
                          : hoverInfo.data.riskLevel === 'Warning'
                          ? '#fbbf24'
                          : '#34d399',
                    }}
                  >
                    {hoverInfo.data.daysOfSupply ? `${hoverInfo.data.daysOfSupply} days` : '30+ days (Hub)'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '9px', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                Dataset Point • distributionNetwork3D.json • Click to select facility
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 800, fontSize: '12px', color: '#f8fafc' }}>
                  Transit Corridor {hoverInfo.data.id}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: hoverInfo.data.status === 'disrupted' ? '#ef4444' : '#10b981',
                  }}
                >
                  {hoverInfo.data.status === 'disrupted' ? 'Disrupted' : 'Active'}
                </span>
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '6px' }}>
                {hoverInfo.data.statusLabel || 'Scheduled Freight Route'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', backgroundColor: 'rgba(255,255,255,0.06)', padding: '6px', borderRadius: '6px', marginBottom: '6px' }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Distance:</span>
                  <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{hoverInfo.data.distanceKm} km</div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Lead Time:</span>
                  <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{hoverInfo.data.leadTimeHours} hrs</div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Throughput Cap:</span>
                  <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{hoverInfo.data.capacityPerDay} u/day</div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Unit Transit Cost:</span>
                  <div style={{ fontWeight: 700, color: '#e2e8f0' }}>${hoverInfo.data.transportCost}</div>
                </div>
              </div>
              <div style={{ fontSize: '9px', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                Logistics Lane • Verified Dataset Corridor
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Layer Dynamic Legend (Floating Bottom-Left) */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(6px)',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          zIndex: 6,
          maxWidth: '380px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
            <Layers size={13} color="#2563eb" />
            3D Facility Houses Simulation (Dataset Points)
          </div>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: '#475569',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              padding: '1px 5px',
              borderRadius: '3px',
            }}
          >
            {DATASET_CLUSTERS[activeCluster]?.label || 'Dataset Points'}
          </span>
        </div>

        {/* 3D House Components */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '10px', color: '#334155', marginBottom: '6px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#2563eb' }} />
            DC Main Hall (180m)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#3b82f6' }} />
            DC Control Tower (280m)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#10b981' }} />
            Healthy Storehouse (120m)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#f59e0b' }} />
            Low Stock Storehouse
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#ef4444' }} />
            Critical Stockout
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#94a3b8' }} />
            Storefront Portico
          </span>
        </div>

        {showArcs && (
          <div style={{ marginBottom: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              Shipment Flows (DC → Store Arcs)
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: '#334155' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '16px', height: '3px', background: 'linear-gradient(to right, #2563eb, #10b981)', borderRadius: '2px' }} />
                Active Corridors
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '16px', height: '3px', background: '#ef4444', borderRadius: '2px' }} />
                Disrupted Lane
              </span>
            </div>
          </div>
        )}

        {showHeatmap && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              <span>Demand Density</span>
              <span style={{ fontWeight: 600, color: '#94a3b8' }}>~500 to ~3.6k u/wk</span>
            </div>
            <div
              style={{
                height: '6px',
                borderRadius: '3px',
                background: 'linear-gradient(to right, #38bdf8, #3b82f6, #eab308, #f97316, #ef4444)',
                marginBottom: '4px',
              }}
            />
          </div>
        )}

        {/* Attribution & Notice */}
        <div
          style={{
            fontSize: '9px',
            color: '#64748b',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '5px',
            lineHeight: '1.35',
            marginTop: '6px',
          }}
        >
          Rendering 3D architectural houses exclusively for the 15 dataset facilities across India.
        </div>
      </div>

      {/* Floating Shortest Road Route Card (Draggable anywhere on screen, positioned slightly upside) */}
      {routeData && (
        <div
          style={{
            position: 'absolute',
            bottom: '130px',
            right: '16px',
            transform: `translate3d(${cardOffset.x}px, ${cardOffset.y}px, 0)`,
            transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
            backgroundColor: 'rgba(15, 23, 42, 0.97)',
            backdropFilter: 'blur(12px)',
            border: rescuePlan ? '1px solid #ef4444' : '1px solid #38bdf8',
            borderRadius: '14px',
            padding: '14px 16px',
            color: '#ffffff',
            boxShadow: isDragging
              ? '0 24px 48px rgba(0,0,0,0.6), 0 0 0 2px #38bdf8'
              : '0 12px 36px rgba(0,0,0,0.45)',
            zIndex: 40,
            width: '380px',
            maxWidth: 'calc(100% - 24px)',
            maxHeight: 'calc(100vh - 220px)',
            overflowY: 'auto',
            userSelect: 'none',
          }}
        >
          {/* Card Header with Drag Handle & Close Button */}
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleTouchStart}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
              paddingBottom: '6px',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            title="Click and drag to reposition route card anywhere on screen"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                <GripVertical size={14} />
              </div>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '4px',
                  backgroundColor: rescuePlan ? '#ef4444' : '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {rescuePlan ? <Zap size={13} color="#ffffff" /> : <Truck size={13} color="#ffffff" />}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: rescuePlan ? '#f87171' : '#38bdf8',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                }}
              >
                {rescuePlan ? '⚡ AUTO-RESCUE SHORTEST PATH' : 'SHORTEST ROAD TRANSPORT'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearRoute}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                color: '#cbd5e1',
                borderRadius: '4px',
                padding: '3px 7px',
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Close shortest path and clear route"
            >
              <X size={12} />
              Close
            </button>
          </div>

          {/* Rescue Notification Banner */}
          {rescuePlan && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.16)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '6px',
                padding: '6px 8px',
                marginBottom: '8px',
                fontSize: '10.5px',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Auto-connected nearest center via shortest road path.</span>
              <span style={{ fontWeight: 800, color: '#4ade80' }}>✓ Protected</span>
            </div>
          )}

          {/* Origin & Destination Facilities */}
          <div style={{ fontSize: '11px', lineHeight: '1.4', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span
                style={{
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                A
              </span>
              <span style={{ color: '#94a3b8' }}>
                {rescuePlan ? 'Supplying Hub:' : 'Origin:'}
              </span>
              <strong
                style={{
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {routeData.originName || routeOrigin?.name}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                B
              </span>
              <span style={{ color: '#94a3b8' }}>
                {rescuePlan ? 'Rescue Target Store:' : 'Destination:'}
              </span>
              <strong
                style={{
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {routeData.destName || routeDest?.name}
              </strong>
            </div>
          </div>

          {/* Primary Estimations Grid: Distance, Transit Time, Freight Cost, Units / CO2 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Road Distance
              </div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#38bdf8' }}>
                {routeData.distanceKm} km
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Expected Transit
              </div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#4ade80' }}>
                {routeData.durationFormatted}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Freight Transport Cost
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#fbbf24' }}>
                ₹{(routeData.estimatedCostINR || Math.round(1850 + routeData.distanceKm * 24.5)).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                {rescuePlan ? 'Stock Required' : 'Carbon Footprint'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#c084fc' }}>
                {rescuePlan
                  ? `${(routeData.unitsNeeded || 2400).toLocaleString('en-IN')} units`
                  : `${routeData.co2Kg || Number((routeData.distanceKm * 0.16 * 2.2).toFixed(1))} kg CO₂e`}
              </div>
            </div>
          </div>

          {/* Detailed Estimations Row (Fuel, Tolls, CO2, Stockout Avoidance) */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px',
              padding: '6px 8px',
              marginBottom: '10px',
              fontSize: '10.5px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              color: '#94a3b8',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>⛽ Fuel & Tolls:</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                Fuel: ₹{(routeData.estimatedFuelINR || Math.round((routeData.distanceKm / 4.2) * 94)).toLocaleString('en-IN')} • Tolls: ₹{(routeData.estimatedTollINR || Math.round(routeData.distanceKm * 3.6)).toLocaleString('en-IN')}
              </span>
            </div>
            {rescuePlan && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🌱 Carbon Footprint:</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                  {routeData.co2Kg || Number((routeData.distanceKm * 0.16 * 2.2).toFixed(1))} kg CO₂e
                </span>
              </div>
            )}
            {rescuePlan && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🛡️ Stockout Risk Mitigation:</span>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>
                  14-Day Supply Buffer Secured
                </span>
              </div>
            )}
          </div>

          {/* Alternative Rescue Supply Paths */}
          {rescuePlan && rescuePlan.allCandidates && rescuePlan.allCandidates.length > 1 && (
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '8px',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#e2e8f0' }}>
                  Alternative Supply Centers ({rescuePlan.allCandidates.length - 1} available):
                </span>
                <span style={{ fontSize: '9px', color: '#c084fc' }}>
                  Click path or dashed line on map
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {rescuePlan.allCandidates.map((cand, idx) => {
                  const isSelected = idx === selectedRescueIndex
                  return (
                    <div
                      key={cand.warehouse.id || idx}
                      onClick={() => handleSelectRescueAlternative(idx)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(30, 41, 59, 0.6)',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.8)'
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#38bdf8' : '#ffffff' }}>
                            {cand.warehouse.name}
                          </span>
                          {idx === 0 && (
                            <span style={{ fontSize: '8.5px', backgroundColor: '#0284c7', color: '#fff', padding: '1px 4px', borderRadius: '3px', fontWeight: 800 }}>
                              SHORTEST
                            </span>
                          )}
                          {isSelected && (
                            <span style={{ fontSize: '8.5px', backgroundColor: '#10b981', color: '#fff', padding: '1px 4px', borderRadius: '3px', fontWeight: 800 }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {cand.distanceKm} km • {cand.durationFormatted} • ₹{cand.estimatedCostINR.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectRescueAlternative(idx)
                        }}
                        style={{
                          backgroundColor: isSelected ? '#38bdf8' : 'rgba(255,255,255,0.12)',
                          color: isSelected ? '#0f172a' : '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '3px 7px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isSelected ? 'Selected' : 'Choose Path'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Drag instruction & Close Shortest Path Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#94a3b8',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '6px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>🛣️ Highway road route</span>
              <span style={{ color: '#64748b' }}>• Drag to move</span>
            </span>
            <button
              type="button"
              onClick={handleClearRoute}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '5px',
                padding: '4px 8px',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ Close Shortest Path
            </button>
          </div>
        </div>
      )}

      {/* Guide Toast when Origin is selected, waiting for Destination (Slightly upside) */}
      {routeOrigin && !routeDest && (
        <div
          style={{
            position: 'absolute',
            bottom: '130px',
            right: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #10b981',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#ffffff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 40,
            maxWidth: '320px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            A
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Origin: {routeOrigin.name}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#4ade80' }}>
              Click 2nd location on map to trace shortest road path
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearRoute}
            style={{
              background: 'transparent',
              border: '1px solid #475569',
              color: '#94a3b8',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Compact Attribution (Bottom-Right) */}
      <div
        style={{
          position: 'absolute',
          bottom: '4px',
          right: '8px',
          fontSize: '10px',
          color: '#64748b',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          padding: '2px 6px',
          borderRadius: '4px',
          zIndex: 5,
        }}
      >
        MapLibre GL • deck.gl • © OpenStreetMap • SupplyShield AI
      </div>

      {/* 3D Inventory Shelf Inspector Modal (Scale 1 to 7) */}
      <InventoryShelfModal
        isOpen={!!inspectingNode}
        node={inspectingNode}
        onClose={() => setInspectingNode(null)}
        onTriggerRescue={(target) => {
          triggerStoreRescue(target)
          setInspectingNode(null)
        }}
      />
    </div>
  )
}
