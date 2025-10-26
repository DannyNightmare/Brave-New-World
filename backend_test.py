#!/usr/bin/env python3
"""
Backend Testing for "Add to Powers" Feature
Tests the complete power system implementation including shop items, purchases, and power management.
"""

import requests
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any

# Backend URL from frontend environment
BACKEND_URL = "https://gamelife-rpg.preview.emergentagent.com/api"

class PowersBackendTester:
    def __init__(self):
        self.test_user_id = None
        self.test_power_item_id = None
        self.test_regular_item_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def setup_test_user(self) -> str:
        """Create or get a test user"""
        try:
            # Create a test user
            user_data = {
                "username": f"power_test_user_{uuid.uuid4().hex[:8]}"
            }
            
            response = requests.post(f"{BACKEND_URL}/users", json=user_data)
            if response.status_code == 200:
                user = response.json()
                self.test_user_id = user["id"]
                self.log_test("Setup Test User", True, f"Created user: {user['username']} (ID: {user['id']})")
                return user["id"]
            else:
                self.log_test("Setup Test User", False, f"Failed to create user: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Setup Test User", False, f"Exception: {str(e)}")
            return None
    
    def test_shop_item_creation_with_power_fields(self):
        """Test creating shop items with power fields"""
        print("\n=== Testing Shop Item Creation with Power Fields ===")
        
        # Test 1: Create power item with is_power=true and power_category
        try:
            power_item_data = {
                "name": "Super Strength Serum",
                "description": "Increases physical strength dramatically",
                "price": 150,
                "category": "consumables",
                "item_type": "potion",
                "is_power": True,
                "power_category": "Physical Abilities",
                "stat_boost": {"strength": 5}
            }
            
            response = requests.post(f"{BACKEND_URL}/shop", json=power_item_data)
            if response.status_code == 200:
                item = response.json()
                self.test_power_item_id = item["id"]
                
                # Verify all fields are saved correctly
                if (item["is_power"] == True and 
                    item["power_category"] == "Physical Abilities" and
                    item["stat_boost"]["strength"] == 5):
                    self.log_test("Create Power Item", True, f"Power item created with ID: {item['id']}")
                else:
                    self.log_test("Create Power Item", False, f"Power fields not saved correctly: {item}")
            else:
                self.log_test("Create Power Item", False, f"Failed to create power item: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_test("Create Power Item", False, f"Exception: {str(e)}")
        
        # Test 2: Create regular item with is_power=false
        try:
            regular_item_data = {
                "name": "Health Potion",
                "description": "Restores health",
                "price": 50,
                "category": "consumables", 
                "item_type": "potion",
                "is_power": False,
                "stat_boost": {"vitality": 2}
            }
            
            response = requests.post(f"{BACKEND_URL}/shop", json=regular_item_data)
            if response.status_code == 200:
                item = response.json()
                self.test_regular_item_id = item["id"]
                
                # Verify power_category is optional when is_power=false
                if item["is_power"] == False and item.get("power_category") is None:
                    self.log_test("Create Regular Item", True, f"Regular item created with ID: {item['id']}")
                else:
                    self.log_test("Create Regular Item", False, f"Regular item fields incorrect: {item}")
            else:
                self.log_test("Create Regular Item", False, f"Failed to create regular item: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_test("Create Regular Item", False, f"Exception: {str(e)}")
    
    def test_power_categories_endpoint(self):
        """Test power categories endpoint"""
        print("\n=== Testing Power Categories Endpoint ===")
        
        try:
            # Test when no powers exist yet
            response = requests.get(f"{BACKEND_URL}/powers/categories/all")
            if response.status_code == 200:
                data = response.json()
                if "categories" in data and isinstance(data["categories"], list):
                    self.log_test("Power Categories Endpoint Structure", True, f"Returns categories array: {data['categories']}")
                else:
                    self.log_test("Power Categories Endpoint Structure", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Power Categories Endpoint Structure", False, f"Failed to get categories: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_test("Power Categories Endpoint Structure", False, f"Exception: {str(e)}")
    
    def test_purchase_flow_with_powers(self):
        """Test purchasing power items and verifying they appear in both inventory and powers"""
        print("\n=== Testing Purchase Flow with Powers ===")
        
        if not self.test_user_id or not self.test_power_item_id:
            self.log_test("Purchase Flow Setup", False, "Missing test user or power item")
            return
        
        try:
            # Get user's initial gold
            user_response = requests.get(f"{BACKEND_URL}/users/{self.test_user_id}")
            if user_response.status_code != 200:
                self.log_test("Get User Before Purchase", False, f"Failed to get user: {user_response.text}")
                return
            
            initial_user = user_response.json()
            initial_gold = initial_user["gold"]
            initial_strength = initial_user["strength"]
            
            # Purchase the power item
            purchase_data = {
                "user_id": self.test_user_id,
                "item_id": self.test_power_item_id
            }
            
            purchase_response = requests.post(f"{BACKEND_URL}/shop/purchase", json=purchase_data)
            if purchase_response.status_code == 200:
                purchase_result = purchase_response.json()
                
                # Verify gold was deducted
                new_gold = purchase_result["user"]["gold"]
                item_price = purchase_result["item"]["price"]
                
                if new_gold == initial_gold - item_price:
                    self.log_test("Gold Deduction", True, f"Gold reduced from {initial_gold} to {new_gold}")
                else:
                    self.log_test("Gold Deduction", False, f"Gold calculation incorrect: {initial_gold} - {item_price} != {new_gold}")
                
                # Verify stat boost was applied
                new_strength = purchase_result["user"]["strength"]
                if new_strength == initial_strength + 5:  # +5 from stat_boost
                    self.log_test("Stat Boost Applied", True, f"Strength increased from {initial_strength} to {new_strength}")
                else:
                    self.log_test("Stat Boost Applied", False, f"Strength boost incorrect: {initial_strength} + 5 != {new_strength}")
                
            else:
                self.log_test("Purchase Power Item", False, f"Purchase failed: {purchase_response.status_code} - {purchase_response.text}")
                return
            
            # Test inventory contains the item
            inventory_response = requests.get(f"{BACKEND_URL}/inventory/{self.test_user_id}")
            if inventory_response.status_code == 200:
                inventory = inventory_response.json()
                power_item_in_inventory = any(item["item_id"] == self.test_power_item_id for item in inventory)
                
                if power_item_in_inventory:
                    self.log_test("Item in Inventory", True, "Power item found in user inventory")
                else:
                    self.log_test("Item in Inventory", False, f"Power item not found in inventory: {inventory}")
            else:
                self.log_test("Item in Inventory", False, f"Failed to get inventory: {inventory_response.text}")
            
            # Test powers contains the item
            powers_response = requests.get(f"{BACKEND_URL}/powers/{self.test_user_id}")
            if powers_response.status_code == 200:
                powers = powers_response.json()
                power_item_in_powers = any(power["shop_item_id"] == self.test_power_item_id for power in powers)
                
                if power_item_in_powers:
                    # Verify power item has all required fields
                    power_item = next(power for power in powers if power["shop_item_id"] == self.test_power_item_id)
                    required_fields = ["id", "user_id", "shop_item_id", "name", "description", "power_category"]
                    
                    missing_fields = [field for field in required_fields if field not in power_item]
                    if not missing_fields:
                        self.log_test("Item in Powers", True, f"Power item found in powers with all required fields")
                        
                        # Verify power_category is correct
                        if power_item["power_category"] == "Physical Abilities":
                            self.log_test("Power Category Correct", True, f"Power category: {power_item['power_category']}")
                        else:
                            self.log_test("Power Category Correct", False, f"Wrong power category: {power_item['power_category']}")
                    else:
                        self.log_test("Item in Powers", False, f"Power item missing fields: {missing_fields}")
                else:
                    self.log_test("Item in Powers", False, f"Power item not found in powers: {powers}")
            else:
                self.log_test("Item in Powers", False, f"Failed to get powers: {powers_response.text}")
                
        except Exception as e:
            self.log_test("Purchase Flow with Powers", False, f"Exception: {str(e)}")
    
    def test_powers_retrieval(self):
        """Test powers retrieval endpoint"""
        print("\n=== Testing Powers Retrieval ===")
        
        if not self.test_user_id:
            self.log_test("Powers Retrieval Setup", False, "Missing test user")
            return
        
        try:
            response = requests.get(f"{BACKEND_URL}/powers/{self.test_user_id}")
            if response.status_code == 200:
                powers = response.json()
                
                if isinstance(powers, list):
                    self.log_test("Powers Endpoint Returns List", True, f"Found {len(powers)} powers")
                    
                    # If we have powers, verify structure
                    if powers:
                        power = powers[0]
                        required_fields = ["id", "user_id", "shop_item_id", "name", "description", "power_category", "acquired_at"]
                        missing_fields = [field for field in required_fields if field not in power]
                        
                        if not missing_fields:
                            self.log_test("Power Item Structure", True, "All required fields present")
                        else:
                            self.log_test("Power Item Structure", False, f"Missing fields: {missing_fields}")
                    else:
                        self.log_test("Powers List Empty", True, "No powers found (expected if no purchases made)")
                else:
                    self.log_test("Powers Endpoint Returns List", False, f"Expected list, got: {type(powers)}")
            else:
                self.log_test("Powers Retrieval", False, f"Failed to get powers: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_test("Powers Retrieval", False, f"Exception: {str(e)}")
    
    def test_non_power_item_purchase(self):
        """Test that regular items don't go to powers collection"""
        print("\n=== Testing Non-Power Item Purchase ===")
        
        if not self.test_user_id or not self.test_regular_item_id:
            self.log_test("Non-Power Purchase Setup", False, "Missing test user or regular item")
            return
        
        try:
            # Get initial powers count
            powers_response = requests.get(f"{BACKEND_URL}/powers/{self.test_user_id}")
            initial_powers_count = len(powers_response.json()) if powers_response.status_code == 200 else 0
            
            # Purchase regular item
            purchase_data = {
                "user_id": self.test_user_id,
                "item_id": self.test_regular_item_id
            }
            
            purchase_response = requests.post(f"{BACKEND_URL}/shop/purchase", json=purchase_data)
            if purchase_response.status_code == 200:
                self.log_test("Purchase Regular Item", True, "Regular item purchased successfully")
                
                # Verify it's in inventory
                inventory_response = requests.get(f"{BACKEND_URL}/inventory/{self.test_user_id}")
                if inventory_response.status_code == 200:
                    inventory = inventory_response.json()
                    regular_item_in_inventory = any(item["item_id"] == self.test_regular_item_id for item in inventory)
                    
                    if regular_item_in_inventory:
                        self.log_test("Regular Item in Inventory", True, "Regular item found in inventory")
                    else:
                        self.log_test("Regular Item in Inventory", False, "Regular item not found in inventory")
                
                # Verify it's NOT in powers
                powers_response = requests.get(f"{BACKEND_URL}/powers/{self.test_user_id}")
                if powers_response.status_code == 200:
                    powers = powers_response.json()
                    final_powers_count = len(powers)
                    
                    if final_powers_count == initial_powers_count:
                        self.log_test("Regular Item NOT in Powers", True, f"Powers count unchanged: {final_powers_count}")
                    else:
                        self.log_test("Regular Item NOT in Powers", False, f"Powers count changed: {initial_powers_count} -> {final_powers_count}")
                
            else:
                self.log_test("Purchase Regular Item", False, f"Purchase failed: {purchase_response.status_code} - {purchase_response.text}")
                
        except Exception as e:
            self.log_test("Non-Power Item Purchase", False, f"Exception: {str(e)}")
    
    def test_power_categories_after_purchase(self):
        """Test that power categories endpoint returns correct categories after purchases"""
        print("\n=== Testing Power Categories After Purchase ===")
        
        try:
            response = requests.get(f"{BACKEND_URL}/powers/categories/all")
            if response.status_code == 200:
                data = response.json()
                categories = data.get("categories", [])
                
                # Should now include "Physical Abilities" if power item was purchased
                if "Physical Abilities" in categories:
                    self.log_test("Power Categories Updated", True, f"Categories include 'Physical Abilities': {categories}")
                else:
                    self.log_test("Power Categories Updated", False, f"'Physical Abilities' not found in categories: {categories}")
            else:
                self.log_test("Power Categories After Purchase", False, f"Failed to get categories: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_test("Power Categories After Purchase", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests for the Powers feature"""
        print("🚀 Starting Backend Tests for 'Add to Powers' Feature")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_user():
            print("❌ Failed to setup test user. Aborting tests.")
            return
        
        # Run tests in order
        self.test_shop_item_creation_with_power_fields()
        self.test_power_categories_endpoint()
        self.test_purchase_flow_with_powers()
        self.test_powers_retrieval()
        self.test_non_power_item_purchase()
        self.test_power_categories_after_purchase()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
        
        print(f"\n🎯 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Powers feature is working correctly.")
        else:
            print(f"⚠️  {total - passed} tests failed. See details above.")
        
        return passed == total

if __name__ == "__main__":
    tester = PowersBackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)