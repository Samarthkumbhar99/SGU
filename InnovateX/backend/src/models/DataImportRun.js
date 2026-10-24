import mongoose from 'mongoose'

const rejectionDetailSchema = new mongoose.Schema(
  {
    rowNumber: { type: Number, required: true },
    reason: { type: String, required: true },
    rawSnippet: { type: String },
  },
  { _id: false }
)

const dataImportRunSchema = new mongoose.Schema(
  {
    importId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      trim: true,
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    isDryRun: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'failed', 'dry_run'],
      default: 'in_progress',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    validRows: {
      type: Number,
      default: 0,
    },
    importedRows: {
      type: Number,
      default: 0,
    },
    rejectedRows: {
      type: Number,
      default: 0,
    },
    duplicateRows: {
      type: Number,
      default: 0,
    },
    metrics: {
      dateRange: {
        start: { type: String, default: null },
        end: { type: String, default: null },
      },
      distinctSKUs: { type: Number, default: 0 },
      distinctWarehouses: { type: Number, default: 0 },
      distinctSuppliers: { type: Number, default: 0 },
      distinctRegions: { type: Number, default: 0 },
      missingValuesCount: { type: Number, default: 0 },
      stockoutZeroCount: { type: Number, default: 0 },
      promotionCount: { type: Number, default: 0 },
    },
    rejections: [rejectionDetailSchema],
    errorMessage: {
      type: String,
      default: null,
    },
    importedBy: {
      type: String,
      default: 'system',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

const DataImportRun =
  mongoose.models.DataImportRun || mongoose.model('DataImportRun', dataImportRunSchema)
export default DataImportRun
