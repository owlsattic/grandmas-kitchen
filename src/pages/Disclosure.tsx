import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Disclosure = () => {
  return (
    <>
      <Helmet>
        <title>Affiliate Disclosure • Grandma's Kitchen</title>
        <meta name="description" content="Affiliate disclosure for Grandma's Kitchen. We may earn small commissions from links we recommend, at no extra cost to you." />
      </Helmet>

      <div style={{ 
        background: 'repeating-linear-gradient(to bottom, #fffdf9, #fffdf9 28px, #fff8ed 29px)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #eee',
          background: '#fffdf9'
        }}>
          <div style={{ margin: 0, color: '#4b6043', fontSize: '1.5rem', fontWeight: 600 }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Grandma's Kitchen</Link>
          </div>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#4b6043', fontWeight: 600 }}>Home</Link>
            <Link to="/recipes" style={{ textDecoration: 'none', color: '#4b6043', fontWeight: 600 }}>Recipes</Link>
            <Link to="/shop" style={{ textDecoration: 'none', color: '#4b6043', fontWeight: 600 }}>Shop</Link>
            <Link to="/about" style={{ textDecoration: 'none', color: '#4b6043', fontWeight: 600 }}>About</Link>
          </nav>
        </header>

        <main style={{ flex: 1, padding: '40px 20px' }}>
          <section style={{
            background: '#fffdf9',
            border: '1px solid #e9ddcc',
            borderRadius: '14px',
            padding: '30px 24px',
            margin: '0 auto',
            maxWidth: '900px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
          }}>
            <h1 style={{
              fontFamily: "'Homemade Apple', cursive",
              color: '#c97a40',
              fontSize: '1.5rem',
              marginBottom: '1rem'
            }}>Affiliate Disclosure</h1>
            
            <p><strong>Last updated:</strong> 29 October 2025</p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>1) Honest recommendations only</h2>
            <p>
              Grandma's Kitchen sometimes uses <strong>affiliate links</strong> when we share kitchen tools,
              cookbooks, or pantry items that we personally use or genuinely recommend.
              This means that if you click a link and buy something, we may earn a small commission — 
              at <strong>no extra cost to you</strong>.
            </p>

            <p>
              We carefully choose every item we mention.
              We only recommend products we believe meet Grandma's standards:
              simple, practical, and built to last.
            </p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>2) Why we use affiliate links</h2>
            <ul style={{ lineHeight: 1.6 }}>
              <li>They help cover our hosting and ingredient costs.</li>
              <li>They allow us to keep recipes and printables free for readers.</li>
              <li>They ensure we can stay independent — no paid reviews, no gimmicks.</li>
            </ul>

            <p>
              We believe in full transparency.
              If we ever receive a product for free, sponsorship, or review request,
              it will always be <strong>clearly labelled</strong>.
            </p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>3) How it works</h2>
            <ul style={{ lineHeight: 1.6 }}>
              <li>When you click an affiliate link (for example, on Amazon UK), a small tracking code tells the shop that you came from Grandma's Kitchen.</li>
              <li>If you buy something within a short period (usually 24 hours), we may earn a tiny commission.</li>
              <li>It doesn't affect your price or your order in any way.</li>
            </ul>

            <p><em>Example:</em> Grandma's Kitchen is an Amazon Associate and earns from qualifying purchases made through affiliate links.</p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>4) Our promise to you</h2>
            <ul style={{ lineHeight: 1.6 }}>
              <li>No "sponsored" posts disguised as genuine advice.</li>
              <li>No pushing products we don't use ourselves.</li>
              <li>No hidden links or cookie stuffing — everything is upfront and visible.</li>
            </ul>

            <div style={{
              background: '#f8efde',
              border: '1px solid #e9ddcc',
              borderRadius: '14px',
              padding: '20px',
              marginTop: '1rem',
              fontStyle: 'italic'
            }}>
              <p style={{ margin: '0 0 .5rem 0' }}>"Grandma always said: never recommend what you wouldn't buy yourself."</p>
              <footer style={{ textAlign: 'right', color: '#6b5b46' }}>— Grandma's Kitchen</footer>
            </div>

            <p style={{ marginTop: '1.5rem' }}>
              If you ever have questions about a recommendation or want to know more about a specific product link, please reach out to us at{' '}
              <a href="mailto:hello@grandmaskitchen.org" style={{ color: '#c97a40' }}>hello@grandmaskitchen.org</a>.
            </p>

            <p style={{ marginTop: '1rem' }}>
              <Link 
                to="/shop" 
                style={{
                  background: '#c97a40',
                  color: '#fff',
                  fontWeight: 600,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                Visit Grandma's Shop
              </Link>
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Disclosure;
