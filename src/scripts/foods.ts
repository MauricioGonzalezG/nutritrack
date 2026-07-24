import type { Food } from './types';

/**
 * Base de datos de alimentos comunes.
 * Valores nutricionales aproximados por porción indicada.
 * satFat = grasa saturada (g) · fiber = fibra (g) · sugar = azúcares (g)
 */
export const FOODS: Food[] = [
  // Frutas
  { id: 'manzana', name: 'Manzana', emoji: '🍎', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, satFat: 0, fiber: 4.4, sugar: 19, serving: '1 unidad (180 g)' },
  { id: 'banana', name: 'Banana', emoji: '🍌', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, satFat: 0.1, fiber: 3.1, sugar: 14, serving: '1 unidad (120 g)' },
  { id: 'naranja', name: 'Naranja', emoji: '🍊', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, satFat: 0, fiber: 3.1, sugar: 12, serving: '1 unidad (130 g)' },
  { id: 'fresas', name: 'Fresas', emoji: '🍓', calories: 49, protein: 1, carbs: 12, fat: 0.5, satFat: 0, fiber: 3, sugar: 7, serving: '1 taza (150 g)' },
  { id: 'aguacate', name: 'Aguacate', emoji: '🥑', calories: 240, protein: 3, carbs: 13, fat: 22, satFat: 3.2, fiber: 10, sugar: 1, serving: '1 unidad (150 g)' },
  { id: 'uvas', name: 'Uvas', emoji: '🍇', calories: 104, protein: 1.1, carbs: 27, fat: 0.2, satFat: 0.1, fiber: 1.4, sugar: 23, serving: '1 taza (150 g)' },
  { id: 'sandia', name: 'Sandía', emoji: '🍉', calories: 46, protein: 0.9, carbs: 11.5, fat: 0.2, satFat: 0, fiber: 0.6, sugar: 9, serving: '1 taza (150 g)' },

  // Proteínas
  { id: 'huevo', name: 'Huevo', emoji: '🥚', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, satFat: 1.6, fiber: 0, sugar: 0.6, serving: '1 unidad (50 g)' },
  { id: 'pollo', name: 'Pechuga de pollo', emoji: '🍗', calories: 165, protein: 31, carbs: 0, fat: 3.6, satFat: 1, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'salmon', name: 'Salmón', emoji: '🐟', calories: 208, protein: 22, carbs: 0, fat: 13, satFat: 3.1, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'atun', name: 'Atún (enlatado)', emoji: '🥫', calories: 116, protein: 26, carbs: 0, fat: 1, satFat: 0.3, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'carne-res', name: 'Carne de res magra', emoji: '🥩', calories: 250, protein: 26, carbs: 0, fat: 15, satFat: 6, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'cerdo', name: 'Lomo de cerdo', emoji: '🍖', calories: 242, protein: 27, carbs: 0, fat: 14, satFat: 5, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'jamon', name: 'Jamón', emoji: '🥓', calories: 145, protein: 21, carbs: 1.5, fat: 6, satFat: 2, fiber: 0, sugar: 1, serving: '100 g' },
  { id: 'tofu', name: 'Tofu', emoji: '⬜', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, satFat: 0.7, fiber: 0.3, sugar: 0.7, serving: '100 g' },

  // Lácteos
  { id: 'leche', name: 'Leche entera', emoji: '🥛', calories: 149, protein: 8, carbs: 12, fat: 8, satFat: 4.6, fiber: 0, sugar: 12, serving: '1 taza (240 ml)' },
  { id: 'yogur-griego', name: 'Yogur griego', emoji: '🍶', calories: 100, protein: 17, carbs: 6, fat: 0.7, satFat: 0.4, fiber: 0, sugar: 6, serving: '1 envase (170 g)' },
  { id: 'queso', name: 'Queso', emoji: '🧀', calories: 113, protein: 7, carbs: 0.4, fat: 9, satFat: 6, fiber: 0, sugar: 0.1, serving: '1 loncha (28 g)' },
  { id: 'mantequilla', name: 'Mantequilla', emoji: '🧈', calories: 102, protein: 0.1, carbs: 0, fat: 11.5, satFat: 7.3, fiber: 0, sugar: 0, serving: '1 cda (14 g)' },

  // Carbohidratos / granos
  { id: 'arroz', name: 'Arroz blanco (cocido)', emoji: '🍚', calories: 205, protein: 4.3, carbs: 45, fat: 0.4, satFat: 0.1, fiber: 0.6, sugar: 0.1, serving: '1 taza (160 g)' },
  { id: 'pasta', name: 'Pasta (cocida)', emoji: '🍝', calories: 220, protein: 8, carbs: 43, fat: 1.3, satFat: 0.2, fiber: 2.5, sugar: 0.8, serving: '1 taza (140 g)' },
  { id: 'pan-blanco', name: 'Pan blanco', emoji: '🍞', calories: 79, protein: 2.7, carbs: 15, fat: 1, satFat: 0.2, fiber: 0.7, sugar: 1.5, serving: '1 rebanada (30 g)' },
  { id: 'pan-integral', name: 'Pan integral', emoji: '🥖', calories: 81, protein: 4, carbs: 14, fat: 1.1, satFat: 0.3, fiber: 1.9, sugar: 1.4, serving: '1 rebanada (32 g)' },
  { id: 'avena', name: 'Avena', emoji: '🥣', calories: 150, protein: 5, carbs: 27, fat: 2.5, satFat: 0.5, fiber: 4, sugar: 0.4, serving: '½ taza (40 g)' },
  { id: 'quinoa', name: 'Quinoa (cocida)', emoji: '🌾', calories: 222, protein: 8, carbs: 39, fat: 3.6, satFat: 0.5, fiber: 5.2, sugar: 1.6, serving: '1 taza (185 g)' },
  { id: 'papa', name: 'Papa (hervida)', emoji: '🥔', calories: 130, protein: 3, carbs: 30, fat: 0.2, satFat: 0.1, fiber: 3, sugar: 1.6, serving: '1 unidad (150 g)' },
  { id: 'batata', name: 'Batata', emoji: '🍠', calories: 112, protein: 2, carbs: 26, fat: 0.1, satFat: 0, fiber: 3.9, sugar: 7.4, serving: '1 unidad (130 g)' },
  { id: 'tortilla', name: 'Tortilla de maíz', emoji: '🫓', calories: 52, protein: 1.4, carbs: 11, fat: 0.7, satFat: 0.1, fiber: 1.5, sugar: 0.2, serving: '1 unidad (24 g)' },
  { id: 'cereal', name: 'Cereal de desayuno', emoji: '🥡', calories: 110, protein: 2, carbs: 24, fat: 1, satFat: 0.2, fiber: 1, sugar: 10, serving: '1 taza (30 g)' },

  // Legumbres y frutos secos
  { id: 'frijoles', name: 'Frijoles negros', emoji: '🫘', calories: 132, protein: 8.9, carbs: 24, fat: 0.5, satFat: 0.1, fiber: 7.5, sugar: 0.3, serving: '½ taza (90 g)' },
  { id: 'lentejas', name: 'Lentejas (cocidas)', emoji: '🍲', calories: 115, protein: 9, carbs: 20, fat: 0.4, satFat: 0.1, fiber: 4, sugar: 0.9, serving: '½ taza (100 g)' },
  { id: 'almendras', name: 'Almendras', emoji: '🌰', calories: 164, protein: 6, carbs: 6, fat: 14, satFat: 1.1, fiber: 3.5, sugar: 1.2, serving: '28 g (~23 uds)' },
  { id: 'nueces', name: 'Nueces', emoji: '🥜', calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5, satFat: 1.7, fiber: 1.9, sugar: 0.7, serving: '28 g (~14 mitades)' },
  { id: 'mantequilla-mani', name: 'Mantequilla de maní', emoji: '🥜', calories: 188, protein: 8, carbs: 6, fat: 16, satFat: 3, fiber: 1.8, sugar: 3, serving: '2 cdas (32 g)' },

  // Verduras
  { id: 'brocoli', name: 'Brócoli', emoji: '🥦', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, satFat: 0.1, fiber: 3.9, sugar: 2.6, serving: '1 taza (150 g)' },
  { id: 'ensalada', name: 'Ensalada mixta', emoji: '🥗', calories: 35, protein: 2, carbs: 6, fat: 0.4, satFat: 0, fiber: 2, sugar: 1.5, serving: '2 tazas (100 g)' },
  { id: 'tomate', name: 'Tomate', emoji: '🍅', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, satFat: 0, fiber: 1.5, sugar: 3.2, serving: '1 unidad (120 g)' },
  { id: 'zanahoria', name: 'Zanahoria', emoji: '🥕', calories: 25, protein: 0.6, carbs: 6, fat: 0.1, satFat: 0, fiber: 1.7, sugar: 2.9, serving: '1 unidad (60 g)' },
  { id: 'espinaca', name: 'Espinaca', emoji: '🥬', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, satFat: 0.1, fiber: 2.2, sugar: 0.4, serving: '100 g' },
  { id: 'maiz', name: 'Maíz dulce', emoji: '🌽', calories: 96, protein: 3.4, carbs: 21, fat: 1.5, satFat: 0.2, fiber: 2, sugar: 4.5, serving: '½ taza (82 g)' },

  // Comidas preparadas / rápidas
  { id: 'pizza', name: 'Pizza (porción)', emoji: '🍕', calories: 285, protein: 12, carbs: 36, fat: 10, satFat: 4.5, fiber: 2.5, sugar: 3.8, serving: '1 porción (107 g)' },
  { id: 'hamburguesa', name: 'Hamburguesa', emoji: '🍔', calories: 354, protein: 20, carbs: 29, fat: 17, satFat: 6.5, fiber: 1.5, sugar: 6, serving: '1 unidad (170 g)' },
  { id: 'tacos', name: 'Taco', emoji: '🌮', calories: 210, protein: 9, carbs: 21, fat: 10, satFat: 3.5, fiber: 3, sugar: 1.5, serving: '1 unidad (100 g)' },
  { id: 'sushi', name: 'Sushi (roll)', emoji: '🍣', calories: 255, protein: 9, carbs: 38, fat: 7, satFat: 1.5, fiber: 1, sugar: 7, serving: '6 piezas (180 g)' },
  { id: 'sandwich', name: 'Sándwich de pollo', emoji: '🥪', calories: 310, protein: 18, carbs: 30, fat: 12, satFat: 3, fiber: 2, sugar: 4, serving: '1 unidad (180 g)' },
  { id: 'burrito', name: 'Burrito', emoji: '🌯', calories: 430, protein: 18, carbs: 55, fat: 15, satFat: 6, fiber: 4, sugar: 2, serving: '1 unidad (250 g)' },
  { id: 'papas-fritas', name: 'Papas fritas', emoji: '🍟', calories: 365, protein: 4, carbs: 48, fat: 17, satFat: 2.5, fiber: 4, sugar: 0.5, serving: 'porción mediana (117 g)' },
  { id: 'nuggets', name: 'Nuggets de pollo', emoji: '🍗', calories: 296, protein: 15, carbs: 16, fat: 18, satFat: 3, fiber: 1, sugar: 0.5, serving: '6 piezas (100 g)' },

  // Snacks y dulces
  { id: 'chocolate', name: 'Chocolate', emoji: '🍫', calories: 210, protein: 3, carbs: 24, fat: 12, satFat: 7, fiber: 2.5, sugar: 20, serving: '1 barra (40 g)' },
  { id: 'helado', name: 'Helado de vainilla', emoji: '🍦', calories: 273, protein: 4.6, carbs: 31, fat: 14, satFat: 9, fiber: 0.5, sugar: 28, serving: '1 taza (130 g)' },
  { id: 'galletas', name: 'Galletas', emoji: '🍪', calories: 150, protein: 2, carbs: 20, fat: 7, satFat: 2.5, fiber: 0.5, sugar: 10, serving: '3 unidades (30 g)' },
  { id: 'donut', name: 'Dona glaseada', emoji: '🍩', calories: 260, protein: 3, carbs: 31, fat: 14, satFat: 6, fiber: 0.8, sugar: 13, serving: '1 unidad (60 g)' },
  { id: 'palomitas', name: 'Palomitas', emoji: '🍿', calories: 106, protein: 3, carbs: 21, fat: 1.2, satFat: 0.2, fiber: 3.6, sugar: 0.1, serving: '3 tazas (24 g)' },
  { id: 'chips', name: 'Papas de bolsa', emoji: '🥨', calories: 152, protein: 2, carbs: 15, fat: 10, satFat: 1.5, fiber: 1.3, sugar: 0.5, serving: '28 g (~15 uds)' },
  { id: 'brownie', name: 'Brownie', emoji: '🍰', calories: 227, protein: 3, carbs: 36, fat: 9, satFat: 3, fiber: 1, sugar: 20, serving: '1 unidad (56 g)' },

  // Bebidas
  { id: 'cafe', name: 'Café negro', emoji: '☕', calories: 2, protein: 0.3, carbs: 0, fat: 0, satFat: 0, fiber: 0, sugar: 0, serving: '1 taza (240 ml)' },
  { id: 'cafe-leche', name: 'Café con leche', emoji: '☕', calories: 77, protein: 4, carbs: 6, fat: 4, satFat: 2.5, fiber: 0, sugar: 6, serving: '1 taza (240 ml)' },
  { id: 'jugo-naranja', name: 'Jugo de naranja', emoji: '🧃', calories: 112, protein: 1.7, carbs: 26, fat: 0.5, satFat: 0.1, fiber: 0.5, sugar: 21, serving: '1 taza (240 ml)' },
  { id: 'refresco', name: 'Refresco (cola)', emoji: '🥤', calories: 150, protein: 0, carbs: 39, fat: 0, satFat: 0, fiber: 0, sugar: 39, serving: '1 lata (355 ml)' },
  { id: 'cerveza', name: 'Cerveza', emoji: '🍺', calories: 153, protein: 1.6, carbs: 13, fat: 0, satFat: 0, fiber: 0, sugar: 0, serving: '1 lata (355 ml)' },
  { id: 'vino', name: 'Vino tinto', emoji: '🍷', calories: 125, protein: 0.1, carbs: 4, fat: 0, satFat: 0, fiber: 0, sugar: 1, serving: '1 copa (150 ml)' },
  { id: 'batido-proteina', name: 'Batido de proteína', emoji: '🥤', calories: 160, protein: 30, carbs: 3, fat: 2, satFat: 0.5, fiber: 1, sugar: 2, serving: '1 porción (35 g)' },
  { id: 'te', name: 'Té (sin azúcar)', emoji: '🍵', calories: 2, protein: 0, carbs: 0.5, fat: 0, satFat: 0, fiber: 0, sugar: 0, serving: '1 taza (240 ml)' },

  // Extras comunes
  { id: 'aceite-oliva', name: 'Aceite de oliva', emoji: '🫒', calories: 119, protein: 0, carbs: 0, fat: 13.5, satFat: 1.9, fiber: 0, sugar: 0, serving: '1 cda (14 g)' },
  { id: 'miel', name: 'Miel', emoji: '🍯', calories: 64, protein: 0, carbs: 17, fat: 0, satFat: 0, fiber: 0, sugar: 17, serving: '1 cda (21 g)' },
  { id: 'azucar', name: 'Azúcar', emoji: '🍬', calories: 49, protein: 0, carbs: 13, fat: 0, satFat: 0, fiber: 0, sugar: 13, serving: '1 cda (13 g)' },
  { id: 'granola', name: 'Granola', emoji: '🥣', calories: 200, protein: 5, carbs: 32, fat: 6, satFat: 1, fiber: 3.5, sugar: 12, serving: '½ taza (50 g)' },
  { id: 'hummus', name: 'Hummus', emoji: '🫙', calories: 70, protein: 2, carbs: 6, fat: 4, satFat: 0.6, fiber: 1.7, sugar: 0, serving: '2 cdas (28 g)' },
];

export function findFood(id: string): Food | undefined {
  return FOODS.find((f) => f.id === id);
}

export function searchFoods(query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOODS;
  return FOODS.filter((f) => f.name.toLowerCase().includes(q));
}
