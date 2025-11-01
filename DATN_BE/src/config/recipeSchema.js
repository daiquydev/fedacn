const db = require('./lowdb');

const initRecipeData = () => {
  const existing = db.get('recipes').value();
  if (existing.length === 0) {
    const vietnameseRecipes = [
      {
        id: 'recipe-001',
        name: 'Phở Bò Hà Nội',
        description: 'Món phở truyền thống với nước dùng trong, thịt bò tươi ngon',
        instructions: `
1. Ninh xương bò 3-4 tiếng để có nước dùng trong
2. Thái thịt bò thành lát mỏng
3. Trụng bánh phở qua nước sôi
4. Cho bánh phở vào tô, thêm thịt bò, rau thơm
5. Đổ nước dùng nóng lên trên
        `,
        prep_time: 30,
        cook_time: 240,
        servings: 4,
        difficulty_level: 4,
        cuisine_type: 'vietnamese',
        meal_type: [1, 2], // breakfast, lunch
        image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800',
        images: [],
        ingredients: [
          { ingredient_id: 'ing-001', amount: 500, unit: 'g', name: 'Xương bò' },
          { ingredient_id: 'ing-005', amount: 300, unit: 'g', name: 'Thịt bò' },
          { ingredient_id: 'ing-003', amount: 400, unit: 'g', name: 'Bánh phở' },
          { ingredient_id: 'ing-023', amount: 50, unit: 'g', name: 'Hành lá' },
        ],
        nutrition: {
          calories: 450,
          protein: 25,
          carbs: 55,
          fat: 12,
          fiber: 3,
          sugar: 8,
          sodium: 1200
        },
        tags: ['traditional', 'beef', 'soup', 'vietnamese'],
        author_id: 'admin',
        is_public: true,
        rating: 4.8,
        rating_count: 156,
        likes_count: 89,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'recipe-002',
        name: 'Cơm Tấm Sài Gòn',
        description: 'Cơm tấm với sườn nướng, bì, chả trứng đặc trưng Sài Gòn',
        instructions: `
1. Ướp sườn với gia vị 2 tiếng
2. Nướng sườn trên than hoa
3. Chuẩn bị bì, chả trứng
4. Trình bày cơm tấm ra đĩa
5. Ăn kèm nước mắm pha
        `,
        prep_time: 45,
        cook_time: 30,
        servings: 2,
        difficulty_level: 3,
        cuisine_type: 'vietnamese',
        meal_type: [2, 3], // lunch, dinner
        image: 'https://images.unsplash.com/photo-1559847844-d147246a52f8?w=800',
        images: [],
        ingredients: [
          { ingredient_id: 'ing-001', amount: 300, unit: 'g', name: 'Cơm tấm' },
          { ingredient_id: 'ing-008', amount: 200, unit: 'g', name: 'Sườn heo' },
          { ingredient_id: 'ing-006', amount: 100, unit: 'g', name: 'Bì' },
          { ingredient_id: 'ing-031', amount: 2, unit: 'quả', name: 'Trứng' },
        ],
        nutrition: {
          calories: 680,
          protein: 35,
          carbs: 65,
          fat: 28,
          fiber: 2,
          sugar: 5,
          sodium: 980
        },
        tags: ['grilled', 'pork', 'rice', 'southern'],
        author_id: 'admin',
        is_public: true,
        rating: 4.6,
        rating_count: 203,
        likes_count: 124,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'recipe-003',
        name: 'Bún Chả Hà Nội',
        description: 'Bún chả với thịt nướng thơm lừng, nước mắm chua ngọt',
        instructions: `
1. Ướp thịt heo với gia vị
2. Nướng thịt trên bếp than
3. Pha nước mắm chua ngọt
4. Trụng bún tươi
5. Ăn kèm rau sống
        `,
        prep_time: 20,
        cook_time: 25,
        servings: 2,
        difficulty_level: 2,
        cuisine_type: 'vietnamese',
        meal_type: [2], // lunch
        image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800',
        images: [],
        ingredients: [
          { ingredient_id: 'ing-004', amount: 200, unit: 'g', name: 'Bún tươi' },
          { ingredient_id: 'ing-006', amount: 300, unit: 'g', name: 'Thịt heo' },
          { ingredient_id: 'ing-015', amount: 100, unit: 'g', name: 'Rau thơm' },
        ],
        nutrition: {
          calories: 520,
          protein: 28,
          carbs: 45,
          fat: 18,
          fiber: 3,
          sugar: 6,
          sodium: 890
        },
        tags: ['grilled', 'pork', 'noodles', 'hanoi'],
        author_id: 'admin',
        is_public: true,
        rating: 4.7,
        rating_count: 189,
        likes_count: 156,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'recipe-004',
        name: 'Canh Chua Cá',
        description: 'Canh chua cá với cà chua, dứa, đậu bắp chua ngọt',
        instructions: `
1. Sơ chế cá, cắt miếng vừa ăn
2. Phi thơm hành tỏi
3. Cho cà chua vào xào
4. Đổ nước, nêm gia vị
5. Cho cá vào nấu chín
        `,
        prep_time: 15,
        cook_time: 20,
        servings: 4,
        difficulty_level: 2,
        cuisine_type: 'vietnamese',
        meal_type: [2, 3], // lunch, dinner
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
        images: [],
        ingredients: [
          { ingredient_id: 'ing-009', amount: 500, unit: 'g', name: 'Cá thu' },
          { ingredient_id: 'ing-014', amount: 200, unit: 'g', name: 'Cà chua' },
          { ingredient_id: 'ing-021', amount: 150, unit: 'g', name: 'Dứa' },
        ],
        nutrition: {
          calories: 180,
          protein: 22,
          carbs: 12,
          fat: 5,
          fiber: 2,
          sugar: 8,
          sodium: 680
        },
        tags: ['soup', 'fish', 'sour', 'southern'],
        author_id: 'admin',
        is_public: true,
        rating: 4.5,
        rating_count: 134,
        likes_count: 98,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'recipe-005',
        name: 'Gỏi Cuốn Tôm Thịt',
        description: 'Gỏi cuốn tươi mát với tôm, thịt heo và rau thơm',
        instructions: `
1. Luộc tôm và thịt heo
2. Chuẩn bị rau sống
3. Ngâm bánh tráng
4. Cuốn gọn các nguyên liệu
5. Ăn kèm nước mắm pha
        `,
        prep_time: 25,
        cook_time: 15,
        servings: 3,
        difficulty_level: 2,
        cuisine_type: 'vietnamese',
        meal_type: [1, 4], // breakfast, snack
        image: 'https://images.unsplash.com/photo-1559567780-e64b0a2b6c01?w=800',
        images: [],
        ingredients: [
          { ingredient_id: 'ing-011', amount: 200, unit: 'g', name: 'Tôm sú' },
          { ingredient_id: 'ing-006', amount: 150, unit: 'g', name: 'Thịt heo' },
          { ingredient_id: 'ing-015', amount: 100, unit: 'g', name: 'Rau thơm' },
        ],
        nutrition: {
          calories: 150,
          protein: 18,
          carbs: 8,
          fat: 4,
          fiber: 2,
          sugar: 3,
          sodium: 420
        },
        tags: ['fresh', 'shrimp', 'roll', 'healthy'],
        author_id: 'admin',
        is_public: true,
        rating: 4.4,
        rating_count: 167,
        likes_count: 112,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'recipe-006',
        name: 'Cà Ri Gà',
        description: 'Cà ri gà đậm đà với nước cốt dừa và gia vị Ấn Độ',
        instructions: `
1. Thái gà miếng vừa ăn
2. Phi thơm hành tỏi
3. Cho gà vào xào
4. Thêm bột cà ri
5. Đổ nước cốt dừa ninh nhừ
        `,
        prep_time: 20,
        cook_time: 35,
        servings: 4,
        difficulty_level: 3,
        cuisine_type: 'vietnamese',
        meal_type: [2, 3], // lunch, dinner
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
        images: [],
        ingredients: [
          { ingredient_id: 'ing-007', amount: 600, unit: 'g', name: 'Thịt gà' },
          { ingredient_id: 'ing-018', amount: 200, unit: 'g', name: 'Khoai lang' },
          { ingredient_id: 'ing-017', amount: 150, unit: 'g', name: 'Cà rốt' },
        ],
        nutrition: {
          calories: 380,
          protein: 26,
          carbs: 18,
          fat: 22,
          fiber: 3,
          sugar: 8,
          sodium: 720
        },
        tags: ['curry', 'chicken', 'coconut', 'spicy'],
        author_id: 'admin',
        is_public: true,
        rating: 4.6,
        rating_count: 145,
        likes_count: 134,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    db.get('recipes').push(...vietnameseRecipes).write();
    console.log('✅ Vietnamese recipes data seeded successfully!');
  }
};

module.exports = { initRecipeData };
