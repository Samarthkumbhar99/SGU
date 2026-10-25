import fs from 'fs'
import csv from 'csv-parser'
import { randomUUID } from 'crypto'
import Product from '../models/Product.js'
import Warehouse from '../models/Warehouse.js'
import Supplier from '../models/Supplier.js'
import Inventory from '../models/Inventory.js'
import DemandHistory from '../models/DemandHistory.js'
import TransportLane from '../models/TransportLane.js'
import DataImportRun from '../models/DataImportRun.js'
import logger from '../utils/logger.js'

export const REQUIRED_CSV_COLUMNS = [
  'Date',
  'SKU_ID',
  'Warehouse_ID',
  'Supplier_ID',
  'Region',
  'Units_Sold',
  'Inventory_Level',
  'Supplier_Lead_Time_Days',
  'Reorder_Point',
  'Order_Quantity',
  'Unit_Cost',
  'Unit_Price',
  'Promotion_Flag',
  'Stockout_Flag',
  'Demand_Forecast',
]

/**
 * Parses numeric field strictly without converting empty/null to 0
 */
function parseStrictNumber(val, fieldName) {
  if (val === undefined || val === null || val === '') {
    throw new Error(`Missing value for numeric field '${fieldName}'`)
  }
  const num = Number(val)
  if (isNaN(num)) {
    throw new Error(`Invalid numeric value '${val}' for field '${fieldName}'`)
  }
  return num
}

/**
 * Validates and normalizes YYYY-MM-DD date
 */
