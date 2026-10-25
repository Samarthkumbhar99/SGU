import mongoose from 'mongoose'

const optimizationRunSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    runType: {
      type: String,
      enum: ['solve', 'simulate'],
      required: true,
      default: 'solve',
      index: true,
    },
    scenarioName: {
      type: String,
      trim: true,
      default: 'Baseline Optimization',
    },
    datasetVersion: {
      type: String,
      trim: true,
      default: 'v1.0-demo',
    },
    solver: {
      type: String,
      trim: true,
      default: 'Google OR-Tools CP-SAT',
    },
    status: {
      type: String,
      required: true,
      enum: ['OPTIMAL', 'FEASIBLE', 'INFEASIBLE', 'MODEL_INVALID', 'UNKNOWN', 'FAILED'],
      index: true,
    },
    isFeasible: {
      type: Boolean,
      default: true,
    },
    solverRuntimeSeconds: {
      type: Number,
      default: 0,
    },
    objectiveScore: {
      type: Number,
      default: 0,
    },
    metrics: {
      baselineTransportCost: { type: Number, default: 0 },
      optimizedTransportCost: { type: Number, default: 0 },
      baselineUnmetDemandUnits: { type: Number, default: 0 },
      optimizedUnmetDemandUnits: { type: Number, default: 0 },
      demandFulfillmentRatePct: { type: Number, default: 0 },
      allocatedUnits: { type: Number, default: 0 },
      forecastDemandUnits: { type: Number, default: 0 },
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    planSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    resilienceInsights: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    warnings: {
      type: [String],
      default: [],
    },
    allocationsCount: {
      type: Number,
      default: 0,
    },
    allocationsSample: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    correlationId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

optimizationRunSchema.index({ createdAt: -1 })
optimizationRunSchema.index({ runType: 1, status: 1 })

export const OptimizationRun = mongoose.model('OptimizationRun', optimizationRunSchema)
export default OptimizationRun
