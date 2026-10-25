import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    skuId: {
      type: String,
      required: [true, 'SKU ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
      index: true,
    },
    unitOfMeasure: {
      type: String,
      default: 'unit',
      trim: true,
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
    supplierId: {
      type: String,
      trim: true,
      index: true,
    },
    leadTimeDays: {
      type: Number,
      default: 7,
      min: [0, 'Lead time cannot be negative'],
    },
    reorderPoint: {
      type: Number,
      default: 0,
      min: [0, 'Reorder point cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Index for common filter queries
productSchema.index({ category: 1, supplierId: 1 })

const Product = mongoose.models.Product || mongoose.model('Product', productSchema)
export default Product
