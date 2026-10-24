import mongoose from 'mongoose'

const inventorySchema = new mongoose.Schema(
  {
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
    inventoryLevel: {
      type: Number,
      required: [true, 'Inventory level is required'],
      min: [0, 'Inventory level cannot be negative'],
    },
    reorderPoint: {
      type: Number,
      required: [true, 'Reorder point is required'],
      min: [0, 'Reorder point cannot be negative'],
    },
    orderQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Order quantity cannot be negative'],
    },
    supplierId: {
      type: String,
      trim: true,
      index: true,
    },
    supplierLeadTimeDays: {
      type: Number,
      default: 7,
      min: [0, 'Lead time cannot be negative'],
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
    lastObservationDate: {
      type: Date,
      required: [true, 'Last observation date is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Compound unique index ensuring one snapshot per SKU/Warehouse
inventorySchema.index({ skuId: 1, warehouseId: 1 }, { unique: true })

// Helper virtual for low stock identification
inventorySchema.virtual('isLowStock').get(function () {
  return this.inventoryLevel <= this.reorderPoint
})

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema)
export default Inventory
