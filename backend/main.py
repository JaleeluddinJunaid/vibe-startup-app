import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

# Load the secret keys from the .env file (used locally; on Render they come from the dashboard)
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Create the connection to your Supabase database
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create the web app
app = FastAPI()

# Allow your frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Describes the shape of data we expect when saving an item
class Item(BaseModel):
    name: str
    description: str

# GET endpoint: returns all items, newest first
@app.get("/items")
def get_items():
    response = supabase.table("items").select("*").order("id", desc=True).execute()
    return response.data

# POST endpoint: saves a new item
@app.post("/items")
def get_items():
    response = supabase.table("items").select("*").execute()
    return response.data