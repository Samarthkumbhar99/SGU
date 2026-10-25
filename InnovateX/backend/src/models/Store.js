import mongoose from 'mongoose'

const storeSchema = new mongoose.Schema(
  {
    storeId: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
      sparse: true,
    },
    storeName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [120, 'Store name cannot exceed 120 characters'],
    },
    code: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true,
    },
    region: {
      type: String,
      trim: true,
      default: 'National',
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
    category: {
      type: String,
      enum: ['Supermarket', 'Hypermarket', 'Metro Express', 'Cold Retail', 'Wholesale Outlet', 'Convenience', 'General FMCG'],
      default: 'Supermarket',
    },
    location: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        latitude: 19.076,
        longitude: 72.8777,
        accuracy: 10,
        city: 'Metropolitan Center',
        state: 'MH',
        address: 'Commercial Retail Hub',
      }),
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    storeCapacityUnits: {
      type: Number,
      default: 1500,
      min: [0, 'Store capacity cannot be negative'],
    },
    dailyDemandVelocity: {
      type: Number,
      default: 4500,
    },
    safetyStockUnits: {
      type: Number,
      default: 1200,
    },
    maxShelfCapacityUnits: {
      type: Number,
      default: 18000,
    },
    currentStockUnits: {
      type: Number,
      default: 14200,
    },
    serviceLeadTimeHours: {
      type: Number,
      default: 3.5,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Restocking', 'Critical Stockout Risk', 'Offline'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Pre-save synchronization
storeSchema.pre('save', function () {
  if (!this.storeName && this.name) {
    this.storeName = this.name
  } else if (!this.name && this.storeName) {
    this.name = this.storeName
  }

  if (!this.code && this.storeId) {
    this.code = this.storeId
  } else if (!this.storeId && this.code) {
    this.storeId = this.code
  }

  if (!this.code && !this.storeId) {
    const city = (typeof this.location === 'object' ? this.location?.city : 'STR') || 'STR'
    const cityPrefix = city.substring(0, 3).toUpperCase()
    const rand = Math.floor(1000 + Math.random() * 9000)
    const generated = `STR-${cityPrefix}-${rand}`
    this.code = generated
    this.storeId = generated
  }
})

const Store = mongoose.models.Store || mongoose.model('Store', storeSchema)
export default Store
