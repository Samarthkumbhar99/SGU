import mongoose from 'mongoose'

const warehouseSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: String,
      required: [true, 'Warehouse ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    warehouseName: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    regionsServed: [
      {
        type: String,
        trim: true,
        index: true,
      },
    ],
    storageCapacityUnits: {
      type: Number,
      default: 10000,
      min: [0, 'Storage capacity cannot be negative'],
    },
    location: {
      type: String,
      default: 'Regional Distribution Hub',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse', warehouseSchema)
export default Warehouse
