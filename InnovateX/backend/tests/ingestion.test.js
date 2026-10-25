import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import connectDB, { disconnectDB } from '../src/config/db.js'
import Product from '../src/models/Product.js'
import Warehouse from '../src/models/Warehouse.js'
import Inventory from '../src/models/Inventory.js'
import DemandHistory from '../src/models/DemandHistory.js'
import { ingestSupplyChainCsv, REQUIRED_CSV_COLUMNS } from '../src/services/ingestService.js'

describe('Data Ingestion & Integrity Engine', () => {
  let tempDir

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'supplyshield-test-'))
    await connectDB()
  })

  afterAll(async () => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
    await disconnectDB()
  })

  it('Product model should reject negative prices and costs', async () => {
    const invalidProduct = new Product({
      skuId: 'TEST_SKU',
      productName: 'Test Product',
      unitCost: -5.0,
      unitPrice: 10.0,
    })

    await expect(invalidProduct.validate()).rejects.toThrow(/Unit cost cannot be negative/)
  })

  it('DemandHistory model should reject invalid date strings', async () => {
    const invalidDemand = new DemandHistory({
      date: new Date(),
      dateString: '2024/01/01', // not YYYY-MM-DD
      skuId: 'SKU_1',
      warehouseId: 'WH_1',
      region: 'North',
      unitsSold: 10,
      inventoryLevel: 100,
      demandForecast: 10,
      unitCost: 5,
      unitPrice: 10,
    })

    await expect(invalidDemand.validate()).rejects.toThrow(/YYYY-MM-DD format/)
  })

  it('ingestSupplyChainCsv should fail clearly when required headers are missing', async () => {
    const badCsvPath = path.join(tempDir, 'missing_headers.csv')
    fs.writeFileSync(badCsvPath, 'Date,SKU_ID,Units_Sold\n2024-01-01,SKU_1,10\n')

    await expect(ingestSupplyChainCsv(badCsvPath, { isDryRun: true })).rejects.toThrow(
      /Required CSV headers missing/
    )
  })

  it('ingestSupplyChainCsv should reject rows with malformed numeric values and report reasons', async () => {
    const malformedCsvPath = path.join(tempDir, 'malformed.csv')
    const headers = REQUIRED_CSV_COLUMNS.join(',')
    const validRow = '2024-01-01,SKU_TEST,WH_TEST,SUP_TEST,West,10,100,7,50,0,10.0,15.0,0,0,10.0'
    const malformedRow = '2024-01-02,SKU_TEST,WH_TEST,SUP_TEST,West,NOT_A_NUM,100,7,50,0,10.0,15.0,0,0,10.0'
    const negativeRow = '2024-01-03,SKU_TEST,WH_TEST,SUP_TEST,West,-5,100,7,50,0,10.0,15.0,0,0,10.0'

    fs.writeFileSync(malformedCsvPath, `${headers}\n${validRow}\n${malformedRow}\n${negativeRow}\n`)

    const result = await ingestSupplyChainCsv(malformedCsvPath, { isDryRun: true })

    expect(result.totalRows).toBe(3)
    expect(result.validRows).toBe(1)
    expect(result.rejectedRows).toBe(2)
    expect(result.rejections.length).toBe(2)
    expect(result.rejections[0].reason).toContain("Invalid numeric value 'NOT_A_NUM'")
    expect(result.rejections[1].reason).toContain('Negative Units_Sold: -5')
  })

  it('ingestSupplyChainCsv should detect and report intra-file duplicate observations', async () => {
    const dupCsvPath = path.join(tempDir, 'duplicates.csv')
    const headers = REQUIRED_CSV_COLUMNS.join(',')
    const row1 = '2024-01-01,SKU_DUP,WH_1,SUP_1,West,10,100,7,50,0,10.0,15.0,0,0,10.0'
    const row2 = '2024-01-01,SKU_DUP,WH_1,SUP_1,West,15,100,7,50,0,10.0,15.0,0,0,10.0' // duplicate (Date, SKU, WH)

    fs.writeFileSync(dupCsvPath, `${headers}\n${row1}\n${row2}\n`)

    const result = await ingestSupplyChainCsv(dupCsvPath, { isDryRun: true })

    expect(result.totalRows).toBe(2)
    expect(result.validRows).toBe(1)
    expect(result.duplicateRows).toBe(1)
    expect(result.rejectedRows).toBe(1)
  })

  it('Dry-run mode should not write records to database', async () => {
    const dryCsvPath = path.join(tempDir, 'dry_test.csv')
    const headers = REQUIRED_CSV_COLUMNS.join(',')
    const row = '2024-05-01,SKU_DRY_RUN,WH_DRY,SUP_DRY,North,20,500,5,100,0,12.0,18.0,0,0,20.0'
    fs.writeFileSync(dryCsvPath, `${headers}\n${row}\n`)

    const summary = await ingestSupplyChainCsv(dryCsvPath, { isDryRun: true })
    expect(summary.isDryRun).toBe(true)
    expect(summary.importedRows).toBe(0)

    const found = await Product.findOne({ skuId: 'SKU_DRY_RUN' })
    expect(found).toBeNull()
  })
})
