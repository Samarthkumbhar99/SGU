const mongoose = require('mongoose')

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [120, 'Store name cannot exceed 120 characters'],
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
    category: {
      type: String,
      enum: ['Supermarket', 'Hypermarket', 'Metro Express', 'Cold Retail', 'Wholesale Outlet', 'Convenience'],
      default: 'Supermarket',
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      accuracy: { type: Number, default: 10 },
      city: { type: String, default: 'Metropolitan Center' },
      state: { type: String, default: 'MH' },
      address: { type: String, default: 'Commercial Retail Hub' },
    },
    dailyDemandVelocity: {
      type: Number,
      default: 4500, // units per day
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

// Auto-generate store code if not provided
storeSchema.pre('save', function () {
  if (!this.code) {
    const cityPrefix = (this.location?.city || 'STR').substring(0, 3).toUpperCase()
    const rand = Math.floor(1000 + Math.random() * 9000)
    this.code = `STR-${cityPrefix}-${rand}`
  }
})

const Store = mongoose.model('Store', storeSchema)
module.exports = Store
