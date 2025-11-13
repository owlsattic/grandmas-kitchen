import { Link } from "react-router-dom";

interface AffiliateNoteProps {
  variant?: 'full' | 'short' | 'footer';
  className?: string;
}

const AffiliateNote = ({ variant = 'full', className = '' }: AffiliateNoteProps) => {
  if (variant === 'short') {
    return (
      <p className={`affiliate-note ${className}`}>
        As an Amazon Associate, we earn from qualifying purchases.{' '}
        <Link to="/disclosure">More info ›</Link>
      </p>
    );
  }

  if (variant === 'footer') {
    return (
      <p className={`affiliate-note affiliate-footer ${className}`}>
        <strong>Heads up:</strong> This page contains affiliate links. As an Amazon Associate, we earn from qualifying purchases.{' '}
        <Link to="/disclosure">Full disclosure ›</Link>
      </p>
    );
  }

  return (
    <p className={`affiliate-note ${className}`}>
      <strong>Note from Grandma's Kitchen:</strong> Some of our links are affiliate links — which means we may earn a small commission if you buy through them. It never costs you extra, and it helps us keep sharing real-food recipes and free printable guides.{' '}
      <Link to="/disclosure">Learn more ›</Link>
    </p>
  );
};

export default AffiliateNote;
