from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    level: int = 1
    xp: int = 0
    gold: int = 100
    strength: int = 10
    intelligence: int = 10
    vitality: int = 10
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str

class Quest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    difficulty: str  # easy, medium, hard
    xp_reward: int
    gold_reward: int
    item_reward: Optional[str] = None
    attribute_rewards: Optional[dict] = None  # {"strength": 2, "intelligence": 1, "vitality": 1}
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class QuestCreate(BaseModel):
    user_id: str
    title: str
    description: str
    difficulty: Optional[str] = None
    xp_reward: Optional[int] = None
    gold_reward: Optional[int] = None
    item_reward: Optional[str] = None
    attribute_rewards: Optional[dict] = None

class ShopItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: int
    stock: Optional[int] = None
    category: str = "general"  # Category for filtering
    image: Optional[str] = None  # Base64 encoded image
    stat_boost: Optional[dict] = None
    item_type: str  # weapon, armor, potion, accessory

class ShopItemCreate(BaseModel):
    name: str
    description: str
    price: int
    stock: Optional[int] = None
    category: str = "general"
    image: Optional[str] = None
    stat_boost: Optional[dict] = None
    item_type: str

class InventoryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    item_id: str
    item_name: str
    item_description: str
    item_type: str
    stat_boost: Optional[dict] = None
    acquired_at: datetime = Field(default_factory=datetime.utcnow)

class PurchaseRequest(BaseModel):
    user_id: str
    item_id: str


# Helper function to calculate XP needed for next level
def xp_for_level(level: int) -> int:
    return level * 100

# Helper function to calculate quest rewards based on difficulty
def calculate_rewards(difficulty: str) -> tuple:
    rewards = {
        "easy": (50, 10),
        "medium": (100, 25),
        "hard": (200, 50)
    }
    return rewards.get(difficulty.lower(), (50, 10))


# User endpoints
@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    # Check if user already exists
    existing = await db.users.find_one({"username": user.username})
    if existing:
        return User(**existing)
    
    user_obj = User(**user.dict())
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.get("/users", response_model=List[User])
async def get_all_users():
    users = await db.users.find().to_list(100)
    return [User(**user) for user in users]


# Quest endpoints
@api_router.post("/quests", response_model=Quest)
async def create_quest(quest: QuestCreate):
    quest_dict = quest.dict()
    
    # If rewards not specified, calculate based on difficulty
    if quest_dict.get("xp_reward") is None and quest_dict.get("difficulty"):
        xp_reward, gold_reward = calculate_rewards(quest_dict["difficulty"])
        quest_dict["xp_reward"] = xp_reward
        quest_dict["gold_reward"] = gold_reward
    elif quest_dict.get("xp_reward") is None:
        # Default rewards if nothing specified
        quest_dict["xp_reward"] = 50
        quest_dict["gold_reward"] = 10
    
    if quest_dict.get("gold_reward") is None:
        quest_dict["gold_reward"] = 10
    
    if not quest_dict.get("difficulty"):
        quest_dict["difficulty"] = "custom"
    
    quest_obj = Quest(**quest_dict)
    await db.quests.insert_one(quest_obj.dict())
    return quest_obj

@api_router.get("/quests/{user_id}", response_model=List[Quest])
async def get_user_quests(user_id: str):
    quests = await db.quests.find({"user_id": user_id}).to_list(1000)
    return [Quest(**quest) for quest in quests]

