export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProtocolIngredient {
  id: number;
  ingredient: Ingredient;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProtocolStepIngredient {
  id: number;
  ingredient: Ingredient;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface IngredientQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: Ingredient[];
}
