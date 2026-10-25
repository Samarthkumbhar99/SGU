import path from 'path'
import connectDB, { disconnectDB } from '../config/db.js'
import env from '../config/env.js'
import { ingestSupplyChainCsv } from '../services/ingestService.js'

async function runCli() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')

  // Find file arg or fallback to env.DATASET_PATH
  let targetPath = env.DATASET_PATH
  const fileArgIndex = args.indexOf('--file')
  if (fileArgIndex !== -1 && args[fileArgIndex + 1]) {
    targetPath = args[fileArgIndex + 1]
  }

  const resolvedPath = path.resolve(targetPath)

  console.log('='.repeat(70))
  console.log('📦 SUPPLYSHIELD AI — DATA INGESTION ENGINE')
  console.log('='.repeat(70))
  console.log(`📁 Target File: ${resolvedPath}`)
  console.log(`🔍 Mode:        ${isDryRun ? 'DRY-RUN (Validation only, no database writes)' : 'LIVE IMPORT (Writing to MongoDB)'}`)
  console.log('-'.repeat(70))

  await connectDB()

  try {
    const summary = await ingestSupplyChainCsv(resolvedPath, {
      isDryRun,
      importedBy: 'CLI',
    })

    console.log('\n' + '='.repeat(70))
    console.log('📊 INGESTION AUDIT REPORT')
    console.log('='.repeat(70))
    console.log(`Run ID:         ${summary.importId}`)
    console.log(`Execution Time: ${summary.durationMs} ms (${(summary.durationMs / 1000).toFixed(2)}s)`)
    console.log(`Status:         ${summary.status.toUpperCase()}`)
    console.log('-'.repeat(70))
    console.log(`Total Rows Read:    ${summary.totalRows.toLocaleString()}`)
    console.log(`Valid Records:      ${summary.validRows.toLocaleString()}`)
    console.log(`Imported Records:   ${summary.importedRows.toLocaleString()}`)
    console.log(`Duplicate Records:  ${summary.duplicateRows.toLocaleString()}`)
    console.log(`Rejected Records:   ${summary.rejectedRows.toLocaleString()}`)
    console.log('-'.repeat(70))
    console.log('📈 DATASET METRICS & PROFILE:')
    console.log(`Date Range:         ${summary.metrics.dateRange.start} -> ${summary.metrics.dateRange.end}`)
    console.log(`Distinct SKUs:      ${summary.metrics.distinctSKUs}`)
    console.log(`Distinct Warehouses:${summary.metrics.distinctWarehouses}`)
    console.log(`Distinct Suppliers: ${summary.metrics.distinctSuppliers}`)
    console.log(`Distinct Regions:   ${summary.metrics.distinctRegions}`)
    console.log(`Stockout=0 Rows:    ${summary.metrics.stockoutZeroCount.toLocaleString()} (100% zero)`)
    console.log(`Promotion=1 Rows:   ${summary.metrics.promotionCount.toLocaleString()}`)
    console.log('='.repeat(70))

    if (summary.rejections.length > 0) {
      console.log('\n⚠️ REJECTION EXAMPLES:')
      summary.rejections.slice(0, 5).forEach((rej) => {
        console.log(`  - Row ${rej.rowNumber}: ${rej.reason}`)
      })
    }

    await disconnectDB()
    process.exit(0)
  } catch (err) {
    console.error('\n❌ Ingestion failed:', err.message)
    await disconnectDB()
    process.exit(1)
  }
}

runCli()
