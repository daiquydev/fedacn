# Test script for Recipe API endpoints

$baseUrl = "http://localhost:4000"
$token = "YOUR_JWT_TOKEN_HERE"  # Replace with actual JWT token

Write-Host "Testing Recipe API Endpoints..." -ForegroundColor Green

# Test 1: Get recipe categories
Write-Host "`n1. Testing Get Recipe Categories..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/recipes/category/get-category" -Method GET -ContentType "application/json"
    Write-Host "Categories retrieved successfully:" -ForegroundColor Green
    $response.result | ForEach-Object { Write-Host "  - $($_.name) (ID: $($_._id))" }
} catch {
    Write-Host "Error getting categories: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Create a sample recipe (you need to have valid JWT token)
Write-Host "`n2. Testing Create Recipe..." -ForegroundColor Yellow
if ($token -eq "YOUR_JWT_TOKEN_HERE") {
    Write-Host "Please replace YOUR_JWT_TOKEN_HERE with actual JWT token to test recipe creation" -ForegroundColor Red
} else {
    try {
        # Read sample recipe data
        $sampleRecipe = Get-Content "sample-recipes.json" | ConvertFrom-Json
        $firstRecipe = $sampleRecipe[0]
        
        # Create form data for the first sample recipe
        $form = @{
            title = $firstRecipe.title
            description = $firstRecipe.description
            content = $firstRecipe.content
            time = $firstRecipe.time
            difficult_level = $firstRecipe.difficult_level
            region = $firstRecipe.region
            processing_food = $firstRecipe.processing_food
            energy = $firstRecipe.energy
            protein = $firstRecipe.protein
            fat = $firstRecipe.fat
            carbohydrate = $firstRecipe.carbohydrate
            ingredients = ($firstRecipe.ingredients | ConvertTo-Json -Compress)
            instructions = ($firstRecipe.instructions | ConvertTo-Json -Compress)
            tags = ($firstRecipe.tags | ConvertTo-Json -Compress)
            category_recipe_id = "REPLACE_WITH_VALID_CATEGORY_ID"  # Get from categories endpoint
        }
        
        $headers = @{
            'Authorization' = "Bearer $token"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/recipes/user/create" -Method POST -Form $form -Headers $headers
        Write-Host "Recipe created successfully: $($response.message)" -ForegroundColor Green
        Write-Host "Recipe ID: $($response.result._id)"
    } catch {
        Write-Host "Error creating recipe: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Get my recipes
Write-Host "`n3. Testing Get My Recipes..." -ForegroundColor Yellow
if ($token -eq "YOUR_JWT_TOKEN_HERE") {
    Write-Host "Please replace YOUR_JWT_TOKEN_HERE with actual JWT token to test getting recipes" -ForegroundColor Red
} else {
    try {
        $headers = @{
            'Authorization' = "Bearer $token"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/recipes/user/my-recipes?page=1&limit=10" -Method GET -Headers $headers
        Write-Host "My recipes retrieved successfully:" -ForegroundColor Green
        Write-Host "Total recipes: $($response.result.total)"
        $response.result.recipes | ForEach-Object { 
            Write-Host "  - $($_.title) (Status: $($_.status))" 
        }
    } catch {
        Write-Host "Error getting my recipes: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nTest completed!" -ForegroundColor Green

# Instructions for using this script
Write-Host "`nInstructions:" -ForegroundColor Cyan
Write-Host "1. Start your backend server on localhost:4000"
Write-Host "2. Get a valid JWT token by logging in"
Write-Host "3. Replace 'YOUR_JWT_TOKEN_HERE' with your actual token"
Write-Host "4. Get a valid category_recipe_id from the categories endpoint"
Write-Host "5. Replace 'REPLACE_WITH_VALID_CATEGORY_ID' with the actual ID"
Write-Host "6. Run this script: .\test_recipe_apis.ps1"
