export interface WeightEntry {
  date: string; // "YYYY-MM-DD"
  weight: number;
  bmi: number;
}

export interface WaterEntry {
  date: string; // "YYYY-MM-DD"
  amount: number; // in ml
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  diseases: string[];
  allergies: string[];
  habits: string;
  activityLevel: 'low' | 'moderate' | 'high';
  subscriptionTier: 'free' | 'extra' | 'plus' | 'unlimited';
  planEndDate?: string;
  role?: 'admin' | 'user';
  likedIngredients?: string[];
  dislikedIngredients?: string[];
  weightHistory?: WeightEntry[];
  waterHistory?: WaterEntry[];
  createdAt: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  vitamins?: {
    vitaminA?: string;
    vitaminC?: string;
    vitaminD?: string;
    calcium?: string;
    iron?: string;
    potassium?: string;
  };
}

export interface HealthTip {
  title: string;
  content: string;
  category: 'nutrition' | 'lifestyle' | 'warning';
  icon?: string;
}

export interface MealPlan {
  id?: string;
  userId: string;
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  nutrition?: {
    breakfast: NutritionInfo;
    lunch: NutritionInfo;
    dinner: NutritionInfo;
    snacks: NutritionInfo;
  };
  ingredients?: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  aiTips: string;
  shouldAvoid: string[];
  shouldEat: string[];
  ratings?: {
    [mealType: string]: {
      rating: number;
      feedback?: string;
      createdAt?: string;
    };
  };
  createdAt: string;
}

export interface ComplianceLog {
  id?: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  status: 'followed' | 'skipped' | 'modified';
  timestamp: string;
  mood?: 'happy' | 'calm' | 'tired' | 'stressed' | 'anxious' | 'depressed';
  moodNote?: string;
}

export interface Disease {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl?: string;
  shouldEat: string[];
  shouldAvoid: string[];
  sampleMenu: string[];
}
