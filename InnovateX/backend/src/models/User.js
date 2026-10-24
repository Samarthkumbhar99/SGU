import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be under 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      select: false, // Never return password hash in queries
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    avatar: {
      type: String,
    },
    company: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name must be under 200 characters'],
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        'Retailer',
        'Warehouse Manager',
        'Warehouse Controller',
        'Distribution Manager',
        'Supply Chain Analyst',
        'Operations Manager',
        'Admin',
        'Other',
      ],
      default: 'Retailer',
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    liveLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      city: { type: String, default: 'Detected City' },
      address: { type: String, default: 'Live GPS Location' },
      updatedAt: { type: Date, default: Date.now },
    },
    managedStores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
      },
    ],
    managedWarehouses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false
  return bcrypt.compare(candidatePassword, this.passwordHash)
}

// Static method: hash password
userSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, 12)
}

// Remove sensitive fields from JSON output
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject()
  delete obj.passwordHash
  delete obj.googleId
  delete obj.__v
  return obj
}

const User = mongoose.models.User || mongoose.model('User', userSchema)
export default User
