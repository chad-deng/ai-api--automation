import pytest
import pytest_asyncio
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import json
from src.database.models import (
    Base, 
    WebhookEvent, 
    GeneratedTest, 
    init_db, 
    get_db,
    engine,
    SessionLocal
)

class TestWebhookEventModel:
    """Unit tests for WebhookEvent database model"""
    
    def test_webhook_event_model_creation(self):
        """Test WebhookEvent model can be created with required fields"""
        payload = {"event": "api_created", "data": {"id": "123"}}
        
        webhook_event = WebhookEvent(
            event_id="test_event_123",
            event_type="api_created",
            project_id="project_456",
            payload=payload
        )
        
        assert webhook_event.event_id == "test_event_123"
        assert webhook_event.event_type == "api_created"
        assert webhook_event.project_id == "project_456"
        assert webhook_event.payload == payload
        # Default value is only set during database operations, not instance creation
        assert webhook_event.processed is None or webhook_event.processed is False
        assert webhook_event.created_at is None  # Not set until database operation
        assert webhook_event.processed_at is None
        assert webhook_event.processing_metadata is None
        assert webhook_event.error_message is None
    
    def test_webhook_event_model_with_optional_fields(self):
        """Test WebhookEvent model with optional fields"""
        payload = {"event": "api_updated", "data": {"id": "456"}}
        metadata = {"advanced_generation": True, "quality_summary": {"score": 0.9}}
        error_msg = "Processing failed"
        processed_time = datetime(2023, 1, 1, 12, 0, 0)
        
        webhook_event = WebhookEvent(
            event_id="test_event_456",
            event_type="api_updated",
            project_id="project_789",
            payload=payload,
            processed=True,
            processed_at=processed_time,
            processing_metadata=metadata,
            error_message=error_msg
        )
        
        assert webhook_event.processed is True
        assert webhook_event.processed_at == processed_time
        assert webhook_event.processing_metadata == metadata
        assert webhook_event.error_message == error_msg
    
    def test_webhook_event_model_table_name(self):
        """Test WebhookEvent model has correct table name"""
        assert WebhookEvent.__tablename__ == "webhook_events"
    
    def test_webhook_event_model_primary_key(self):
        """Test WebhookEvent model has correct primary key configuration"""
        webhook_event = WebhookEvent()
        id_column = WebhookEvent.__table__.columns['id']
        
        assert id_column.primary_key is True
        assert id_column.index is True
    
    def test_webhook_event_model_unique_constraints(self):
        """Test WebhookEvent model has correct unique constraints"""
        event_id_column = WebhookEvent.__table__.columns['event_id']
        
        assert event_id_column.unique is True
        assert event_id_column.index is True
    
    def test_webhook_event_model_nullable_fields(self):
        """Test WebhookEvent model nullable field configuration"""
        columns = WebhookEvent.__table__.columns
        
        # Required fields
        assert columns['event_type'].nullable is False
        assert columns['project_id'].nullable is False
        assert columns['payload'].nullable is False
        
        # Optional fields
        assert columns['processed_at'].nullable is True
        assert columns['processing_metadata'].nullable is True
        assert columns['error_message'].nullable is True
    
    def test_webhook_event_model_default_values(self):
        """Test WebhookEvent model default values"""
        columns = WebhookEvent.__table__.columns
        
        # processed should default to False
        assert columns['processed'].default.arg is False
        
        # created_at should have lambda function as default
        assert callable(columns['created_at'].default.arg)
    
    def test_webhook_event_model_json_payload(self):
        """Test WebhookEvent model handles JSON payload correctly"""
        complex_payload = {
            "event": "api_created",
            "data": {
                "api_id": "12345",
                "name": "User API",
                "endpoints": [
                    {"method": "GET", "path": "/users"},
                    {"method": "POST", "path": "/users"}
                ],
                "metadata": {"version": "1.0", "tags": ["user", "management"]}
            }
        }
        
        webhook_event = WebhookEvent(
            event_id="complex_event",
            event_type="api_created",
            project_id="complex_project",
            payload=complex_payload
        )
        
        assert webhook_event.payload == complex_payload
        assert webhook_event.payload["data"]["api_id"] == "12345"
        assert len(webhook_event.payload["data"]["endpoints"]) == 2

