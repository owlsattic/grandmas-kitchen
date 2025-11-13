import { Link } from 'react-router-dom';
import GrandmaApprovedBadge from "./GrandmaApprovedBadge";
import sunflowerBadge from "@/assets/sunflower-badge.png";

interface ProductCardProps {
  id: string;
  title: string;
  description?: string;
  priceText?: string;
  imageUrl: string;
  productUrl: string;
  approved?: boolean;
  tip?: boolean;
  favorite?: boolean;
  category?: string;
  amazonTag?: string;
  highlightedTitle?: string;
  highlightedDescription?: string;
  hasFAB?: boolean;
  ribbonLabels?: {
    approved?: string;
    tip?: string;
    favorite?: string;
  };
}

const ProductCard = ({
  id,
  title,
  description,
  priceText,
  imageUrl,
  productUrl,
  approved = true,
  tip = false,
  favorite = false,
  category,
  amazonTag = 'grandmaskitch-21',
  highlightedTitle,
  highlightedDescription,
  hasFAB = false,
  ribbonLabels
}: ProductCardProps) => {
  // Add Amazon affiliate tag if it's an Amazon URL
  const finalUrl = (() => {
    try {
      const url = new URL(productUrl);
      if (/amazon\./i.test(url.hostname) && !url.searchParams.has('tag') && amazonTag) {
        url.searchParams.set('tag', amazonTag);
      }
      return url.toString();
    } catch {
      return productUrl;
    }
  })();

  return (
    <div className="card product-card" data-approved={approved ? "1" : "0"}>
      {tip && (
        <div className="ribbon-bl">
          <span>{ribbonLabels?.tip || "Grandma's Tip"}</span>
        </div>
      )}
      {favorite && (
        <div className="ribbon-bc">
          <span>{ribbonLabels?.favorite || 'Family Favourite'}</span>
        </div>
      )}
      
      <div className="relative">
        <img 
          className="product-image" 
          src={imageUrl || '/placeholder.svg'} 
          alt={`${title} - ${category || 'kitchen product'} from Grandma's Kitchen`}
          loading="lazy"
        />
        
        {hasFAB && (
          <img 
            src={sunflowerBadge}
            alt="Complete FAB Analysis Available"
            className="absolute top-2 right-2 w-16 h-16 object-contain drop-shadow-lg"
          />
        )}
      </div>
      
      <div className="product-body">
        <h3 
          className="product-title"
          dangerouslySetInnerHTML={{ __html: highlightedTitle || title }}
        />
        {description && (
          <p 
            className="product-desc"
            dangerouslySetInnerHTML={{ __html: highlightedDescription || description }}
          />
        )}
        
        <Link 
          to={`/product/${id}`}
          className="button product-link"
        >
          <span className="block">View Product and</span>
          <span className="block">Price on Amazon</span>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
