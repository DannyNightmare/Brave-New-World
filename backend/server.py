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
    ability_points: int = 5  # AP for leveling up powers
    # RPG Status fields
    hp: int = 100
    max_hp: int = 100
    mp: int = 50
    max_mp: int = 50
    player_class: str = "Adventurer"
    title: str = "Novice"
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
    ap_reward: int = 0
    item_reward: Optional[str] = None
    attribute_rewards: Optional[dict] = None  # {"strength": 2, "intelligence": 1, "vitality": 1}
    completed: bool = False
    repeat_frequency: str = "none"  # none, daily, weekly, monthly
    last_completed: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class QuestCreate(BaseModel):
    user_id: str
    title: str
    description: str
    difficulty: Optional[str] = None
    xp_reward: Optional[int] = None
    gold_reward: Optional[int] = None
    ap_reward: Optional[int] = 0
    item_reward: Optional[str] = None
    attribute_rewards: Optional[dict] = None
    repeat_frequency: Optional[str] = "none"

class ShopItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: int
    stock: Optional[int] = None
    category: str = "general"  # Category for filtering
    images: Optional[List[str]] = None  # List of Base64 encoded images (supports multiple GIF/PNG)
    is_power: bool = False  # Whether this item appears in Powers tab
    power_category: Optional[str] = None  # Category in Powers tab (e.g., "Physical Abilities")
    power_subcategory: Optional[str] = None  # Subcategory in Powers tab (e.g., "Strength", "Speed")
    power_tier: Optional[str] = None  # Tier: "Base", "Peak Human", "Enhanced", "Superhuman", "Absolute"
    power_max_level: Optional[int] = None  # Maximum level for this power
    next_tier_ability: Optional[str] = None  # Name of the ability that unlocks when this is maxed
    stat_boost: Optional[dict] = None
    item_type: str  # weapon, armor, potion, accessory, exp, synthesis_material, gold, ability_points
    # Consumable item fields
    exp_amount: Optional[int] = None  # EXP gained when used
    gold_amount: Optional[int] = None  # Gold gained when used
    ap_amount: Optional[int] = None  # Ability Points gained when used
    is_synthesis_material: bool = False  # Whether this can be used in synthesis

class ShopItemCreate(BaseModel):
    name: str
    description: str
    price: int
    stock: Optional[int] = None
    category: str = "general"
    images: Optional[List[str]] = None
    is_power: bool = False
    power_category: Optional[str] = None
    power_subcategory: Optional[str] = None
    power_tier: Optional[str] = None
    power_max_level: Optional[int] = None
    next_tier_ability: Optional[str] = None
    stat_boost: Optional[dict] = None
    item_type: str
    # Consumable item fields
    exp_amount: Optional[int] = None
    gold_amount: Optional[int] = None
    ap_amount: Optional[int] = None
    is_synthesis_material: bool = False

class InventoryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    item_id: str
    item_name: str
    item_description: str
    item_type: str
    category: str = "general"  # Item category from shop
    stat_boost: Optional[dict] = None
    # Consumable fields
    exp_amount: Optional[int] = None
    gold_amount: Optional[int] = None
    ap_amount: Optional[int] = None
    is_synthesis_material: Optional[bool] = False
    acquired_at: datetime = Field(default_factory=datetime.utcnow)

class PurchaseRequest(BaseModel):
    user_id: str
    item_id: str

class PowerItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    shop_item_id: str
    name: str
    description: str
    power_category: str  # e.g., "Physical Abilities", "Mental Abilities"
    power_subcategory: Optional[str] = None  # e.g., "Strength", "Speed"
    power_tier: str = "Base"  # "Base", "Peak Human", "Enhanced", "Superhuman", "Absolute"
    current_level: int = 1  # Current level of the power
    max_level: int = 5  # Maximum level before needing to upgrade tier
    next_tier_ability: Optional[str] = None  # Name of ability that unlocks when maxed
    sub_abilities: Optional[list] = None  # List of sub-abilities/perks
    image: Optional[str] = None
    stat_boost: Optional[dict] = None
    acquired_at: datetime = Field(default_factory=datetime.utcnow)

