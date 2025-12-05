"""
Pytest configuration and fixtures
"""
import pytest
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

# Add vercel-deploy/api to Python path for imports
project_root = Path(__file__).parent.parent
api_path = project_root / "vercel-deploy" / "api"
if str(api_path) not in sys.path:
    sys.path.insert(0, str(api_path))


@pytest.fixture
def mock_cloudinary():
    """Mock Cloudinary upload"""
    with patch("api.core.cloudinary_utils.upload_file_to_cloudinary") as mock:
        mock.return_value = {
            "public_id": "test/public_id",
            "secure_url": "https://res.cloudinary.com/test/image.jpg",
            "width": 1024,
            "height": 1536
        }
        yield mock


@pytest.fixture
def mock_mongo():
    """Mock MongoDB database"""
    with patch("api.core.mongo.db") as mock_db:
        yield mock_db


@pytest.fixture
def sample_image_path(tmp_path):
    """Create a sample test image"""
    # Create a simple test image file
    image_path = tmp_path / "test.jpg"
    image_path.write_bytes(b"fake image data")
    return str(image_path)

