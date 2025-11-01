const express = require('express');
const db = require('../../config/lowdb');
const { wrapRequestHandler } = require('../../utils/handler');

const router = express.Router();

// POST /api/nutrition/calculate - Tính toán dinh dưỡng
const calculateNutritionController = async (req, res) => {
  try {
    const { ingredients } = req.body; // [{ ingredient_id, amount }]

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách nguyên liệu không hợp lệ'
      });
    }

    let totalNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    const detailedIngredients = [];

    for (const item of ingredients) {
      const ingredient = db.get('ingredients').find({ id: item.ingredient_id }).value();
      
      if (ingredient) {
        const ratio = item.amount / 100; // Nutrition data per 100g
        
        const calculatedNutrition = {
          calories: ingredient.calories * ratio,
          protein: ingredient.protein * ratio,
          carbs: ingredient.carbs * ratio,
          fat: ingredient.fat * ratio,
          fiber: ingredient.fiber * ratio,
          sugar: (ingredient.sugar || 0) * ratio,
          sodium: (ingredient.sodium || 0) * ratio
        };

        totalNutrition.calories += calculatedNutrition.calories;
        totalNutrition.protein += calculatedNutrition.protein;
        totalNutrition.carbs += calculatedNutrition.carbs;
        totalNutrition.fat += calculatedNutrition.fat;
        totalNutrition.fiber += calculatedNutrition.fiber;
        totalNutrition.sugar += calculatedNutrition.sugar;
        totalNutrition.sodium += calculatedNutrition.sodium;

        detailedIngredients.push({
          ...ingredient,
          amount: item.amount,
          nutrition: calculatedNutrition
        });
      }
    }

    // Round numbers
    Object.keys(totalNutrition).forEach(key => {
      totalNutrition[key] = Math.round(totalNutrition[key] * 10) / 10;
    });

    res.json({
      success: true,
      result: {
        total_nutrition: totalNutrition,
        detailed_ingredients: detailedIngredients
      },
      message: 'Tính toán dinh dưỡng thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// GET /api/nutrition/recommendations - Gợi ý dinh dưỡng
const getRecommendationsController = async (req, res) => {
  try {
    const { 
      age, 
      gender, 
      weight, 
      height, 
      activity_level, 
      goal 
    } = req.query;

    // Validate required fields
    if (!age || !gender || !weight || !height) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: tuổi, giới tính, cân nặng, chiều cao'
      });
    }

    // BMR calculation (Mifflin-St Jeor Equation)
    let bmr;
    if (gender === 'male') {
      bmr = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseInt(age) + 5;
    } else {
      bmr = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseInt(age) - 161;
    }

    // Activity factor
    const activityFactors = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9
    };

    const tdee = bmr * (activityFactors[activity_level] || 1.2);

    // Goal adjustment
    let targetCalories = tdee;
    if (goal === 'weight_loss') {
      targetCalories = tdee - 500; // 0.5kg/week loss
    } else if (goal === 'weight_gain') {
      targetCalories = tdee + 500; // 0.5kg/week gain
    }

    // Macro distribution
    const recommendations = {
      calories: Math.round(targetCalories),
      protein: Math.round(parseFloat(weight) * 1.6), // 1.6g per kg
      carbs: Math.round(targetCalories * 0.45 / 4), // 45% of calories
      fat: Math.round(targetCalories * 0.25 / 9), // 25% of calories
      fiber: Math.round(14 * targetCalories / 1000), // 14g per 1000 calories
      water: Math.round(parseFloat(weight) * 35), // 35ml per kg
    };

    res.json({
      success: true,
      result: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        recommendations
      },
      message: 'Tính toán gợi ý dinh dưỡng thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// GET /api/nutrition/daily-values - Lấy giá trị dinh dưỡng hàng ngày khuyến nghị
const getDailyValuesController = async (req, res) => {
  try {
    const dailyValues = {
      calories: 2000,
      protein: 50, // g
      carbs: 300, // g
      fat: 65, // g
      fiber: 25, // g
      sugar: 50, // g (added sugars)
      sodium: 2300, // mg
      vitamin_c: 90, // mg
      vitamin_d: 20, // mcg
      calcium: 1300, // mg
      iron: 18, // mg
      potassium: 4700 // mg
    };

    res.json({
      success: true,
      result: { daily_values: dailyValues },
      message: 'Lấy giá trị dinh dưỡng khuyến nghị thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// POST /api/nutrition/analyze-meal - Phân tích bữa ăn
const analyzeMealController = async (req, res) => {
  try {
    const { meal_ingredients, target_calories = 2000 } = req.body;

    if (!meal_ingredients || !Array.isArray(meal_ingredients)) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách nguyên liệu bữa ăn không hợp lệ'
      });
    }

    // Calculate nutrition for the meal
    let mealNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    for (const item of meal_ingredients) {
      const ingredient = db.get('ingredients').find({ id: item.ingredient_id }).value();
      
      if (ingredient) {
        const ratio = item.amount / 100;
        
        mealNutrition.calories += ingredient.calories * ratio;
        mealNutrition.protein += ingredient.protein * ratio;
        mealNutrition.carbs += ingredient.carbs * ratio;
        mealNutrition.fat += ingredient.fat * ratio;
        mealNutrition.fiber += ingredient.fiber * ratio;
        mealNutrition.sugar += (ingredient.sugar || 0) * ratio;
        mealNutrition.sodium += (ingredient.sodium || 0) * ratio;
      }
    }

    // Round numbers
    Object.keys(mealNutrition).forEach(key => {
      mealNutrition[key] = Math.round(mealNutrition[key] * 10) / 10;
    });

    // Calculate percentages of daily values
    const percentages = {
      calories: Math.round(mealNutrition.calories / target_calories * 100),
      protein: Math.round(mealNutrition.protein / 50 * 100),
      carbs: Math.round(mealNutrition.carbs / 300 * 100),
      fat: Math.round(mealNutrition.fat / 65 * 100),
      fiber: Math.round(mealNutrition.fiber / 25 * 100),
      sodium: Math.round(mealNutrition.sodium / 2300 * 100)
    };

    // Health assessment
    const assessment = {
      overall_score: 0,
      recommendations: [],
      warnings: []
    };

    // Calculate overall score (0-100)
    let score = 50; // Base score

    // Protein check
    if (mealNutrition.protein >= 10) score += 10;
    else assessment.recommendations.push('Tăng thêm protein trong bữa ăn');

    // Fiber check
    if (mealNutrition.fiber >= 5) score += 10;
    else assessment.recommendations.push('Thêm rau xanh hoặc trái cây để tăng chất xơ');

    // Sodium check
    if (mealNutrition.sodium <= 600) score += 10;
    else assessment.warnings.push('Lượng natri cao, hạn chế muối và gia vị');

    // Sugar check
    if (mealNutrition.sugar <= 15) score += 10;
    else assessment.warnings.push('Lượng đường cao, hạn chế đồ ngọt');

    // Calories balance
    const caloriePercentage = mealNutrition.calories / target_calories * 100;
    if (caloriePercentage >= 20 && caloriePercentage <= 40) score += 10;
    else if (caloriePercentage > 40) assessment.warnings.push('Bữa ăn có quá nhiều calo');
    else assessment.recommendations.push('Bữa ăn cần thêm calo');

    assessment.overall_score = Math.min(score, 100);

    res.json({
      success: true,
      result: {
        nutrition: mealNutrition,
        percentages,
        assessment
      },
      message: 'Phân tích bữa ăn thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Routes
router.post('/calculate', wrapRequestHandler(calculateNutritionController));
router.get('/recommendations', wrapRequestHandler(getRecommendationsController));
router.get('/daily-values', wrapRequestHandler(getDailyValuesController));
router.post('/analyze-meal', wrapRequestHandler(analyzeMealController));

module.exports = router;
