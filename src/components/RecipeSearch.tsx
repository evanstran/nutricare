import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  Utensils, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Heart, 
  Check, 
  AlertCircle, 
  Plus, 
  Flame, 
  SlidersHorizontal 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MealPlan, NutritionInfo } from '../types';

interface AlternativeRecipe {
  id: string;
  nameVi: string;
  nameEn: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number; // in mg
  nutrientsKeywords: string[]; // key nutritional indicators
  suitableForDiseases: string[];
  keyNutrientTagVi: string;
  keyNutrientTagEn: string;
  ingredientsVi: string[];
  ingredientsEn: string[];
  instructionsVi: string[];
  instructionsEn: string[];
}

const ALTERNATIVE_RECIPES: AlternativeRecipe[] = [
  {
    id: 'rec_1',
    nameVi: 'Cháo yến mạch hạt chia chuối tây',
    nameEn: 'Oatmeal Chia Seed Banana Porridge',
    category: 'breakfast',
    calories: 280,
    protein: 9,
    carbs: 48,
    fat: 6,
    fiber: 8,
    sodium: 15,
    nutrientsKeywords: ['chất xơ', 'bột đường phức', 'kali', 'chia', 'yến mạch', 'ít béo', 'canxi', 'fiber', 'potassium', 'low sodium', 'đại tràng', 'dạ dày'],
    suitableForDiseases: ['Tiểu đường', 'Huyết áp cao', 'Béo phì', 'Đại tràng', 'Dạ dày'],
    keyNutrientTagVi: 'Giàu Chất Xơ Hòa Tan & Kali',
    keyNutrientTagEn: 'High Soluble Fiber & Potassium',
    ingredientsVi: [
      '40g Yến mạch cán dẹt nứt đôi',
      '1 thìa hạt chia hữu cơ (5g)',
      '1 quả chuối tây chín vừa vừa (80g)',
      '150ml sữa tươi tách béo không đường',
      'Một nhúm quế bột thơm'
    ],
    ingredientsEn: [
      '40g Rolled oats',
      '1 tsp Organic chia seeds (5g)',
      '1 Ripe medium banana (80g)',
      '150ml Unsweetened skim milk',
      'A pinch of ground cinnamon'
    ],
    instructionsVi: [
      'Đun nóng sữa tách béo trên lửa vừa dập dìu, tránh để sôi bùng.',
      'Cho yến mạch và hạt chia vào, khuấy nhẹ đều tay trong khoảng 5-7 phút cho nở mềm.',
      'Tắt bếp, múc cháo ẩm ra bát tô.',
      'Cắt chuối thành những lát tròn mỏng xếp lên trên bề mặt cháo.',
      'Rắc bột quế thơm nồng lên rồi thưởng thức ấm áp.'
    ],
    instructionsEn: [
      'Warm the skim milk over low-medium heat, avoiding boiling.',
      'Add rolled oats and chia seeds, stirring gently for 5-7 mins until thickened.',
      'Remove from heat, transfer to a clean serving bowl.',
      'Slice the ripe banana and arrange elegantly on top.',
      'Dust with ground cinnamon and serve warm.'
    ]
  },
  {
    id: 'rec_2',
    nameVi: 'Salad cải xoăn cá hồi áp chảo sốt chanh leo',
    nameEn: 'Seared Salmon Kale Salad with Passionfruit',
    category: 'lunch',
    calories: 420,
    protein: 32,
    carbs: 12,
    fat: 26,
    fiber: 5,
    sodium: 110,
    nutrientsKeywords: ['omega 3', 'chất béo tốt', 'đạm cao', 'ít muối', 'keto', 'low carb', 'cá hồi', 'bơ', 'vitamin e', 'healthy fats', 'high protein', 'low sodium', 'tim mạch', 'gút'],
    suitableForDiseases: ['Tiểu đường', 'Huyết áp cao', 'Tim mạch', 'Béo phì', 'Gút (Gout)'],
    keyNutrientTagVi: 'Omega-3 Bất Tận & Lipid Lành Mạnh',
    keyNutrientTagEn: 'High Omega-3 & Cardio-Healthy Fats',
    ingredientsVi: [
      '120g Cá hồi NaUy phi-lê tươi rói',
      '100g Cải xoăn Kale hữu cơ rửa sạch',
      '1/2 quả bơ chín ngậy thái hạt lựu (50g)',
      '1 quả chanh leo lọc lấy nước cốt nguyên chất',
      '1 thìa cà phê dầu oliu nguyên chất',
      'Vài giọt mật ong hữu cơ nhẹ dịu'
    ],
    ingredientsEn: [
      '120g Fresh salmon fillet',
      '100g Clean organic Kale leaves',
      '1/2 Ripe avocado, diced (50g)',
      '1 Passionfruit, juiced and strained',
      '1 tsp Extra virgin olive oil',
      'A few drops of pure organic honey'
    ],
    instructionsVi: [
      'Áp chảo cá hồi với nửa thìa dầu oliu, mỗi mặt 2-3 phút cho chín vàng bên ngoài, chín hồng mọng nước bên trong.',
      'Cải xoăn tuốt lá nhỏ, bóp nhẹ với vài hạt muối để giảm bớt độ xơ cứng.',
      'Trộn nước cốt chanh leo, mật ong và phần dầu oliu còn lại làm nước sốt chua ngọt ấm nhẹ.',
      'Xếp cải xoăn, bơ hạt lựu ra đĩa rộng, đặt cá hồi áp chảo lên trên.',
      'Rưới đều sốt chanh leo óng ánh lên toàn bộ đĩa salad rồi thưởng thức.'
    ],
    instructionsEn: [
      'Sear the salmon with half of the olive oil, 2-3 mins per side until golden outside, juicy tender inside.',
      'Strip kale leaves, massage gently with a tiny pinch of salt to soften.',
      'Whisk passionfruit juice, honey, and remaining olive oil for the sweet-sour dressing.',
      'Arrange kale and avocado on a plate, top with the seared salmon fillet.',
      'Drizzle the fragrant passionfruit dressing and serve fresh.'
    ]
  },
  {
    id: 'rec_3',
    nameVi: 'Súp lơ xanh xào tỏi và thịt bò nạc mềm',
    nameEn: 'Tender Beef Stir-fried with Garlic Broccoli',
    category: 'dinner',
    calories: 340,
    protein: 28,
    carbs: 14,
    fat: 18,
    fiber: 4,
    sodium: 180,
    nutrientsKeywords: ['sắt', 'kẽm', 'đạm', 'súp lơ xanh', 'broccoli', 'ít carb', 'thịt bò', 'iron', 'zinc', 'high protein', 'low carb', 'phục hồi', 'thiếu máu'],
    suitableForDiseases: ['Tiểu đường', 'Thiếu máu', 'Béo phì', 'Dạ dày'],
    keyNutrientTagVi: 'Bổ Máu Cực Cao, Giàu Sắt & Magnesium',
    keyNutrientTagEn: 'Iron-Rich & High Magnesium Strength',
    ingredientsVi: [
      '100g Thịt bò thăn nạc thái mỏng',
      '150g Súp lơ xanh hữu cơ cắt nhánh nhỏ',
      '3 tép tỏi ta giã dập',
      '1 thìa cà phê dầu hạt cải',
      '1 thìa cà phê nước tương hữu cơ ít natri'
    ],
    ingredientsEn: [
      '100g Lean flank beef, thinly sliced',
      '150g Organic broccoli florets',
      '3 Garlic cloves, crushed',
      '1 tsp Canola oil',
      '1 tsp Low-sodium organic soy sauce'
    ],
    instructionsVi: [
      'Ướp thịt bò với tỏi và nước tương giảm muối trong 10 phút để thấm gia vị.',
      'Chần sơ súp lơ xanh qua nước sôi khoáng 1 phút rồi vớt ra xả ngay nước đá lạnh để giữ độ giòn ngọt và màu xanh thắm.',
      'Làm nóng chảo với dầu hạt cải, phi tỏi thơm vàng rồi trút thịt bò vào đảo nhanh tay lửa lớn trong 2 phút.',
      'Cho tiếp súp lơ xanh vào đảo nhanh thêm 1 phút cho hòa quyện hương vị.',
      'Trút súp xào nóng hổi ra đĩa.'
    ],
    instructionsEn: [
      'Marinate beef slices with half of garlic and low-sodium soy sauce for 10 mins.',
      'Blanch broccoli florets in boiling water for 1 min, then shock in ice bath to keep green.',
      'Heat canola oil in a wok, sauté garlic, then toss in beef on high heat for 2 mins.',
      'Add broccoli and stir-fry quickly for 1 more min until harmonious.',
      'Serve immediate and warm.'
    ]
  },
  {
    id: 'rec_4',
    nameVi: 'Súp bí đỏ hạt sen và thịt bằn thanh ngọt',
    nameEn: 'Minced Meat Pumpkin Lotus Seed Soup',
    category: 'dinner',
    calories: 250,
    protein: 14,
    carbs: 32,
    fat: 7,
    fiber: 5,
    sodium: 140,
    nutrientsKeywords: ['dễ tiêu', 'an thần', 'bí đỏ', 'hạt sen', 'kali', 'vitamin a', 'ít béo', 'gạo', 'antioxidants', 'digestive support', 'low fat', 'dạ dày', 'đại tràng'],
    suitableForDiseases: ['Dạ dày', 'Đại tràng', 'Huyết áp cao', 'Tim mạch'],
    keyNutrientTagVi: 'Dễ Tiêu Hóa & An Thần Ngủ Ngon',
    keyNutrientTagEn: 'Gentle Digestion & Relaxation Support',
    ingredientsVi: [
      '150g Bí đỏ gọt vỏ thái miếng vuông',
      '40g Hạt sen tươi thông tâm bỏ đắng',
      '50g Thịt thăn lợn xay nhuyễn',
      '1 củ hành khô băm nhỏ',
      'Rau thơm, hành lá rửa sạch'
    ],
    ingredientsEn: [
      '150g Peeled pumpkin, cubed',
      '40g Fresh lotus seeds',
      '50g Lean minced pork',
      '1 Shallot, minced',
      'Fresh scallion and herbs'
    ],
    instructionsVi: [
      'Xào qua thịt bằm với hành khô phi thơm trong nồi nấu canh.',
      'Cho tiếp bí đỏ và hạt sen và đổ ngập nước khoáng 400ml đun sôi bùng lên.',
      'Hạ lửa liu riu hầm trong vòng 20 phút cho hạt sen chín bở mềm, bí đỏ chín nhừ.',
      'Dùng muôi dầm nhuyễn bí đỏ để súp có độ sệt tự nhiên ngọt ngào.',
      'Thả hành lá cắt nhỏ vào, múc súp nóng ra bát.'
    ],
    instructionsEn: [
      'Sauté minced pork with shallow minced shallots in the soup pot.',
      'Add pumpkin cubes, lotus seeds, and pour 400ml water to a boil.',
      'Simmer on low heat for 20 mins until lotus seeds and pumpkin are completely soft.',
      'Gently mash the pumpkin with a spoon for a natural thick golden texture.',
      'Sprinkle chopped scallions, ladle warm soup and serve.'
    ]
  },
  {
    id: 'rec_5',
    nameVi: 'Cá tuyết hấp gừng hành hành lá',
    nameEn: 'Steamed Ginger Scallion Cod Fillet',
    category: 'lunch',
    calories: 290,
    protein: 34,
    carbs: 6,
    fat: 14,
    fiber: 2,
    sodium: 90,
    nutrientsKeywords: ['ít natri', 'suy thận', 'thận', 'đạm lành mạnh', 'canxi', 'cá tuyết', 'gừng', 'low sodium', 'renal diet', 'high protein', 'low fat', 'huyết áp'],
    suitableForDiseases: ['Suy thận', 'Huyết áp cao', 'Tim mạch', 'Béo phì', 'Gút (Gout)'],
    keyNutrientTagVi: 'Nồng Độ Muối Siêu Thấp, Bảo Vệ Thận',
    keyNutrientTagEn: 'Extremely Low Sodium, Renal Protective',
    ingredientsVi: [
      '150g Cá tuyết phi lê thịt trắng tuyết sạch sẽ',
      '1 củ gừng nhỏ thái sợi chỉ ngấm sâu',
      '2 nhánh hành lá chẻ mượt',
      '1 thìa dầu mè tinh khiết thơm lừng',
      'Một chút xíu giọt rượu nhạt khử tanh'
    ],
    ingredientsEn: [
      '150g Clean white cod fillet',
      '1 Small ginger root, julienned',
      '2 Scallions, split into silky threads',
      '1 tsp Pure sesame oil',
      'A splash of light cooking wine'
    ],
    instructionsVi: [
      'Xếp cá tuyết lên đĩa chịu nhiệt rộng, dàn đều gừng thái chỉ phủ lên bề mặt miếng cá.',
      'Đặt đĩa cá vào xửng hấp hơi nóng cách thủy sôi bùng trong khoảng 8-10 phút tùy độ dày.',
      'Cá chín mềm mượt vớt ra nước hấp chảy, xếp hành hành lá đã chẻ mềm lên trên.',
      'Đun nóng dầu mè rồi rưới nhanh lên hành tạo tiếng xèo xèo dậy mùi hương quyến rũ.'
    ],
    instructionsEn: [
      'Place cod fillet on a heatproof dish, scattering ginger threads evenly on top.',
      'Steam over high boiling water for 8-10 mins until fish is flaking and tender.',
      'Discard excess water, layer neatly the split scallion on top.',
      'Heat sesame oil and flash-pour over the scallion to release therapeutic aroma.'
    ]
  },
  {
    id: 'rec_6',
    nameVi: 'Bún gạo lứt đậu hũ áp chảo tiêu xanh',
    nameEn: 'Brown Rice Vermicelli with Crispy Tofu',
    category: 'lunch',
    calories: 360,
    protein: 16,
    carbs: 58,
    fat: 8,
    fiber: 6,
    sodium: 80,
    nutrientsKeywords: ['chay', 'plant-based', 'gạo lứt', 'đậu hũ', 'ít purine', 'gút', 'tiểu đường', 'giàu chất xơ', 'vegan', 'gout friendly', 'fiber rich', 'low glycemix'],
    suitableForDiseases: ['Gút (Gout)', 'Tiểu đường', 'Huyết áp cao', 'Béo phì'],
    keyNutrientTagVi: 'Chỉ Số Đường Huyết Thấp, An Toàn Cho Gút',
    keyNutrientTagEn: 'Low Glycemic Index & Low Purine Safe',
    ingredientsVi: [
      '60g Bún gạo lứt khô luộc chín ráo nước',
      '1 bìa Đậu hũ non ép chặt, áp chảo vàng đều',
      '80g Rau xà lách hữu cơ, dưa leo tươi mát băm nhỏ',
      '1 thìa hạt điều rang giã dập thơm béo',
      'Nước sốt chay chua ngọt nhạt thanh'
    ],
    ingredientsEn: [
      '60g Dried brown rice vermicelli, boiled and drained',
      '1 block Firm tofu, pan-fried gold without oil',
      '80g Crisp organic lettuce, diced cucumbers',
      '1 tbsp Toasted cashews, crushed',
      'Light sweet-and-sour vegan soy vinaigrette'
    ],
    instructionsVi: [
      'Bún gạo lứt luộc chín mềm vớt ra ngâm nước lạnh rồi xốc tơi để ráo nước.',
      'Áp chảo đậu hũ bằng chảo chống dính không dầu mỡ cho giòn màng mỏng bên ngoài.',
      'Thái hạt lựu dưa leo, cắt nhỏ xà lách hữu cơ xanh mướt.',
      'Xếp tất cả nguyên liệu vào bát lớn mộc mạc.',
      'Rắc hạt điều giã mịn lên trên, rưới nước sốt nhạt thanh dịu dàng rồi trộn đều thưởng thức.'
    ],
    instructionsEn: [
      'Boil brown rice vermicelli until al-dente, rinse in cold water and drain well.',
      'Pan-sear the tofu firm blocks over non-stick pan until slightly golden on all sides.',
      'Chop lettuce and cucumber into crunchy small bites.',
      'Assemble all beautifully in a classic rustic bowl.',
      'Garnish with crushed cashews and pour the clean mild dressing before mixing.'
    ]
  },
  {
    id: 'rec_7',
    nameVi: 'Canh bí xanh nấu thịt nạc tôm viên khô',
    nameEn: 'Wintermelon Soup with Minced pork & Shrimp',
    category: 'lunch',
    calories: 140,
    protein: 16,
    carbs: 8,
    fat: 3,
    fiber: 3,
    sodium: 120,
    nutrientsKeywords: ['ít purine', 'thanh nhiệt', 'bí xanh', 'tôm', 'thịt viên', 'mát gan', 'gút', 'huyết áp', 'canh', 'healthy soup', 'low sodium', 'gout safety'],
    suitableForDiseases: ['Gút (Gout)', 'Huyết áp cao', 'Suy thận', 'Béo phì'],
    keyNutrientTagVi: 'Đào Thải Axit Uric, Mát Gan Giải Độc',
    keyNutrientTagEn: 'Uric Acid Elimination & Detoxification',
    ingredientsVi: [
      '200g Bí xanh tươi mọng gọt vỏ thái mỏng',
      '50g Tôm tươi lột vỏ băm chung thịt nạc lưng lợn',
      '1 quả hành củ băm nhuyễn',
      'Vài nhánh hành lá, mùi tàu thơm phức'
    ],
    ingredientsEn: [
      '200g Fresh wintermelon, peeled and sliced',
      '50g Fresh minced shrimps mixed with lean pork',
      '1 Shallot, finely chopped',
      'Fresh chopped scallions and cilantro'
    ],
    instructionsVi: [
      'Trộn nhuyễn tôm băm và thịt nạc băm, vo tròn nhẹ nhàng thành 4-5 viên tôm thịt nhỏ xinh.',
      'Đun sôi 450ml nước trong nồi, thả nhẹ từng viên tôm thịt vào nấu chín sủi bọt nhẹ trong 3 phút.',
      'Thả tiếp bí xanh mọc nước vào nấu tiếp lửa vừa 3-4 phút cho bí xanh chuyển trong mềm ngọt.',
      'Tắt bếp ngay dập lò, nêm chút hành lá mùi tàu cho nổi hương thơm giải nhiệt.'
    ],
    instructionsEn: [
      'Mix minced shrimp and pork thoroughly, roll into 4-5 small firm meatballs.',
      'Bring 450ml plain water to boil, drop the meatballs and float on gentle heat for 3 mins.',
      'Add wintermelon slices, cooking for another 3-4 mins until transclucent.',
      'Turn off heat, stir in fresh scallion and coriander and enjoy warm.'
    ]
  },
  {
    id: 'rec_8',
    nameVi: 'Sinh tố bơ rau chân vịt chuối lùn',
    nameEn: 'Avocado Spinach & Forest Banana Smoothie',
    category: 'snacks',
    calories: 195,
    protein: 4,
    carbs: 28,
    fat: 8,
    fiber: 7,
    sodium: 25,
    nutrientsKeywords: ['vitamin', 'chất xơ xơ', 'kali', 'omega 3', 'sinh tố', 'bơ', 'rau chân vịt', 'spinach', 'smoothie', 'energy booster', 'folate', 'tim mạch', 'tiểu đường'],
    suitableForDiseases: ['Tiểu đường', 'Huyết áp cao', 'Tim mạch', 'Thiếu máu'],
    keyNutrientTagVi: 'Siêu Cấp Folate, Vitamin K & Chất Xơ',
    keyNutrientTagEn: 'Excellent Folate, Vitamin K & Fiber Blend',
    ingredientsVi: [
      '1/4 quả quả bơ sáp chín bùi (40g)',
      '50g Rau chân vịt baby mọng nước',
      '1/2 quả chuối tây đông lạnh thái khoanh nhỏ (40g)',
      '120ml Sữa hạnh nhân không đường'
    ],
    ingredientsEn: [
      '1/4 Ripe buttery avocado (40g)',
      '50g Organic baby spinach leaves',
      '1/2 Ripe banana, previously sliced and frozen',
      '120ml Unsweetened almond milk'
    ],
    instructionsVi: [
      'Rửa sạch mơn mởn lá rau chân vịt rồi ngâm xả ráo nước.',
      'Cho bơ, chuối tây đông lạnh, rau chân vịt và sữa hạnh nhân vào máy sinh tố công suất tốt.',
      'Xay mịn mượt tốc độ cao trong 1-2 phút cho đến khi được một hỗn hợp xanh mướt, mịn sánh như nhung.',
      'Rót ra ly thủy tinh mát lạnh tự nhiên và thưởng thức ngay lúc tơi xốp.'
    ],
    instructionsEn: [
      'Wash spinach leaves thoroughly and drain.',
      'Toss avocado, frozen banana, spinach, and cold almond milk into a high-speed blender.',
      'Blend on absolute high speed for 1-2 mins until silky smooth green texture forms.',
      'Pour into a clear tall glass and cherish immediately.'
    ]
  },
  {
    id: 'rec_9',
    nameVi: 'Sữa chua Hy Lạp hạt óc chó và dâu tây tằm',
    nameEn: 'Greek Yogurt with Walnuts & Wild Berries',
    category: 'snacks',
    calories: 180,
    protein: 12,
    carbs: 14,
    fat: 9,
    fiber: 3,
    sodium: 40,
    nutrientsKeywords: ['men vi sinh', 'probiotic', 'omega 3', 'đạm lành', 'sữa chua', 'hạt', 'dâu tây', 'gout', 'tiểu đường', 'dạ dày', 'đại tràng', 'probiotics', 'healthy lipid'],
    suitableForDiseases: ['Dạ dày', 'Đại tràng', 'Gút (Gout)', 'Báo phì', 'Tiểu đường'],
    keyNutrientTagVi: 'Cung Cấp Men Probiotic Giúp Êm Ru Đường Ruột',
    keyNutrientTagEn: 'Rich Probiotics & Omega-3 Intestinal Care',
    ingredientsVi: [
      '100g Sữa chua Hy Lạp nguyên chất ít béo không đường',
      '3 hạt óc chó nhập khẩu tách vỏ bẻ vụn nhỏ (15g)',
      '3 quả dâu tây hữu cơ thái lát mỏng ngây thơ',
      '1/2 thìa cà phê phấn hoa rừng nguyên chất'
    ],
    ingredientsEn: [
      '100g Real unsweetened low-fat Greek yogurt',
      '3 Whole walnuts, cracked and crumbled (15g)',
      '3 Fresh organic strawberries, sliced thin',
      '1/2 tsp Raw forest honey or pollen'
    ],
    instructionsVi: [
      'Múc sữa chua Hy Lạp mượt đặc ra ly thủy tinh sang trọng.',
      'Thả dâu tây đỏ mọng xếp tròn quanh mép ly.',
      'Rắc nhân hạt óc chó bùi giòn phủ lên trung tâm ly sữa chua.',
      'Rưới chút mật ong rừng mảnh dẻ rồi thưởng thức thìa đầu tiên lâng lâng ngon miệng.'
    ],
    instructionsEn: [
      'Spoon thick Greek yogurt into a clean glass.',
      'Layer sliced red strawberries around the inner edges.',
      'Sprinkle crunchy walnut crumbles directly in the center.',
      'Garnish with a drop of organic sweet syrup and enjoy with a spoon.'
    ]
  }
];

