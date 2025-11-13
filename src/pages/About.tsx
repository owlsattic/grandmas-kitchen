import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import heroImage from '@/assets/hero-kitchen.jpg';
import { OrganizationSchema } from '@/components/StructuredData';
import { FAQSchema } from '@/components/FAQSchema';

const About = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, role } = useUserRole(user?.id);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About Our 104-Year Legacy | Grandma's Kitchen</title>
        <meta 
          name="description" 
          content="Learn about our grandmother's 104-year legacy of simple, wholesome cooking. Real food, no fuss, proper nourishment shared with love across generations." 
        />
        <link rel="canonical" href={`${window.location.origin}/about`} />
      </Helmet>
      
      {/* Organization Schema */}
      <OrganizationSchema />

      {/* FAQ Schema */}
      <FAQSchema 
        items={[
          {
            question: "What is Grandma's Kitchen?",
            answer: "Grandma's Kitchen is a celebration of a 104-year legacy of simple, wholesome cooking. We share traditional family recipes and quality kitchen products, passed down through generations."
          },
          {
            question: "What kind of recipes do you share?",
            answer: "We focus on simple, nourishing recipes using real ingredients. From 5-minute juices to hearty family dinners, our recipes are designed to be practical and accessible for everyone."
          },
          {
            question: "What is your cooking philosophy?",
            answer: "Our philosophy is simple: use fresh, seasonal ingredients when possible, cook simple meals that don't steal your evening, avoid ultra-processed shortcuts, and share meals around the table."
          },
          {
            question: "How do I get started?",
            answer: "Browse our recipe library to discover traditional family recipes. All recipes include clear step-by-step instructions, ingredient lists, and can be printed for easy reference while cooking."
          }
        ]}
      />

      <header className="bg-grandma-cream border-b border-border" role="banner">
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl md:text-3xl font-serif font-bold hover:text-primary transition-colors">
                Grandma's Kitchen
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link to="/recipes" className="text-muted-foreground hover:text-foreground transition-colors">
                  Recipes
                </Link>
                <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
                  Shop
                </Link>
                <Link to="/about" className="text-foreground font-medium">
                  About
                </Link>
              </nav>
            </div>
            <div className="flex gap-2">
              {user ? (
                <Button variant="ghost" onClick={signOut}>
                  Sign Out
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main id="main" role="main" className="notebook-main container mx-auto max-w-5xl">
        <section className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ 
            background: `url(${heroImage}) center/cover no-repeat`, 
            minHeight: '260px', 
            display: 'flex', 
            alignItems: 'flex-end' 
          }}>
            <h1 style={{ 
              margin: 0, 
              padding: '28px 24px', 
              color: '#fff', 
              textShadow: '0 2px 8px rgba(0,0,0,.35)', 
              fontSize: '2.2rem',
              fontFamily: "'Homemade Apple', cursive"
            }}>
              A 104-Year Legacy of Simple, Nourishing Food
            </h1>
          </div>
        </section>

        <section className="panel">
          <span className="handwritten">Our Story</span>
          <p>
            Grandma's Kitchen is more than a website — it's a celebration of a life well-lived through simple,
            wholesome cooking. Our grandmother lived to 104, and her "secret" was no secret at all:
            real ingredients, no fuss, proper nourishment shared with people you love.
          </p>

          <blockquote className="panel" style={{ background: '#f6e7cf' }}>
            <p style={{ margin: 0, fontSize: '1.05rem' }}>
              "Good food doesn't need to be complicated. It needs to be honest, fresh, and made with love."
            </p>
            <footer style={{ opacity: 0.75, marginTop: '0.35rem' }}>— Grandma</footer>
          </blockquote>
        </section>

          <section className="panel">
            <span className="handwritten">Our Mission (2026)</span>
            <p>
              We exist to bring families back to the table — one real meal at a time. In a world of speed and shortcuts,
              we slow down to honour the wisdom that nourished generations: cook simply, eat together, and care for your
              body like it carries your whole life (because it does).
            </p>
            <ul>
              <li><strong>Reconnect generations</strong> through recipes, stories, and weekly traditions.</li>
              <li><strong>Make real food doable</strong> with clear steps, printable cards, and budget-friendly swaps.</li>
              <li><strong>Champion honesty</strong> in ingredients, recommendations, and the way we earn.</li>
            </ul>
          </section>

          <section className="panel">
            <span className="handwritten">Why We Do This</span>
            <p>
              We've traded wooden spoons for microwave buttons and lost more than flavour along the way — we lost the
              conversation, the skills, and the quiet joy of making something good from simple things. Grandma's Kitchen
              helps you get that back.
            </p>
          <div className="row">
            <div className="panel" style={{ flex: '1 1 260px' }}>
              <h3 style={{ marginTop: 0 }}>Because real food heals</h3>
              <p>Home cooking improves health, mood, and connection — without extreme rules or labels.</p>
            </div>
            <div className="panel" style={{ flex: '1 1 260px' }}>
              <h3 style={{ marginTop: 0 }}>Because skills are legacy</h3>
              <p>Passing on simple methods means our children inherit confidence, not confusion, in the kitchen.</p>
            </div>
            <div className="panel" style={{ flex: '1 1 260px' }}>
              <h3 style={{ marginTop: 0 }}>Because together beats perfect</h3>
              <p>We prefer shared meals to perfect plates. Imperfect food cooked with care still tastes like love.</p>
            </div>
          </div>
        </section>

          <section className="panel">
            <span className="handwritten">The Philosophy</span>
            <ul>
              <li>Use fresh, seasonal ingredients when possible; keep the pantry honest.</li>
              <li>Cook simple meals that don't steal your evening.</li>
              <li>Avoid ultra-processed shortcuts; choose real fats, fibre, and flavour.</li>
              <li>Make cooking a calm, repeatable practice — not a performance.</li>
              <li>Share meals; stories taste better around a table.</li>
            </ul>
          </section>

          <section className="panel">
            <span className="handwritten">Our Promise</span>
            <ul>
              <li><strong>Honest:</strong> No fads, no fluff. Clear methods, real ingredients.</li>
              <li><strong>Practical:</strong> Step-by-step recipes, substitutions, and make-ahead notes.</li>
              <li><strong>Uplifting:</strong> Every page should feel like a warm hug from Grandma.</li>
              <li><strong>Inclusive:</strong> New cooks welcome. Small kitchens welcome. Tight budgets welcome.</li>
            </ul>

          <h3>Our Tone & Voice</h3>
          <p>
            <strong>Warm, nostalgic, honest.</strong> We write like a caring friend at your kitchen table —
            plain language, gentle storytelling, and zero guilt. We favour clarity over jargon and kindness
            over cleverness.
          </p>
        </section>

          <section className="panel">
            <span className="handwritten">How We Help</span>
            <ul>
              <li><strong>Recipe Library:</strong> Real-food classics, 5-minute juices, hearty family dinners.</li>
              <li><strong>Printable Recipe Cards & Planners:</strong> A5 pages you can pin, file, or cook from on an iPad.</li>
              <li><strong>Grandma's Tips:</strong> Budget swaps, batch-cook plans, and simple skills for confidence.</li>
              <li><strong>Curated Shop:</strong> Only tools we actually use and trust — clearly marked with affiliate links.</li>
            </ul>
          <Button asChild className="notebook-button" style={{ marginTop: '0.5rem' }}>
            <Link to="/recipes">Explore Recipes</Link>
          </Button>
        </section>

          <section className="panel">
            <span className="handwritten">A Note From Our Family</span>
            <p>
              We're building Grandma's Kitchen as a living legacy — a place where our children and yours can learn the
              gentle art of cooking well. If something here helps you make one more home-cooked meal this week, we've done our job.
            </p>
          </section>
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4">
          {user && isAdmin && (
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">Admin Panel</Link>
              </Button>
            </div>
          )}
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 Grandma's Kitchen • All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
