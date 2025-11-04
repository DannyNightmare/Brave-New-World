import requests
import json

API_URL = "http://localhost:8001"

# Get user ID (assuming there's a user)
print("1. Getting user...")
response = requests.get(f"{API_URL}/api/users")
if response.status_code == 200:
    users = response.json()
    if users:
        user_id = users[0]['id']
        print(f"✅ Found user: {user_id}")
    else:
        print("❌ No users found")
        exit(1)
else:
    print(f"❌ Failed to get users: {response.status_code}")
    exit(1)

# Get current categories
print("\n2. Getting current categories...")
response = requests.get(f"{API_URL}/api/users/{user_id}/categories")
if response.status_code == 200:
    categories = response.json()
    print(f"✅ Current categories: {json.dumps(categories, indent=2)}")
else:
    print(f"❌ Failed to get categories: {response.status_code}")

# Save test categories
print("\n3. Saving test categories...")
test_categories = {
    "Physical Abilities": ["Strength", "Speed", "Endurance"],
    "Mental Abilities": ["Telepathy", "Telekinesis"],
    "Elemental Powers": []
}
response = requests.post(
    f"{API_URL}/api/users/{user_id}/categories",
    json=test_categories,
    headers={"Content-Type": "application/json"}
)
if response.status_code == 200:
    print(f"✅ Categories saved successfully")
else:
    print(f"❌ Failed to save categories: {response.status_code} - {response.text}")

# Get categories again to verify
print("\n4. Verifying saved categories...")
response = requests.get(f"{API_URL}/api/users/{user_id}/categories")
if response.status_code == 200:
    categories = response.json()
    print(f"✅ Verified categories: {json.dumps(categories, indent=2)}")
else:
    print(f"❌ Failed to verify categories: {response.status_code}")

