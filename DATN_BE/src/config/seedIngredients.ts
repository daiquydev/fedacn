import db, { Ingredient } from './lowdb';

// Dữ liệu seed cho nguyên liệu Việt Nam
const seedIngredients: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Thịt heo ba chỉ',
    category: 'Thịt',
    season: 'all',
    price: 180000,
    unit: 'kg',
    nutrition: {
      calories: 518,
      protein: 9.3,
      carbs: 0,
      fat: 53,
      fiber: 0,
      sugar: 0,
      sodium: 58,
      potassium: 230,
      vitaminC: 0,
      calcium: 8,
      iron: 1.0
    },
    description: 'Thịt heo ba chỉ tươi ngon, nhiều mỡ, thích hợp cho nhiều món ăn',
    image: '/images/ingredients/thit-heo-ba-chi.jpg'
  },
  {
    name: 'Thịt bò thăn',
    category: 'Thịt',
    season: 'all',
    price: 350000,
    unit: 'kg',
    nutrition: {
      calories: 250,
      protein: 26,
      carbs: 0,
      fat: 15,
      fiber: 0,
      sugar: 0,
      sodium: 72,
      potassium: 318,
      vitaminC: 0,
      calcium: 18,
      iron: 2.6
    },
    description: 'Thịt bò thăn cao cấp, mềm ngon, giàu protein',
    image: '/images/ingredients/thit-bo-than.jpg'
  },
  {
    name: 'Cá diêu hồng',
    category: 'Hải sản',
    season: 'all',
    price: 120000,
    unit: 'kg',
    nutrition: {
      calories: 128,
      protein: 26,
      carbs: 0,
      fat: 2.3,
      fiber: 0,
      sugar: 0,
      sodium: 81,
      potassium: 415,
      vitaminC: 0,
      calcium: 37,
      iron: 0.3
    },
    description: 'Cá diêu hồng tươi sống, thịt chắc ngọt',
    image: '/images/ingredients/ca-dieu-hong.jpg'
  },
  {
    name: 'Tôm sú',
    category: 'Hải sản',
    season: 'all',
    price: 400000,
    unit: 'kg',
    nutrition: {
      calories: 99,
      protein: 18,
      carbs: 0.2,
      fat: 1.4,
      fiber: 0,
      sugar: 0,
      sodium: 111,
      potassium: 259,
      vitaminC: 2.1,
      calcium: 54,
      iron: 2.4
    },
    description: 'Tôm sú tươi sống size lớn, thịt ngọt đậm đà',
    image: '/images/ingredients/tom-su.jpg'
  },
  {
    name: 'Rau muống',
    category: 'Rau củ',
    season: 'summer',
    price: 15000,
    unit: 'kg',
    nutrition: {
      calories: 19,
      protein: 2.6,
      carbs: 3.1,
      fat: 0.2,
      fiber: 2.1,
      sugar: 1.8,
      sodium: 113,
      potassium: 312,
      vitaminC: 55,
      calcium: 99,
      iron: 2.5
    },
    description: 'Rau muống tươi xanh, giòn ngọt, giàu vitamin',
    image: '/images/ingredients/rau-muong.jpg'
  },
  {
    name: 'Cải thảo',
    category: 'Rau củ',
    season: 'winter',
    price: 12000,
    unit: 'kg',
    nutrition: {
      calories: 13,
      protein: 1.5,
      carbs: 2.2,
      fat: 0.2,
      fiber: 1.2,
      sugar: 1.2,
      sodium: 9,
      potassium: 252,
      vitaminC: 45,
      calcium: 105,
      iron: 0.8
    },
    description: 'Cải thảo tươi ngọt, thích hợp nấu canh, xào',
    image: '/images/ingredients/cai-thao.jpg'
  },
  {
    name: 'Gạo tẻ',
    category: 'Ngũ cốc',
    season: 'all',
    price: 25000,
    unit: 'kg',
    nutrition: {
      calories: 365,
      protein: 7.1,
      carbs: 80,
      fat: 0.7,
      fiber: 1.3,
      sugar: 0.1,
      sodium: 5,
      potassium: 115,
      vitaminC: 0,
      calcium: 28,
      iron: 0.8
    },
    description: 'Gạo tẻ thơm ngon, hạt dài, nấu cơm rời mềm',
    image: '/images/ingredients/gao-te.jpg'
  },
  {
    name: 'Nước mắm',
    category: 'Gia vị',
    season: 'all',
    price: 35000,
    unit: 'chai',
    nutrition: {
      calories: 10,
      protein: 1.5,
      carbs: 0.9,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 1368,
      potassium: 56,
      vitaminC: 0,
      calcium: 29,
      iron: 1.0
    },
    description: 'Nước mắm truyền thống Phú Quốc, đậm đà thơm ngon',
    image: '/images/ingredients/nuoc-mam.jpg'
  },
  {
    name: 'Hành lá',
    category: 'Rau thơm',
    season: 'all',
    price: 8000,
    unit: 'bó',
    nutrition: {
      calories: 32,
      protein: 1.8,
      carbs: 7.3,
      fat: 0.2,
      fiber: 2.6,
      sugar: 2.3,
      sodium: 16,
      potassium: 276,
      vitaminC: 18.8,
      calcium: 72,
      iron: 1.5
    },
    description: 'Hành lá tươi xanh, thơm nồng, trang trí và gia vị',
    image: '/images/ingredients/hanh-la.jpg'
  },
  {
    name: 'Tỏi',
    category: 'Rau thơm',
    season: 'all',
    price: 45000,
    unit: 'kg',
    nutrition: {
      calories: 149,
      protein: 6.4,
      carbs: 33,
      fat: 0.5,
      fiber: 2.1,
      sugar: 1,
      sodium: 17,
      potassium: 401,
      vitaminC: 31.2,
      calcium: 181,
      iron: 1.7
    },
    description: 'Tỏi tím Lý Sơn, cay nồng, khử mùi tanh',
    image: '/images/ingredients/toi.jpg'
  }
];

// Hàm seed ingredients vào database
export const seedIngredientsData = () => {
  const existingIngredients = db.get('ingredients').value();
  
  if (existingIngredients.length === 0) {
    console.log('Seeding ingredients data...');
    
    const ingredientsWithIds = seedIngredients.map(ingredient => ({
      ...ingredient,
      id: `ingredient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    db.get('ingredients')
      .push(...ingredientsWithIds)
      .write();

    console.log(`Seeded ${ingredientsWithIds.length} ingredients successfully!`);
  } else {
    console.log('Ingredients data already exists, skipping seed...');
  }
};

export default seedIngredients;
