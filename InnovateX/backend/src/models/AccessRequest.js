const mongoose = require('mongoose')

const accessRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['Store', 'Warehouse'],
      required: true,
    },
    targetStore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    targetWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    targetOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roleRequested: {
      type: String,
      enum: ['Co-Manager', 'Shift Supervisor', 'Inventory Auditor', 'Operations Staff'],
      default: 'Co-Manager',
    },
    reason: {
      type: String,
      trim: true,
      default: 'Joining operations team to coordinate store replenishments and dispatches.',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

const AccessRequest = mongoose.model('AccessRequest', accessRequestSchema)
module.exports = AccessRequest
