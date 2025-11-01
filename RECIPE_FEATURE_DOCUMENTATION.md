# Recipe Management Feature - Implementation Guide

## Overview
This document outlines the implementation of the recipe management feature for the Vietnamese nutrition social network, allowing users to create, view, edit, and delete their own recipes.

## Backend Implementation

### API Endpoints

#### Recipe Categories
- **GET** `/api/recipes/category/get-category`
  - Get all recipe categories
  - No authentication required

#### User Recipe Management
- **POST** `/api/recipes/user/create`
  - Create a new recipe
  - Requires authentication
  - Supports file upload (image and video)
  - Content-Type: multipart/form-data

- **GET** `/api/recipes/user/my-recipes`
  - Get current user's recipes
  - Requires authentication
  - Supports pagination, filtering, and search
  - Query parameters: page, limit, status, search

- **PUT** `/api/recipes/user/update/:recipe_id`
  - Update user's recipe
  - Requires authentication and ownership
  - Supports file upload

- **DELETE** `/api/recipes/user/delete/:recipe_id`
  - Delete user's recipe
  - Requires authentication and ownership

#### Public Recipe Viewing
- **GET** `/api/recipes/user/get-recipes`
  - Get published recipes for viewing
  - Requires authentication
  - Supports filtering and pagination

- **GET** `/api/recipes/user/get-recipe/:id`
  - Get single recipe details
  - Requires authentication

### Data Model

#### Recipe Schema
```typescript
{
  _id: ObjectId,
  user_id: ObjectId,
  title: string,
  description: string,
  content: string,
  image: string,
  video: string,
  ingredients: [
    {
      name: string,
      amount: string,
      unit: string
    }
  ],
  instructions: [string],
  tags: [string],
  time: number,
  difficult_level: number,
  region: number,
  processing_food: string,
  category_recipe_id: ObjectId,
  energy: number,
  protein: number,
  fat: number,
  carbohydrate: number,
  status: number,
  created_at: Date,
  updated_at: Date
}
```

#### Enums
- **difficulty_level**: 0 (Easy), 1 (Medium), 2 (Hard)
- **region**: 0 (North), 1 (Central), 2 (South), 3 (Asian), 4 (Western)
- **status**: 0 (Pending), 1 (Approved), 2 (Rejected)

### Service Layer Features
- File upload to S3 for images and videos
- Image processing with Sharp library
- Recipe validation and ownership checking
- Automatic file cleanup on deletion
- Associated data cleanup (likes, bookmarks, comments)

## Frontend Implementation

### Pages
1. **CreateRecipe** (`/recipes/create`)
   - Comprehensive form with all recipe fields
   - Image and video upload support
   - Real-time preview
   - Dynamic ingredient/instruction/tag management

2. **RecipeList** (`/recipes/my-recipes`)
   - List user's created recipes
   - Filtering and search functionality
   - Edit and delete actions

### Key Features
- **Dynamic Form Management**: Add/remove ingredients, instructions, and tags
- **File Upload**: Support for both image and video files
- **Rich Text Editor**: For recipe content with formatting
- **Form Validation**: Client-side validation with Yup schema
- **Real-time Preview**: See how recipe will look while creating
- **Responsive Design**: Works on all device sizes

### API Integration
- Updated API calls to use MongoDB endpoints
- Proper FormData handling for file uploads
- Error handling and user feedback
- React Query for data management

## Sample Data

### Recipe Categories
The system includes categories like:
- Món chính (Main dishes)
- Món phụ (Side dishes)
- Đồ uống (Beverages)
- Tráng miệng (Desserts)

### Sample Recipes
Six sample Vietnamese recipes are provided:
1. **Phở Bò Truyền Thống** - Traditional beef pho
2. **Bánh Mì Thịt Nướng** - Grilled pork banh mi
3. **Bún Chả Hà Nội** - Hanoi grilled pork with noodles
4. **Chả Cá Lã Vọng** - Turmeric fish with dill
5. **Gỏi Cuốn Tôm Thịt** - Fresh spring rolls
6. **Cà Ri Gà** - Chicken curry

Each recipe includes:
- Complete ingredient lists with measurements
- Step-by-step instructions
- Nutritional information
- Cooking time and difficulty level
- Regional classification
- Relevant tags

## File Structure

### Backend Files
```
src/
├── controllers/userControllers/recipe.controller.ts
├── services/userServices/recipe.services.ts
├── routes/userRoutes/recipe.routes.ts
├── models/schemas/recipe.schema.ts
└── middlewares/recipe.middleware.ts
```

### Frontend Files
```
src/
├── pages/CreateRecipe/CreateRecipe.jsx
├── pages/RecipeList/RecipeList.jsx
├── apis/recipeApi.js
├── components/ModernRecipeCard/
├── components/ModernIngredientList/
└── utils/imageUrl.js
```

## Testing

### API Testing Script
Use `test_recipe_apis.ps1` to test all endpoints:
1. Get recipe categories
2. Create new recipe
3. Retrieve user's recipes

### Required Setup
1. Backend server running on localhost:4000
2. Valid JWT authentication token
3. Valid category IDs from the database

## Deployment Notes

### Environment Variables
- AWS S3 credentials for file upload
- Database connection string
- JWT secret key

### Database Seeding
- Import recipe categories
- Optionally import sample recipes
- Set up user accounts for testing

## Security Considerations
- Authentication required for all user operations
- Authorization checks for recipe ownership
- File upload validation and size limits
- SQL injection prevention through MongoDB ODM
- XSS protection in content rendering

## Future Enhancements
- Recipe rating and review system
- Recipe sharing functionality
- Advanced search and filtering
- Recipe collections/favorites
- Social features (following chefs, recipe feeds)
- Recipe analytics and statistics
