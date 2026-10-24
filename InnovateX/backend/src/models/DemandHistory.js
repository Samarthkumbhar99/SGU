import mongoose from 'mongoose'

const demandHistorySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Observation date is required'],
      index: true,
    },
    dateString: {
      type: String,
      required: [true, 'Date string (YYYY-MM-DD) is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'dateString must be in YYYY-MM-DD format'],
      index: true,
    },
    skuId: {
      type: String,
      required: [true, 'SKU ID is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    warehouseId: {
      type: String,
      required: [true, 'Warehouse ID is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
      index: true,
    },
    supplierId: {
      type: String,
      trim: true,
      index: true,
    },
    unitsSold: {
      type: Number,
      required: [true, 'Units sold is required'],
      min: [0, 'Units sold cannot be negative'],
    },
    inventoryLevel: {
      type: Number,
      required: [true, 'Inventory level is required'],
      min: [0, 'Inventory level cannot be negative'],
    },
    demandForecast: {
      type: Number,
      required: [true, 'Demand forecast is required'],
      min: [0, 'Demand forecast cannot be negative'],
    },
    promotionFlag: {
      type: Number,
      enum: [0, 1],
      default: 0,
      index: true,
    },
    stockoutFlag: {
      type: Number,
      enum: [0, 1],
      default: 0,
      index: true,
    },
    orderQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Order quantity cannot be negative'],
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Primary unique composite index guaranteeing historical observation uniqueness
demandHistorySchema.index(
  { dateString: 1, skuId: 1, warehouseId: 1 },
  { unique: true }
)

// Compound query index for analytical slice queries
demandHistorySchema.index({ skuId: 1, warehouseId: 1, date: 1 })
demandHistorySchema.index({ region: 1, date: 1 })

const DemandHistory =
  mongoose.models.DemandHistory || mongoose.model('DemandHistory', demandHistorySchema)
export default DemandHistory
