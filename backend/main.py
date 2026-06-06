import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Item(BaseModel):
    name: str
    description: str

# GET endpoint: returns all items
@app.get("/items")
def get_items():
    response = supabase.table("items").select("*").execute()
    return response.data

# POST endpoint: saves a new item
@app.post("/items")
def create_item(item: Item):
    response = supabase.table("items").insert(
        {"name": item.name, "description": item.description}
    ).execute()
    return response.data