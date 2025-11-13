interface GrandmaApprovedBadgeProps {
  variant?: 'badge' | 'pill';
  className?: string;
}

const GrandmaApprovedBadge = ({ variant = 'badge', className = '' }: GrandmaApprovedBadgeProps) => {
  if (variant === 'pill') {
    return (
      <span className={`gk-aff-pill ${className}`} aria-hidden="true">
        Approved
      </span>
    );
  }

  return (
    <span className={`badge-approved ${className}`}>
      Grandma Approved
    </span>
  );
};

export default GrandmaApprovedBadge;
