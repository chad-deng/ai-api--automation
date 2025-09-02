from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session
import structlog
from datetime import datetime, timezone
from typing import List
from src.database.models import get_db, WebhookEvent, GeneratedTest
from src.webhook.schemas import ApiFoxWebhook
from src.generators.test_generator import TestGenerator
from src.utils.retry_handler import RetryHandler, CircuitBreaker, DeadLetterQueue
from src.utils.test_runner import TestRunner

logger = structlog.get_logger()
webhook_router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Initialize retry components
retry_handler = RetryHandler()
circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60)
dead_letter_queue = DeadLetterQueue()
test_runner = TestRunner()

async def process_webhook_with_retry(webhook_data: ApiFoxWebhook, db: Session):
    """Process webhook with retry logic and circuit breaker"""
    
    @retry_handler.with_retry(
        max_attempts=3,
        exception_types=(Exception,)
    )
    async def _process_webhook():
        return await circuit_breaker.call(
            _generate_tests_internal, 
            webhook_data, 
            db
        )
    
    try:
        await _process_webhook()
    except Exception as e:
        # Add to dead letter queue if all retries fail
        await dead_letter_queue.add_failed_event(
            webhook_data.model_dump(mode='json'),
            str(e)
        )
        raise

async def _generate_tests_internal(webhook_data: ApiFoxWebhook, db: Session):
    """Internal test generation logic"""
    generator = TestGenerator()
    await generator.generate_tests_from_webhook(webhook_data, db)
    
    # Update webhook event as processed
    db_event = db.query(WebhookEvent).filter(
        WebhookEvent.event_id == webhook_data.event_id
    ).first()
    
    if db_event:
        db_event.processed = True
        db_event.processed_at = datetime.now(timezone.utc)
        db.commit()

async def process_enhanced_webhook_generation(webhook_data: ApiFoxWebhook, db: Session):
    """Process webhook using enhanced generators with quality gates and fallback"""
    try:
        logger.info("Processing webhook with enhanced generators", event_id=webhook_data.event_id)
        
        # Initialize test generator with enhanced capabilities
        test_generator = TestGenerator()
        
        # Generate tests with enhanced quality control and fallback
        result = await test_generator.generate_enhanced_tests_with_quality_gate(
            webhook_data, db
        )
        
        # Update webhook event with enhanced processing results
        db_event = db.query(WebhookEvent).filter(
            WebhookEvent.event_id == webhook_data.event_id
        ).first()
        
        if db_event:
            db_event.processed = result.get("success", False)
            db_event.processed_at = datetime.now(timezone.utc)
            # Store enhanced processing metadata
            db_event.processing_metadata = {
                "enhanced_generation": True,
                "enhanced_generation_used": result.get("enhanced_generation_used", False),
                "quality_summary": result.get("quality_summary", {}),
                "files_generated": len(result.get("generated_files", [])),
                "generation_time_seconds": result.get("generation_time_seconds", 0),
                "success": result.get("success", False),
                "metrics": result.get("metrics", {}),
                "fallback_used": result.get("fallback_used", False)
            }
            db.commit()
            
        if result.get("success"):
            logger.info("Enhanced webhook processing completed successfully",
                       event_id=webhook_data.event_id,
                       enhanced_used=result.get("enhanced_generation_used", False),
                       files_generated=len(result.get("generated_files", [])),
                       quality_summary=result.get("quality_summary"))
        else:
            logger.error("Enhanced webhook processing failed",
                        event_id=webhook_data.event_id,
                        error=result.get("error"))
            
    except Exception as e:
        logger.error("Enhanced webhook processing failed",
                    event_id=webhook_data.event_id,
                    error=str(e),
                    exc_info=True)
        
        # Update event with error status
        db_event = db.query(WebhookEvent).filter(
            WebhookEvent.event_id == webhook_data.event_id
        ).first()
        
        if db_event:
            db_event.processed = False
            db_event.error_message = str(e)
            db.commit()