class CustomStat(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    color: str
    current: int
    max: int
    level: int = 1
    icon: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CustomStatCreate(BaseModel):
    user_id: str
    name: str
    color: str
    current: int
    max: int
    level: Optional[int] = 1
    icon: Optional[str] = None


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

@api_router.post("/users/{user_id}/reset")
async def reset_user_stats(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Reset user to default values
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "level": 1,
            "xp": 0,
            "gold": 100,
            "strength": 10,
            "intelligence": 10,
            "vitality": 10,
            "ability_points": 5
        }}
    )
    
    updated_user = await db.users.find_one({"id": user_id})
    return {"message": "User stats reset to default", "user": User(**updated_user)}


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
    
    # For limitless quests, allow re-completion. For others, check if already completed
    if quest["completed"] and quest.get("repeat_frequency") != "limitless":
        raise HTTPException(status_code=400, detail="Quest already completed")
    
    # Update quest - For limitless quests, keep completed as False so it can be done again
    is_limitless = quest.get("repeat_frequency") == "limitless"
    await db.quests.update_one(
        {"id": quest_id},
        {"$set": {
            "completed": False if is_limitless else True, 
            "completed_at": datetime.utcnow(),
            "last_completed": datetime.utcnow()
        }}
    )
    
    # Update user XP, gold, and AP
    user = await db.users.find_one({"id": quest["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_xp = user["xp"] + quest["xp_reward"]
    new_gold = user["gold"] + quest["gold_reward"]
    new_level = user["level"]
    new_ability_points = user.get("ability_points", 5) + quest.get("ap_reward", 0)
    
    # Check for level up
    levels_gained = 0
    while new_xp >= xp_for_level(new_level):
        new_xp -= xp_for_level(new_level)
        new_level += 1
        levels_gained += 1
    
    # Give 2 ability points per level gained
    new_ability_points += levels_gained * 2
    
    updates = {"xp": new_xp, "gold": new_gold, "level": new_level, "ability_points": new_ability_points}
    
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
        "item_reward": item_reward_name,
        "levels_gained": levels_gained,
        "old_level": user["level"],
        "xp_reward": quest["xp_reward"],
        "gold_reward": quest["gold_reward"]
    }

@api_router.put("/quests/{quest_id}")
async def update_quest(quest_id: str, quest_update: QuestCreate):
    existing_quest = await db.quests.find_one({"id": quest_id})
    if not existing_quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    update_data = {
        "title": quest_update.title,
        "description": quest_update.description,
        "xp_reward": quest_update.xp_reward,
        "gold_reward": quest_update.gold_reward,
        "ap_reward": quest_update.ap_reward,
        "item_reward": quest_update.item_reward,
        "attribute_rewards": quest_update.attribute_rewards,
        "repeat_frequency": quest_update.repeat_frequency,
    }
    
    await db.quests.update_one(
        {"id": quest_id},
        {"$set": update_data}
    )
    
    updated_quest = await db.quests.find_one({"id": quest_id})
    return Quest(**updated_quest)

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
        category=item.get("category", "general"),
        stat_boost=item.get("stat_boost"),
        exp_amount=item.get("exp_amount"),
        gold_amount=item.get("gold_amount"),
        ap_amount=item.get("ap_amount"),
        is_synthesis_material=item.get("is_synthesis_material", False)
    )
    await db.inventory.insert_one(inventory_item.dict())
    
    # If this is a power item, also add to powers collection
    if item.get("is_power") and item.get("power_category"):
        power_item = PowerItem(
            user_id=purchase.user_id,
            shop_item_id=item["id"],
            name=item["name"],
            description=item["description"],
            power_category=item["power_category"],
            power_subcategory=item.get("power_subcategory"),
            power_tier=item.get("power_tier", "Base"),
            current_level=1,
            max_level=item.get("power_max_level", 5),
            next_tier_ability=item.get("next_tier_ability"),
            image=item.get("image"),
            stat_boost=item.get("stat_boost")
        )
        await db.powers.insert_one(power_item.dict())
    
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

@api_router.post("/inventory/{item_id}/use")
async def use_inventory_item(item_id: str, request: dict):
    user_id = request.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    # Get the inventory item
    item = await db.inventory.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Get user
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = {}
    old_level = user.get("level", 1)
    new_xp = user.get("xp", 0)
    
    # Apply consumable effects based on item type
    if item.get("item_type") == "exp" and item.get("exp_amount"):
        # Add EXP to user
        new_xp = user.get("xp", 0) + item["exp_amount"]
        await db.users.update_one({"id": user_id}, {"$set": {"xp": new_xp}})
        result["exp_gained"] = item["exp_amount"]
        
    elif item.get("item_type") == "gold" and item.get("gold_amount"):
        # Add Gold to user
        new_gold = user.get("gold", 0) + item["gold_amount"]
        await db.users.update_one({"id": user_id}, {"$set": {"gold": new_gold}})
        result["gold_gained"] = item["gold_amount"]
        
    elif item.get("item_type") == "ability_points" and item.get("ap_amount"):
        # Add AP to user
        new_ap = user.get("ability_points", 0) + item["ap_amount"]
        await db.users.update_one({"id": user_id}, {"$set": {"ability_points": new_ap}})
        result["ap_gained"] = item["ap_amount"]
    else:
        raise HTTPException(status_code=400, detail="Item is not consumable or has no effect")
    
    # Check for level up (XP threshold: level * 100)
    new_level = old_level
    while new_xp >= (new_level * 100):
        new_level += 1
    
    if new_level > old_level:
        # User leveled up! Update level and grant rewards
        gold_reward = 50 * (new_level - old_level)
        ap_reward = 5 * (new_level - old_level)
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "level": new_level,
                "gold": user.get("gold", 0) + gold_reward,
                "ability_points": user.get("ability_points", 0) + ap_reward
            }}
        )
        
        result["level_up"] = True
        result["new_level"] = new_level
        result["gold_reward"] = gold_reward
        result["ap_reward"] = ap_reward
    
    # Remove the item from inventory after use
    await db.inventory.delete_one({"id": item_id})
    
    return result


