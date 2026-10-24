import mlClient, { MlServiceError } from '../integrations/mlClient.js'
import logger from '../utils/logger.js'

/**
 * Controller for demand forecasting and ML model integration
 */
export const predictForecast = async (req, res, next) => {
  try {
    const {
      skuId,
      sku_id,
      productId,
      product_id,
      warehouseId,
      warehouse_id,
      storeId,
      store_id,
      horizonDays,
      horizon_days,
      modelType,
      model_type,
      modelVersion,
      model_version,
      windowDays,
      window_days,
      roundingPolicy,
      rounding_policy,
    } = req.body

    const effectiveSku = skuId || sku_id || productId || product_id
    const effectiveWarehouse = warehouseId || warehouse_id || storeId || store_id

    if (!effectiveSku || !effectiveWarehouse) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: 'Both skuId and warehouseId are required to generate demand forecast',
      })
    }

    const payload = {
      sku_id: effectiveSku,
      warehouse_id: effectiveWarehouse,
      product_id: effectiveSku,
      store_id: effectiveWarehouse,
      horizon_days: horizonDays ? Number(horizonDays) : 14,
      model_type: modelType || 'auto',
      model_version: modelVersion || 'active',
      window_days: windowDays ? Number(windowDays) : 14,
      rounding_policy: roundingPolicy || 'round',
    }

    const result = await mlClient.predictForecast(payload, {
      correlationId: req.correlationId,
    })

    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof MlServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.name,
        message: error.message,
        details: error.details,
      })
    }
    next(error)
  }
}

export const trainForecast = async (req, res, next) => {
  try {
    const { modelType, forceRetrain, setActive } = req.body

    const payload = {
      model_type: modelType || 'lightgbm',
      force_retrain: Boolean(forceRetrain),
      set_active: setActive !== undefined ? Boolean(setActive) : true,
    }

    const result = await mlClient.trainForecast(payload, {
      correlationId: req.correlationId,
    })

    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof MlServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.name,
        message: error.message,
        details: error.details,
      })
    }
    next(error)
  }
}

export const evaluateForecast = async (req, res, next) => {
  try {
    const { skuId, warehouseId, productId, storeId, trainEndDate, testStartDate, testEndDate, includeMlModels } = req.body

    const payload = {
      sku_id: skuId || productId || null,
      warehouse_id: warehouseId || storeId || null,
      train_end_date: trainEndDate || '2024-11-04',
      test_start_date: testStartDate || '2024-12-03',
      test_end_date: testEndDate || '2024-12-30',
      include_ml_models: includeMlModels !== undefined ? Boolean(includeMlModels) : true,
    }

    const result = await mlClient.evaluateForecast(payload, {
      correlationId: req.correlationId,
    })

    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof MlServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.name,
        message: error.message,
        details: error.details,
      })
    }
    next(error)
  }
}

export const getForecastModels = async (req, res, next) => {
  try {
    const result = await mlClient.getForecastModels({
      correlationId: req.correlationId,
    })

    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof MlServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.name,
        message: error.message,
        details: error.details,
      })
    }
    next(error)
  }
}
