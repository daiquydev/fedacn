import db, { Recipe } from './lowdb';

// Dữ liệu seed cho công thức món ăn Việt Nam
const seedRecipes: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Phở Bò',
    description: 'Món phở bò truyền thống Hà Nội với nước dầy đậm đà, thịt bò tái và bánh phở mềm',
    image: '/images/recipes/pho-bo.jpg',
    servings: 4,
    prepTime: 30,
    cookTime: 180,
    difficulty: 'medium',
    cuisine: 'vietnamese',
    category: 'Món chính',
    tags: ['phở', 'bò', 'truyền thống', 'hà nội'],
    ingredients: [
      { ingredientId: 'ingredient_beef', quantity: 500, unit: 'g' },
      { ingredientId: 'ingredient_rice_noodles', quantity: 400, unit: 'g' },
      { ingredientId: 'ingredient_beef_bones', quantity: 1, unit: 'kg' },
      { ingredientId: 'ingredient_onion', quantity: 2, unit: 'củ' },
      { ingredientId: 'ingredient_ginger', quantity: 50, unit: 'g' }
    ],
    instructions: [
      { step: 1, instruction: 'Làm sạch xương bò, chần sơ qua nước sôi', time: 15 },
      { step: 2, instruction: 'Nấu nước dùng với xương bò trong 3 tiếng', time: 180 },
      { step: 3, instruction: 'Thái thịt bò mỏng, chần bánh phở', time: 10 },
      { step: 4, instruction: 'Trình bày và chan nước dùng nóng', time: 5 }
    ],
    nutrition: {
      calories: 450,
      protein: 25,
      carbs: 65,
      fat: 8,
      fiber: 2,
      sugar: 4,
      sodium: 800
    },
    author: 'admin'
  },
  {
    name: 'Bún Bò Huế',
    description: 'Bún bò Huế cay nồng đặc trưng xứ Huế với nước lèo đỏ thơm',
    image: '/images/recipes/bun-bo-hue.jpg',
    servings: 6,
    prepTime: 45,
    cookTime: 120,
    difficulty: 'hard',
    cuisine: 'vietnamese',
    category: 'Món chính',
    tags: ['bún', 'bò', 'huế', 'cay'],
    ingredients: [
      { ingredientId: 'ingredient_beef_shank', quantity: 400, unit: 'g' },
      { ingredientId: 'ingredient_pork_leg', quantity: 300, unit: 'g' },
      { ingredientId: 'ingredient_thick_noodles', quantity: 500, unit: 'g' },
      { ingredientId: 'ingredient_lemongrass', quantity: 3, unit: 'cây' }
    ],
    instructions: [
      { step: 1, instruction: 'Sơ chế thịt bò và heo, ướp gia vị', time: 30 },
      { step: 2, instruction: 'Nấu nước dùng với xương và thịt', time: 90 },
      { step: 3, instruction: 'Chế biến tôm chua và các loại rau', time: 20 },
      { step: 4, instruction: 'Trình bày bún và chan nước lèo', time: 10 }
    ],
    nutrition: {
      calories: 520,
      protein: 28,
      carbs: 58,
      fat: 18,
      fiber: 3,
      sugar: 6,
      sodium: 950
    },
    author: 'admin'
  },
  {
    name: 'Gỏi Cuốn Tôm Thịt',
    description: 'Gỏi cuốn tươi mát với tôm, thịt heo và rau thơm, chấm nước mắm pha',
    image: '/images/recipes/goi-cuon.jpg',
    servings: 4,
    prepTime: 45,
    cookTime: 20,
    difficulty: 'easy',
    cuisine: 'vietnamese',
    category: 'Khai vị',
    tags: ['gỏi cuốn', 'tôm', 'tươi mát', 'healthy'],
    ingredients: [
      { ingredientId: 'ingredient_shrimp', quantity: 300, unit: 'g' },
      { ingredientId: 'ingredient_pork_belly', quantity: 200, unit: 'g' },
      { ingredientId: 'ingredient_rice_paper', quantity: 1, unit: 'gói' },
      { ingredientId: 'ingredient_lettuce', quantity: 1, unit: 'bó' }
    ],
    instructions: [
      { step: 1, instruction: 'Luộc tôm và thịt heo chín tái', time: 15 },
      { step: 2, instruction: 'Chuẩn bị rau sống và bánh tráng', time: 15 },
      { step: 3, instruction: 'Cuốn gỏi cuốn theo thứ tự nguyên liệu', time: 20 },
      { step: 4, instruction: 'Pha nước chấm và trình bày', time: 10 }
    ],
    nutrition: {
      calories: 180,
      protein: 15,
      carbs: 20,
      fat: 4,
      fiber: 2,
      sugar: 3,
      sodium: 450
    },
    author: 'admin'
  },
  {
    name: 'Cơm Tấm Sườn Nướng',
    description: 'Cơm tấm Sài Gòn với sườn nướng thơm lừng, chả trứng và nước mắm chấm',
    image: '/images/recipes/com-tam-suon-nuong.jpg',
    servings: 2,
    prepTime: 30,
    cookTime: 25,
    difficulty: 'medium',
    cuisine: 'vietnamese',
    category: 'Món chính',
    tags: ['cơm tấm', 'sườn nướng', 'sài gòn'],
    ingredients: [
      { ingredientId: 'ingredient_broken_rice', quantity: 300, unit: 'g' },
      { ingredientId: 'ingredient_pork_ribs', quantity: 400, unit: 'g' },
      { ingredientId: 'ingredient_egg_meatloaf', quantity: 200, unit: 'g' },
      { ingredientId: 'ingredient_fish_sauce', quantity: 3, unit: 'tbsp' }
    ],
    instructions: [
      { step: 1, instruction: 'Ướp sườn với nước mắm, đường, tỏi', time: 20 },
      { step: 2, instruction: 'Nướng sườn trên than hoa', time: 15 },
      { step: 3, instruction: 'Nấu cơm tấm và chả trứng', time: 20 },
      { step: 4, instruction: 'Trình bày và phục vụ kèm nước mắm chấm', time: 5 }
    ],
    nutrition: {
      calories: 650,
      protein: 32,
      carbs: 75,
      fat: 22,
      fiber: 1,
      sugar: 8,
      sodium: 1200
    },
    author: 'admin'
  },
  {
    name: 'Canh Chua Cá',
    description: 'Canh chua cá truyền thống miền Nam với cá, dứa, đậu bắp và rau thơm',
    image: '/images/recipes/canh-chua-ca.jpg',
    servings: 4,
    prepTime: 20,
    cookTime: 25,
    difficulty: 'easy',
    cuisine: 'vietnamese',
    category: 'Canh',
    tags: ['canh chua', 'cá', 'miền nam'],
    ingredients: [
      { ingredientId: 'ingredient_catfish', quantity: 500, unit: 'g' },
      { ingredientId: 'ingredient_pineapple', quantity: 200, unit: 'g' },
      { ingredientId: 'ingredient_okra', quantity: 150, unit: 'g' },
      { ingredientId: 'ingredient_tamarind', quantity: 2, unit: 'tbsp' }
    ],
    instructions: [
      { step: 1, instruction: 'Làm sạch cá, cắt khúc vừa ăn', time: 10 },
      { step: 2, instruction: 'Nấu nước dùng với xương cá', time: 15 },
      { step: 3, instruction: 'Cho dứa, đậu bắp vào nấu', time: 8 },
      { step: 4, instruction: 'Nêm nếm và cho rau thơm', time: 5 }
    ],
    nutrition: {
      calories: 180,
      protein: 22,
      carbs: 15,
      fat: 3,
      fiber: 4,
      sugar: 10,
      sodium: 600
    },
    author: 'admin'
  }
];

// Hàm seed recipes vào database
export const seedRecipesData = () => {
  const existingRecipes = db.get('recipes').value();
  
  if (existingRecipes.length === 0) {
    console.log('Seeding recipes data...');
    
    const recipesWithIds = seedRecipes.map(recipe => ({
      ...recipe,
      id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    db.get('recipes')
      .push(...recipesWithIds)
      .write();

    console.log(`Seeded ${recipesWithIds.length} recipes successfully!`);
  } else {
    console.log('Recipes data already exists, skipping seed...');
  }
};

export default seedRecipes;
