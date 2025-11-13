export interface Recipe {
  id: string;
  title: string;
  category: string;
  country: string;
  time: number;
  image?: string; // Deprecated - use images array instead
  images: string[];
  description: string;
  ingredients: string[];
  instructions: string[];
  servings: number;
  altText?: string; // SEO-optimized alt text for images
  nutrition?: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
}

// Updated to use WebP format from Supabase storage
const chickenSoupImg = "https://xipgwsckilciddoqrfsj.supabase.co/storage/v1/object/public/recipe-images/static-1762110012058-chicken-soup.webp";
const cookiesImg = "https://xipgwsckilciddoqrfsj.supabase.co/storage/v1/object/public/recipe-images/static-1762110012745-cookies.webp";
const carrotJuiceImg = "https://xipgwsckilciddoqrfsj.supabase.co/storage/v1/object/public/recipe-images/static-1762110012990-carrot-juice.webp";
const lentilSoupImg = "https://xipgwsckilciddoqrfsj.supabase.co/storage/v1/object/public/recipe-images/static-1762110013195-lentil-soup.webp";
const applePieImg = "https://xipgwsckilciddoqrfsj.supabase.co/storage/v1/object/public/recipe-images/static-1762110013449-apple-pie.webp";
const gardenSaladImg = "https://xipgwsckilciddoqrfsj.supabase.co/storage/v1/object/public/recipe-images/static-1762110013670-garden-salad.webp";
const roastBeefDinnerImg = "https://xipgwsckilciddoqrfsj.supabase.co/storage/v1/object/public/recipe-images/static-1762110013907-roast-beef-dinner.webp";
const legOfLambImg = "https://xipgwsckilciddoqrfsj.supabase.co/storage/v1/object/public/recipe-images/static-1762110014147-leg-of-lamb.webp";
const roastPorkImg = "https://xipgwsckilciddoqrfsj.supabase.co/storage/v1/object/public/recipe-images/static-1762110014437-roast-pork.webp";
const roastChickenImg = "https://xipgwsckilciddoqrfsj.supabase.co/storage/v1/object/public/recipe-images/static-1762110014708-roast-chicken.webp";