class TestGeneratedTestModel:
    """Unit tests for GeneratedTest database model"""
    
    def test_generated_test_model_creation(self):
        """Test GeneratedTest model can be created with required fields"""
        test_content = "import pytest\\n\\ndef test_api_endpoint():\\n    assert True"
        
        generated_test = GeneratedTest(
            webhook_event_id="event_123",
            test_name="test_create_user",
            test_content=test_content,
            file_path="/path/to/test_create_user.py"
        )
        
        assert generated_test.webhook_event_id == "event_123"
        assert generated_test.test_name == "test_create_user"
        assert generated_test.test_content == test_content
        assert generated_test.file_path == "/path/to/test_create_user.py"
        # Default value is only set during database operations, not instance creation
        assert generated_test.status is None or generated_test.status == "generated"
        assert generated_test.created_at is None  # Not set until database operation
        assert generated_test.last_run_at is None
        assert generated_test.last_run_result is None
    
    def test_generated_test_model_with_optional_fields(self):
        """Test GeneratedTest model with optional fields"""
        test_content = "comprehensive test content"
        created_time = datetime(2023, 1, 1, 10, 0, 0)
        last_run_time = datetime(2023, 1, 1, 11, 0, 0)
        
        generated_test = GeneratedTest(
            webhook_event_id="event_456",
            test_name="test_update_user",
            test_content=test_content,
            file_path="/path/to/test_update_user.py",
            status="executed",
            created_at=created_time,
            last_run_at=last_run_time,
            last_run_result="passed"
        )
        
        assert generated_test.status == "executed"
        assert generated_test.created_at == created_time
        assert generated_test.last_run_at == last_run_time
        assert generated_test.last_run_result == "passed"
    
    def test_generated_test_model_table_name(self):
        """Test GeneratedTest model has correct table name"""
        assert GeneratedTest.__tablename__ == "generated_tests"
    
    def test_generated_test_model_primary_key(self):
        """Test GeneratedTest model has correct primary key configuration"""
        id_column = GeneratedTest.__table__.columns['id']
        
        assert id_column.primary_key is True
        assert id_column.index is True
    
    def test_generated_test_model_nullable_fields(self):
        """Test GeneratedTest model nullable field configuration"""
        columns = GeneratedTest.__table__.columns
        
        # Required fields
        assert columns['webhook_event_id'].nullable is False
        assert columns['test_name'].nullable is False
        assert columns['test_content'].nullable is False
        assert columns['file_path'].nullable is False
        
        # Optional fields
        assert columns['last_run_at'].nullable is True
        assert columns['last_run_result'].nullable is True
    
    def test_generated_test_model_default_values(self):
        """Test GeneratedTest model default values"""
        columns = GeneratedTest.__table__.columns
        
        # status should default to "generated"
        assert columns['status'].default.arg == "generated"
        
        # created_at should have lambda function as default
        assert callable(columns['created_at'].default.arg)
    
    def test_generated_test_model_field_lengths(self):
        """Test GeneratedTest model field length constraints"""
        columns = GeneratedTest.__table__.columns
        
        # Check string field lengths
        assert columns['webhook_event_id'].type.length == 255
        assert columns['test_name'].type.length == 255
        assert columns['file_path'].type.length == 500
        assert columns['status'].type.length == 50
        assert columns['last_run_result'].type.length == 50
    
    def test_generated_test_model_long_content(self):
        """Test GeneratedTest model handles long test content"""
        long_content = "\\n".join([f"# Line {i}: " + "test content " * 20 for i in range(100)])
        
        generated_test = GeneratedTest(
            webhook_event_id="event_long",
            test_name="test_long_content",
            test_content=long_content,
            file_path="/path/to/test_long_content.py"
        )
        
        assert generated_test.test_content == long_content
        assert len(generated_test.test_content) > 1000

