# Test User Food Management APIs

Write-Host "Testing User Food Management APIs..." -ForegroundColor Green

# Base URL
$baseUrl = "http://localhost:5000"

# Test token - replace with actual token
$testToken = "your_access_token_here"

Write-Host "`n=== INGREDIENT MANAGEMENT TESTS ===" -ForegroundColor Cyan

Write-Host "`n1. Testing Get All Ingredient Categories..." -ForegroundColor Yellow
try {
    $categoriesResponse = Invoke-RestMethod -Uri "$baseUrl/api/ingredients/categories" -Method GET
    Write-Host "✅ Categories Response:" -ForegroundColor Green
    $categoriesResponse | ConvertTo-Json -Depth 2
}
catch {
    Write-Host "❌ Categories Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. Testing Get All Ingredients..." -ForegroundColor Yellow
try {
    $ingredientsResponse = Invoke-RestMethod -Uri "$baseUrl/api/ingredients?page=1&limit=5" -Method GET
    Write-Host "✅ Ingredients Response:" -ForegroundColor Green
    $ingredientsResponse | ConvertTo-Json -Depth 3
}
catch {
    Write-Host "❌ Ingredients Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Testing Search Ingredients..." -ForegroundColor Yellow
try {
    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/api/ingredients/search?q=chicken" -Method GET
    Write-Host "✅ Search Response:" -ForegroundColor Green
    $searchResponse | ConvertTo-Json -Depth 3
}
catch {
    Write-Host "❌ Search Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Testing Create New Ingredient..." -ForegroundColor Yellow
try {
    $newIngredient = @{
        name = "Cà chua bi organic"
        category = "Rau củ"
        calories_per_100g = 18
        protein_per_100g = 0.9
        carbs_per_100g = 3.9
        fat_per_100g = 0.2
        fiber_per_100g = 1.2
        sugar_per_100g = 2.6
        sodium_per_100g = 5
    } | ConvertTo-Json

    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/ingredients" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $testToken"
            "Content-Type" = "application/json"
        } `
        -Body $newIngredient

    Write-Host "✅ Create Ingredient Response:" -ForegroundColor Green
    $createResponse | ConvertTo-Json -Depth 3
}
catch {
    Write-Host "❌ Create Ingredient Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== RECIPE MANAGEMENT TESTS ===" -ForegroundColor Cyan

Write-Host "`n5. Testing Get All Recipe Categories..." -ForegroundColor Yellow
try {
    $recipeCategoriesResponse = Invoke-RestMethod -Uri "$baseUrl/api/lowdb-recipes/categories" -Method GET
    Write-Host "✅ Recipe Categories Response:" -ForegroundColor Green
    $recipeCategoriesResponse | ConvertTo-Json -Depth 2
}
catch {
    Write-Host "❌ Recipe Categories Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n6. Testing Get All Recipes..." -ForegroundColor Yellow
try {
    $recipesResponse = Invoke-RestMethod -Uri "$baseUrl/api/lowdb-recipes?page=1&limit=3" -Method GET
    Write-Host "✅ Recipes Response:" -ForegroundColor Green
    $recipesResponse | ConvertTo-Json -Depth 4
}
catch {
    Write-Host "❌ Recipes Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n7. Testing Create New Recipe..." -ForegroundColor Yellow
try {
    $newRecipe = @{
        name = "Salad cà chua bi tươi"
        description = "Salad tươi mát cho mùa hè"
        category = "Salad"
        cuisine = "Việt Nam"
        prep_time = 15
        cook_time = 0
        servings = 2
        difficulty = "Easy"
        ingredients = @(
            @{
                name = "Cà chua bi"
                amount = 200
                unit = "gram"
            },
            @{
                name = "Rau xà lách"
                amount = 100
                unit = "gram"
            }
        )
        instructions = @(
            "Rửa sạch cà chua bi và rau xà lách",
            "Cắt cà chua bi thành từng miếng",
            "Trộn tất cả với dressing"
        )
        tags = @("healthy", "vegetarian", "summer")
    } | ConvertTo-Json -Depth 5

    $createRecipeResponse = Invoke-RestMethod -Uri "$baseUrl/api/lowdb-recipes" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $testToken"
            "Content-Type" = "application/json"
        } `
        -Body $newRecipe

    Write-Host "✅ Create Recipe Response:" -ForegroundColor Green
    $createRecipeResponse | ConvertTo-Json -Depth 4
}
catch {
    Write-Host "❌ Create Recipe Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== NUTRITION CALCULATION TESTS ===" -ForegroundColor Cyan

Write-Host "`n8. Testing Nutrition Calculation..." -ForegroundColor Yellow
try {
    $nutritionRequest = @{
        ingredients = @(
            @{
                ingredient_id = "test_ingredient_id"
                amount = 100
            }
        )
    } | ConvertTo-Json -Depth 3

    $nutritionResponse = Invoke-RestMethod -Uri "$baseUrl/api/nutrition/calculate" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
        } `
        -Body $nutritionRequest

    Write-Host "✅ Nutrition Calculation Response:" -ForegroundColor Green
    $nutritionResponse | ConvertTo-Json -Depth 3
}
catch {
    Write-Host "❌ Nutrition Calculation Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n9. Testing Recipe Nutrition Calculation..." -ForegroundColor Yellow
try {
    $recipeNutritionRequest = @{
        ingredients = @(
            @{
                name = "Cà chua bi"
                amount = 200
                unit = "gram"
            }
        )
    } | ConvertTo-Json -Depth 3

    $recipeNutritionResponse = Invoke-RestMethod -Uri "$baseUrl/api/lowdb-recipes/calculate-nutrition" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
        } `
        -Body $recipeNutritionRequest

    Write-Host "✅ Recipe Nutrition Calculation Response:" -ForegroundColor Green
    $recipeNutritionResponse | ConvertTo-Json -Depth 3
}
catch {
    Write-Host "❌ Recipe Nutrition Calculation Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== SEARCH AND FILTER TESTS ===" -ForegroundColor Cyan

Write-Host "`n10. Testing Recipe Search..." -ForegroundColor Yellow
try {
    $searchRecipeResponse = Invoke-RestMethod -Uri "$baseUrl/api/lowdb-recipes/search?q=salad" -Method GET
    Write-Host "✅ Recipe Search Response:" -ForegroundColor Green
    $searchRecipeResponse | ConvertTo-Json -Depth 4
}
catch {
    Write-Host "❌ Recipe Search Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAll tests completed!" -ForegroundColor Green
Write-Host "Note: Replace 'your_access_token_here' with actual token for authenticated endpoints" -ForegroundColor Cyan
