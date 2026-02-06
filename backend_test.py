#!/usr/bin/env python3
"""
Backend Testing for RPG Quest App - Disciplinary Feature
Tests the newly implemented disciplinary feature that penalizes users for missing quest deadlines.
"""

import requests
import json
from datetime import datetime, timedelta
import time

# Backend URL from environment
BACKEND_URL = "https://demerit-system-1.preview.emergentagent.com/api"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
    
    def add_result(self, test_name, passed, message=""):
        self.results.append({
            "test": test_name,
            "passed": passed,
            "message": message
        })
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
    
    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed} passed, {self.failed} failed")
        print(f"{'='*60}")
        
        if self.failed > 0:
            print("\nFAILED TESTS:")
            for result in self.results:
                if not result["passed"]:
                    print(f"❌ {result['test']}: {result['message']}")

def test_disciplinary_feature():
    """Main test function for disciplinary feature"""
    results = TestResults()
    
    print("🧪 TESTING DISCIPLINARY FEATURE FOR RPG QUEST APP")
    print("=" * 60)
    
    # Test data
    test_user_data = {
        "username": "disciplinary_test_user"
    }
    
    try:
        # 1. Create or get test user
        print("\n1️⃣ Creating test user...")
        user_response = requests.post(f"{BACKEND_URL}/users", json=test_user_data)
        
        if user_response.status_code not in [200, 201]:
            results.add_result("Create test user", False, f"Failed to create user: {user_response.status_code}")
            return results
        
        user_data = user_response.json()
        user_id = user_data["id"]
        results.add_result("Create test user", True, f"User ID: {user_id}")
        
        # Record initial user stats
        initial_xp = user_data["xp"]
        initial_gold = user_data["gold"]
        initial_ap = user_data["ability_points"]
        
        print(f"   Initial stats - XP: {initial_xp}, Gold: {initial_gold}, AP: {initial_ap}")
        
        # 2. Create quest with deadline in the past
        print("\n2️⃣ Creating quest with past deadline...")
        # Get current time and set deadline to 1 hour ago
        current_time = datetime.utcnow()
        past_hour = (current_time - timedelta(hours=1)).strftime("%H:%M")
        
        past_quest_data = {
            "user_id": user_id,
            "title": "Test Deadline Quest",
            "description": "Testing failure system",
            "xp_reward": 100,
            "gold_reward": 50,
            "ap_reward": 5,
            "has_deadline": True,
            "deadline_time": past_hour,  # 1 hour ago
            "repeat_frequency": "none"
        }
        
        print(f"   Setting deadline to: {past_hour} (1 hour ago)")
        
        quest_response = requests.post(f"{BACKEND_URL}/quests", json=past_quest_data)
        if quest_response.status_code not in [200, 201]:
            results.add_result("Create quest with past deadline", False, f"Failed: {quest_response.status_code}")
            return results
        
        quest_data = quest_response.json()
        quest_id = quest_data["id"]
        results.add_result("Create quest with past deadline", True, f"Quest ID: {quest_id}")
        
        # 3. Call check-failures endpoint
        print("\n3️⃣ Calling check-failures endpoint...")
        failures_response = requests.post(f"{BACKEND_URL}/quests/{user_id}/check-failures")
        
        if failures_response.status_code != 200:
            results.add_result("Call check-failures endpoint", False, f"Failed: {failures_response.status_code}")
            return results
        
        failures_data = failures_response.json()
        results.add_result("Call check-failures endpoint", True, "Endpoint responded successfully")
        
        # Verify response structure
        if "failed_quests" not in failures_data or "total_demerits" not in failures_data:
            results.add_result("Check-failures response structure", False, "Missing required fields")
        else:
            results.add_result("Check-failures response structure", True, "Response has required fields")
        
        # Verify the quest appears in failed_quests
        failed_quests = failures_data["failed_quests"]
        quest_found = any(q["id"] == quest_id for q in failed_quests)
        results.add_result("Quest appears in failed_quests", quest_found, 
                         f"Found {len(failed_quests)} failed quests")
        
        # Verify demerits calculation
        total_demerits = failures_data["total_demerits"]
        expected_xp_demerit = 100
        expected_gold_demerit = 50
        expected_ap_demerit = 5
        
        xp_correct = total_demerits["xp"] == expected_xp_demerit
        gold_correct = total_demerits["gold"] == expected_gold_demerit
        ap_correct = total_demerits["ap"] == expected_ap_demerit
        
        results.add_result("XP demerits calculated correctly", xp_correct, 
                         f"Expected: {expected_xp_demerit}, Got: {total_demerits['xp']}")
        results.add_result("Gold demerits calculated correctly", gold_correct,
                         f"Expected: {expected_gold_demerit}, Got: {total_demerits['gold']}")
        results.add_result("AP demerits calculated correctly", ap_correct,
                         f"Expected: {expected_ap_demerit}, Got: {total_demerits['ap']}")
        
        # 4. Verify demerits were applied to user
        print("\n4️⃣ Verifying demerits were applied to user...")
        user_after_response = requests.get(f"{BACKEND_URL}/users/{user_id}")
        
        if user_after_response.status_code != 200:
            results.add_result("Get user after demerits", False, f"Failed: {user_after_response.status_code}")
            return results
        
        user_after_data = user_after_response.json()
        
        expected_xp_after = max(0, initial_xp - expected_xp_demerit)
        expected_gold_after = max(0, initial_gold - expected_gold_demerit)
        expected_ap_after = max(0, initial_ap - expected_ap_demerit)
        
        xp_applied = user_after_data["xp"] == expected_xp_after
        gold_applied = user_after_data["gold"] == expected_gold_after
        ap_applied = user_after_data["ability_points"] == expected_ap_after
        
        results.add_result("XP demerits applied to user", xp_applied,
                         f"Expected: {expected_xp_after}, Got: {user_after_data['xp']}")
        results.add_result("Gold demerits applied to user", gold_applied,
                         f"Expected: {expected_gold_after}, Got: {user_after_data['gold']}")
        results.add_result("AP demerits applied to user", ap_applied,
                         f"Expected: {expected_ap_after}, Got: {user_after_data['ability_points']}")
        
        # 5. Test limitless quests are ignored
        print("\n5️⃣ Testing limitless quests are ignored...")
        limitless_quest_data = {
            "user_id": user_id,
            "title": "Limitless Quest",
            "description": "Should not fail",
            "xp_reward": 75,
            "gold_reward": 25,
            "ap_reward": 3,
            "has_deadline": True,
            "deadline_time": "00:00",
            "repeat_frequency": "limitless"
        }
        
        limitless_response = requests.post(f"{BACKEND_URL}/quests", json=limitless_quest_data)
        if limitless_response.status_code not in [200, 201]:
            results.add_result("Create limitless quest", False, f"Failed: {limitless_response.status_code}")
        else:
            limitless_quest = limitless_response.json()
            limitless_quest_id = limitless_quest["id"]
            results.add_result("Create limitless quest", True, f"Quest ID: {limitless_quest_id}")
            
            # Call check-failures again
            failures2_response = requests.post(f"{BACKEND_URL}/quests/{user_id}/check-failures")
            if failures2_response.status_code == 200:
                failures2_data = failures2_response.json()
                limitless_found = any(q["id"] == limitless_quest_id for q in failures2_data["failed_quests"])
                results.add_result("Limitless quest ignored by failure system", not limitless_found,
                                 f"Limitless quest {'found' if limitless_found else 'not found'} in failed quests")
            else:
                results.add_result("Check failures for limitless test", False, f"Failed: {failures2_response.status_code}")
        
        # 6. Test quests without deadline are ignored
        print("\n6️⃣ Testing quests without deadline are ignored...")
        no_deadline_quest_data = {
            "user_id": user_id,
            "title": "No Deadline Quest",
            "description": "Should not fail",
            "xp_reward": 60,
            "gold_reward": 20,
            "ap_reward": 2,
            "has_deadline": False,
            "repeat_frequency": "none"
        }
        
        no_deadline_response = requests.post(f"{BACKEND_URL}/quests", json=no_deadline_quest_data)
        if no_deadline_response.status_code not in [200, 201]:
            results.add_result("Create quest without deadline", False, f"Failed: {no_deadline_response.status_code}")
        else:
            no_deadline_quest = no_deadline_response.json()
            no_deadline_quest_id = no_deadline_quest["id"]
            results.add_result("Create quest without deadline", True, f"Quest ID: {no_deadline_quest_id}")
            
            # Call check-failures again
            failures3_response = requests.post(f"{BACKEND_URL}/quests/{user_id}/check-failures")
            if failures3_response.status_code == 200:
                failures3_data = failures3_response.json()
                no_deadline_found = any(q["id"] == no_deadline_quest_id for q in failures3_data["failed_quests"])
                results.add_result("Quest without deadline ignored", not no_deadline_found,
                                 f"No-deadline quest {'found' if no_deadline_found else 'not found'} in failed quests")
            else:
                results.add_result("Check failures for no-deadline test", False, f"Failed: {failures3_response.status_code}")
        
        # 7. Test daily quests are reset, not deleted
        print("\n7️⃣ Testing daily quests are reset, not deleted...")
        daily_quest_data = {
            "user_id": user_id,
            "title": "Daily Quest",
            "description": "Should be reset, not deleted",
            "xp_reward": 40,
            "gold_reward": 15,
            "ap_reward": 1,
            "has_deadline": True,
            "deadline_time": "00:00",
            "repeat_frequency": "daily"
        }
        
        daily_response = requests.post(f"{BACKEND_URL}/quests", json=daily_quest_data)
        if daily_response.status_code not in [200, 201]:
            results.add_result("Create daily quest", False, f"Failed: {daily_response.status_code}")
        else:
            daily_quest = daily_response.json()
            daily_quest_id = daily_quest["id"]
            results.add_result("Create daily quest", True, f"Quest ID: {daily_quest_id}")
            
            # Call check-failures
            failures4_response = requests.post(f"{BACKEND_URL}/quests/{user_id}/check-failures")
            if failures4_response.status_code == 200:
                failures4_data = failures4_response.json()
                daily_found = any(q["id"] == daily_quest_id for q in failures4_data["failed_quests"])
                results.add_result("Daily quest appears in failures", daily_found,
                                 f"Daily quest {'found' if daily_found else 'not found'} in failed quests")
                
                # Check that the quest still exists (not deleted)
                quests_response = requests.get(f"{BACKEND_URL}/quests/{user_id}")
                if quests_response.status_code == 200:
                    user_quests = quests_response.json()
                    daily_still_exists = any(q["id"] == daily_quest_id for q in user_quests)
                    results.add_result("Daily quest still exists after failure", daily_still_exists,
                                     f"Daily quest {'exists' if daily_still_exists else 'deleted'} after failure")
                    
                    # Check that it's marked as failed but not completed for daily quests
                    if daily_still_exists:
                        daily_quest_after = next(q for q in user_quests if q["id"] == daily_quest_id)
                        is_failed = daily_quest_after.get("failed", False)
                        is_completed = daily_quest_after.get("completed", False)
                        
                        results.add_result("Daily quest marked as failed", is_failed,
                                         f"Failed status: {is_failed}")
                        results.add_result("Daily quest NOT marked as completed", not is_completed,
                                         f"Completed status: {is_completed}")
                else:
                    results.add_result("Get user quests after daily failure", False, f"Failed: {quests_response.status_code}")
            else:
                results.add_result("Check failures for daily test", False, f"Failed: {failures4_response.status_code}")
        
        # 8. Test that calling check-failures multiple times doesn't duplicate demerits
        print("\n8️⃣ Testing duplicate failure prevention...")
        user_before_duplicate = requests.get(f"{BACKEND_URL}/users/{user_id}")
        if user_before_duplicate.status_code == 200:
            stats_before = user_before_duplicate.json()
            
            # Call check-failures again
            duplicate_response = requests.post(f"{BACKEND_URL}/quests/{user_id}/check-failures")
            if duplicate_response.status_code == 200:
                user_after_duplicate = requests.get(f"{BACKEND_URL}/users/{user_id}")
                if user_after_duplicate.status_code == 200:
                    stats_after = user_after_duplicate.json()
                    
                    # Stats should be the same (no additional demerits)
                    xp_same = stats_before["xp"] == stats_after["xp"]
                    gold_same = stats_before["gold"] == stats_after["gold"]
                    ap_same = stats_before["ability_points"] == stats_after["ability_points"]
                    
                    results.add_result("No duplicate XP demerits", xp_same,
                                     f"XP before: {stats_before['xp']}, after: {stats_after['xp']}")
                    results.add_result("No duplicate Gold demerits", gold_same,
                                     f"Gold before: {stats_before['gold']}, after: {stats_after['gold']}")
                    results.add_result("No duplicate AP demerits", ap_same,
                                     f"AP before: {stats_before['ability_points']}, after: {stats_after['ability_points']}")
                else:
                    results.add_result("Get user after duplicate test", False, f"Failed: {user_after_duplicate.status_code}")
            else:
                results.add_result("Call check-failures for duplicate test", False, f"Failed: {duplicate_response.status_code}")
        else:
            results.add_result("Get user before duplicate test", False, f"Failed: {user_before_duplicate.status_code}")
        
    except Exception as e:
        results.add_result("Test execution", False, f"Exception occurred: {str(e)}")
    
    return results

if __name__ == "__main__":
    print("🚀 Starting Disciplinary Feature Backend Tests")
    print(f"Backend URL: {BACKEND_URL}")
    print()
    
    results = test_disciplinary_feature()
    results.print_summary()
    
    # Exit with appropriate code
    exit(0 if results.failed == 0 else 1)