export const recipes: Recipe[] = [
  {
    id: 'grandmas-chicken-soup',
    title: "Grandma's Chicken Soup",
    category: 'Soups',
    country: 'USA',
    time: 45,
    images: [chickenSoupImg],
    description: 'A healing bowl of comfort - the way grandma always made it.',
    servings: 6,
    altText: 'Traditional homemade chicken soup with vegetables and noodles in white bowl - grandma\'s healing recipe',
    ingredients: [
      '1 whole chicken (3-4 lbs)',
      '2 carrots, chopped',
      '2 celery stalks, chopped',
      '1 onion, quartered',
      '4 cloves garlic',
      '8 cups water',
      '2 bay leaves',
      'Salt and pepper to taste',
      'Fresh parsley for garnish',
      '8 oz egg noodles'
    ],
    instructions: [
      'Place chicken in a large pot with water, bring to boil',
      'Add vegetables, garlic, and bay leaves',
      'Reduce heat and simmer for 30 minutes',
      'Remove chicken, shred meat, discard bones',
      'Return meat to pot, add noodles',
      'Cook noodles until tender, about 8 minutes',
      'Season with salt and pepper',
      'Garnish with fresh parsley and serve hot'
    ],
    nutrition: {
      calories: 245,
      protein: '22g',
      carbs: '18g',
      fat: '9g'
    }
  },
  {
    id: 'chocolate-chip-cookies',
    title: 'Classic Chocolate Chip Cookies',
    category: 'Desserts',
    country: 'USA',
    time: 25,
    images: [cookiesImg],
    description: 'Soft, chewy, and loaded with chocolate - these cookies never fail.',
    servings: 24,
    altText: 'Freshly baked chocolate chip cookies on cooling rack - soft and chewy homemade cookie recipe',
    ingredients: [
      '2¼ cups all-purpose flour',
      '1 tsp baking soda',
      '1 tsp salt',
      '1 cup butter, softened',
      '¾ cup granulated sugar',
      '¾ cup brown sugar',
      '2 large eggs',
      '2 tsp vanilla extract',
      '2 cups chocolate chips'
    ],
    instructions: [
      'Preheat oven to 375°F (190°C)',
      'Mix flour, baking soda, and salt in a bowl',
      'Beat butter and sugars until creamy',
      'Add eggs and vanilla, beat well',
      'Gradually stir in flour mixture',
      'Fold in chocolate chips',
      'Drop rounded tablespoons onto baking sheets',
      'Bake 9-11 minutes until golden brown',
      'Cool on baking sheet for 2 minutes, then transfer to wire rack'
    ],
    nutrition: {
      calories: 185,
      protein: '2g',
      carbs: '24g',
      fat: '9g'
    }
  },
  {
    id: 'fresh-carrot-juice',
    title: 'Fresh Carrot Juice',
    category: 'Juices',
    country: 'USA',
    time: 5,
    images: [carrotJuiceImg],
    description: 'Pure energy in a glass - sweet, vibrant, and packed with vitamins.',
    servings: 2,
    altText: 'Fresh orange carrot juice in glass with whole carrots - healthy vegetable juice recipe',
    ingredients: [
      '6-8 large carrots, peeled',
      '1 apple (optional, for sweetness)',
      '1-inch piece of ginger (optional)',
      'Ice cubes'
    ],
    instructions: [
      'Wash and peel carrots',
      'Cut into chunks that fit your juicer',
      'If adding apple, core and quarter it',
      'Peel ginger if using',
      'Run all ingredients through juicer',
      'Stir well and serve immediately over ice',
      'Enjoy within 30 minutes for maximum nutrition'
    ],
    nutrition: {
      calories: 95,
      protein: '2g',
      carbs: '22g',
      fat: '0g'
    }
  },
  {
    id: 'hearty-lentil-soup',
    title: 'Hearty Lentil Soup',
    category: 'Soups',
    country: 'UK',
    time: 40,
    images: [lentilSoupImg],
    description: 'Warming, filling, and wonderfully wholesome - comfort in every spoonful.',
    servings: 8,
    altText: 'Hearty lentil soup with vegetables in rustic bowl - warming vegetarian soup recipe',
    ingredients: [
      '2 cups dried lentils, rinsed',
      '1 onion, diced',
      '3 carrots, diced',
      '3 celery stalks, diced',
      '4 cloves garlic, minced',
      '6 cups vegetable broth',
      '1 can (14 oz) diced tomatoes',
      '2 tsp cumin',
      '1 tsp thyme',
      '2 bay leaves',
      'Salt and pepper to taste',
      '2 tbsp olive oil',
      'Fresh herbs for garnish'
    ],
    instructions: [
      'Heat olive oil in large pot over medium heat',
      'Sauté onion, carrots, and celery until softened, about 5 minutes',
      'Add garlic and spices, cook 1 minute until fragrant',
      'Add lentils, broth, tomatoes, and bay leaves',
      'Bring to boil, then reduce heat and simmer',
      'Cook 30 minutes until lentils are tender',
      'Remove bay leaves, season with salt and pepper',
      'Serve hot with fresh bread'
    ],
    nutrition: {
      calories: 220,
      protein: '14g',
      carbs: '38g',
      fat: '2g'
    }
  },
  {
    id: 'classic-apple-pie',
    title: 'Classic Apple Pie',
    category: 'Desserts',
    country: 'UK',
    time: 90,
    images: [applePieImg],
    description: 'Golden, flaky crust with sweet-tart apples - a timeless favorite.',
    servings: 8,
    altText: 'Golden-brown classic apple pie with lattice crust - homemade traditional dessert',
    ingredients: [
      '2 pie crusts (homemade or store-bought)',
      '6-7 cups sliced apples (Granny Smith or Honeycrisp)',
      '¾ cup granulated sugar',
      '2 tbsp all-purpose flour',
      '1 tsp cinnamon',
      '¼ tsp nutmeg',
      '¼ tsp salt',
      '1 tbsp lemon juice',
      '2 tbsp butter',
      '1 egg (for egg wash)'
    ],
    instructions: [
      'Preheat oven to 425°F (220°C)',
      'Roll out one crust and place in 9-inch pie pan',
      'Mix apples with sugar, flour, spices, salt, and lemon juice',
      'Pour apple mixture into crust, dot with butter',
      'Cover with second crust, seal and crimp edges',
      'Cut slits in top for steam to escape',
      'Brush with beaten egg',
      'Bake 45-50 minutes until golden and bubbly',
      'Cool for at least 2 hours before serving'
    ],
    nutrition: {
      calories: 365,
      protein: '3g',
      carbs: '52g',
      fat: '17g'
    }
  },
  {
    id: 'garden-fresh-salad',
    title: 'Garden Fresh Salad',
    category: 'Salads',
    country: 'Italy',
    time: 10,
    images: [gardenSaladImg],
    description: 'Crisp, colorful, and bursting with flavor - nature on a plate.',
    servings: 4,
    altText: 'Fresh garden salad with mixed greens, tomatoes, and vegetables - healthy Italian salad recipe',
    ingredients: [
      '6 cups mixed salad greens',
      '1 cup cherry tomatoes, halved',
      '1 cucumber, sliced',
      '1 bell pepper, diced',
      '½ red onion, thinly sliced',
      '¼ cup extra virgin olive oil',
      '2 tbsp balsamic vinegar',
      '1 tsp Dijon mustard',
      '1 clove garlic, minced',
      'Salt and pepper to taste',
      'Fresh herbs (basil, parsley)'
    ],
    instructions: [
      'Wash and dry all vegetables thoroughly',
      'Combine greens, tomatoes, cucumber, pepper, and onion in large bowl',
      'In small bowl, whisk together olive oil, vinegar, mustard, and garlic',
      'Season dressing with salt and pepper',
      'Pour dressing over salad just before serving',
      'Toss gently to coat',
      'Garnish with fresh herbs',
      'Serve immediately'
    ],
    nutrition: {
      calories: 165,
      protein: '2g',
      carbs: '12g',
      fat: '13g'
    }
  },
  {
    id: 'traditional-roast-beef-dinner',
    title: 'Traditional Roast Beef Dinner with Yorkshire Puddings and Roast Potatoes',
    category: 'Main Dishes',
    country: 'UK',
    time: 150,
    images: [roastBeefDinnerImg],
    description: 'A quintessential British Sunday roast featuring tender beef, fluffy Yorkshire puddings, and golden roast potatoes.',
    servings: 6,
    altText: 'Traditional British roast beef dinner with Yorkshire puddings and roast potatoes - Sunday roast recipe',
    ingredients: [
      '2kg beef rib roast',
      '2kg potatoes, peeled and quartered',
      '4 tbsp beef dripping or vegetable oil',
      '6 large eggs',
      '300ml whole milk',
      '200g plain flour',
      'Salt and pepper to taste',
      '4 carrots, peeled',
      '2 parsnips, peeled',
      '500ml beef stock for gravy',
      '2 tbsp cornflour',
      'Fresh rosemary and thyme'
    ],
    instructions: [
      'Preheat oven to 220°C (425°F)',
      'Season beef with salt, pepper, and herbs. Roast at 220°C for 20 minutes',
      'Reduce heat to 180°C (350°F) and roast for 15 minutes per 500g for medium',
      'Parboil potatoes for 10 minutes, drain, and shake to roughen edges',
      'Roast potatoes in hot oil at 200°C for 45-60 minutes until golden',
      'Make Yorkshire pudding batter: whisk eggs, milk, flour, and salt. Rest 30 minutes',
      'Heat oil in muffin tin until smoking. Pour in batter and bake 20-25 minutes',
      'Roast carrots and parsnips with honey for final 45 minutes',
      'Rest beef for 20 minutes before carving',
      'Make gravy from pan juices, stock, and cornflour',
      'Serve beef sliced with Yorkshire puddings, roast potatoes, vegetables, and gravy'
    ],
    nutrition: {
      calories: 685,
      protein: '48g',
      carbs: '52g',
      fat: '32g'
    }
  },
  {
    id: 'leg-of-lamb-mint-jelly',
    title: 'Leg of Lamb with Homemade Mint Jelly Sauce and Roast Potato Noisettes',
    category: 'Main Dishes',
    country: 'UK',
    time: 135,
    images: [legOfLambImg],
    description: 'Succulent roasted leg of lamb paired with vibrant mint jelly and perfectly shaped potato noisettes.',
    servings: 8,
    altText: 'Roasted leg of lamb with mint jelly and potato noisettes - traditional British lamb dinner',
    ingredients: [
      '2kg leg of lamb',
      '6 cloves garlic, slivered',
      'Fresh rosemary sprigs',
      '1.5kg potatoes',
      '100ml vegetable oil',
      '2 cups fresh mint leaves',
      '1 cup white wine vinegar',
      '2 cups sugar',
      '100ml water',
      '1 packet pectin',
      'Salt and black pepper',
      'Olive oil for lamb'
    ],
    instructions: [
      'Preheat oven to 220°C (425°F)',
      'Make slits in lamb, insert garlic and rosemary. Rub with oil, salt, and pepper',
      'Roast lamb at 220°C for 30 minutes, then reduce to 180°C',
      'Continue roasting for 20 minutes per 500g for medium',
      'For mint jelly: combine chopped mint, vinegar, sugar, and water. Bring to boil',
      'Add pectin, boil hard for 1 minute. Strain and cool',
      'Using a melon baller, scoop potatoes into noisette shapes',
      'Parboil noisettes for 5 minutes, drain well',
      'Roast noisettes in hot oil at 200°C for 30-40 minutes until golden',
      'Rest lamb for 20 minutes before carving',
      'Serve sliced lamb with mint jelly and crispy potato noisettes'
    ],
    nutrition: {
      calories: 595,
      protein: '42g',
      carbs: '38g',
      fat: '28g'
    }
  },
  {
    id: 'roast-pork-crackling',
    title: 'Roast Pork with Crispy Crackling, Apple Sauce, Bread Sauce, and Honey-Glazed Vegetables',
    category: 'Main Dishes',
    country: 'UK',
    time: 165,
    images: [roastPorkImg],
    description: 'Perfectly roasted pork with crackling that shatters, accompanied by traditional British sauces and glazed root vegetables.',
    servings: 8,
    altText: 'Roast pork with crispy crackling and honey-glazed vegetables - traditional British pork roast',
    ingredients: [
      '2.5kg pork loin with skin',
      '2 tbsp sea salt for crackling',
      '4 Bramley apples, peeled and chopped',
      '50g butter',
      '2 tbsp sugar',
      '600ml whole milk for bread sauce',
      '1 onion, studded with cloves',
      '150g fresh white breadcrumbs',
      '4 parsnips, halved lengthways',
      '6 carrots, halved',
      '3 tbsp organic honey',
      'Olive oil, salt, pepper'
    ],
    instructions: [
      'Pat pork skin completely dry. Score skin and rub with sea salt',
      'Let pork sit uncovered in fridge for 2 hours to dry skin',
      'Preheat oven to 230°C (450°F)',
      'Roast pork at 230°C for 30 minutes until crackling forms',
      'Reduce heat to 180°C, continue roasting 25 minutes per 500g',
      'For apple sauce: cook apples with butter and sugar until soft, then mash',
      'For bread sauce: heat milk with clove-studded onion. Remove onion, stir in breadcrumbs',
      'Parboil parsnips and carrots for 5 minutes',
      'Roast vegetables with honey glaze at 200°C for 45 minutes',
      'Rest pork for 20 minutes. Remove crackling and cut into pieces',
      'Carve pork and serve with crackling, sauces, and honey-glazed vegetables'
    ],
    nutrition: {
      calories: 720,
      protein: '52g',
      carbs: '48g',
      fat: '35g'
    }
  },
  {
    id: 'roast-chicken-trimmings',
    title: 'Free Range Roast Chicken with Traditional Trimmings and Honey-Glazed Pigs in Blankets',
    category: 'Main Dishes',
    country: 'UK',
    time: 120,
    images: [roastChickenImg],
    description: 'A succulent free-range roast chicken with all the traditional accompaniments including honey-glazed pigs in blankets.',
    servings: 6,
    altText: 'Golden roast chicken with pigs in blankets and roast potatoes - traditional British chicken dinner',
    ingredients: [
      '2kg free-range chicken',
      '1 lemon, halved',
      'Fresh thyme and rosemary',
      '12 chipolata sausages',
      '12 rashers streaky bacon',
      '2 tbsp honey',
      '1kg potatoes for roasting',
      '6 pork sausages',
      '500ml chicken stock',
      'Stuffing mix (sage and onion)',
      'Butter, salt, pepper',
      'Vegetables of choice'
    ],
    instructions: [
      'Preheat oven to 200°C (400°F)',
      'Stuff chicken cavity with lemon and herbs. Rub with butter, season well',
      'Roast chicken for 20 minutes per 500g plus 20 minutes extra',
      'Wrap each chipolata in bacon to make pigs in blankets',
      'Roast pigs in blankets and pork sausages for final 30 minutes',
      'Brush pigs in blankets with honey 5 minutes before done',
      'Prepare stuffing according to package and bake alongside',
      'Parboil potatoes, roughen, and roast in hot oil until crispy',
      'Make gravy from pan juices and stock',
      'Rest chicken for 15 minutes before carving',
      'Serve carved chicken with pigs in blankets, sausages, roast potatoes, stuffing, and gravy'
    ],
    nutrition: {
      calories: 645,
      protein: '54g',
      carbs: '42g',
      fat: '28g'
    }
  }
];

export const categories = ['All', 'Soups', 'Desserts', 'Juices', 'Salads', 'Main Dishes'];
