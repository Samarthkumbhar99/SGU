const mongoose = require('mongoose')

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
      maxlength: [140, 'Warehouse name cannot exceed 140 characters'],
    },
    code: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      sparse: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    managers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    type: {
      type: String,
      enum: ['Regional Distribution Center', 'Transit Hub', 'Cold-Chain Depot', 'Urban Fulfillment Hub'],
      default: 'Regional Distribution Center',
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      accuracy: { type: Number, default: 10 },
      city: { type: String, default: 'Logistics Corridor' },
      state: { type: String, default: 'MH' },
      address: { type: String, default: 'National Highway Depot Sector' },
    },
    totalPalletCapacity: {
      type: Number,
      default: 4500,
    },
    usedPalletCapacity: {
      type: Number,
      default: 3120,
    },
    dockCount: {
      type: Number,
      default: 12,
    },
    temperatureControlled: {
      type: Boolean,
      default: true,
    },
    fleetCount: {
      type: Number,
      default: 18,
    },
    status: {
      type: String,
      enum: ['Operational', 'Capacity Warning', 'Maintenance'],
      default: 'Operational',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

warehouseSchema.pre('save', function () {
  if (!this.code) {
    const cityPrefix = (this.location?.city || 'DC').substring(0, 3).toUpperCase()
    const rand = Math.floor(1000 + Math.random() * 9000)
    this.code = `DC-${cityPrefix}-${rand}`
  }
})

const Warehouse = mongoose.model('Warehouse', warehouseSchema)
module.exports = Warehouse