# Powers endpoints
@api_router.get("/powers/{user_id}", response_model=List[PowerItem])
async def get_user_powers(user_id: str):
    powers = await db.powers.find({"user_id": user_id}).to_list(1000)
    return [PowerItem(**power) for power in powers]

@api_router.get("/powers/categories/all")
async def get_all_power_categories():
    """Get all unique power categories from powers collection"""
    powers = await db.powers.find().to_list(10000)
    categories = list(set([power["power_category"] for power in powers if power.get("power_category")]))
    return {"categories": sorted(categories)}

@api_router.delete("/powers/{power_id}")
async def delete_power(power_id: str):
    result = await db.powers.delete_one({"id": power_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Power not found")
    return {"message": "Power deleted"}

# User Categories endpoints
@api_router.post("/users/{user_id}/categories")
async def save_user_categories(user_id: str, categories: dict):
    """Save user's custom categories and subcategories"""
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"custom_categories": categories}}
    )
    return {"message": "Categories saved", "categories": categories}

@api_router.get("/users/{user_id}/categories")
async def get_user_categories(user_id: str):
    """Get user's custom categories"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.get("custom_categories", {})

@api_router.post("/powers/{power_id}/levelup")
async def level_up_power(power_id: str):
    power = await db.powers.find_one({"id": power_id})
    if not power:
        raise HTTPException(status_code=404, detail="Power not found")
    
    if power["current_level"] >= power["max_level"]:
        raise HTTPException(status_code=400, detail="Power is already at max level")
    
    # Check if user has enough ability points
    user = await db.users.find_one({"id": power["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("ability_points", 0) < 1:
        raise HTTPException(status_code=400, detail="Not enough ability points")
    
    # Consume 1 ability point and level up the power
    new_level = power["current_level"] + 1
    await db.powers.update_one(
        {"id": power_id},
        {"$set": {"current_level": new_level}}
    )
    
    # Deduct 1 ability point from user
    await db.users.update_one(
        {"id": power["user_id"]},
        {"$set": {"ability_points": user["ability_points"] - 1}}
    )
    
    # Check if power reached max level and has next tier ability
    if new_level >= power["max_level"] and power.get("next_tier_ability"):
        # Search for the next tier item in shop
        next_tier_item = await db.shop_items.find_one({
            "name": power["next_tier_ability"],
            "is_power": True
        })
        
        # Create the next tier power automatically
        next_power = PowerItem(
            user_id=power["user_id"],
            shop_item_id=next_tier_item["id"] if next_tier_item else str(uuid.uuid4()),
            name=power["next_tier_ability"],
            description=next_tier_item.get("description", f"Advanced form of {power['name']}") if next_tier_item else f"Advanced form of {power['name']}",
            power_category=power["power_category"],
            power_tier=next_tier_item.get("power_tier", "Peak Human") if next_tier_item else "Peak Human",
            current_level=1,
            max_level=next_tier_item.get("power_max_level", 5) if next_tier_item else 5,
            next_tier_ability=next_tier_item.get("next_tier_ability") if next_tier_item else None,
            image=next_tier_item.get("image") if next_tier_item else power.get("image"),
            stat_boost=next_tier_item.get("stat_boost") if next_tier_item else power.get("stat_boost")
        )
        await db.powers.insert_one(next_power.dict())
    
    updated_power = await db.powers.find_one({"id": power_id})
    return PowerItem(**updated_power)

@api_router.put("/powers/{power_id}")
async def update_power(power_id: str, updates: dict):
    power = await db.powers.find_one({"id": power_id})
    if not power:
        raise HTTPException(status_code=404, detail="Power not found")
    
    # Only allow updating specific fields
    allowed_fields = ["name", "description", "max_level", "sub_abilities"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if update_data:
        await db.powers.update_one(
            {"id": power_id},
            {"$set": update_data}
        )
    
    updated_power = await db.powers.find_one({"id": power_id})
    return PowerItem(**updated_power)


# Custom Stats endpoints
@api_router.get("/users/{user_id}/stats", response_model=List[CustomStat])
async def get_user_stats(user_id: str):
    """Get all custom stats for a user"""
    stats = await db.custom_stats.find({"user_id": user_id}).to_list(1000)
    return [CustomStat(**stat) for stat in stats]

@api_router.post("/users/{user_id}/stats", response_model=CustomStat)
async def create_custom_stat(user_id: str, stat: CustomStatCreate):
    """Create a new custom stat"""
    stat_dict = stat.dict()
    stat_dict["user_id"] = user_id
    stat_dict["id"] = str(uuid.uuid4())
    stat_dict["created_at"] = datetime.utcnow()
    
    await db.custom_stats.insert_one(stat_dict)
    return CustomStat(**stat_dict)

@api_router.put("/users/{user_id}/stats/{stat_id}")
async def update_custom_stat(user_id: str, stat_id: str, updates: dict):
    """Update a custom stat"""
    stat = await db.custom_stats.find_one({"id": stat_id, "user_id": user_id})
    if not stat:
        raise HTTPException(status_code=404, detail="Custom stat not found")
    
    # Allow updating name, color, current, max, icon
    allowed_fields = ["name", "color", "current", "max", "icon"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if update_data:
        await db.custom_stats.update_one(
            {"id": stat_id, "user_id": user_id},
            {"$set": update_data}
        )
    
    updated_stat = await db.custom_stats.find_one({"id": stat_id})
    return CustomStat(**updated_stat)

@api_router.delete("/users/{user_id}/stats/{stat_id}")
async def delete_custom_stat(user_id: str, stat_id: str):
    """Delete a custom stat"""
    result = await db.custom_stats.delete_one({"id": stat_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Custom stat not found")
    return {"message": "Custom stat deleted successfully"}


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
