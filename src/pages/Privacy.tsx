import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy • Grandma's Kitchen</title>
        <meta name="description" content="Plain-English privacy policy for Grandma's Kitchen." />
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
            }}>Privacy Policy</h1>
            
            <p><strong>Effective date:</strong> 29 October 2025</p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>1) Who we are</h2>
            <p><strong>Data Controller:</strong> Grandma's Kitchen (United Kingdom)</p>
            <p>Contact: <a href="mailto:hello@grandmaskitchen.org" style={{ color: '#c97a40' }}>hello@grandmaskitchen.org</a></p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>2) What we collect (and why)</h2>
            <ul style={{ lineHeight: 1.6 }}>
              <li><strong>Email address</strong> — when you subscribe or request downloads (to send what you asked for and occasional updates).</li>
              <li><strong>Name (optional)</strong> — helps personalise emails.</li>
              <li><strong>Basic site activity</strong> — anonymous, aggregate usage (e.g., which pages are popular) to improve the site.</li>
            </ul>
            <p><strong>Lawful bases:</strong> consent (email marketing), contract (sending the download you requested), and legitimate interests (site security, performance, basic analytics).</p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>3) What we do <em>not</em> collect</h2>
            <ul style={{ lineHeight: 1.6 }}>
              <li>No sensitive categories (health, religion, etc.).</li>
              <li>No payment details on this site (we link out to trusted platforms if/when needed).</li>
            </ul>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>4) Cookies & analytics</h2>
            <p>We aim to keep cookies minimal. Essential cookies (for security or delivering the site) may run without consent. If we add non-essential analytics or marketing cookies in the future, we'll show a clear banner to ask for your permission first.</p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>5) Email: how we use your data</h2>
            <ul style={{ lineHeight: 1.6 }}>
              <li>We use a reputable email service (e.g., MailerLite or Brevo) to send downloads and newsletters.</li>
              <li>Every email includes an <strong>Unsubscribe</strong> link — one click and you're out.</li>
              <li>We keep your email until you unsubscribe or ask us to delete it.</li>
            </ul>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>6) Sharing</h2>
            <p>We don't sell your data. We only share with trusted processors needed to run the site (hosting, email delivery). They can't use your data for their own purposes.</p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>7) Your rights (UK GDPR)</h2>
            <ul style={{ lineHeight: 1.6 }}>
              <li>Access, correct, delete your data</li>
              <li>Object or restrict certain processing</li>
              <li>Data portability (a copy you can reuse)</li>
              <li>Withdraw consent at any time (e.g., unsubscribe)</li>
            </ul>
            <p>To use these rights, email <a href="mailto:hello@grandmaskitchen.org" style={{ color: '#c97a40' }}>hello@grandmaskitchen.org</a>. You also have the right to complain to the ICO (UK).</p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>8) Retention</h2>
            <p>We keep personal data only as long as needed to deliver what you asked for or meet legal requirements, then delete or anonymise it.</p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>9) Security</h2>
            <p>We follow good security practices, use reputable providers, and limit access. No internet service can be 100% secure, but we work to protect your information.</p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>10) Affiliate links</h2>
            <p>Some product links may be affiliate links. If you click and buy, we may earn a small commission at no extra cost to you. We only recommend items we genuinely find useful.</p>

            <h2 style={{ color: '#4b6043', marginTop: '1.5rem', marginBottom: '.5rem' }}>11) Changes</h2>
            <p>If we update this policy, we'll change the date at the top. Significant changes will be highlighted on this page.</p>

            <p style={{ marginTop: '1.5rem' }}>
              <Link 
                to="/reset" 
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
                Get the 3-Day Real Food Reset
              </Link>
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Privacy;
