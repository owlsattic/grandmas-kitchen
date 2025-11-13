import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('gk_cookie_ok');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gk_cookie_ok', '1');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      left: '12px',
      right: '12px',
      bottom: '12px',
      zIndex: 9999,
      maxWidth: '900px',
      margin: '0 auto',
      background: '#fffdf9',
      border: '1px solid #e9ddcc',
      borderRadius: '14px',
      padding: '20px 24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <p style={{ margin: '.2rem 0 .5rem 0', color: '#3a3124' }}>
        We use essential cookies to run this site. If we add analytics or marketing cookies, we'll ask for your permission first.{' '}
        <Link to="/privacy" style={{ color: '#c97a40' }}>Learn more</Link>.
      </p>
      <button
        onClick={handleAccept}
        style={{
          background: '#c97a40',
          color: '#fff',
          fontWeight: 600,
          padding: '10px 18px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          marginTop: '.5rem'
        }}
      >
        Okay
      </button>
    </div>
  );
};

export default CookieBanner;
