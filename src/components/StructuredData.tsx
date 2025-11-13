import { Helmet } from 'react-helmet';

interface OrganizationSchemaProps {
  url?: string;
}

export const OrganizationSchema = ({ url }: OrganizationSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Grandma's Kitchen",
    "description": "Traditional family recipes and quality kitchen products, passed down through generations",
    "url": url || window.location.origin,
    "logo": `${window.location.origin}/src/assets/grandmas-kitchen-logo.png`,
    "sameAs": []
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface RecipeSchemaProps {
  name: string;
  description: string;
  image?: string | string[];
  prepTime?: number;
  cookTime?: number;
  totalTime: number;
  recipeYield: number;
  recipeCategory: string;
  recipeIngredient: string[];
  recipeInstructions: string[];
  nutrition?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
}

export const RecipeSchema = ({
  name,
  description,
  image,
  prepTime,
  cookTime,
  totalTime,
  recipeYield,
  recipeCategory,
  recipeIngredient,
  recipeInstructions,
  nutrition
}: RecipeSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": name,
    "description": description,
    "image": image,
    "prepTime": prepTime ? `PT${prepTime}M` : undefined,
    "cookTime": cookTime ? `PT${cookTime}M` : undefined,
    "totalTime": `PT${totalTime}M`,
    "recipeYield": `${recipeYield} servings`,
    "recipeCategory": recipeCategory,
    "recipeIngredient": recipeIngredient,
    "recipeInstructions": recipeInstructions.map((instruction, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "text": instruction
    })),
    "nutrition": nutrition ? {
      "@type": "NutritionInformation",
      "calories": nutrition.calories,
      "proteinContent": nutrition.protein,
      "carbohydrateContent": nutrition.carbs,
      "fatContent": nutrition.fat
    } : undefined,
    "author": {
      "@type": "Organization",
      "name": "Grandma's Kitchen"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface ProductSchemaProps {
  name: string;
  description: string;
  image?: string | string[];
  brand?: string;
  sku?: string;
  offers?: {
    price?: number;
    priceCurrency?: string;
    availability?: string;
    url: string;
  };
}

export const ProductSchema = ({
  name,
  description,
  image,
  brand,
  sku,
  offers
}: ProductSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "image": image,
    "brand": brand ? {
      "@type": "Brand",
      "name": brand
    } : undefined,
    "sku": sku,
    "offers": offers ? {
      "@type": "Offer",
      "price": offers.price,
      "priceCurrency": offers.priceCurrency || "GBP",
      "availability": offers.availability || "https://schema.org/InStock",
      "url": offers.url,
      "seller": {
        "@type": "Organization",
        "name": "Grandma's Kitchen"
      }
    } : undefined
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
