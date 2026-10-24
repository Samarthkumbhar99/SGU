"""FastAPI Application entry point for SupplyShield AI ML Service."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.routes_health import router as health_router
from src.config import settings


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Machine Learning and Optimization Service for SupplyShield AI — "
            "Adaptive Distribution Intelligence and Inventory Optimization Engine."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Configure CORS for integration with React frontend and Node.js backend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Root health endpoint (/health)
    app.include_router(health_router)

    # Versioned health alias (/api/v1/health) for contract compatibility
    app.include_router(health_router, prefix=settings.api_prefix)

    # Versioned data routes (/api/v1/data/validate)
    from src.api.routes_data import router as data_router
    app.include_router(data_router, prefix=settings.api_prefix)

    # Inventory routes (/api/v1/inventory/plan, /api/v1/inventory/health)
    from src.api.routes_inventory import router as inventory_router
    app.include_router(inventory_router, prefix=settings.api_prefix)

    # Forecasting routes (/api/v1/forecast, /api/v1/evaluate-forecast, and root aliases)
    from src.api.routes_forecasting import router as forecasting_router
    app.include_router(forecasting_router, prefix=settings.api_prefix)
    app.include_router(forecasting_router)  # root alias support for /evaluate-forecast

    # Optimization routes (/api/v1/optimize and root alias /optimize)
    from src.api.routes_optimization import router as optimization_router
    app.include_router(optimization_router, prefix=settings.api_prefix)
    app.include_router(optimization_router)  # root alias support for /optimize

    # Scenario simulation routes (/api/v1/scenario/simulate, /api/v1/scenario/disrupt, and root aliases)
    from src.api.routes_scenario import router as scenario_router
    app.include_router(scenario_router, prefix=settings.api_prefix)
    app.include_router(scenario_router)  # root alias support for /scenario/disrupt and /scenario/simulate

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Standardized global exception handler without leaking internal secrets."""
        return JSONResponse(
            status_code=500,
            content={
                "error": "InternalServerError",
                "message": "An unexpected error occurred while processing the request.",
            },
        )

    return app


app = create_app()
