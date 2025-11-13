import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ThankYou = () => {
  return (
    <div className="min-h-screen bg-[#fffaf3]">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-border bg-[#fffdf9]">
        <Link to="/">
          <h1 className="text-2xl font-bold" style={{ color: '#4b6043' }}>
            Grandma's Kitchen
          </h1>
        </Link>
        <nav className="flex gap-6">
          <Link to="/" className="font-semibold hover:text-[#c97a40] transition-colors" style={{ color: '#4b6043' }}>
            Home
          </Link>
          <Link to="/recipes" className="font-semibold hover:text-[#c97a40] transition-colors" style={{ color: '#4b6043' }}>
            Recipes
          </Link>
          <Link to="/shop" className="font-semibold hover:text-[#c97a40] transition-colors" style={{ color: '#4b6043' }}>
            Shop
          </Link>
          <Link to="/about" className="font-semibold hover:text-[#c97a40] transition-colors" style={{ color: '#4b6043' }}>
            About
          </Link>
        </nav>
      </header>

      {/* Main Content with Notebook Background */}
      <main 
        className="py-16 px-6 text-center"
        style={{
          background: 'repeating-linear-gradient(to bottom, #fffdf9, #fffdf9 28px, #fff8ed 29px)',
          borderLeft: '6px solid #e6c89a'
        }}
      >
        <section 
          className="panel max-w-[620px] mx-auto p-8"
          style={{
            background: '#fffdf9',
            border: '1px solid #e9ddcc',
            borderRadius: '14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
          }}
        >
          <span 
            className="handwritten block mb-4 text-2xl"
            style={{
              fontFamily: "'Homemade Apple', cursive",
              color: '#c97a40'
            }}
          >
            Thank You!
          </span>
          
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#4b6043' }}>
            Your Real Food Journey Begins Here 🍎
          </h2>
          
          <p className="text-lg leading-relaxed mb-4" style={{ color: '#3a3124' }}>
            You're all set — Grandma's 3-Day <strong>Real Food Reset</strong> is on its way to your inbox.
            We're thrilled to have you join our kitchen family.
          </p>
          
          <p className="text-lg leading-relaxed mb-6" style={{ color: '#3a3124' }}>
            While you wait, take a look through our most-loved recipes and discover
            simple, wholesome meals to fill your week with goodness.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/recipes">
              <Button 
                className="font-semibold px-6 py-3 rounded-lg transition-all hover:translate-y-[-2px]"
                style={{ 
                  background: '#c97a40',
                  color: '#fff'
                }}
              >
                Explore Recipes
              </Button>
            </Link>
            <Link to="/shop">
              <Button 
                className="font-semibold px-6 py-3 rounded-lg transition-all hover:translate-y-[-2px]"
                style={{ 
                  background: '#4b6043',
                  color: '#fff'
                }}
              >
                Visit Our Shop
              </Button>
            </Link>
          </div>

          <hr style={{ 
            border: 'none', 
            borderTop: '1px dashed #decbb0', 
            margin: '2rem 0' 
          }} />

          <p 
            className="italic max-w-[480px] mx-auto mb-2"
            style={{ color: '#3a3124' }}
          >
            "The secret to feeling well isn't hidden in a supplement —
            it's simmering in your kitchen pot."
          </p>
          <p 
            style={{ 
              fontFamily: "'Homemade Apple', cursive", 
              color: '#c97a40' 
            }}
          >
            — Grandma
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm" style={{ color: '#856a4a' }}>
        © 2025 Grandma's Kitchen — All Rights Reserved
      </footer>
    </div>
  );
};

export default ThankYou;