async def process_advanced_webhook_generation(webhook_data: ApiFoxWebhook, db: Session):
    """Process webhook using Week 3 advanced generators with quality validation"""
    try:
        logger.info("Processing webhook with advanced generators", event_id=webhook_data.event_id)
        
        # Initialize advanced test generator
        test_generator = TestGenerator()
        
        # Generate tests with quality checking
        result = await test_generator.generate_advanced_tests_with_quality_check(
            webhook_data, db
        )
        
        if result.get("success"):
            logger.info("Advanced test generation completed successfully",
                       event_id=webhook_data.event_id,
                       files_generated=len(result.get("generated_files", [])),
                       quality_summary=result.get("quality_summary"))
        else:
            logger.error("Advanced test generation failed",
                        event_id=webhook_data.event_id,
                        error=result.get("error"))
        
        # Update webhook event with advanced processing results
        db_event = db.query(WebhookEvent).filter(
            WebhookEvent.event_id == webhook_data.event_id
        ).first()
        
        if db_event:
            db_event.processed = True
            db_event.processed_at = datetime.now(timezone.utc)
            # Store advanced processing results
            db_event.processing_metadata = {
                "advanced_generation": True,
                "quality_summary": result.get("quality_summary", {}),
                "files_generated": len(result.get("generated_files", [])),
                "success": result.get("success", False)
            }
            db.commit()
            
    except Exception as e:
        logger.error("Advanced webhook processing failed",
                    event_id=webhook_data.event_id,
                    error=str(e),
                    exc_info=True)
        
        # Update event with error status
        db_event = db.query(WebhookEvent).filter(
            WebhookEvent.event_id == webhook_data.event_id
        ).first()
        
        if db_event:
            db_event.processed = False
            db_event.error_message = str(e)
            db.commit()

@webhook_router.post("/apifox")
async def handle_apifox_webhook(
    background_tasks: BackgroundTasks,
    request: Request,
    webhook_data: ApiFoxWebhook,
    db: Session = Depends(get_db)
):
    try:
        logger.info("Received ApiFox webhook", event_type=webhook_data.event_type)
        
        # Store webhook event
        db_event = WebhookEvent(
            event_id=webhook_data.event_id,
            event_type=webhook_data.event_type,
            project_id=webhook_data.project_id,
            payload=webhook_data.model_dump(mode='json')
        )
        db.add(db_event)
        db.commit()
        
        # Process webhook based on event type with background processing
        if webhook_data.event_type in ["api_created", "api_updated"]:
            # Use enhanced generation by default, with fallback to standard generation
            background_tasks.add_task(
                process_enhanced_webhook_generation,
                webhook_data,
                db
            )
        
        return {
            "status": "success", 
            "message": "Webhook received and processing started",
            "event_id": webhook_data.event_id
        }
        
    except Exception as e:
        logger.error("Failed to process webhook", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@webhook_router.get("/health")
async def health_check():
    """Enhanced health check with generator status"""
    try:
        # Basic health check
        basic_health = {"status": "healthy", "timestamp": datetime.now(timezone.utc)}
        
        # Enhanced generator health check
        test_generator = TestGenerator()
        enhanced_health = test_generator.get_enhanced_generator_health()
        
        return {
            **basic_health,
            "enhanced_generator": enhanced_health,
            "components": {
                "webhook_processor": "healthy",
                "test_generator": "healthy", 
                "quality_checker": "healthy",
                "enhanced_generator": enhanced_health["health"]
            }
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc)
        }

@webhook_router.get("/status")
async def webhook_status():
    """Get webhook processing status and metrics"""
    failed_events = await dead_letter_queue.get_failed_events()
    
    return {
        "circuit_breaker_state": circuit_breaker.state,
        "circuit_breaker_failures": circuit_breaker.failure_count,
        "dead_letter_queue_size": len(failed_events),
        "timestamp": datetime.now(timezone.utc)
    }

@webhook_router.get("/failed-events")
async def get_failed_events():
    """Get all events in the dead letter queue"""
    return await dead_letter_queue.get_failed_events()

