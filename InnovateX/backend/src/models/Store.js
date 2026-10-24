import mongoose from 'mongoose'

const storeSchema = new mongoose.Schema(
  {
    storeId: {
      type: String,
      required: [true, 'Store ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    region: {
      type: String,
      required: [true, 'Store region is required'],
      trim: true,
      index: true,
    },
    storeCapacityUnits: {
      type: Number,
      default: 1500,
      min: [0, 'Store capacity cannot be negative'],
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

const Store = mongoose.models.Store || mongoose.model('Store', storeSchema)
export default Store
