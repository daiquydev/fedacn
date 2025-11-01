const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/lowdb');
const { accessTokenValidator } = require('../middlewares/authUser.middleware');
const { wrapRequestHandler } = require('../utils/handler');

const router = express.Router();

// GET /api/ingredients - Lấy danh sách nguyên liệu
const getIngredientsController = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      category, 
      season,
      price_range 
    } = req.query;

    let ingredients = db.get('ingredients').value();

    // Filtering
    if (search) {
      const searchLower = search.toLowerCase();
      ingredients = ingredients.filter(ingredient => 
        ingredient.name.toLowerCase().includes(searchLower)
      );
    }

    if (category) {
      ingredients = ingredients.filter(ingredient => ingredient.category === category);
    }

    if (season && season !== 'all') {
      ingredients = ingredients.filter(ingredient => 
        ingredient.season === 'all' || ingredient.season === season
      );
    }

    if (price_range) {
      const [min, max] = price_range.split('-').map(Number);
      ingredients = ingredients.filter(ingredient => 
        ingredient.price >= min && ingredient.price <= max
      );
    }

    // Sorting by name
    ingredients.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    // Pagination
    const total = ingredients.length;
    const startIndex = (page - 1) * limit;
    const paginatedIngredients = ingredients.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      result: {
        ingredients: paginatedIngredients,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      },
      message: 'Lấy danh sách nguyên liệu thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// GET /api/ingredients/search - Tìm kiếm nguyên liệu (autocomplete)
const searchIngredientsController = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        result: { ingredients: [] },
        message: 'Vui lòng nhập ít nhất 2 ký tự'
      });
    }

    const searchLower = q.toLowerCase();
    let ingredients = db.get('ingredients').value();

    ingredients = ingredients
      .filter(ingredient => ingredient.name.toLowerCase().includes(searchLower))
      .slice(0, parseInt(limit))
      .map(ingredient => ({
        id: ingredient.id,
        name: ingredient.name,
        category: ingredient.category,
        calories: ingredient.calories,
        unit: ingredient.unit,
        price: ingredient.price
      }));

    res.json({
      success: true,
      result: { ingredients },
      message: 'Tìm kiếm nguyên liệu thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// GET /api/ingredients/:id - Lấy chi tiết nguyên liệu
const getIngredientDetailController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ingredient = db.get('ingredients').find({ id }).value();
    
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nguyên liệu'
      });
    }

    res.json({
      success: true,
      result: { ingredient },
      message: 'Lấy chi tiết nguyên liệu thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// POST /api/ingredients - Thêm nguyên liệu mới (Admin only)
const createIngredientController = async (req, res) => {
  try {
    // Check admin role
    if (req.decoded_authorization.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể thêm nguyên liệu'
      });
    }

    const {
      name,
      category,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
      unit,
      price,
      season = 'all'
    } = req.body;

    // Validate required fields
    if (!name || !category || !calories || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: tên, category, calories, đơn vị'
      });
    }

    // Check duplicate name
    const existingIngredient = db.get('ingredients').find({ name }).value();
    if (existingIngredient) {
      return res.status(400).json({
        success: false,
        message: 'Nguyên liệu này đã tồn tại'
      });
    }

    const newIngredient = {
      id: uuidv4(),
      name: name.trim(),
      category,
      calories: parseFloat(calories),
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      fiber: parseFloat(fiber) || 0,
      sugar: parseFloat(sugar) || 0,
      sodium: parseFloat(sodium) || 0,
      unit,
      price: parseFloat(price) || 0,
      season,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.get('ingredients').push(newIngredient).write();

    res.status(201).json({
      success: true,
      result: { ingredient: newIngredient },
      message: 'Thêm nguyên liệu thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// GET /api/ingredients/categories/list - Lấy danh sách categories
const getCategoriesController = async (req, res) => {
  try {
    const categories = [
      { id: 'grains', name: 'Ngũ cốc', name_en: 'Grains' },
      { id: 'meat', name: 'Thịt', name_en: 'Meat' },
      { id: 'seafood', name: 'Hải sản', name_en: 'Seafood' },
      { id: 'vegetables', name: 'Rau củ', name_en: 'Vegetables' },
      { id: 'fruits', name: 'Trái cây', name_en: 'Fruits' },
      { id: 'dairy', name: 'Sữa & Trứng', name_en: 'Dairy & Eggs' },
      { id: 'legumes', name: 'Đậu các loại', name_en: 'Legumes' },
      { id: 'nuts', name: 'Hạt', name_en: 'Nuts' },
      { id: 'spices', name: 'Gia vị', name_en: 'Spices' },
      { id: 'oils', name: 'Dầu ăn', name_en: 'Oils' }
    ];

    res.json({
      success: true,
      result: { categories },
      message: 'Lấy danh sách categories thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Routes
router.get('/', wrapRequestHandler(getIngredientsController));
router.get('/search', wrapRequestHandler(searchIngredientsController));
router.get('/categories/list', wrapRequestHandler(getCategoriesController));
router.get('/:id', wrapRequestHandler(getIngredientDetailController));
router.post('/', accessTokenValidator, wrapRequestHandler(createIngredientController));

module.exports = router;