interface RecipeSearchProps {
  user: any;
  mealPlan: MealPlan | null;
  onUpdateMealPlan: (p: MealPlan) => void;
  lang: 'vi' | 'en';
  selectedDate: string;
}

export const RecipeSearch: React.FC<RecipeSearchProps> = ({
  user,
  mealPlan,
  onUpdateMealPlan,
  lang,
  selectedDate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiseaseFilter, setSelectedDiseaseFilter] = useState<string>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [replacingMealType, setReplacingMealType] = useState<string | null>(null);
  const [activeRecipeForReplacement, setActiveRecipeForReplacement] = useState<AlternativeRecipe | null>(null);
  const [isLoadingReplacement, setIsLoadingReplacement] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Collect active disease options in standard language
  const diseaseOptions = useMemo(() => {
    return ['All', 'Tiểu đường', 'Huyết áp cao', 'Suy thận', 'Gút (Gout)', 'Dạ dày', 'Đại tràng', 'Tim mạch', 'Béo phì'];
  }, []);

  // Filter recipes based on term, category and profile/disease tag
  const filteredRecipes = useMemo(() => {
    return ALTERNATIVE_RECIPES.filter((recipe) => {
      // 1. Text Search Match (Name, keywords)
      const term = searchTerm.toLowerCase().trim();
      const matchText = 
        !term || 
        recipe.nameVi.toLowerCase().includes(term) ||
        recipe.nameEn.toLowerCase().includes(term) ||
        recipe.keyNutrientTagVi.toLowerCase().includes(term) ||
        recipe.keyNutrientTagEn.toLowerCase().includes(term) ||
        recipe.nutrientsKeywords.some(kw => kw.toLowerCase().includes(term));

      // 2. Category Match
      const matchCategory = selectedCategoryFilter === 'All' || recipe.category === selectedCategoryFilter;

      // 3. Disease Match
      const matchDisease = selectedDiseaseFilter === 'All' || recipe.suitableForDiseases.includes(selectedDiseaseFilter);

      return matchText && matchCategory && matchDisease;
    });
  }, [searchTerm, selectedCategoryFilter, selectedDiseaseFilter]);

  const toggleExpand = (id: string) => {
    setExpandedRecipeId(expandedRecipeId === id ? null : id);
  };

  const handleTriggerReplace = (recipe: AlternativeRecipe) => {
    setActiveRecipeForReplacement(recipe);
    setReplacingMealType(recipe.category); // Default suggestion matches the recipe class
  };

  const executeReplacement = async () => {
    if (!user || !activeRecipeForReplacement || !replacingMealType) return;
    setIsLoadingReplacement(true);
    setSuccessNotice(null);

    const docId = `${user.uid}_${selectedDate}`;
    
    // Construct alternative nutrition node
    const updatedNutrition: NutritionInfo = {
      calories: activeRecipeForReplacement.calories,
      protein: activeRecipeForReplacement.protein,
      carbs: activeRecipeForReplacement.carbs,
      fat: activeRecipeForReplacement.fat,
      fiber: activeRecipeForReplacement.fiber,
      sodium: activeRecipeForReplacement.sodium
    };

    // Prepare updated plan
    const updatedMealPlan: MealPlan = mealPlan 
      ? {
          ...mealPlan,
          [replacingMealType]: activeRecipeForReplacement.nameVi + ' (Thay thế từ Tìm kiếm)',
          nutrition: {
            ...mealPlan.nutrition,
            [replacingMealType]: updatedNutrition
          } as any,
          ingredients: {
            ...mealPlan.ingredients,
            [replacingMealType]: activeRecipeForReplacement.ingredientsVi
          } as any,
        }
      : {
          userId: user.uid,
          date: selectedDate,
          breakfast: replacingMealType === 'breakfast' ? activeRecipeForReplacement.nameVi : 'Cháo yến mạch chuối tiêu (Mặc định)',
          lunch: replacingMealType === 'lunch' ? activeRecipeForReplacement.nameVi : 'Gỏi ức gà bắp cải (Mặc định)',
          dinner: replacingMealType === 'dinner' ? activeRecipeForReplacement.nameVi : 'Cá hồi áp chảo bông cải (Mặc định)',
          snacks: replacingMealType === 'snacks' ? activeRecipeForReplacement.nameVi : 'Lê tươi 1 quả bùi giòn (Mặc định)',
          nutrition: {
            breakfast: replacingMealType === 'breakfast' ? updatedNutrition : { calories: 200, protein: 5, carbs: 40, fat: 2 },
            lunch: replacingMealType === 'lunch' ? updatedNutrition : { calories: 350, protein: 25, carbs: 45, fat: 5 },
            dinner: replacingMealType === 'dinner' ? updatedNutrition : { calories: 300, protein: 22, carbs: 35, fat: 8 },
            snacks: replacingMealType === 'snacks' ? updatedNutrition : { calories: 90, protein: 1, carbs: 20, fat: 0 }
          } as any,
          ingredients: {
            breakfast: replacingMealType === 'breakfast' ? activeRecipeForReplacement.ingredientsVi : ['Yến mạch', 'Chuối'],
            lunch: replacingMealType === 'lunch' ? activeRecipeForReplacement.ingredientsVi : ['Ức gà', 'Bắp cải'],
            dinner: replacingMealType === 'dinner' ? activeRecipeForReplacement.ingredientsVi : ['Cá hồi', 'Súp lơ'],
            snacks: replacingMealType === 'snacks' ? activeRecipeForReplacement.ingredientsVi : ['Quả lê']
          } as any,
          aiTips: 'Chế độ ăn thay thế đã được lưu thành công. Giảm tinh bột chậm và tăng đạm tốt.',
          shouldAvoid: [],
          shouldEat: [],
          createdAt: new Date().toISOString()
        };

    try {
      await setDoc(doc(db, 'mealPlans', docId), updatedMealPlan);
      onUpdateMealPlan(updatedMealPlan);
      
      const successStr = lang === 'vi' 
        ? `Đã thay thế thành công món ăn bằng "${activeRecipeForReplacement.nameVi}" cho ${
            replacingMealType === 'breakfast' ? 'Bữa sáng' : 
            replacingMealType === 'lunch' ? 'Bữa trưa' : 
            replacingMealType === 'snacks' ? 'Bữa phụ' : 'Bữa tối'
          }!`
        : `Successfully replaced your meal with "${activeRecipeForReplacement.nameEn}" for ${replacingMealType}!`;
      
      setSuccessNotice(successStr);
      setTimeout(() => setSuccessNotice(null), 5000); // clear notice
      setActiveRecipeForReplacement(null);
    } catch (err) {
      console.error("Lỗi thay thế món ăn:", err);
      alert(lang === 'vi' ? 'Có lỗi xảy ra khi lưu thay đổi!' : 'Server error while storing alternative meal!');
    } finally {
      setIsLoadingReplacement(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 my-6 relative overflow-hidden shadow-inner">
      {/* Decorative gradient light corner */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header and description */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-5 relative z-10">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-500" />
            {lang === 'vi' ? 'Tìm Kiếm & Thay Thế Công Thức Dinh Dưỡng' : 'Meal Alternative Search & Recipes'}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            {lang === 'vi' 
              ? 'Lọc và hoán đổi món ăn lành mạnh dựa trên từ khóa hoạt chất chất xơ, omega-3, kali, hoặc nhóm bệnh lý'
              : 'Search and hot-swap meals based on key performance nutrients or medical clinical guidelines.'}
          </p>
        </div>
      </div>

      {/* Status Notice Indicator */}
      {successNotice && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3.5 text-xs font-black mb-4 flex items-center gap-2.5 relative z-10"
        >
          <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center font-black">✓</div>
          <p>{successNotice}</p>
        </motion.div>
      )}

      {/* Main Search and filter ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 relative z-10 mb-4">
        {/* Search bar inputs */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'vi' ? 'Nhập tinh bột, xơ, kali, ức gà, oméga 3...' : 'Type nutrient keywords, salmon, low-carb...'}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-bold bg-white border border-slate-200/80 rounded-xl focus:ring-1.5 focus:ring-emerald-500 outline-none text-slate-800 shadow-xs"
          />
        </div>

        {/* Categories selector */}
        <div className="md:col-span-3">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-xs font-black bg-white border border-slate-200/80 rounded-xl focus:ring-1.5 focus:ring-emerald-500 outline-none text-slate-700 shadow-xs cursor-pointer"
          >
            <option value="All">{lang === 'vi' ? 'Mọi Loại Bữa Ăn' : 'All meal types'}</option>
            <option value="breakfast">{lang === 'vi' ? 'Bữa Sáng' : 'Breakfast'}</option>
            <option value="lunch">{lang === 'vi' ? 'Bữa Trưa' : 'Lunch'}</option>
            <option value="dinner">{lang === 'vi' ? 'Bữa Tối' : 'Dinner'}</option>
            <option value="snacks">{lang === 'vi' ? 'Bữa Phụ' : 'Snacks'}</option>
          </select>
        </div>

        {/* Medial suitability search selector */}
        <div className="md:col-span-3">
          <select
            value={selectedDiseaseFilter}
            onChange={(e) => setSelectedDiseaseFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-xs font-black bg-white border border-slate-200/80 rounded-xl focus:ring-1.5 focus:ring-emerald-500 outline-none text-slate-700 shadow-xs cursor-pointer"
          >
            <option value="All">{lang === 'vi' ? 'Hợp Mọi Bệnh Lý' : 'All medical constraints'}</option>
            {diseaseOptions.slice(1).map((disease) => (
              <option key={disease} value={disease}>{disease}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        <AnimatePresence>
          {filteredRecipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;
            return (
              <motion.div 
                key={recipe.id}
                layout
                className="bg-white border border-slate-200/60 hover:border-slate-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                {/* Header card info */}
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100/60 px-2 py-0.5 rounded-full">
                      {recipe.category === 'breakfast' ? 'Bữa Sáng' : 
                       recipe.category === 'lunch' ? 'Bữa Trưa' : 
                       recipe.category === 'snacks' ? 'Bữa Phụ' : 'Bữa Tối'}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono">
                      {recipe.calories} kcal
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-800 leading-snug font-sans">
                    {lang === 'vi' ? recipe.nameVi : recipe.nameEn}
                  </h4>

                  <span className="text-[9px] font-bold text-indigo-600 block mt-1.5 uppercase font-sans">
                    ✨ {lang === 'vi' ? recipe.keyNutrientTagVi : recipe.keyNutrientTagEn}
                  </span>

                  {/* Nutrients macros block */}
                  <div className="grid grid-cols-5 gap-1 pt-3.5 border-t border-slate-100 mt-3.5 text-center">
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Đạm</p>
                      <p className="text-xs font-black text-slate-800">{recipe.protein}g</p>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Carb</p>
                      <p className="text-xs font-black text-slate-800">{recipe.carbs}g</p>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Béo</p>
                      <p className="text-xs font-black text-slate-800">{recipe.fat}g</p>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Xơ</p>
                      <p className="text-xs font-black text-slate-800">{recipe.fiber}g</p>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Muối</p>
                      <p className="text-[10px] font-black text-emerald-700">{recipe.sodium}mg</p>
                    </div>
                  </div>

                  {/* Suitability disease ribbons */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {recipe.suitableForDiseases.map((dis) => (
                      <span key={dis} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100/40">
                        {dis}
                      </span>
                    ))}
                  </div>

                  {/* Expanded block showing ingredients / steps */}
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-100 space-y-3"
                    >
                      {/* Ingredients */}
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'vi' ? 'Thành phần cần chuẩn bị' : 'Ingredients Needed'}</p>
                        <ul className="list-disc list-inside text-[10.5px] leading-relaxed text-slate-600 space-y-0.5 font-medium pl-1">
                          {(lang === 'vi' ? recipe.ingredientsVi : recipe.ingredientsEn).map((ing, i) => (
                            <li key={i}>{ing}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Instructions */}
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'vi' ? 'Các bước thực hiện nhanh' : 'Cooking Instructions'}</p>
                        <ul className="list-decimal list-inside text-[10.5px] leading-relaxed text-slate-650 space-y-1 font-medium pl-1">
                          {(lang === 'vi' ? recipe.instructionsVi : recipe.instructionsEn).map((inst, i) => (
                            <li key={i}>{inst}</li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Bottom interactive swap triggers */}
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100/90 flex justify-between items-center gap-2">
                  <button
                    onClick={() => toggleExpand(recipe.id)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 focus:outline-none"
                  >
                    {isExpanded ? (
                      <>
                        <span>{lang === 'vi' ? 'Thu gọn' : 'Close details'}</span>
                        <ChevronUp size={11} />
                      </>
                    ) : (
                      <>
                        <span>{lang === 'vi' ? 'Xem công thức' : 'View recipe'}</span>
                        <ChevronDown size={11} />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleTriggerReplace(recipe)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all focus:outline-none"
                  >
                    {lang === 'vi' ? 'Thay thế bữa ăn' : 'Swap target meal'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredRecipes.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <AlertCircle size={28} className="text-slate-300 mb-2" />
            <p className="text-xs font-black uppercase tracking-wider">{lang === 'vi' ? 'Không tìm thấy món ăn phù hợp' : 'No recipes matched'}</p>
            <p className="text-[10px] text-slate-400 font-medium">
              {lang === 'vi' ? 'Hãy thử gõ các hoạt chất như "xơ", "bột đường phực", "kali", "omega 3"...' : 'Try searching other terms like "sodium", "protein", "bơ"...'}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Replacement Modal overlay */}
      {activeRecipeForReplacement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl flex flex-col"
          >
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{lang === 'vi' ? 'XÁC NHẬN THAY THẾ' : 'CONFIRM SWAP'}</h4>
            <p className="text-[13px] text-slate-800 font-black leading-snug mb-4">
              {lang === 'vi' 
                ? `Bạn muốn hoán đổi bữa ăn hôm nay thành món "${activeRecipeForReplacement.nameVi}"?` 
                : `Are you sure you want to swap today's meal into "${activeRecipeForReplacement.nameEn}"?`}
            </p>

            <div className="mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{lang === 'vi' ? 'Thế chỗ cho bữa nào hôm nay?' : 'Substitute which of today\'s meal slot?'}</label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {[
                  { id: 'breakfast', label: 'Bữa Sáng' },
                  { id: 'lunch', label: 'Bữa Trưa' },
                  { id: 'snacks', label: 'Bữa Phụ' },
                  { id: 'dinner', label: 'Bữa Tối' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReplacingMealType(item.id)}
                    className={`p-2 rounded-lg text-[10px] font-black transition-all border ${
                      replacingMealType === item.id 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setActiveRecipeForReplacement(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-black text-[10px] text-slate-500 uppercase tracking-wider hover:bg-slate-50 transition-colors focus:outline-none"
              >
                {lang === 'vi' ? 'Đóng / Hủy' : 'Cancel'}
              </button>
              <button
                onClick={executeReplacement}
                disabled={isLoadingReplacement}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider hover:bg-emerald-700 hover:shadow-lg transition-all focus:outline-none"
              >
                {isLoadingReplacement ? (lang === 'vi' ? 'Ghi đè...' : 'Saving...') : (lang === 'vi' ? 'Đồng Ý Thay' : 'Confirm Swap')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
