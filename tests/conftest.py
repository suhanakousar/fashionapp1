"""
Pytest configuration and fixtures
"""
import pytest
import os
from unittest.mock import MagicMock


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

