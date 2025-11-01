const express = require('express');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const path = require('path');
const db = require('../config/lowdb');
const { upload } = require('../middleware/upload');
const { accessTokenValidator } = require('../middlewares/authUser.middleware');
const { wrapRequestHandler } = require('../utils/handler');

const router = express.Router();

// GET /api/recipes - Lấy danh sách recipes
const getRecipesController = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      cuisine_type, 
      meal_type,
      difficulty_level,
      prep_time_max,
      tags 
    } = req.query;

    let recipes = db.get('recipes').value();

    // Filtering
    if (search) {
      const searchLower = search.toLowerCase();
      recipes = recipes.filter(recipe => 
        recipe.name.toLowerCase().includes(searchLower) ||
        recipe.description.toLowerCase().includes(searchLower) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (cuisine_type) {
      recipes = recipes.filter(recipe => recipe.cuisine_type === cuisine_type);
    }

    if (meal_type) {
      const mealTypeNum = parseInt(meal_type);
      recipes = recipes.filter(recipe => recipe.meal_type.includes(mealTypeNum));
    }

    if (difficulty_level) {
      recipes = recipes.filter(recipe => recipe.difficulty_level <= parseInt(difficulty_level));
    }

    if (prep_time_max) {
      recipes = recipes.filter(recipe => recipe.prep_time <= parseInt(prep_time_max));
    }

    if (tags) {
      const tagArray = tags.split(',');
      recipes = recipes.filter(recipe => 
        tagArray.some(tag => recipe.tags.includes(tag.trim()))
      );
    }

    // Sorting
    recipes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Pagination
    const total = recipes.length;
    const startIndex = (page - 1) * limit;
    const paginatedRecipes = recipes.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      result: {
        recipes: paginatedRecipes,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      },
      message: 'Lấy danh sách công thức thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// GET /api/recipes/:id - Lấy chi tiết recipe
const getRecipeDetailController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const recipe = db.get('recipes').find({ id }).value();
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức'
      });
    }

    res.json({
      success: true,
      result: { recipe },
      message: 'Lấy chi tiết công thức thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// POST /api/recipes - Tạo recipe mới
const createRecipeController = async (req, res) => {
  try {
    const {
      name,
      description,
      instructions,
      prep_time,
      cook_time,
      servings,
      difficulty_level,
      cuisine_type,
      meal_type,
      ingredients, // JSON string
      nutrition, // JSON string
      tags, // JSON string or comma-separated
      is_public = true
    } = req.body;

    // Validate required fields
    if (!name || !instructions || !ingredients) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: tên, hướng dẫn, nguyên liệu'
      });
    }

    // Process uploaded images
    let mainImage = '';
    let additionalImages = [];

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const file = req.files.image[0];
        const fileId = uuidv4();
        const filename = `${fileId}.webp`;
        
        // Process and save main image
        await sharp(file.buffer)
          .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(path.join(__dirname, '../../uploads', filename));
        
        mainImage = `/uploads/${filename}`;
      }

      if (req.files.images) {
        for (const file of req.files.images) {
          const fileId = uuidv4();
          const filename = `${fileId}.webp`;
          
          await sharp(file.buffer)
            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(path.join(__dirname, '../../uploads', filename));
          
          additionalImages.push(`/uploads/${filename}`);
        }
      }
    }

    // Parse JSON fields
    let parsedIngredients = [];
    let parsedNutrition = {};
    let parsedTags = [];
    let parsedMealType = [];

    try {
      parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
      parsedNutrition = typeof nutrition === 'string' ? JSON.parse(nutrition) : nutrition || {};
      parsedTags = typeof tags === 'string' ? 
        (tags.includes('[') ? JSON.parse(tags) : tags.split(',').map(t => t.trim())) : 
        (Array.isArray(tags) ? tags : []);
      parsedMealType = typeof meal_type === 'string' ? 
        (meal_type.includes('[') ? JSON.parse(meal_type) : [parseInt(meal_type)]) : 
        (Array.isArray(meal_type) ? meal_type.map(Number) : []);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu JSON không hợp lệ: ' + parseError.message
      });
    }

    // Tạo recipe mới
    const newRecipe = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim() || '',
      instructions: instructions.trim(),
      prep_time: parseInt(prep_time) || 0,
      cook_time: parseInt(cook_time) || 0,
      servings: parseInt(servings) || 1,
      difficulty_level: parseInt(difficulty_level) || 1,
      cuisine_type: cuisine_type || 'vietnamese',
      meal_type: parsedMealType,
      image: mainImage,
      images: additionalImages,
      ingredients: parsedIngredients,
      nutrition: {
        calories: parseFloat(parsedNutrition.calories) || 0,
        protein: parseFloat(parsedNutrition.protein) || 0,
        carbs: parseFloat(parsedNutrition.carbs) || 0,
        fat: parseFloat(parsedNutrition.fat) || 0,
        fiber: parseFloat(parsedNutrition.fiber) || 0,
        sugar: parseFloat(parsedNutrition.sugar) || 0,
        sodium: parseFloat(parsedNutrition.sodium) || 0
      },
      tags: parsedTags,
      author_id: req.decoded_authorization.user_id,
      is_public: is_public === 'true' || is_public === true,
      rating: 0,
      rating_count: 0,
      likes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Lưu vào lowdb
    db.get('recipes').push(newRecipe).write();

    res.status(201).json({
      success: true,
      result: { recipe: newRecipe },
      message: 'Tạo công thức thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// PUT /api/recipes/:id - Cập nhật recipe
const updateRecipeController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingRecipe = db.get('recipes').find({ id }).value();
    
    if (!existingRecipe) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức'
      });
    }

    // Check ownership
    if (existingRecipe.author_id !== req.decoded_authorization.user_id && req.decoded_authorization.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền chỉnh sửa công thức này'
      });
    }

    // Process uploaded images (similar to create)
    let mainImage = existingRecipe.image;
    let additionalImages = existingRecipe.images;

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const file = req.files.image[0];
        const fileId = uuidv4();
        const filename = `${fileId}.webp`;
        
        await sharp(file.buffer)
          .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(path.join(__dirname, '../../uploads', filename));
        
        mainImage = `/uploads/${filename}`;
      }

      if (req.files.images) {
        additionalImages = [];
        for (const file of req.files.images) {
          const fileId = uuidv4();
          const filename = `${fileId}.webp`;
          
          await sharp(file.buffer)
            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(path.join(__dirname, '../../uploads', filename));
          
          additionalImages.push(`/uploads/${filename}`);
        }
      }
    }

    // Update recipe
    const updatedData = {
      ...existingRecipe,
      ...req.body,
      image: mainImage,
      images: additionalImages,
      updated_at: new Date().toISOString()
    };

    // Parse JSON fields if needed
    if (req.body.ingredients && typeof req.body.ingredients === 'string') {
      updatedData.ingredients = JSON.parse(req.body.ingredients);
    }
    if (req.body.nutrition && typeof req.body.nutrition === 'string') {
      updatedData.nutrition = JSON.parse(req.body.nutrition);
    }
    if (req.body.tags && typeof req.body.tags === 'string') {
      updatedData.tags = req.body.tags.includes('[') ? JSON.parse(req.body.tags) : req.body.tags.split(',');
    }

    db.get('recipes').find({ id }).assign(updatedData).write();

    res.json({
      success: true,
      result: { recipe: updatedData },
      message: 'Cập nhật công thức thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// DELETE /api/recipes/:id - Xóa recipe
const deleteRecipeController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const recipe = db.get('recipes').find({ id }).value();
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức'
      });
    }

    // Check ownership
    if (recipe.author_id !== req.decoded_authorization.user_id && req.decoded_authorization.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa công thức này'
      });
    }

    db.get('recipes').remove({ id }).write();

    res.json({
      success: true,
      message: 'Xóa công thức thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Routes
router.get('/', wrapRequestHandler(getRecipesController));
router.get('/:id', wrapRequestHandler(getRecipeDetailController));
router.post('/', 
  accessTokenValidator,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 5 }
  ]),
  wrapRequestHandler(createRecipeController)
);
router.put('/:id', 
  accessTokenValidator,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 5 }
  ]),
  wrapRequestHandler(updateRecipeController)
);
router.delete('/:id', accessTokenValidator, wrapRequestHandler(deleteRecipeController));

module.exports = router;
