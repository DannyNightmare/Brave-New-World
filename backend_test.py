#!/usr/bin/env python3
"""
Backend Testing Suite for Power Tier and Leveling System
Tests the new power tier functionality and level up system
"""

import requests
import json
import uuid
from datetime import datetime

# Backend URL from frontend .env
BASE_URL = "https://gamelife-rpg.preview.emergentagent.com/api"

class PowerTierTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_user_id = None
        self.test_shop_items = []
        self.test_powers = []
        
    def setup_test_user(self):
        """Create a test user for testing"""
        print("🔧 Setting up test user...")
        
        # Create user
        user_data = {"username": f"power_test_user_{uuid.uuid4().hex[:8]}"}
        response = requests.post(f"{self.base_url}/users", json=user_data)
        
        if response.status_code == 200:
            user = response.json()
            self.test_user_id = user["id"]
            print(f"✅ Test user created: {user['username']} (ID: {self.test_user_id})")
            
            # Give user more gold for testing
            reset_response = requests.post(f"{self.base_url}/users/{self.test_user_id}/reset")
            if reset_response.status_code == 200:
                # Update gold to 10000 for testing
                print("✅ User stats reset, ready for testing")
            return True
        else:
            print(f"❌ Failed to create test user: {response.status_code} - {response.text}")
            return False
    
    def test_shop_item_creation_with_power_tiers(self):
        """Test creating shop items with different power tiers"""
        print("\n🧪 Testing Shop Item Creation with Power Tiers...")
        
        power_tiers = ["Base", "Peak Human", "Enhanced", "Superhuman", "Absolute"]
        test_results = []
        
        for i, tier in enumerate(power_tiers):
            item_data = {
                "name": f"Test Power {tier}",
                "description": f"A {tier} level power for testing",
                "price": 100 + (i * 50),
                "category": "powers",
                "is_power": True,
                "power_category": "Physical Abilities",
                "power_tier": tier,
                "power_max_level": 3 + i,  # Different max levels for each tier
                "stat_boost": {"strength": 5 + i},
                "item_type": "power"
            }
            
            response = requests.post(f"{self.base_url}/shop", json=item_data)
            
            if response.status_code == 200:
                item = response.json()
                self.test_shop_items.append(item)
                
                # Verify all fields are saved correctly
                if (item["is_power"] == True and 
                    item["power_category"] == "Physical Abilities" and
                    item["power_tier"] == tier and
                    item["power_max_level"] == 3 + i):
                    print(f"✅ {tier} tier item created successfully")
                    test_results.append(True)
                else:
                    print(f"❌ {tier} tier item fields not saved correctly")
                    print(f"   Expected: is_power=True, power_category='Physical Abilities', power_tier='{tier}', power_max_level={3+i}")
                    print(f"   Got: is_power={item['is_power']}, power_category={item.get('power_category')}, power_tier={item.get('power_tier')}, power_max_level={item.get('power_max_level')}")
                    test_results.append(False)
            else:
                print(f"❌ Failed to create {tier} tier item: {response.status_code} - {response.text}")
                test_results.append(False)
        
        return all(test_results)
    
    def test_purchase_flow_with_tier_system(self):
        """Test purchasing power items and verifying tier/level system"""
        print("\n🧪 Testing Purchase Flow with Tier System...")
        
        if not self.test_shop_items:
            print("❌ No test shop items available for purchase testing")
            return False
        
        test_results = []
        
        # Test purchasing the first power item (Base tier)
        base_item = self.test_shop_items[0]  # Should be "Base" tier
        
        purchase_data = {
            "user_id": self.test_user_id,
            "item_id": base_item["id"]
        }
        
        response = requests.post(f"{self.base_url}/shop/purchase", json=purchase_data)
        
        if response.status_code == 200:
            print("✅ Power item purchased successfully")
            
            # Verify item appears in powers with correct tier/level info
            powers_response = requests.get(f"{self.base_url}/powers/{self.test_user_id}")
            
            if powers_response.status_code == 200:
                powers = powers_response.json()
                
                if len(powers) > 0:
                    power = powers[0]
                    self.test_powers.append(power)
                    
                    # Verify power has correct initial values
                    expected_values = {
                        "current_level": 1,
                        "max_level": base_item["power_max_level"],
                        "power_tier": base_item["power_tier"],
                        "power_category": base_item["power_category"]
                    }
                    
                    all_correct = True
                    for field, expected in expected_values.items():
                        if power.get(field) != expected:
                            print(f"❌ Power field {field}: expected {expected}, got {power.get(field)}")
                            all_correct = False
                    
                    if all_correct:
                        print("✅ Power created with correct tier/level information")
                        test_results.append(True)
                    else:
                        test_results.append(False)
                        
                    # Verify item also appears in inventory
                    inventory_response = requests.get(f"{self.base_url}/inventory/{self.test_user_id}")
                    if inventory_response.status_code == 200:
                        inventory = inventory_response.json()
                        if any(item["item_name"] == base_item["name"] for item in inventory):
                            print("✅ Power item also appears in inventory")
                            test_results.append(True)
                        else:
                            print("❌ Power item not found in inventory")
                            test_results.append(False)
                    else:
                        print(f"❌ Failed to get inventory: {inventory_response.status_code}")
                        test_results.append(False)
                else:
                    print("❌ No powers found after purchase")
                    test_results.append(False)
            else:
                print(f"❌ Failed to get user powers: {powers_response.status_code}")
                test_results.append(False)
        else:
            print(f"❌ Failed to purchase power item: {response.status_code} - {response.text}")
            test_results.append(False)
        
        return all(test_results)
    
    def test_level_up_functionality(self):
        """Test the level up functionality"""
        print("\n🧪 Testing Level Up Functionality...")
        
        if not self.test_powers:
            print("❌ No test powers available for level up testing")
            return False
        
        test_results = []
        power = self.test_powers[0]
        power_id = power["id"]
        max_level = power["max_level"]
        
        print(f"Testing power: {power['name']} (max level: {max_level})")
        
        # Test leveling up to max level
        for expected_level in range(2, max_level + 1):
            response = requests.post(f"{self.base_url}/powers/{power_id}/levelup")
            
            if response.status_code == 200:
                updated_power = response.json()
                if updated_power["current_level"] == expected_level:
                    print(f"✅ Successfully leveled up to level {expected_level}")
                    test_results.append(True)
                else:
                    print(f"❌ Level up failed: expected level {expected_level}, got {updated_power['current_level']}")
                    test_results.append(False)
            else:
                print(f"❌ Level up request failed: {response.status_code} - {response.text}")
                test_results.append(False)
                break
        
        # Test trying to level up beyond max level (should fail)
        response = requests.post(f"{self.base_url}/powers/{power_id}/levelup")
        
        if response.status_code == 400:
            error_data = response.json()
            if "already at max level" in error_data.get("detail", "").lower():
                print("✅ Correctly prevented leveling beyond max level")
                test_results.append(True)
            else:
                print(f"❌ Wrong error message: {error_data.get('detail')}")
                test_results.append(False)
        else:
            print(f"❌ Should have failed with 400 error, got: {response.status_code}")
            test_results.append(False)
        
        return all(test_results)
    
    def test_powers_retrieval_with_levels(self):
        """Test retrieving powers with all tier/level fields"""
        print("\n🧪 Testing Powers Retrieval with Levels...")
        
        # Purchase multiple powers in different categories with different tiers
        test_results = []
        
        # Create a power in a different category with lower price
        mental_power_data = {
            "name": "Telepathy",
            "description": "Read minds and communicate telepathically",
            "price": 50,  # Lower price to ensure user can afford it
            "category": "powers",
            "is_power": True,
            "power_category": "Mental Abilities",
            "power_tier": "Enhanced",
            "power_max_level": 4,
            "stat_boost": {"intelligence": 8},
            "item_type": "power"
        }
        
        # Create the mental power item
        response = requests.post(f"{self.base_url}/shop", json=mental_power_data)
        if response.status_code == 200:
            mental_item = response.json()
            
            # Purchase it
            purchase_data = {
                "user_id": self.test_user_id,
                "item_id": mental_item["id"]
            }
            
            # Check user's gold before purchase
            user_response = requests.get(f"{self.base_url}/users/{self.test_user_id}")
            if user_response.status_code == 200:
                user = user_response.json()
                print(f"User has {user['gold']} gold, mental power costs {mental_power_data['price']}")
            
            purchase_response = requests.post(f"{self.base_url}/shop/purchase", json=purchase_data)
            if purchase_response.status_code == 200:
                print("✅ Mental power purchased successfully")
                
                # Test powers retrieval
                powers_response = requests.get(f"{self.base_url}/powers/{self.test_user_id}")
                
                if powers_response.status_code == 200:
                    powers = powers_response.json()
                    
                    # Should have at least 2 powers now
                    if len(powers) >= 2:
                        print(f"✅ Retrieved {len(powers)} powers")
                        
                        # Verify all powers have required tier/level fields
                        required_fields = ["power_tier", "current_level", "max_level", "power_category"]
                        all_powers_valid = True
                        
                        categories = set()
                        for power in powers:
                            categories.add(power["power_category"])
                            for field in required_fields:
                                if field not in power:
                                    print(f"❌ Power {power['name']} missing field: {field}")
                                    all_powers_valid = False
                        
                        if all_powers_valid:
                            print("✅ All powers have required tier/level fields")
                            test_results.append(True)
                        else:
                            test_results.append(False)
                        
                        # Verify we have multiple categories
                        if len(categories) >= 2:
                            print(f"✅ Powers span multiple categories: {list(categories)}")
                            test_results.append(True)
                        else:
                            print(f"❌ Expected multiple categories, got: {list(categories)}")
                            test_results.append(False)
                    else:
                        print(f"❌ Expected at least 2 powers, got {len(powers)}")
                        test_results.append(False)
                else:
                    print(f"❌ Failed to retrieve powers: {powers_response.status_code}")
                    test_results.append(False)
            else:
                error_msg = purchase_response.text if purchase_response.text else "No error details"
                print(f"❌ Failed to purchase mental power: {purchase_response.status_code} - {error_msg}")
                test_results.append(False)
        else:
            print(f"❌ Failed to create mental power item: {response.status_code}")
            test_results.append(False)
        
        return all(test_results)
    
    def cleanup(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test shop items
        for item in self.test_shop_items:
            requests.delete(f"{self.base_url}/shop/{item['id']}")
        
        print("✅ Cleanup completed")
    
    def run_all_tests(self):
        """Run all power tier and leveling tests"""
        print("🚀 Starting Power Tier and Leveling System Tests")
        print("=" * 60)
        
        if not self.setup_test_user():
            return False
        
        test_results = []
        
        # Test 1: Shop Item Creation with Power Tiers
        test_results.append(self.test_shop_item_creation_with_power_tiers())
        
        # Test 2: Purchase Flow with Tier System
        test_results.append(self.test_purchase_flow_with_tier_system())
        
        # Test 3: Level Up Functionality
        test_results.append(self.test_level_up_functionality())
        
        # Test 4: Powers Retrieval with Levels
        test_results.append(self.test_powers_retrieval_with_levels())
        
        # Cleanup
        self.cleanup()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        test_names = [
            "Shop Item Creation with Power Tiers",
            "Purchase Flow with Tier System", 
            "Level Up Functionality",
            "Powers Retrieval with Levels"
        ]
        
        for i, (name, result) in enumerate(zip(test_names, test_results)):
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{i+1}. {name}: {status}")
        
        overall_result = all(test_results)
        print(f"\nOverall Result: {'✅ ALL TESTS PASSED' if overall_result else '❌ SOME TESTS FAILED'}")
        
        return overall_result

if __name__ == "__main__":
    tester = PowerTierTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)