function parseDate(val) {
  if (!val || typeof val !== 'string') {
    throw new Error('Missing observation date')
  }
  const trimmed = val.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(`Date '${val}' must be in YYYY-MM-DD format`)
  }
  const date = new Date(trimmed)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid calendar date '${val}'`)
  }
  return { date, dateString: trimmed }
}

/**
 * Ingest supply chain CSV file with chunked processing, validation, and audit tracking
 */
export async function ingestSupplyChainCsv(filePath, options = {}) {
  const { isDryRun = false, importedBy = 'system' } = options
  const startTime = Date.now()
  const importId = `IMP-${Date.now()}-${randomUUID().slice(0, 6)}`

  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset file not found at path: ${filePath}`)
  }

  const fileStats = fs.statSync(filePath)
  const filename = filePath.split(/[\\/]/).pop()

  logger.info({ importId, filePath, isDryRun }, 'Starting supply chain dataset ingestion')

  let headersVerified = false
  let totalRows = 0
  let validRows = 0
  let rejectedRows = 0
  let duplicateRows = 0
  let missingValuesCount = 0
  let stockoutZeroCount = 0
  let promotionCount = 0

  const rejections = []
  const distinctSkus = new Set()
  const distinctWarehouses = new Set()
  const distinctSuppliers = new Set()
  const distinctRegions = new Set()
  let minDate = null
  let maxDate = null

  // Deduplication set for current run
  const seenObservationKeys = new Set()

  // Entities to aggregate and upsert
  const productsMap = new Map()
  const warehousesMap = new Map()
  const suppliersMap = new Map()
  const lanesMap = new Map()
  const inventoryLatestMap = new Map()
  const demandRecordsChunk = []

  const CHUNK_SIZE = 5000

  // Helper to flush demand records chunk to MongoDB
  async function flushDemandChunk(chunk) {
    if (isDryRun || chunk.length === 0) return
    const operations = chunk.map((record) => ({
      updateOne: {
        filter: {
          dateString: record.dateString,
          skuId: record.skuId,
          warehouseId: record.warehouseId,
        },
        update: { $set: record },
        upsert: true,
      },
    }))
    await DemandHistory.bulkWrite(operations, { ordered: false })
  }

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath).pipe(
      csv({
        mapHeaders: ({ header }) => header.trim(),
      })
    )

    stream.on('headers', (headers) => {
      const missing = REQUIRED_CSV_COLUMNS.filter((col) => !headers.includes(col))
      if (missing.length > 0) {
        stream.destroy(
          new Error(
            `Required CSV headers missing: ${missing.join(', ')}. Found: ${headers.join(', ')}`
          )
        )
      }
      headersVerified = true
    })

    stream.on('data', async (row) => {
      totalRows++
      const rowNum = totalRows + 1 // accounts for CSV header

      try {
        // 1. Date Validation
        const { date, dateString } = parseDate(row.Date)
        if (!minDate || dateString < minDate) minDate = dateString
        if (!maxDate || dateString > maxDate) maxDate = dateString

        // 2. String Fields
        const skuId = (row.SKU_ID || '').trim().toUpperCase()
        const warehouseId = (row.Warehouse_ID || '').trim().toUpperCase()
        const supplierId = (row.Supplier_ID || '').trim().toUpperCase()
        const region = (row.Region || '').trim()

        if (!skuId) throw new Error('Missing SKU_ID')
        if (!warehouseId) throw new Error('Missing Warehouse_ID')
        if (!supplierId) throw new Error('Missing Supplier_ID')
        if (!region) throw new Error('Missing Region')

        distinctSkus.add(skuId)
        distinctWarehouses.add(warehouseId)
        distinctSuppliers.add(supplierId)
        distinctRegions.add(region)

        // 3. Duplicate check for identical observation within dataset
        const obsKey = `${dateString}__${skuId}__${warehouseId}`
        if (seenObservationKeys.has(obsKey)) {
          duplicateRows++
          throw new Error(`Duplicate observation for Date: ${dateString}, SKU: ${skuId}, WH: ${warehouseId}`)
        }
        seenObservationKeys.add(obsKey)

        // 4. Numeric Validations
        const unitsSold = parseStrictNumber(row.Units_Sold, 'Units_Sold')
        const inventoryLevel = parseStrictNumber(row.Inventory_Level, 'Inventory_Level')
        const supplierLeadTimeDays = parseStrictNumber(row.Supplier_Lead_Time_Days, 'Supplier_Lead_Time_Days')
        const reorderPoint = parseStrictNumber(row.Reorder_Point, 'Reorder_Point')
        const orderQuantity = parseStrictNumber(row.Order_Quantity, 'Order_Quantity')
        const unitCost = parseStrictNumber(row.Unit_Cost, 'Unit_Cost')
        const unitPrice = parseStrictNumber(row.Unit_Price, 'Unit_Price')
        const promotionFlag = parseStrictNumber(row.Promotion_Flag, 'Promotion_Flag')
        const stockoutFlag = parseStrictNumber(row.Stockout_Flag, 'Stockout_Flag')
        const demandForecast = parseStrictNumber(row.Demand_Forecast, 'Demand_Forecast')

        // Range checks
        if (unitsSold < 0) throw new Error(`Negative Units_Sold: ${unitsSold}`)
        if (inventoryLevel < 0) throw new Error(`Negative Inventory_Level: ${inventoryLevel}`)
        if (unitCost < 0) throw new Error(`Negative Unit_Cost: ${unitCost}`)
        if (unitPrice < 0) throw new Error(`Negative Unit_Price: ${unitPrice}`)
        if (unitCost > unitPrice) {
          logger.warn(`Row ${rowNum}: Unit_Cost (${unitCost}) exceeds Unit_Price (${unitPrice})`)
        }
        if (![0, 1].includes(promotionFlag)) {
          throw new Error(`Promotion_Flag must be 0 or 1, got ${promotionFlag}`)
        }
        if (![0, 1].includes(stockoutFlag)) {
          throw new Error(`Stockout_Flag must be 0 or 1, got ${stockoutFlag}`)
        }

        if (stockoutFlag === 0) stockoutZeroCount++
        if (promotionFlag === 1) promotionCount++

        validRows++

        // Aggregate Product entity
        if (!productsMap.has(skuId)) {
          productsMap.set(skuId, {
            skuId,
            productName: `Product ${skuId}`,
            category: 'General FMCG',
            unitCost,
            unitPrice,
            supplierId,
            leadTimeDays: supplierLeadTimeDays,
            reorderPoint,
          })
        }

        // Aggregate Warehouse entity
        if (!warehousesMap.has(warehouseId)) {
          warehousesMap.set(warehouseId, {
            warehouseId,
            warehouseName: `Warehouse ${warehouseId}`,
            regionsServed: new Set([region]),
            storageCapacityUnits: 15000,
          })
        } else {
          warehousesMap.get(warehouseId).regionsServed.add(region)
        }

        // Aggregate Supplier entity
        if (!suppliersMap.has(supplierId)) {
          suppliersMap.set(supplierId, {
            supplierId,
            supplierName: `Supplier ${supplierId}`,
            defaultLeadTimeDays: supplierLeadTimeDays,
            regions: new Set([region]),
          })
        } else {
          suppliersMap.get(supplierId).regions.add(region)
        }

        // Aggregate TransportLane entity
        const laneId = `${warehouseId}__${region.toUpperCase()}`
        if (!lanesMap.has(laneId)) {
          lanesMap.set(laneId, {
            laneId,
            sourceWarehouseId: warehouseId,
            destinationRegion: region,
            unitTransportCost: 0.05,
            leadTimeHours: 12.0,
            availabilityStatus: 'active',
          })
        }

        // Latest inventory snapshot per (SKU, Warehouse)
        const invKey = `${skuId}__${warehouseId}`
        const existingInv = inventoryLatestMap.get(invKey)
        if (!existingInv || dateString >= existingInv.dateString) {
          inventoryLatestMap.set(invKey, {
            skuId,
            warehouseId,
            inventoryLevel,
            reorderPoint,
            orderQuantity,
            supplierId,
            supplierLeadTimeDays,
            unitCost,
            unitPrice,
            lastObservationDate: date,
            dateString,
          })
        }

        // Prepare DemandHistory record
        demandRecordsChunk.push({
          date,
          dateString,
          skuId,
          warehouseId,
          region,
          supplierId,
          unitsSold,
          inventoryLevel,
          demandForecast,
          promotionFlag,
          stockoutFlag,
          orderQuantity,
          unitCost,
          unitPrice,
        })

        // Flush chunk when limit reached to preserve memory
        if (demandRecordsChunk.length >= CHUNK_SIZE) {
          stream.pause()
          const toFlush = demandRecordsChunk.splice(0, demandRecordsChunk.length)
          await flushDemandChunk(toFlush)
          stream.resume()
        }
      } catch (err) {
        rejectedRows++
        if (err.message.includes('Missing value')) {
          missingValuesCount++
        }
        if (rejections.length < 100) {
          rejections.push({
            rowNumber: rowNum,
            reason: err.message,
            rawSnippet: JSON.stringify(row).slice(0, 150),
          })
        }
      }
    })

    stream.on('error', (err) => {
      logger.error({ err: err.message }, 'CSV stream processing failed')
      reject(err)
    })

    stream.on('end', async () => {
      try {
        // Flush remaining demand records
        if (demandRecordsChunk.length > 0) {
          await flushDemandChunk(demandRecordsChunk)
        }

        let importedRows = 0

        // In non-dry-run mode, upsert master records
        if (!isDryRun) {
          // 1. Products
          const productOps = Array.from(productsMap.values()).map((p) => ({
            updateOne: {
              filter: { skuId: p.skuId },
              update: { $set: p },
              upsert: true,
            },
          }))
          if (productOps.length > 0) await Product.bulkWrite(productOps)

          // 2. Warehouses
          const whOps = Array.from(warehousesMap.values()).map((w) => ({
            updateOne: {
              filter: { warehouseId: w.warehouseId },
              update: {
                $set: {
                  warehouseName: w.warehouseName,
                  storageCapacityUnits: w.storageCapacityUnits,
                },
                $addToSet: { regionsServed: { $each: Array.from(w.regionsServed) } },
              },
              upsert: true,
            },
          }))
          if (whOps.length > 0) await Warehouse.bulkWrite(whOps)

          // 3. Suppliers
          const supOps = Array.from(suppliersMap.values()).map((s) => ({
            updateOne: {
              filter: { supplierId: s.supplierId },
              update: {
                $set: {
                  supplierName: s.supplierName,
                  defaultLeadTimeDays: s.defaultLeadTimeDays,
                },
                $addToSet: { regions: { $each: Array.from(s.regions) } },
              },
              upsert: true,
            },
          }))
          if (supOps.length > 0) await Supplier.bulkWrite(supOps)

          // 4. Transport Lanes
          const laneOps = Array.from(lanesMap.values()).map((l) => ({
            updateOne: {
              filter: { laneId: l.laneId },
              update: { $set: l },
              upsert: true,
            },
          }))
          if (laneOps.length > 0) await TransportLane.bulkWrite(laneOps)

          // 5. Inventory Snapshots
          const invOps = Array.from(inventoryLatestMap.values()).map((inv) => {
            const { dateString, ...fields } = inv
            return {
              updateOne: {
                filter: { skuId: inv.skuId, warehouseId: inv.warehouseId },
                update: { $set: fields },
                upsert: true,
              },
            }
          })
          if (invOps.length > 0) await Inventory.bulkWrite(invOps)

          importedRows = validRows
        }

        const durationMs = Date.now() - startTime

        const summary = {
          importId,
          filename,
          filePath,
          fileSizeBytes: fileStats.size,
          isDryRun,
          status: isDryRun ? 'dry_run' : 'completed',
          startedAt: new Date(startTime),
          completedAt: new Date(),
          durationMs,
          totalRows,
          validRows,
          importedRows,
          rejectedRows,
          duplicateRows,
          metrics: {
            dateRange: { start: minDate, end: maxDate },
            distinctSKUs: distinctSkus.size,
            distinctWarehouses: distinctWarehouses.size,
            distinctSuppliers: distinctSuppliers.size,
            distinctRegions: distinctRegions.size,
            missingValuesCount,
            stockoutZeroCount,
            promotionCount,
          },
          rejections,
          importedBy,
        }

        // Record import run in database if DB is connected
        try {
          await DataImportRun.create(summary)
        } catch (dbErr) {
          logger.warn({ err: dbErr.message }, 'Failed to persist DataImportRun log')
        }

        logger.info(
          {
            importId,
            totalRows,
            validRows,
            rejectedRows,
            duplicateRows,
            durationMs,
            isDryRun,
          },
          'CSV Ingestion finished successfully'
        )

        resolve(summary)
      } catch (err) {
        reject(err)
      }
    })
  })
}

export default { ingestSupplyChainCsv, REQUIRED_CSV_COLUMNS }
