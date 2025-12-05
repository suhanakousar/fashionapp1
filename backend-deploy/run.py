"""
Main entry point for backend deployment
This file allows the backend to be run directly with: python run.py
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)