class TestInitDb:
    """Unit tests for init_db function"""
    
    @patch('src.database.models.Settings')
    @patch('src.database.models.create_engine')
    @patch('src.database.models.sessionmaker')
    @patch('src.database.models.Base.metadata.create_all')
    @patch('src.database.models.logger')
    @pytest.mark.asyncio
    async def test_init_db_sqlite(self, mock_logger, mock_create_all, mock_sessionmaker, mock_create_engine, mock_settings_class):
        """Test init_db function with SQLite database"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings.database_url = "sqlite:///./test.db"
        mock_settings_class.return_value = mock_settings
        
        mock_engine = Mock()
        mock_create_engine.return_value = mock_engine
        
        mock_session_local = Mock()
        mock_sessionmaker.return_value = mock_session_local
        
        # Call the function
        await init_db()
        
        # Verify Settings was instantiated
        mock_settings_class.assert_called_once()
        
        # Verify engine was created with correct parameters
        mock_create_engine.assert_called_once_with(
            "sqlite:///./test.db",
            connect_args={"check_same_thread": False}
        )
        
        # Verify sessionmaker was called correctly
        mock_sessionmaker.assert_called_once_with(
            autocommit=False,
            autoflush=False,
            bind=mock_engine
        )
        
        # Verify tables were created
        mock_create_all.assert_called_once_with(bind=mock_engine)
        
        # Verify logging
        mock_logger.info.assert_called_once_with("Database initialized successfully")
    
    @patch('src.database.models.Settings')
    @patch('src.database.models.create_engine')
    @patch('src.database.models.sessionmaker')
    @patch('src.database.models.Base.metadata.create_all')
    @patch('src.database.models.logger')
    @pytest.mark.asyncio
    async def test_init_db_postgresql(self, mock_logger, mock_create_all, mock_sessionmaker, mock_create_engine, mock_settings_class):
        """Test init_db function with PostgreSQL database"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings.database_url = "postgresql://user:pass@localhost/dbname"
        mock_settings_class.return_value = mock_settings
        
        mock_engine = Mock()
        mock_create_engine.return_value = mock_engine
        
        mock_session_local = Mock()
        mock_sessionmaker.return_value = mock_session_local
        
        # Call the function
        await init_db()
        
        # Verify engine was created without SQLite-specific connect_args
        mock_create_engine.assert_called_once_with(
            "postgresql://user:pass@localhost/dbname",
            connect_args={}
        )
    
    @patch('src.database.models.Settings')
    @patch('src.database.models.create_engine')
    @patch('src.database.models.sessionmaker')
    @patch('src.database.models.Base.metadata.create_all')
    @patch('src.database.models.logger')
    @pytest.mark.asyncio
    async def test_init_db_mysql(self, mock_logger, mock_create_all, mock_sessionmaker, mock_create_engine, mock_settings_class):
        """Test init_db function with MySQL database"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings.database_url = "mysql://user:pass@localhost/dbname"
        mock_settings_class.return_value = mock_settings
        
        mock_engine = Mock()
        mock_create_engine.return_value = mock_engine
        
        # Call the function
        await init_db()
        
        # Verify engine was created without SQLite-specific connect_args
        mock_create_engine.assert_called_once_with(
            "mysql://user:pass@localhost/dbname",
            connect_args={}
        )
    
    @patch('src.database.models.Settings')
    @patch('src.database.models.create_engine')
    @patch('src.database.models.sessionmaker')
    @pytest.mark.asyncio
    async def test_init_db_creates_engine_and_session(self, mock_sessionmaker, mock_create_engine, mock_settings_class):
        """Test that init_db creates engine and session factory correctly"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings.database_url = "sqlite:///./test.db"
        mock_settings_class.return_value = mock_settings
        
        mock_engine = Mock()
        mock_create_engine.return_value = mock_engine
        
        mock_session_local = Mock()
        mock_sessionmaker.return_value = mock_session_local
        
        # Call the function
        await init_db()
        
        # Verify engine was created
        mock_create_engine.assert_called_once()
        
        # Verify sessionmaker was configured correctly
        mock_sessionmaker.assert_called_once_with(
            autocommit=False,
            autoflush=False,
            bind=mock_engine
        )

