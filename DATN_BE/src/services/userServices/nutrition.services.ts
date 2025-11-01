import db, { Ingredient, Recipe } from '~/config/lowdb'

interface NutritionRecommendation {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  weight: number; // kg
  height: number; // cm
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'maintain' | 'lose' | 'gain'; // weight goal
}

class NutritionService {
  // Tính BMR (Basal Metabolic Rate) theo công thức Harris-Benedict
  calculateBMR(profile: UserProfile): number {
    const { age, gender, weight, height } = profile;
    
    if (gender === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
  }

  // Tính TDEE (Total Daily Energy Expenditure)
  calculateTDEE(profile: UserProfile): number {
    const bmr = this.calculateBMR(profile);
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    return bmr * activityMultipliers[profile.activityLevel];
  }

  // Tính khuyến nghị dinh dưỡng hàng ngày
  calculateDailyNutritionRecommendation(profile: UserProfile): NutritionRecommendation {
    let tdee = this.calculateTDEE(profile);
    
    // Điều chỉnh calories theo mục tiêu
    switch (profile.goal) {
      case 'lose':
        tdee *= 0.85; // Giảm 15% calories để giảm cân
        break;
      case 'gain':
        tdee *= 1.15; // Tăng 15% calories để tăng cân
        break;
      default:
        // maintain - không thay đổi
        break;
    }

    // Phân bổ macro theo tỷ lệ chuẩn
    const protein = (tdee * 0.25) / 4; // 25% calories từ protein (4 cal/g)
    const carbs = (tdee * 0.45) / 4;   // 45% calories từ carbs (4 cal/g)
    const fat = (tdee * 0.30) / 9;     // 30% calories từ fat (9 cal/g)
    const fiber = Math.max(25, profile.weight * 0.5); // Tối thiểu 25g hoặc 0.5g/kg cân nặng

    return {
      calories: Math.round(tdee),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      fiber: Math.round(fiber)
    };
  }

  // Phân tích dinh dưỡng của một bữa ăn
  async analyzeMealNutrition(recipeIds: string[], servingSizes: number[] = []) {
    const recipes = db.get('recipes').value() as Recipe[];
    const analysis = {
      totalNutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
      },
      recipes: [] as any[]
    };

    for (let i = 0; i < recipeIds.length; i++) {
      const recipe = recipes.find(r => r.id === recipeIds[i]);
      if (recipe) {
        const servingSize = servingSizes[i] || 1;
        const recipeNutrition = {
          ...recipe.nutrition,
          calories: recipe.nutrition.calories * servingSize,
          protein: recipe.nutrition.protein * servingSize,
          carbs: recipe.nutrition.carbs * servingSize,
          fat: recipe.nutrition.fat * servingSize,
          fiber: recipe.nutrition.fiber * servingSize,
          sugar: recipe.nutrition.sugar * servingSize,
          sodium: recipe.nutrition.sodium * servingSize
        };

        analysis.recipes.push({
          id: recipe.id,
          name: recipe.name,
          servingSize,
          nutrition: recipeNutrition
        });

        // Cộng dồn vào tổng
        Object.keys(analysis.totalNutrition).forEach(key => {
          analysis.totalNutrition[key as keyof typeof analysis.totalNutrition] += 
            recipeNutrition[key as keyof typeof recipeNutrition];
        });
      }
    }

    // Làm tròn các giá trị
    Object.keys(analysis.totalNutrition).forEach(key => {
      analysis.totalNutrition[key as keyof typeof analysis.totalNutrition] = 
        Math.round(analysis.totalNutrition[key as keyof typeof analysis.totalNutrition] * 100) / 100;
    });

    return analysis;
  }

