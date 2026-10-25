import mongoose from 'mongoose'

const supplierSchema = new mongoose.Schema(
  {
    supplierId: {
      type: String,
      required: [true, 'Supplier ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    supplierName: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    defaultLeadTimeDays: {
      type: Number,
      default: 7,
      min: [0, 'Lead time cannot be negative'],
    },
    regions: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema)
export default Supplier