@api_router.post("/quests/{quest_id}/complete")
async def complete_quest(quest_id: str):
    quest = await db.quests.find_one({"id": quest_id})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    if quest["completed"]:
        raise HTTPException(status_code=400, detail="Quest already completed")
    
    # Update quest
    await db.quests.update_one(
        {"id": quest_id},
        {"$set": {"completed": True, "completed_at": datetime.utcnow()}}
    )
    
    # Update user XP and gold
    user = await db.users.find_one({"id": quest["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_xp = user["xp"] + quest["xp_reward"]
    new_gold = user["gold"] + quest["gold_reward"]
    new_level = user["level"]
    
    # Check for level up
    while new_xp >= xp_for_level(new_level):
        new_xp -= xp_for_level(new_level)
        new_level += 1
    
    updates = {"xp": new_xp, "gold": new_gold, "level": new_level}
    
    # Apply attribute rewards if specified
    if quest.get("attribute_rewards"):
        for attr, value in quest["attribute_rewards"].items():
            if attr in ["strength", "intelligence", "vitality"]:
                updates[attr] = user.get(attr, 10) + value
    
    await db.users.update_one(
        {"id": quest["user_id"]},
        {"$set": updates}
    )
    
    # Handle item reward if specified
    item_reward_name = None
    if quest.get("item_reward"):
        # Create a custom inventory item for the quest reward
        inventory_item = InventoryItem(
            user_id=quest["user_id"],
            item_id=str(uuid.uuid4()),
            item_name=quest["item_reward"],
            item_description="Quest reward item",
            item_type="quest_reward",
            stat_boost=quest.get("attribute_rewards")
        )
        await db.inventory.insert_one(inventory_item.dict())
        item_reward_name = quest["item_reward"]
    
    updated_user = await db.users.find_one({"id": quest["user_id"]})
    return {
        "quest": Quest(**{**quest, "completed": True}), 
        "user": User(**updated_user),
        "item_reward": item_reward_name
    }

@api_router.delete("/quests/{quest_id}")
async def delete_quest(quest_id: str):
    result = await db.quests.delete_one({"id": quest_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quest not found")
    return {"message": "Quest deleted"}


# Shop endpoints
@api_router.get("/shop", response_model=List[ShopItem])
async def get_shop_items():
    items = await db.shop_items.find().to_list(1000)
    return [ShopItem(**item) for item in items]

@api_router.post("/shop", response_model=ShopItem)
async def create_shop_item(item: ShopItemCreate):
    item_obj = ShopItem(**item.dict())
    await db.shop_items.insert_one(item_obj.dict())
    return item_obj

@api_router.put("/shop/{item_id}", response_model=ShopItem)
async def update_shop_item(item_id: str, item: ShopItemCreate):
    existing = await db.shop_items.find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Shop item not found")
    
    await db.shop_items.update_one(
        {"id": item_id},
        {"$set": item.dict()}
    )
    
    updated_item = await db.shop_items.find_one({"id": item_id})
    return ShopItem(**updated_item)

@api_router.delete("/shop/clear-all")
async def clear_all_shop_items():
    result = await db.shop_items.delete_many({})
    return {"message": f"Deleted {result.deleted_count} items from shop"}

@api_router.delete("/shop/{item_id}")
async def delete_shop_item(item_id: str):
    result = await db.shop_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shop item not found")
    return {"message": "Shop item deleted"}

@api_router.post("/shop/purchase")
async def purchase_item(purchase: PurchaseRequest):
    # Get user
    user = await db.users.find_one({"id": purchase.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get item
    item = await db.shop_items.find_one({"id": purchase.item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if user has enough gold
    if user["gold"] < item["price"]:
        raise HTTPException(status_code=400, detail="Not enough gold")
    
    # Deduct gold and update stats
    new_gold = user["gold"] - item["price"]
    updates = {"gold": new_gold}
    
    if item.get("stat_boost"):
        for stat, boost in item["stat_boost"].items():
            updates[stat] = user.get(stat, 0) + boost
    
    await db.users.update_one({"id": purchase.user_id}, {"$set": updates})
    
    # Add to inventory
    inventory_item = InventoryItem(
        user_id=purchase.user_id,
        item_id=item["id"],
        item_name=item["name"],
        item_description=item["description"],
        item_type=item["item_type"],
        stat_boost=item.get("stat_boost")
    )
    await db.inventory.insert_one(inventory_item.dict())
    
    updated_user = await db.users.find_one({"id": purchase.user_id})
    return {"user": User(**updated_user), "item": ShopItem(**item)}


# Inventory endpoints
@api_router.get("/inventory/{user_id}", response_model=List[InventoryItem])
async def get_user_inventory(user_id: str):
    items = await db.inventory.find({"user_id": user_id}).to_list(1000)
    return [InventoryItem(**item) for item in items]

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str):
    result = await db.inventory.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return {"message": "Inventory item deleted"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
