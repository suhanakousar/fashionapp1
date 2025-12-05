"""
MongoDB connection and database setup
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/styleweave")

# Create async MongoDB client
client = AsyncIOMotorClient(MONGO_URI)

# Get database
db = client.styleweave

# Collections
# db.uploads - stores uploaded images metadata
# db.jobs - stores job status and results

