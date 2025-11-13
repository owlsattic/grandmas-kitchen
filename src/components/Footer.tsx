import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);

  return (
    <footer style={{
      textAlign: 'center',
      padding: '1.5rem',
      color: '#856a4a',
      background: '#fffdf9',
      borderTop: '1px solid #eee'
    }}>
      <nav style={{ marginBottom: '.5rem', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        <Link to="/recipes" style={{ color: 'inherit', textDecoration: 'none' }}>Recipes</Link>
        <Link to="/shop" style={{ color: 'inherit', textDecoration: 'none' }}>Shop</Link>
        <Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>About</Link>
        <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
        <Link to="/disclosure" style={{ color: 'inherit', textDecoration: 'none' }}>Disclosure</Link>
        <a href="mailto:hello@grandmaskitchen.org" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
        {isAdmin && (
          <Link to="/admin" style={{ color: 'inherit', textDecoration: 'none' }}>Admin Panel</Link>
        )}
      </nav>
      <small>© {currentYear} Grandma's Kitchen • Simple food. Lifelong health.</small>
    </footer>
  );
};

export default Footer;
