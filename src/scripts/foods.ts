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

  // ================ FRUTAS (Colombia / Andinas) ================
  { id: 'lulo', name: 'Lulo', emoji: '🍈', calories: 25, protein: 0.5, carbs: 6, fat: 0.1, satFat: 0, fiber: 2.5, sugar: 4, serving: '1 unidad (80 g)' },
  { id: 'tomate-arbol', name: 'Tomate de árbol', emoji: '🍅', calories: 30, protein: 1, carbs: 7, fat: 0.2, satFat: 0, fiber: 2.5, sugar: 4, serving: '1 unidad (50 g)' },
  { id: 'granadilla', name: 'Granadilla', emoji: '🍈', calories: 50, protein: 1, carbs: 11, fat: 0.3, satFat: 0, fiber: 2, sugar: 11, serving: '1 unidad (50 g)' },
  { id: 'curuba', name: 'Curuba', emoji: '🍈', calories: 25, protein: 0.5, carbs: 6, fat: 0.1, satFat: 0, fiber: 3, sugar: 4, serving: '1 unidad (50 g)' },
  { id: 'gulupa', name: 'Gulupa', emoji: '🍈', calories: 40, protein: 1, carbs: 9, fat: 0.2, satFat: 0, fiber: 6, sugar: 6, serving: '1 unidad (60 g)' },
  { id: 'pitahaya', name: 'Pitahaya', emoji: '🪷', calories: 30, protein: 0.5, carbs: 7, fat: 0.1, satFat: 0, fiber: 3, sugar: 8, serving: '½ unidad (100 g)' },
  { id: 'mora', name: 'Mora andina', emoji: '🫐', calories: 25, protein: 0.5, carbs: 6, fat: 0.2, satFat: 0, fiber: 5, sugar: 4, serving: '½ taza (60 g)' },
  { id: 'uchuva', name: 'Uchuva (golden berry)', emoji: '🍒', calories: 27, protein: 0.7, carbs: 6, fat: 0.4, satFat: 0, fiber: 4, sugar: 11, serving: '10 unidades (50 g)' },
  { id: 'feijoa', name: 'Feijoa', emoji: '🍏', calories: 28, protein: 0.5, carbs: 6, fat: 0.2, satFat: 0, fiber: 7, sugar: 3, serving: '2 unidades (80 g)' },
  { id: 'carambolo', name: 'Carambolo', emoji: '⭐', calories: 16, protein: 0.5, carbs: 4, fat: 0.1, satFat: 0, fiber: 1.5, sugar: 2, serving: '1 unidad (60 g)' },
  { id: 'papaya', name: 'Papaya', emoji: '🍈', calories: 22, protein: 0.3, carbs: 5, fat: 0.1, satFat: 0, fiber: 1.2, sugar: 3.5, serving: '1 taza (120 g)' },
  { id: 'pina', name: 'Piña', emoji: '🍍', calories: 30, protein: 0.3, carbs: 7.5, fat: 0.1, satFat: 0, fiber: 1.4, sugar: 7, serving: '1 taza (120 g)' },
  { id: 'mango', name: 'Mango', emoji: '🥭', calories: 60, protein: 0.5, carbs: 15, fat: 0.3, satFat: 0, fiber: 1.5, sugar: 14, serving: '1 taza (120 g)' },
  { id: 'guanabana', name: 'Guanábana', emoji: '🥝', calories: 33, protein: 0.6, carbs: 8, fat: 0.2, satFat: 0, fiber: 1.6, sugar: 7, serving: '½ taza (80 g)' },
  { id: 'chontaduro', name: 'Chontaduro (cocido)', emoji: '🌴', calories: 180, protein: 3, carbs: 22, fat: 9, satFat: 2, fiber: 5, sugar: 5, serving: '½ taza (100 g)' },
  { id: 'coco', name: 'Coco fresco', emoji: '🥥', calories: 160, protein: 1.5, carbs: 7, fat: 15, satFat: 13, fiber: 4, sugar: 4, serving: '½ unidad (50 g)' },
  { id: 'kiwi', name: 'Kiwi', emoji: '🥝', calories: 25, protein: 0.5, carbs: 6, fat: 0.2, satFat: 0, fiber: 2.5, sugar: 4, serving: '1 unidad (60 g)' },
  { id: 'arandanos', name: 'Arándanos', emoji: '🫐', calories: 28, protein: 0.4, carbs: 7, fat: 0.2, satFat: 0, fiber: 1.6, sugar: 5, serving: '½ taza (70 g)' },
  { id: 'pera', name: 'Pera', emoji: '🍐', calories: 50, protein: 0.3, carbs: 12, fat: 0.1, satFat: 0, fiber: 3, sugar: 9, serving: '1 unidad (120 g)' },
  { id: 'ciruela', name: 'Ciruela', emoji: '🍑', calories: 30, protein: 0.5, carbs: 8, fat: 0.2, satFat: 0, fiber: 1, sugar: 7, serving: '2 unidades (80 g)' },
  { id: 'durazno', name: 'Durazno', emoji: '🍑', calories: 30, protein: 0.6, carbs: 7, fat: 0.1, satFat: 0, fiber: 1.2, sugar: 6, serving: '1 unidad (80 g)' },
  { id: 'mandarina', name: 'Mandarina', emoji: '🍊', calories: 50, protein: 0.7, carbs: 12, fat: 0.2, satFat: 0, fiber: 1.8, sugar: 9, serving: '1 unidad (100 g)' },
  { id: 'maracuya', name: 'Maracuyá', emoji: '🟣', calories: 50, protein: 1, carbs: 12, fat: 0.3, satFat: 0, fiber: 5, sugar: 8, serving: '1 unidad (40 g)' },
  { id: 'frutilla', name: 'Frutilla', emoji: '🍓', calories: 30, protein: 0.5, carbs: 7, fat: 0.2, satFat: 0, fiber: 2, sugar: 5, serving: '1 taza (120 g)' },

  // ================ VERDURAS Y HORTALIZAS ================
  { id: 'pepino', name: 'Pepino', emoji: '🥒', calories: 12, protein: 0.5, carbs: 2, fat: 0.1, satFat: 0, fiber: 0.8, sugar: 1, serving: '1 taza (100 g)' },
  { id: 'lechuga', name: 'Lechuga', emoji: '🥬', calories: 8, protein: 0.5, carbs: 1.5, fat: 0.1, satFat: 0, fiber: 0.8, sugar: 0.5, serving: '2 tazas (50 g)' },
  { id: 'apio', name: 'Apio', emoji: '🥬', calories: 10, protein: 0.5, carbs: 2, fat: 0.1, satFat: 0, fiber: 1, sugar: 1, serving: '1 taza (100 g)' },
  { id: 'ahuyama', name: 'Ahuyama (calabaza)', emoji: '🎃', calories: 26, protein: 1, carbs: 7, fat: 0.1, satFat: 0, fiber: 1, sugar: 3, serving: '1 taza (150 g)' },
  { id: 'calabacin', name: 'Calabacín (zucchini)', emoji: '🥒', calories: 17, protein: 1, carbs: 4, fat: 0.2, satFat: 0, fiber: 1, sugar: 2, serving: '1 taza (120 g)' },
  { id: 'arveja-verde', name: 'Arveja verde cocida', emoji: '🟢', calories: 80, protein: 5, carbs: 14, fat: 0.3, satFat: 0, fiber: 5, sugar: 6, serving: '½ taza (80 g)' },
  { id: 'habas', name: 'Habas tiernas', emoji: '🟢', calories: 90, protein: 6, carbs: 13, fat: 0.4, satFat: 0, fiber: 5, sugar: 3, serving: '½ taza (80 g)' },
  { id: 'col', name: 'Col (repollo)', emoji: '🥬', calories: 22, protein: 1, carbs: 5, fat: 0.1, satFat: 0, fiber: 2, sugar: 3, serving: '1 taza (90 g)' },
  { id: 'acelgas', name: 'Acelgas', emoji: '🥬', calories: 19, protein: 1.6, carbs: 4, fat: 0.2, satFat: 0, fiber: 1.6, sugar: 1, serving: '1 taza (100 g)' },
  { id: 'rabanos', name: 'Rábanos', emoji: '🥕', calories: 16, protein: 0.7, carbs: 3.4, fat: 0.1, satFat: 0, fiber: 1.6, sugar: 1.8, serving: '1 taza (100 g)' },
  { id: 'pimenton', name: 'Pimentón', emoji: '🫑', calories: 24, protein: 0.9, carbs: 6, fat: 0.2, satFat: 0, fiber: 2, sugar: 3, serving: '1 unidad (100 g)' },
  { id: 'cebolla-huevo', name: 'Cebolla de huevo', emoji: '🧅', calories: 32, protein: 1, carbs: 7, fat: 0.1, satFat: 0, fiber: 1.5, sugar: 3, serving: '½ unidad (60 g)' },
  { id: 'cebolla-larga', name: 'Cebolla larga', emoji: '🧅', calories: 25, protein: 1, carbs: 6, fat: 0.1, satFat: 0, fiber: 2, sugar: 2, serving: '½ taza (50 g)' },
  { id: 'ajo', name: 'Ajo', emoji: '🧄', calories: 4, protein: 0.2, carbs: 1, fat: 0, satFat: 0, fiber: 0.1, sugar: 0, serving: '1 diente (3 g)' },
  { id: 'cilantro', name: 'Cilantro', emoji: '🌿', calories: 4, protein: 0.2, carbs: 0.7, fat: 0, satFat: 0, fiber: 0.3, sugar: 0, serving: '10 g' },
  { id: 'perejil', name: 'Perejil', emoji: '🌿', calories: 6, protein: 0.5, carbs: 1, fat: 0.1, satFat: 0, fiber: 0.5, sugar: 0.2, serving: '10 g' },
  { id: 'chayote', name: 'Chayote', emoji: '🥒', calories: 25, protein: 0.8, carbs: 6, fat: 0.1, satFat: 0, fiber: 2, sugar: 1.5, serving: '1 unidad (120 g)' },
  { id: 'champinones', name: 'Champiñones', emoji: '🍄', calories: 22, protein: 3, carbs: 3, fat: 0.3, satFat: 0, fiber: 1, sugar: 2, serving: '1 taza (100 g)' },
  { id: 'berenjena', name: 'Berenjena', emoji: '🍆', calories: 25, protein: 1, carbs: 6, fat: 0.2, satFat: 0, fiber: 3, sugar: 3, serving: '1 taza (100 g)' },
  { id: 'remolacha', name: 'Remolacha', emoji: '🥗', calories: 43, protein: 1.6, carbs: 10, fat: 0.2, satFat: 0, fiber: 2.8, sugar: 7, serving: '1 unidad (80 g)' },

  // ================ TUBÉRCULOS ANDINOS ================
  { id: 'papa-comun', name: 'Papa común cocida', emoji: '🥔', calories: 130, protein: 3, carbs: 30, fat: 0.1, satFat: 0, fiber: 3, sugar: 1.5, serving: '1 unidad (150 g)' },
  { id: 'papa-criolla', name: 'Papa criolla cocida', emoji: '🥔', calories: 130, protein: 2.5, carbs: 28, fat: 0.1, satFat: 0, fiber: 3, sugar: 1.5, serving: '1 taza (150 g)' },
  { id: 'yuca', name: 'Yuca cocida', emoji: '🥔', calories: 165, protein: 1.5, carbs: 38, fat: 0.3, satFat: 0, fiber: 2, sugar: 1.5, serving: '1 trozo (100 g)' },
  { id: 'arracacha', name: 'Arracacha cocida', emoji: '🥔', calories: 100, protein: 1.2, carbs: 23, fat: 0.2, satFat: 0, fiber: 2, sugar: 3, serving: '1 taza (120 g)' },
  { id: 'chuguas', name: 'Chuguas (ullucos)', emoji: '🥔', calories: 60, protein: 1.5, carbs: 13, fat: 0.1, satFat: 0, fiber: 3, sugar: 1, serving: '1 taza cocida (100 g)' },
  { id: 'cubios', name: 'Cubios', emoji: '🥔', calories: 65, protein: 1.5, carbs: 14, fat: 0.1, satFat: 0, fiber: 3, sugar: 2, serving: '1 taza (100 g)' },
  { id: 'bore', name: 'Bore (cocido)', emoji: '🥔', calories: 75, protein: 1.5, carbs: 17, fat: 0.1, satFat: 0, fiber: 2, sugar: 1, serving: '1 taza (100 g)' },

  // ================ CEREALES Y GRANOS ================
  { id: 'arroz-integral', name: 'Arroz integral', emoji: '🌾', calories: 215, protein: 5, carbs: 45, fat: 1.7, satFat: 0.3, fiber: 3.5, sugar: 0.4, serving: '1 taza (160 g)' },
  { id: 'arepa-maiz', name: 'Arepa de maíz (precocida)', emoji: '🫓', calories: 220, protein: 4, carbs: 47, fat: 1, satFat: 0.2, fiber: 2, sugar: 0.5, serving: '2 unidades (120 g)' },
  { id: 'cebada', name: 'Cebada perlada', emoji: '🌾', calories: 200, protein: 4, carbs: 44, fat: 0.7, satFat: 0.1, fiber: 6, sugar: 0.3, serving: '1 taza (160 g)' },
  { id: 'centeno', name: 'Centeno', emoji: '🌾', calories: 170, protein: 5, carbs: 36, fat: 0.8, satFat: 0.1, fiber: 4, sugar: 0.5, serving: '½ taza (80 g)' },
  { id: 'harina-trigo', name: 'Harina de trigo', emoji: '🌾', calories: 110, protein: 3, carbs: 23, fat: 0.4, satFat: 0, fiber: 0.8, sugar: 0.1, serving: '¼ taza (30 g)' },

  // ================ LEGUMBRES Y FRUTOS SECOS ================
  { id: 'garbanzo', name: 'Garbanzo cocido', emoji: '🫘', calories: 165, protein: 9, carbs: 28, fat: 2.7, satFat: 0.3, fiber: 6.5, sugar: 4, serving: '½ taza (80 g)' },
  { id: 'frijol-rojo', name: 'Frijol rojo cocido', emoji: '🫘', calories: 130, protein: 8, carbs: 23, fat: 0.5, satFat: 0.1, fiber: 7, sugar: 0.4, serving: '½ taza (90 g)' },
  { id: 'frijol-blanco', name: 'Frijol blanco cocido', emoji: '🫘', calories: 130, protein: 8, carbs: 23, fat: 0.5, satFat: 0.1, fiber: 6, sugar: 0.3, serving: '½ taza (90 g)' },
  { id: 'soja', name: 'Soja cocida', emoji: '🫘', calories: 150, protein: 14, carbs: 8, fat: 7, satFat: 1, fiber: 5, sugar: 1, serving: '½ taza (90 g)' },
  { id: 'mani', name: 'Maní tostado', emoji: '🥜', calories: 165, protein: 7, carbs: 5, fat: 14, satFat: 2.4, fiber: 2.5, sugar: 1, serving: '30 g' },
  { id: 'pistachos', name: 'Pistachos', emoji: '🥜', calories: 160, protein: 6, carbs: 8, fat: 13, satFat: 1.7, fiber: 3, sugar: 2, serving: '28 g (~49 uds)' },
  { id: 'castanas-brasil', name: 'Castañas del Brasil', emoji: '🥜', calories: 185, protein: 4, carbs: 3, fat: 19, satFat: 4.5, fiber: 2.5, sugar: 0.7, serving: '28 g (~6 uds)' },
  { id: 'avellana', name: 'Avellana', emoji: '🥜', calories: 180, protein: 4, carbs: 5, fat: 18, satFat: 1.5, fiber: 2.5, sugar: 1, serving: '28 g (~12 uds)' },
  { id: 'pinones', name: 'Piñones', emoji: '🌰', calories: 190, protein: 4, carbs: 4, fat: 19, satFat: 1.5, fiber: 1, sugar: 1, serving: '28 g (~50 uds)' },
  { id: 'chia', name: 'Semillas de chía', emoji: '🌱', calories: 70, protein: 2, carbs: 6, fat: 5, satFat: 0.5, fiber: 5, sugar: 0, serving: '1 cda (12 g)' },
  { id: 'linaza', name: 'Linaza molida', emoji: '🌱', calories: 55, protein: 2, carbs: 3, fat: 4.5, satFat: 0.4, fiber: 3, sugar: 0.2, serving: '1 cda (10 g)' },
  { id: 'semillas-girasol', name: 'Semillas de girasol', emoji: '🌻', calories: 165, protein: 6, carbs: 7, fat: 14, satFat: 1.5, fiber: 3, sugar: 0.7, serving: '28 g' },

  // ================ PROTEÍNAS (carnes, aves, pescado) ================
  { id: 'trucha', name: 'Trucha arcoíris', emoji: '🐟', calories: 145, protein: 23, carbs: 0, fat: 6, satFat: 1.5, fiber: 0, sugar: 0, serving: '1 filete (120 g)' },
  { id: 'pajarilla', name: 'Pajarilla (bazo)', emoji: '🥩', calories: 100, protein: 18, carbs: 1, fat: 3, satFat: 1, fiber: 0, sugar: 0, serving: '100 g cocido' },
  { id: 'higado-res', name: 'Hígado de res', emoji: '🥩', calories: 175, protein: 27, carbs: 5, fat: 5, satFat: 1.6, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'corazon-res', name: 'Corazón de res', emoji: '🥩', calories: 165, protein: 28, carbs: 0.2, fat: 5, satFat: 1.6, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'pollo-pierna', name: 'Pierna de pollo', emoji: '🍗', calories: 175, protein: 24, carbs: 0, fat: 8, satFat: 2, fiber: 0, sugar: 0, serving: '1 unidad (150 g)' },
  { id: 'pavo', name: 'Pavo', emoji: '🦃', calories: 135, protein: 30, carbs: 0, fat: 1, satFat: 0.3, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'cordero', name: 'Cordero', emoji: '🥩', calories: 250, protein: 25, carbs: 0, fat: 17, satFat: 8, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'conejo', name: 'Conejo', emoji: '🐰', calories: 170, protein: 21, carbs: 0, fat: 8, satFat: 2.3, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'chiguiro', name: 'Chigüiro (capibara)', emoji: '🥩', calories: 150, protein: 24, carbs: 0, fat: 6, satFat: 2, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'sobrebarriga', name: 'Sobrebarriga', emoji: '🥩', calories: 240, protein: 22, carbs: 0, fat: 17, satFat: 7, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'bistec-res', name: 'Bistec de res', emoji: '🥩', calories: 220, protein: 27, carbs: 0, fat: 13, satFat: 5, fiber: 0, sugar: 0, serving: '1 bistec (150 g)' },
  { id: 'mollejas', name: 'Mollejas', emoji: '🥩', calories: 100, protein: 18, carbs: 0, fat: 3, satFat: 1, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'sardina', name: 'Sardina enlatada', emoji: '🐟', calories: 210, protein: 25, carbs: 0, fat: 11, satFat: 1.5, fiber: 0, sugar: 0, serving: '1 lata (90 g)' },
  { id: 'camaron', name: 'Camarón', emoji: '🦐', calories: 100, protein: 22, carbs: 0, fat: 1, satFat: 0.2, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'tilapia', name: 'Tilapia', emoji: '🐟', calories: 130, protein: 26, carbs: 0, fat: 2.7, satFat: 0.8, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'mojarra', name: 'Mojarra', emoji: '🐟', calories: 150, protein: 25, carbs: 0, fat: 5, satFat: 1, fiber: 0, sugar: 0, serving: '100 g' },

  // ================ EMBUTIDOS ================
  { id: 'chorizo-antioqueno', name: 'Chorizo antioqueño', emoji: '🌭', calories: 320, protein: 14, carbs: 4, fat: 28, satFat: 10, fiber: 0, sugar: 0, serving: '1 unidad (80 g)' },
  { id: 'longaniza', name: 'Longaniza', emoji: '🌭', calories: 300, protein: 13, carbs: 3, fat: 26, satFat: 9, fiber: 0, sugar: 0, serving: '1 unidad (80 g)' },
  { id: 'morcilla-sangre', name: 'Morcilla de sangre', emoji: '🌭', calories: 270, protein: 14, carbs: 1, fat: 23, satFat: 9, fiber: 0, sugar: 0, serving: '1 unidad (80 g)' },
  { id: 'butifarra', name: 'Butifarra', emoji: '🌭', calories: 280, protein: 16, carbs: 2, fat: 23, satFat: 8, fiber: 0, sugar: 0, serving: '1 unidad (80 g)' },
  { id: 'tocineta', name: 'Tocineta (bacon)', emoji: '🥓', calories: 130, protein: 9, carbs: 0.4, fat: 10, satFat: 4, fiber: 0, sugar: 0, serving: '2 lonchas (28 g)' },
  { id: 'chicharron', name: 'Chicharrón', emoji: '🥓', calories: 500, protein: 18, carbs: 0, fat: 47, satFat: 17, fiber: 0, sugar: 0, serving: '100 g' },
  { id: 'chicharron-prensado', name: 'Chicharrón prensado', emoji: '🥓', calories: 100, protein: 5, carbs: 0, fat: 9, satFat: 3.5, fiber: 0, sugar: 0, serving: '30 g' },
  { id: 'salchicha', name: 'Salchicha de cerdo', emoji: '🌭', calories: 250, protein: 11, carbs: 3, fat: 22, satFat: 8, fiber: 0, sugar: 1, serving: '1 unidad (80 g)' },
  { id: 'mortadela', name: 'Mortadela', emoji: '🥩', calories: 280, protein: 12, carbs: 3, fat: 24, satFat: 9, fiber: 0, sugar: 0, serving: '2 lonchas (60 g)' },

  // ================ LÁCTEOS ================
  { id: 'kumis', name: 'Kumis', emoji: '🥛', calories: 110, protein: 6, carbs: 13, fat: 4, satFat: 2.5, fiber: 0, sugar: 12, serving: '1 vaso (200 ml)' },
  { id: 'cuajada', name: 'Cuajada', emoji: '🧀', calories: 90, protein: 12, carbs: 3, fat: 3, satFat: 1.7, fiber: 0, sugar: 3, serving: '1 porción (100 g)' },
  { id: 'queso-paipa', name: 'Queso Paipa', emoji: '🧀', calories: 320, protein: 22, carbs: 2, fat: 26, satFat: 16, fiber: 0, sugar: 0, serving: '30 g' },
  { id: 'queso-doble-crema', name: 'Queso doble crema', emoji: '🧀', calories: 300, protein: 18, carbs: 1, fat: 25, satFat: 16, fiber: 0, sugar: 0, serving: '30 g' },
  { id: 'crema-leche', name: 'Crema de leche (nata)', emoji: '🥛', calories: 100, protein: 1, carbs: 1, fat: 10, satFat: 6, fiber: 0, sugar: 1, serving: '2 cdas (30 g)' },
  { id: 'leche-descremada', name: 'Leche descremada', emoji: '🥛', calories: 80, protein: 8, carbs: 12, fat: 0.3, satFat: 0.1, fiber: 0, sugar: 12, serving: '1 taza (240 ml)' },
  { id: 'leche-evaporada', name: 'Leche evaporada', emoji: '🥛', calories: 170, protein: 8, carbs: 12, fat: 9, satFat: 5.5, fiber: 0, sugar: 12, serving: '½ taza (120 ml)' },
  { id: 'leche-condensada', name: 'Leche condensada', emoji: '🥛', calories: 100, protein: 2, carbs: 17, fat: 3, satFat: 2, fiber: 0, sugar: 17, serving: '2 cdas (30 g)' },
  { id: 'suero', name: 'Suero costeño', emoji: '🧀', calories: 60, protein: 6, carbs: 2, fat: 3, satFat: 1.7, fiber: 0, sugar: 1, serving: '30 g' },

  // ================ PLATOS TÍPICOS ANDINOS ================
  { id: 'bandeja-paisa', name: 'Bandeja paisa', emoji: '🍛', calories: 1250, protein: 50, carbs: 130, fat: 60, satFat: 22, fiber: 18, sugar: 8, serving: '1 plato (700 g)' },
  { id: 'ajiaco', name: 'Ajiaco santafereño', emoji: '🍲', calories: 380, protein: 25, carbs: 50, fat: 10, satFat: 4, fiber: 6, sugar: 4, serving: '1 plato (350 g)' },
  { id: 'sancocho-pollo', name: 'Sancocho de pollo', emoji: '🍲', calories: 350, protein: 26, carbs: 30, fat: 12, satFat: 3.5, fiber: 4, sugar: 3, serving: '1 plato (350 g)' },
  { id: 'sancocho-res', name: 'Sancocho de res', emoji: '🍲', calories: 380, protein: 28, carbs: 28, fat: 15, satFat: 5, fiber: 4, sugar: 3, serving: '1 plato (350 g)' },
  { id: 'sancocho-pescado', name: 'Sancocho de pescado', emoji: '🍲', calories: 280, protein: 22, carbs: 28, fat: 7, satFat: 1.5, fiber: 4, sugar: 3, serving: '1 plato (350 g)' },
  { id: 'cuchuco', name: 'Cuchuco de trigo', emoji: '🍲', calories: 280, protein: 18, carbs: 40, fat: 6, satFat: 1.5, fiber: 7, sugar: 3, serving: '1 plato (300 g)' },
  { id: 'frijoles-antioquenos', name: 'Frijoles antioqueños', emoji: '🫘', calories: 260, protein: 12, carbs: 30, fat: 9, satFat: 2, fiber: 10, sugar: 2, serving: '1 taza (200 g)' },
  { id: 'frijolada-boyacense', name: 'Frijolada boyacense', emoji: '🫘', calories: 300, protein: 14, carbs: 30, fat: 12, satFat: 3.5, fiber: 12, sugar: 3, serving: '1 plato (300 g)' },
  { id: 'lechona', name: 'Lechona tolimense', emoji: '🍖', calories: 380, protein: 25, carbs: 30, fat: 18, satFat: 6.5, fiber: 2, sugar: 1, serving: '1 porción (200 g)' },
  { id: 'tamal-tolimense', name: 'Tamal tolimense', emoji: '🫔', calories: 450, protein: 16, carbs: 50, fat: 20, satFat: 8, fiber: 3, sugar: 2, serving: '1 unidad (250 g)' },
  { id: 'mute-santandereano', name: 'Mute santandereano', emoji: '🍲', calories: 380, protein: 20, carbs: 35, fat: 14, satFat: 4, fiber: 6, sugar: 3, serving: '1 plato (350 g)' },
  { id: 'mondongo', name: 'Mondongo (sopa)', emoji: '🍲', calories: 320, protein: 22, carbs: 22, fat: 14, satFat: 4, fiber: 3, sugar: 2, serving: '1 plato (300 g)' },
  { id: 'sudado-res', name: 'Sudado de res', emoji: '🥘', calories: 320, protein: 28, carbs: 15, fat: 15, satFat: 6, fiber: 3, sugar: 4, serving: '1 plato (300 g)' },
  { id: 'sudado-pollo', name: 'Sudado de pollo', emoji: '🥘', calories: 280, protein: 28, carbs: 15, fat: 10, satFat: 2.5, fiber: 3, sugar: 4, serving: '1 plato (300 g)' },
  { id: 'arroz-pollo', name: 'Arroz con pollo', emoji: '🍛', calories: 450, protein: 22, carbs: 60, fat: 12, satFat: 3, fiber: 3, sugar: 3, serving: '1 plato (350 g)' },
  { id: 'arroz-atollado', name: 'Arroz atollado', emoji: '🍛', calories: 420, protein: 18, carbs: 60, fat: 12, satFat: 3.5, fiber: 2, sugar: 2, serving: '1 plato (300 g)' },
  { id: 'lomo-cerdo-cerveza', name: 'Lomo de cerdo en cerveza', emoji: '🥩', calories: 350, protein: 28, carbs: 8, fat: 22, satFat: 8, fiber: 0.5, sugar: 2, serving: '1 porción (200 g)' },

  // ================ DESAYUNOS Y CALLEJEROS ================
  { id: 'calentado-paisa', name: 'Calentado paisa', emoji: '🍲', calories: 220, protein: 9, carbs: 30, fat: 7, satFat: 2, fiber: 6, sugar: 1, serving: '1 taza (200 g)' },
  { id: 'changua', name: 'Changua boyacense', emoji: '🥣', calories: 220, protein: 12, carbs: 12, fat: 12, satFat: 7, fiber: 0, sugar: 6, serving: '1 plato (300 g)' },
  { id: 'agua-panela', name: 'Agua de panela', emoji: '🥤', calories: 60, protein: 0, carbs: 15, fat: 0, satFat: 0, fiber: 0, sugar: 15, serving: '1 vaso (240 ml)' },
  { id: 'agua-panela-queso', name: 'Agua de panela con queso', emoji: '🥛', calories: 200, protein: 7, carbs: 15, fat: 11, satFat: 6, fiber: 0, sugar: 14, serving: '1 vaso con 30 g de queso' },
  { id: 'limonada-panela', name: 'Limonada de panela', emoji: '🍋', calories: 90, protein: 0, carbs: 22, fat: 0, satFat: 0, fiber: 0, sugar: 20, serving: '1 vaso (240 ml)' },
  { id: 'arepa-redonda', name: 'Arepa redonda blanca', emoji: '🫓', calories: 130, protein: 2, carbs: 27, fat: 0.5, satFat: 0.1, fiber: 1.5, sugar: 0, serving: '1 unidad (60 g)' },
  { id: 'arepa-asada', name: 'Arepa asada antioqueña', emoji: '🫓', calories: 130, protein: 2, carbs: 27, fat: 0.5, satFat: 0.1, fiber: 1.5, sugar: 0, serving: '1 unidad (60 g)' },
  { id: 'arepa-huevo', name: 'Arepa de huevo', emoji: '🍳', calories: 280, protein: 8, carbs: 28, fat: 14, satFat: 6, fiber: 1, sugar: 0, serving: '1 unidad (100 g)' },
  { id: 'arepa-choclo', name: 'Arepa de choclo', emoji: '🫓', calories: 180, protein: 4, carbs: 32, fat: 3, satFat: 1, fiber: 2, sugar: 4, serving: '1 unidad (80 g)' },
  { id: 'arepa-queso', name: 'Arepa rellena de queso', emoji: '🧀', calories: 280, protein: 9, carbs: 27, fat: 14, satFat: 7, fiber: 1, sugar: 1, serving: '1 unidad (100 g)' },
  { id: 'empanada-antioquena', name: 'Empanada antioqueña', emoji: '🥟', calories: 320, protein: 8, carbs: 38, fat: 15, satFat: 7, fiber: 2, sugar: 1, serving: '1 unidad (120 g)' },
  { id: 'empanada-valluna', name: 'Empanada valluna', emoji: '🥟', calories: 280, protein: 9, carbs: 32, fat: 12, satFat: 6, fiber: 2, sugar: 1, serving: '1 unidad (110 g)' },
  { id: 'pandebono', name: 'Pandebono', emoji: '🥖', calories: 180, protein: 5, carbs: 18, fat: 10, satFat: 5, fiber: 0.5, sugar: 1, serving: '1 unidad (50 g)' },
  { id: 'pan-de-yuca', name: 'Pan de yuca', emoji: '🥖', calories: 200, protein: 5, carbs: 20, fat: 12, satFat: 6, fiber: 0.5, sugar: 1, serving: '1 unidad (50 g)' },
  { id: 'pandequeso', name: 'Pandequeso', emoji: '🥖', calories: 200, protein: 5, carbs: 20, fat: 12, satFat: 6, fiber: 0.5, sugar: 1, serving: '1 unidad (50 g)' },
  { id: 'bunuelo', name: 'Buñuelo', emoji: '🍩', calories: 200, protein: 5, carbs: 20, fat: 11, satFat: 5, fiber: 0.5, sugar: 2, serving: '1 unidad (60 g)' },
  { id: 'achiras', name: 'Achiras (Huila)', emoji: '🥮', calories: 130, protein: 2, carbs: 16, fat: 6, satFat: 3, fiber: 0.5, sugar: 1, serving: '1 unidad (30 g)' },
  { id: 'oblea', name: 'Oblea con arequipe', emoji: '🧇', calories: 230, protein: 3, carbs: 32, fat: 9, satFat: 5, fiber: 0.5, sugar: 22, serving: '1 unidad (50 g)' },
  { id: 'colada-maicena', name: 'Colada de maicena', emoji: '🥣', calories: 180, protein: 2, carbs: 30, fat: 4, satFat: 2.5, fiber: 0, sugar: 20, serving: '1 taza (240 ml)' },
  { id: 'tostada', name: 'Tostada', emoji: '🍞', calories: 80, protein: 3, carbs: 15, fat: 1, satFat: 0.2, fiber: 1, sugar: 1, serving: '1 unidad' },
  { id: 'mantecada', name: 'Mantecada', emoji: '🧁', calories: 200, protein: 3, carbs: 30, fat: 8, satFat: 4, fiber: 0.5, sugar: 15, serving: '1 unidad (50 g)' },
  { id: 'avena-con-leche', name: 'Avena con leche (colombiana)', emoji: '🥣', calories: 230, protein: 8, carbs: 35, fat: 6, satFat: 3.5, fiber: 3, sugar: 18, serving: '1 taza (250 ml)' },
  { id: 'huevo-perico', name: 'Huevos pericos', emoji: '🍳', calories: 180, protein: 12, carbs: 2, fat: 14, satFat: 4, fiber: 0, sugar: 1, serving: '2 huevos (100 g)' },
  { id: 'huevos-revueltos', name: 'Huevos revueltos', emoji: '🍳', calories: 200, protein: 12, carbs: 2, fat: 15, satFat: 5, fiber: 0, sugar: 1, serving: '2 huevos (100 g)' },

  // ================ FRITOS TÍPICOS ================
  { id: 'patacon', name: 'Patacón frito', emoji: '🍌', calories: 200, protein: 2, carbs: 30, fat: 8, satFat: 3, fiber: 2, sugar: 0.5, serving: '2 unidades (100 g)' },
  { id: 'platano-maduro', name: 'Plátano maduro frito', emoji: '🍌', calories: 220, protein: 2, carbs: 35, fat: 8, satFat: 2.5, fiber: 2, sugar: 20, serving: '1 unidad (100 g)' },
  { id: 'yuca-frita', name: 'Yuca frita', emoji: '🥔', calories: 270, protein: 3, carbs: 35, fat: 12, satFat: 3, fiber: 2, sugar: 1, serving: '1 porción (100 g)' },
  { id: 'platanitos', name: 'Plátanos chips', emoji: '🍌', calories: 280, protein: 2, carbs: 35, fat: 14, satFat: 5, fiber: 4, sugar: 0.5, serving: '1 bolsa (50 g)' },

  // ================ DULCES Y POSTRES ================
  { id: 'arequipe', name: 'Arequipe (manjar blanco)', emoji: '🥫', calories: 80, protein: 1, carbs: 13, fat: 3, satFat: 2, fiber: 0, sugar: 12, serving: '1 cda (20 g)' },
  { id: 'bocadillo-guayaba', name: 'Bocadillo de guayaba', emoji: '🍮', calories: 110, protein: 0, carbs: 28, fat: 0, satFat: 0, fiber: 0.5, sugar: 22, serving: '1 tajada (30 g)' },
  { id: 'bocadillo-queso', name: 'Bocadillo con queso', emoji: '🧀', calories: 200, protein: 6, carbs: 28, fat: 7, satFat: 4, fiber: 0.5, sugar: 22, serving: '1 bocadillo + 30 g queso' },
  { id: 'bocadillo-arequipe', name: 'Bocadillo con arequipe', emoji: '🍮', calories: 200, protein: 2, carbs: 35, fat: 4, satFat: 2, fiber: 0.5, sugar: 30, serving: '1 unidad (50 g)' },
  { id: 'natilla', name: 'Natilla', emoji: '🍮', calories: 220, protein: 4, carbs: 30, fat: 8, satFat: 5, fiber: 0, sugar: 26, serving: '1 porción (100 g)' },
  { id: 'brevas-arequipe', name: 'Brevas con arequipe', emoji: '🍮', calories: 250, protein: 3, carbs: 45, fat: 7, satFat: 4, fiber: 4, sugar: 40, serving: '1 porción (100 g)' },
  { id: 'torta-chocolate', name: 'Torta de chocolate', emoji: '🍰', calories: 280, protein: 4, carbs: 38, fat: 12, satFat: 6, fiber: 1, sugar: 26, serving: '1 tajada (100 g)' },
  { id: 'milhojas', name: 'Milhojas', emoji: '🥧', calories: 320, protein: 4, carbs: 38, fat: 16, satFat: 9, fiber: 0.5, sugar: 22, serving: '1 unidad (100 g)' },
  { id: 'rosquilla', name: 'Rosquilla', emoji: '🍩', calories: 150, protein: 2, carbs: 20, fat: 7, satFat: 3, fiber: 0.5, sugar: 8, serving: '1 unidad (40 g)' },
  { id: 'arroz-dulce', name: 'Arroz dulce colombiano', emoji: '🍚', calories: 220, protein: 3, carbs: 40, fat: 5, satFat: 3, fiber: 0.5, sugar: 28, serving: '1 taza (200 g)' },
  { id: 'mazamorra-maracuya', name: 'Mazamorra de maracuyá', emoji: '🍮', calories: 180, protein: 1, carbs: 35, fat: 3, satFat: 2, fiber: 3, sugar: 28, serving: '1 taza (200 g)' },
  { id: 'cocadas', name: 'Cocadas', emoji: '🥥', calories: 180, protein: 1, carbs: 18, fat: 11, satFat: 8, fiber: 1.5, sugar: 16, serving: '1 unidad (30 g)' },
  { id: 'postre-natas', name: 'Postre de natas', emoji: '🍮', calories: 250, protein: 4, carbs: 30, fat: 12, satFat: 7, fiber: 0, sugar: 25, serving: '1 porción (100 g)' },
  { id: 'pan-de-moro', name: 'Pan de moro', emoji: '🍞', calories: 200, protein: 4, carbs: 35, fat: 5, satFat: 1, fiber: 1, sugar: 18, serving: '1 unidad (80 g)' },
  { id: 'torta-banano', name: 'Torta de banano', emoji: '🍰', calories: 280, protein: 4, carbs: 40, fat: 12, satFat: 5, fiber: 1.5, sugar: 25, serving: '1 tajada (100 g)' },
  { id: 'helado-fruta', name: 'Helado de fruta natural', emoji: '🍦', calories: 130, protein: 1, carbs: 25, fat: 3, satFat: 2, fiber: 1, sugar: 20, serving: '1 bola (80 g)' },
  { id: 'cholao', name: 'Cholao (Valle)', emoji: '🍦', calories: 230, protein: 4, carbs: 38, fat: 7, satFat: 4, fiber: 0.5, sugar: 30, serving: '1 vaso (200 g)' },

  // ================ BEBIDAS ================
  { id: 'aromatica-yerbabuena', name: 'Aromática de yerbabuena', emoji: '🍵', calories: 5, protein: 0, carbs: 1, fat: 0, satFat: 0, fiber: 0, sugar: 0.5, serving: '1 taza (240 ml)' },
  { id: 'aromatica-manzanilla', name: 'Aromática de manzanilla', emoji: '🍵', calories: 5, protein: 0, carbs: 1, fat: 0, satFat: 0, fiber: 0, sugar: 0.5, serving: '1 taza (240 ml)' },
  { id: 'canelazo', name: 'Canelazo', emoji: '🥃', calories: 180, protein: 0, carbs: 25, fat: 0, satFat: 0, fiber: 0, sugar: 24, serving: '1 vaso (60 ml)' },
  { id: 'carajillo', name: 'Carajillo', emoji: '☕', calories: 130, protein: 1, carbs: 8, fat: 4, satFat: 2, fiber: 0, sugar: 8, serving: '1 taza (120 ml)' },
  { id: 'chicha', name: 'Chicha de arroz', emoji: '🥤', calories: 110, protein: 1, carbs: 26, fat: 0, satFat: 0, fiber: 0, sugar: 18, serving: '1 vaso (240 ml)' },
  { id: 'champus', name: 'Champús (Popayán)', emoji: '🥤', calories: 80, protein: 0.5, carbs: 20, fat: 0, satFat: 0, fiber: 0.5, sugar: 18, serving: '1 vaso (200 ml)' },
  { id: 'lulada', name: 'Lulada', emoji: '🥤', calories: 90, protein: 0.5, carbs: 22, fat: 0, satFat: 0, fiber: 0.5, sugar: 20, serving: '1 vaso (240 ml)' },
  { id: 'fresco-maracuya', name: 'Fresco de maracuyá', emoji: '🥤', calories: 90, protein: 0.5, carbs: 22, fat: 0, satFat: 0, fiber: 0.5, sugar: 20, serving: '1 vaso (240 ml)' },
  { id: 'jugo-lulo', name: 'Jugo de lulo', emoji: '🥤', calories: 60, protein: 0.5, carbs: 14, fat: 0, satFat: 0, fiber: 0.5, sugar: 13, serving: '1 vaso (240 ml)' },
  { id: 'jugo-mora', name: 'Jugo de mora', emoji: '🥤', calories: 70, protein: 0.5, carbs: 16, fat: 0, satFat: 0, fiber: 1, sugar: 14, serving: '1 vaso (240 ml)' },
  { id: 'jugo-papaya', name: 'Jugo de papaya', emoji: '🥤', calories: 70, protein: 0.5, carbs: 17, fat: 0, satFat: 0, fiber: 0.5, sugar: 16, serving: '1 vaso (240 ml)' },
  { id: 'jugo-tomate-arbol', name: 'Jugo de tomate de árbol', emoji: '🥤', calories: 60, protein: 0.5, carbs: 14, fat: 0, satFat: 0, fiber: 0.5, sugar: 13, serving: '1 vaso (240 ml)' },
  { id: 'agua-coco', name: 'Agua de coco', emoji: '🥥', calories: 45, protein: 0.5, carbs: 10, fat: 0, satFat: 0, fiber: 0, sugar: 8, serving: '1 vaso (240 ml)' },
  { id: 'guarapo', name: 'Guarapo', emoji: '🥤', calories: 90, protein: 0, carbs: 22, fat: 0, satFat: 0, fiber: 0, sugar: 22, serving: '1 vaso (240 ml)' },

  // ================ CONDIMENTOS, SALSAS Y OTROS ================
  { id: 'hogao', name: 'Hogao (salsa criolla)', emoji: '🍲', calories: 80, protein: 2, carbs: 10, fat: 4, satFat: 1, fiber: 2, sugar: 4, serving: '½ taza (100 g)' },
  { id: 'guacamole', name: 'Guacamole', emoji: '🥑', calories: 100, protein: 1, carbs: 6, fat: 8, satFat: 1, fiber: 3, sugar: 0.5, serving: '½ taza (100 g)' },
  { id: 'salsa-rosada', name: 'Salsa rosada', emoji: '🥫', calories: 90, protein: 0.5, carbs: 8, fat: 7, satFat: 1.2, fiber: 0.5, sugar: 5, serving: '2 cdas (30 g)' },
  { id: 'aji-picante', name: 'Ají picante', emoji: '🌶️', calories: 8, protein: 0.3, carbs: 2, fat: 0.1, satFat: 0, fiber: 0.5, sugar: 0.5, serving: '1 cda (15 g)' },
  { id: 'aceite-vegetal', name: 'Aceite vegetal', emoji: '🛢️', calories: 120, protein: 0, carbs: 0, fat: 14, satFat: 2, fiber: 0, sugar: 0, serving: '1 cda (14 g)' },
  { id: 'manteca-cerdo', name: 'Manteca de cerdo', emoji: '🥫', calories: 130, protein: 0, carbs: 0, fat: 14, satFat: 6, fiber: 0, sugar: 0, serving: '1 cda (14 g)' },
  { id: 'panela', name: 'Panela (bloque)', emoji: '🍯', calories: 60, protein: 0, carbs: 15, fat: 0, satFat: 0, fiber: 0, sugar: 15, serving: '1 trozo (20 g)' },
  { id: 'cafe-tinto', name: 'Café tinto', emoji: '☕', calories: 2, protein: 0.3, carbs: 0, fat: 0, satFat: 0, fiber: 0, sugar: 0, serving: '1 taza (60 ml)' },
];

export function findFood(id: string): Food | undefined {
  return FOODS.find((f) => f.id === id);
}

export function searchFoods(query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOODS;
  return FOODS.filter((f) => f.name.toLowerCase().includes(q));
}
