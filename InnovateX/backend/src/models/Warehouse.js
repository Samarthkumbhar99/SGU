import mongoose from 'mongoose'

const warehouseSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
      sparse: true,
    },
    warehouseName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [140, 'Warehouse name cannot exceed 140 characters'],
    },
    code: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
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
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        latitude: 19.076,
        longitude: 72.8777,
        accuracy: 10,
        city: 'Logistics Corridor',
        state: 'MH',
        address: 'National Highway Depot Sector',
      }),
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
  if (!this.warehouseName && this.name) {
    this.warehouseName = this.name
  } else if (!this.name && this.warehouseName) {
    this.name = this.warehouseName
  }

  if (!this.code && this.warehouseId) {
    this.code = this.warehouseId
  } else if (!this.warehouseId && this.code) {
    this.warehouseId = this.code
  }

  if (!this.code && !this.warehouseId) {
    const city = (typeof this.location === 'object' ? this.location?.city : 'DC') || 'DC'
    const cityPrefix = city.substring(0, 3).toUpperCase()
    const rand = Math.floor(1000 + Math.random() * 9000)
    const generated = `DC-${cityPrefix}-${rand}`
    this.code = generated
    this.warehouseId = generated
  }
})

const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse', warehouseSchema)
export default Warehouse
