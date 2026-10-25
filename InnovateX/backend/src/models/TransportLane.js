import mongoose from 'mongoose'

const transportLaneSchema = new mongoose.Schema(
  {
    laneId: {
      type: String,
      required: [true, 'Lane ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    sourceWarehouseId: {
      type: String,
      required: [true, 'Source warehouse ID is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    destinationRegion: {
      type: String,
      required: [true, 'Destination region is required'],
      trim: true,
      index: true,
    },
    destinationStoreId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    distanceKmEstimate: {
      type: Number,
      default: 50.0,
      min: [0, 'Distance cannot be negative'],
    },
    unitTransportCost: {
      type: Number,
      default: 0.05,
      min: [0, 'Transport cost cannot be negative'],
    },
    leadTimeHours: {
      type: Number,
      default: 12.0,
      min: [0, 'Lead time cannot be negative'],
    },
    capacityUnitsPerDay: {
      type: Number,
      default: 500,
      min: [0, 'Capacity cannot be negative'],
    },
    availabilityStatus: {
      type: String,
      enum: ['active', 'restricted', 'closed'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

const TransportLane =
  mongoose.models.TransportLane || mongoose.model('TransportLane', transportLaneSchema)
export default TransportLane