class TestGetDb:
    """Unit tests for get_db dependency function"""
    
    @patch('src.database.models.SessionLocal')
    def test_get_db_yields_session(self, mock_sessionlocal_class):
        """Test that get_db yields a database session"""
        # Setup mock session
        mock_session = Mock()
        mock_sessionlocal_class.return_value = mock_session
        
        # Use the generator
        db_generator = get_db()
        db_session = next(db_generator)
        
        # Verify session was created and yielded
        mock_sessionlocal_class.assert_called_once()
        assert db_session == mock_session
    
    @patch('src.database.models.SessionLocal')
    def test_get_db_closes_session_on_completion(self, mock_sessionlocal_class):
        """Test that get_db closes the session after use"""
        # Setup mock session
        mock_session = Mock()
        mock_sessionlocal_class.return_value = mock_session
        
        # Use the generator and exhaust it
        db_generator = get_db()
        db_session = next(db_generator)
        
        # Close the generator (simulating end of request)
        try:
            next(db_generator)
        except StopIteration:
            pass
        
        # Verify session was closed
        mock_session.close.assert_called_once()
    
    @patch('src.database.models.SessionLocal')
    def test_get_db_closes_session_on_exception(self, mock_sessionlocal_class):
        """Test that get_db closes the session even when an exception occurs"""
        # Setup mock session
        mock_session = Mock()
        mock_sessionlocal_class.return_value = mock_session
        
        # Use the generator
        db_generator = get_db()
        db_session = next(db_generator)
        
        # Simulate an exception by calling close on the generator
        try:
            db_generator.close()
        except GeneratorExit:
            pass
        
        # Verify session was closed
        mock_session.close.assert_called_once()

class TestDatabaseIntegration:
    """Integration tests for database models using in-memory SQLite"""
    
    @pytest.fixture
    def in_memory_db(self):
        """Create an in-memory SQLite database for testing"""
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool
        )
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # Create session factory
        TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        return engine, TestSessionLocal
    
    def test_webhook_event_crud_operations(self, in_memory_db):
        """Test CRUD operations on WebhookEvent model"""
        engine, TestSessionLocal = in_memory_db
        
        with TestSessionLocal() as session:
            # Create
            webhook_event = WebhookEvent(
                event_id="crud_test_123",
                event_type="api_created",
                project_id="test_project",
                payload={"test": "data"}
            )
            session.add(webhook_event)
            session.commit()
            
            # Read
            retrieved = session.query(WebhookEvent).filter(
                WebhookEvent.event_id == "crud_test_123"
            ).first()
            
            assert retrieved is not None
            assert retrieved.event_type == "api_created"
            assert retrieved.payload["test"] == "data"
            
            # Update
            retrieved.processed = True
            retrieved.error_message = "Test error"
            session.commit()
            
            # Verify update
            updated = session.query(WebhookEvent).filter(
                WebhookEvent.event_id == "crud_test_123"
            ).first()
            
            assert updated.processed is True
            assert updated.error_message == "Test error"
            
            # Delete
            session.delete(updated)
            session.commit()
            
            # Verify deletion
            deleted = session.query(WebhookEvent).filter(
                WebhookEvent.event_id == "crud_test_123"
            ).first()
            
            assert deleted is None
    
    def test_generated_test_crud_operations(self, in_memory_db):
        """Test CRUD operations on GeneratedTest model"""
        engine, TestSessionLocal = in_memory_db
        
        with TestSessionLocal() as session:
            # Create
            generated_test = GeneratedTest(
                webhook_event_id="test_event_123",
                test_name="test_integration",
                test_content="def test_something(): pass",
                file_path="/tmp/test_integration.py"
            )
            session.add(generated_test)
            session.commit()
            
            # Read
            retrieved = session.query(GeneratedTest).filter(
                GeneratedTest.test_name == "test_integration"
            ).first()
            
            assert retrieved is not None
            assert retrieved.webhook_event_id == "test_event_123"
            assert retrieved.status == "generated"
            
            # Update
            retrieved.status = "executed"
            retrieved.last_run_result = "passed"
            session.commit()
            
            # Verify update
            updated = session.query(GeneratedTest).filter(
                GeneratedTest.test_name == "test_integration"
            ).first()
            
            assert updated.status == "executed"
            assert updated.last_run_result == "passed"