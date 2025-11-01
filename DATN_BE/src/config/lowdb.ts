const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
import path from 'path';
import fs from 'fs';

// Tạo thư mục data nếu chưa có
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Interface cho database schema
interface FileRecord {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
}

interface Ingredient {
  id: string;
  name: string;
  category: string;
  season: string;
  price: number;
  unit: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    potassium: number;
    vitaminC: number;
    calcium: number;
    iron: number;
  };
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  cuisine: string;
  category: string;
  tags: string[];
  ingredients: Array<{
    ingredientId: string;
    quantity: number;
    unit: string;
  }>;
  instructions: Array<{
    step: number;
    instruction: string;
    time?: number;
  }>;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Database {
  files: FileRecord[];
  recipes: Recipe[];
  ingredients: Ingredient[];
}

// Tạo file database
const adapter = new FileSync(path.join(dataDir, 'fileStorage.json'));
const db = low(adapter);

// Khởi tạo cấu trúc database
db.defaults({
  files: [],
  recipes: [],
  ingredients: []
}).write();

export default db;
export type { FileRecord, Ingredient, Recipe, Database };
