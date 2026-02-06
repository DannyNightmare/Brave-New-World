#!/usr/bin/env python3
"""
Debug test to understand the disciplinary feature logic
"""

import requests
import json
from datetime import datetime, timedelta

BACKEND_URL = "https://demerit-system-1.preview.emergentagent.com/api"

def debug_disciplinary_logic():
    print("🔍 DEBUGGING DISCIPLINARY FEATURE LOGIC")
    print("=" * 50)
    
    # Create test user
    user_data = {"username": "debug_user"}
    user_response = requests.post(f"{BACKEND_URL}/users", json=user_data)
    user = user_response.json()
    user_id = user["id"]
    print(f"Created user: {user_id}")
    
    # Create quest with past deadline
    current_time = datetime.utcnow()
    print(f"Current UTC time: {current_time}")
    
    # Try different deadline scenarios
    scenarios = [
        ("00:00", "Midnight (past)"),
        ("23:59", "23:59 (future today)"),
        ((current_time - timedelta(hours=2)).strftime("%H:%M"), "2 hours ago"),
        ((current_time + timedelta(hours=1)).strftime("%H:%M"), "1 hour from now"),
    ]
    
    for deadline_time, description in scenarios:
        print(f"\n--- Testing deadline: {deadline_time} ({description}) ---")
        
        quest_data = {
            "user_id": user_id,
            "title": f"Test Quest - {description}",
            "description": "Debug test",
            "xp_reward": 50,
            "gold_reward": 25,
            "ap_reward": 2,
            "has_deadline": True,
            "deadline_time": deadline_time,
            "repeat_frequency": "none"
        }
        
        quest_response = requests.post(f"{BACKEND_URL}/quests", json=quest_data)
        if quest_response.status_code == 200:
            quest = quest_response.json()
            print(f"Created quest: {quest['id']}")
            print(f"Quest created_at: {quest.get('created_at')}")
            print(f"Quest deadline_time: {quest.get('deadline_time')}")
            print(f"Quest has_deadline: {quest.get('has_deadline')}")
            print(f"Quest repeat_frequency: {quest.get('repeat_frequency')}")
            
            # Call check-failures
            failures_response = requests.post(f"{BACKEND_URL}/quests/{user_id}/check-failures")
            if failures_response.status_code == 200:
                failures_data = failures_response.json()
                failed_quests = failures_data["failed_quests"]
                quest_failed = any(q["id"] == quest["id"] for q in failed_quests)
                print(f"Quest failed: {quest_failed}")
                print(f"Total failed quests: {len(failed_quests)}")
                if failed_quests:
                    print(f"Failed quest IDs: {[q['id'] for q in failed_quests]}")
            else:
                print(f"Check-failures failed: {failures_response.status_code}")
        else:
            print(f"Quest creation failed: {quest_response.status_code}")
    
    # Get all user quests to see their status
    print(f"\n--- All user quests ---")
    quests_response = requests.get(f"{BACKEND_URL}/quests/{user_id}")
    if quests_response.status_code == 200:
        all_quests = quests_response.json()
        for quest in all_quests:
            print(f"Quest: {quest['title']}")
            print(f"  ID: {quest['id']}")
            print(f"  Deadline: {quest.get('deadline_time')}")
            print(f"  Has deadline: {quest.get('has_deadline')}")
            print(f"  Completed: {quest.get('completed')}")
            print(f"  Failed: {quest.get('failed')}")
            print(f"  Created: {quest.get('created_at')}")
            print()

if __name__ == "__main__":
    debug_disciplinary_logic()