  // Đề xuất thực đơn dựa trên mục tiêu dinh dưỡng
  async suggestMealPlan(targetNutrition: NutritionRecommendation, mealsPerDay: number = 3) {
    const recipes = db.get('recipes').value() as Recipe[];
    
    // Phân chia calories cho từng bữa ăn
    const caloriesPerMeal = targetNutrition.calories / mealsPerDay;
    const proteinPerMeal = targetNutrition.protein / mealsPerDay;
    const carbsPerMeal = targetNutrition.carbs / mealsPerDay;
    const fatPerMeal = targetNutrition.fat / mealsPerDay;

    const mealPlan = [];

    for (let i = 0; i < mealsPerDay; i++) {
      // Lọc recipes phù hợp với calories của bữa ăn
      const suitableRecipes = recipes.filter(recipe => 
        recipe.nutrition.calories <= caloriesPerMeal * 1.2 && // Cho phép vượt 20%
        recipe.nutrition.calories >= caloriesPerMeal * 0.5   // Tối thiểu 50%
      );

      if (suitableRecipes.length > 0) {
        // Chọn random một recipe phù hợp
        const selectedRecipe = suitableRecipes[Math.floor(Math.random() * suitableRecipes.length)];
        mealPlan.push({
          mealNumber: i + 1,
          recipe: selectedRecipe,
          targetNutrition: {
            calories: caloriesPerMeal,
            protein: proteinPerMeal,
            carbs: carbsPerMeal,
            fat: fatPerMeal
          }
        });
      }
    }

    return mealPlan;
  }

  // Tính chỉ số BMI
  calculateBMI(weight: number, height: number): { bmi: number; category: string } {
    const bmi = weight / Math.pow(height / 100, 2);
    
    let category = '';
    if (bmi < 18.5) category = 'Thiếu cân';
    else if (bmi < 25) category = 'Bình thường';
    else if (bmi < 30) category = 'Thừa cân';
    else category = 'Béo phì';

    return {
      bmi: Math.round(bmi * 100) / 100,
      category
    };
  }

  // Lấy thông tin dinh dưỡng của nguyên liệu
  async getIngredientNutrition(ingredientId: string) {
    const ingredients = db.get('ingredients').value() as Ingredient[];
    return ingredients.find(ingredient => ingredient.id === ingredientId);
  }

  // So sánh dinh dưỡng giữa các recipes
  async compareRecipes(recipeIds: string[]) {
    const recipes = db.get('recipes').value() as Recipe[];
    const comparison = recipeIds.map(id => {
      const recipe = recipes.find(r => r.id === id);
      return recipe ? {
        id: recipe.id,
        name: recipe.name,
        nutrition: recipe.nutrition,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        difficulty: recipe.difficulty,
        servings: recipe.servings
      } : null;
    }).filter(Boolean);

    return comparison;
  }

  // Tìm recipes thay thế có dinh dưỡng tương tự
  async findSimilarRecipes(targetRecipeId: string, limit: number = 5) {
    const recipes = db.get('recipes').value() as Recipe[];
    const targetRecipe = recipes.find(r => r.id === targetRecipeId);
    
    if (!targetRecipe) return [];

    // Tính độ tương tự dựa trên dinh dưỡng
    const similarRecipes = recipes
      .filter(recipe => recipe.id !== targetRecipeId)
      .map(recipe => {
        const caloriesDiff = Math.abs(recipe.nutrition.calories - targetRecipe.nutrition.calories);
        const proteinDiff = Math.abs(recipe.nutrition.protein - targetRecipe.nutrition.protein);
        const carbsDiff = Math.abs(recipe.nutrition.carbs - targetRecipe.nutrition.carbs);
        const fatDiff = Math.abs(recipe.nutrition.fat - targetRecipe.nutrition.fat);
        
        // Tính điểm tương tự (càng thấp càng tương tự)
        const similarityScore = caloriesDiff + proteinDiff + carbsDiff + fatDiff;
        
        return {
          ...recipe,
          similarityScore
        };
      })
      .sort((a, b) => a.similarityScore - b.similarityScore)
      .slice(0, limit);

    return similarRecipes;
  }
}

const nutritionService = new NutritionService();
export default nutritionService;
export type { UserProfile, NutritionRecommendation };
