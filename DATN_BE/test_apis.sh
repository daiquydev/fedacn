#!/bin/bash

# Script test các API LowDB
# Usage: chmod +x test_apis.sh && ./test_apis.sh

BASE_URL="http://localhost:5000"

echo "=== Testing LowDB APIs ==="

echo "1. Testing Ingredients API..."

# Get all ingredients
echo "GET /api/ingredients"
curl -s "$BASE_URL/api/ingredients" | jq '.'

echo -e "\n2. Get ingredient categories..."
curl -s "$BASE_URL/api/ingredients/categories" | jq '.'

echo -e "\n3. Search ingredients..."
curl -s "$BASE_URL/api/ingredients/search?q=thịt" | jq '.'

echo -e "\n4. Testing Recipes API..."

# Get all recipes
echo "GET /api/lowdb-recipes"
curl -s "$BASE_URL/api/lowdb-recipes" | jq '.'

echo -e "\n5. Get featured recipes..."
curl -s "$BASE_URL/api/lowdb-recipes/featured?limit=3" | jq '.'

echo -e "\n6. Get recipe categories..."
curl -s "$BASE_URL/api/lowdb-recipes/categories" | jq '.'

echo -e "\n7. Search recipes..."
curl -s "$BASE_URL/api/lowdb-recipes/search?q=phở" | jq '.'

echo -e "\n8. Testing Nutrition API..."

# Calculate BMI
echo "POST /api/nutrition/calculate-bmi"
curl -s -X POST "$BASE_URL/api/nutrition/calculate-bmi" \
  -H "Content-Type: application/json" \
  -d '{"weight": 70, "height": 175}' | jq '.'

echo -e "\n9. Get nutrition recommendation..."
curl -s "$BASE_URL/api/nutrition/recommendation?age=25&gender=male&weight=70&height=175&activityLevel=moderate&goal=maintain" | jq '.'

echo -e "\n10. Calculate daily nutrition..."
curl -s -X POST "$BASE_URL/api/nutrition/calculate-daily" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 25,
    "gender": "male", 
    "weight": 70,
    "height": 175,
    "activityLevel": "moderate",
    "goal": "maintain"
  }' | jq '.'

echo -e "\n=== Testing completed ==="