@webhook_router.post("/retry-failed-events")
async def retry_failed_events(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Retry all failed events in the dead letter queue"""
    failed_events = await dead_letter_queue.get_failed_events()
    
    for event_data in failed_events:
        try:
            webhook_data = ApiFoxWebhook(**event_data["event_data"])
            background_tasks.add_task(
                process_webhook_with_retry,
                webhook_data,
                db
            )
        except Exception as e:
            logger.error("Failed to retry event", 
                        event_id=event_data.get("event_id"),
                        error=str(e))
    
    # Clear the dead letter queue after scheduling retries
    await dead_letter_queue.clear_failed_events()
    
    return {
        "status": "success",
        "message": f"Scheduled {len(failed_events)} failed events for retry",
        "events_retried": len(failed_events)
    }

@webhook_router.get("/generated-tests")
async def list_generated_tests(db: Session = Depends(get_db)):
    """List all generated test files"""
    tests = db.query(GeneratedTest).all()
    
    return {
        "total_tests": len(tests),
        "tests": [
            {
                "id": test.id,
                "test_name": test.test_name,
                "file_path": test.file_path,
                "status": test.status,
                "created_at": test.created_at,
                "webhook_event_id": test.webhook_event_id
            }
            for test in tests
        ]
    }

@webhook_router.post("/generate-enhanced-tests")
async def generate_enhanced_tests_endpoint(
    webhook_data: ApiFoxWebhook,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Generate tests using enhanced generators with quality gates and monitoring"""
    try:
        logger.info("Received request for enhanced test generation", event_id=webhook_data.event_id)
        
        # Process with enhanced generator in background
        background_tasks.add_task(
            process_enhanced_webhook_generation,
            webhook_data,
            db
        )
        
        return {
            "status": "success",
            "message": "Enhanced test generation started",
            "event_id": webhook_data.event_id,
            "features": [
                "Enhanced comprehensive test generation",
                "Quality gate enforcement (90%+ threshold)",
                "Automatic fallback to standard generation",
                "Real-time monitoring and metrics",
                "Zero-downtime deployment support",
                "Performance and boundary testing",
                "Advanced validation scenarios"
            ],
            "quality_features": [
                "Syntax validation",
                "Test structure analysis",
                "Assertion quality checking", 
                "Security pattern validation",
                "Performance pattern optimization",
                "Test isolation verification"
            ]
        }
        
    except Exception as e:
        logger.error("Failed to start enhanced test generation", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@webhook_router.post("/generate-advanced-tests")
async def generate_advanced_tests_endpoint(
    webhook_data: ApiFoxWebhook,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Generate tests using Week 3 advanced generators with quality validation"""
    try:
        logger.info("Received request for advanced test generation", event_id=webhook_data.event_id)
        
        # Process with advanced generator in background
        background_tasks.add_task(
            process_advanced_webhook_generation,
            webhook_data,
            db
        )
        
        return {
            "status": "success",
            "message": "Advanced test generation started",
            "event_id": webhook_data.event_id,
            "features": [
                "Error scenario tests with comprehensive edge cases",
                "Performance tests with load, stress, and endurance scenarios", 
                "Enhanced validation tests with boundary value testing",
                "Automated quality checking and validation",
                "Realistic test data generation"
            ]
        }
        
    except Exception as e:
        logger.error("Failed to start advanced test generation", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@webhook_router.post("/run-tests")
async def run_generated_tests(
    background_tasks: BackgroundTasks,
    test_ids: List[int] = None,
    pytest_args: List[str] = None,
    db: Session = Depends(get_db)
):
    """Execute generated tests and return results"""
    try:
        # Get test files to run
        query = db.query(GeneratedTest)
        if test_ids:
            query = query.filter(GeneratedTest.id.in_(test_ids))
        
        tests = query.all()
        
        if not tests:
            raise HTTPException(status_code=404, detail="No tests found")
        
        test_files = [test.file_path for test in tests]
        
        # Run tests in background
        background_tasks.add_task(
            _execute_tests_background,
            test_files,
            pytest_args,
            db
        )
        
        return {
            "status": "success",
            "message": f"Test execution started for {len(test_files)} files",
            "test_files": test_files
        }
        
    except Exception as e:
        logger.error("Failed to start test execution", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to start test execution")

@webhook_router.post("/validate-tests")
async def validate_generated_tests(
    test_ids: List[int] = None,
    db: Session = Depends(get_db)
):
    """Validate syntax of generated test files"""
    try:
        # Get test files to validate
        query = db.query(GeneratedTest)
        if test_ids:
            query = query.filter(GeneratedTest.id.in_(test_ids))
        
        tests = query.all()
        
        if not tests:
            raise HTTPException(status_code=404, detail="No tests found")
        
        test_files = [test.file_path for test in tests]
        
        # Run syntax validation
        validation_results = await test_runner.run_syntax_check(test_files)
        
        return {
            "status": "success",
            "validation_results": validation_results,
            "summary": {
                "total_files": validation_results["total_files"],
                "valid_files": len(validation_results["valid_files"]),
                "invalid_files": len(validation_results["invalid_files"])
            }
        }
        
    except Exception as e:
        logger.error("Failed to validate tests", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to validate tests")

async def _execute_tests_background(
    test_files: List[str], 
    pytest_args: List[str],
    db: Session
):
    """Background task for test execution"""
    try:
        logger.info(f"Starting test execution for {len(test_files)} files")
        
        # Execute tests
        report = await test_runner.run_tests(test_files, pytest_args)
        
        # Generate HTML report
        report_file = f"/tmp/test_report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.html"
        test_runner.generate_html_report(report, report_file)
        
        # Update test statuses in database based on results
        for result in report.results:
            test = db.query(GeneratedTest).filter(
                GeneratedTest.file_path == result.file_path
            ).first()
            
            if test:
                test.status = f"executed_{result.status}"
                test.last_run_at = result.timestamp
        
        db.commit()
        
        logger.info(
            f"Test execution completed",
            total_tests=report.total_tests,
            passed=report.passed,
            failed=report.failed,
            duration=report.duration,
            report_file=report_file
        )
        
    except Exception as e:
        logger.error("Background test execution failed", error=str(e))

@webhook_router.get("/enhanced-generator/test")
async def test_enhanced_generator():
    """Test enhanced generator functionality"""
    try:
        test_generator = TestGenerator()
        result = await test_generator.test_enhanced_generator()
        return {
            "status": "success",
            "test_result": result,
            "timestamp": datetime.now(timezone.utc)
        }
    except Exception as e:
        logger.error("Enhanced generator test failed", error=str(e))
        return {
            "status": "failed",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc)
        }

@webhook_router.get("/enhanced-generator/metrics")
async def get_enhanced_generator_metrics():
    """Get detailed enhanced generator metrics"""
    try:
        test_generator = TestGenerator()
        health_status = test_generator.get_enhanced_generator_health()
        
        return {
            "status": "success",
            "metrics": health_status.get("metrics", {}),
            "performance": {
                "average_generation_time": health_status["metrics"].get("average_generation_time", 0),
                "success_rate": health_status["metrics"].get("success_rate", 0),
                "quality_gate_failure_rate": health_status["metrics"].get("quality_gate_failure_rate", 0),
                "fallback_usage_rate": health_status["metrics"].get("fallback_usage_rate", 0)
            },
            "quality": {
                "average_quality_score": health_status["metrics"].get("average_quality_score", 0),
                "total_generations": health_status["metrics"].get("total_generations", 0),
                "successful_generations": health_status["metrics"].get("successful_generations", 0)
            },
            "timestamp": datetime.now(timezone.utc)
        }
    except Exception as e:
        logger.error("Failed to get enhanced generator metrics", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@webhook_router.post("/enhanced-generator/feature-flag")
async def toggle_enhanced_generator(enabled: bool):
    """Toggle enhanced generator feature flag"""
    try:
        import os
        os.environ["ENABLE_ENHANCED_GENERATION"] = "true" if enabled else "false"
        
        return {
            "status": "success",
            "message": f"Enhanced generation {'enabled' if enabled else 'disabled'}",
            "enhanced_generation_enabled": enabled,
            "timestamp": datetime.now(timezone.utc)
        }
    except Exception as e:
        logger.error("Failed to toggle enhanced generator", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))