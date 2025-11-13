import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Reset = () => {
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
        className="py-8 px-6"
        style={{
          background: 'repeating-linear-gradient(to bottom, #fffdf9, #fffdf9 28px, #fff8ed 29px)',
          borderLeft: '6px solid #e6c89a'
        }}
      >
        <section 
          className="panel max-w-[820px] mx-auto p-8"
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
            Free Download
          </span>
          
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#4b6043', marginTop: '.2rem' }}>
            Grandma's 3-Day Real Food Reset
          </h2>
          
          <p className="text-lg leading-relaxed mb-4" style={{ color: '#3a3124' }}>
            Feel lighter, calmer, and properly fed — with simple meals, a short shopping list, and zero crazy rules.
          </p>
          
          <ul className="text-lg mb-6 space-y-2" style={{ color: '#3a3124' }}>
            <li>✓ 3 days of simple real-food meals (no fads)</li>
            <li>✓ Printable A5 plan + grocery list</li>
            <li>✓ Grandma's tips for budget swaps & batch prep</li>
          </ul>

          {/* Form Section */}
          <div 
            className="panel p-6 mb-6"
            style={{
              background: '#fffefb',
              border: '1px solid #e9ddcc',
              borderRadius: '14px'
            }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: '#4b6043', marginTop: 0 }}>
              Get it by email
            </h3>
            
            {/* Replace with MailerLite / Brevo embed */}
            <form onSubmit={(e) => { 
              e.preventDefault(); 
              const button = e.currentTarget.querySelector('button[type=submit]') as HTMLButtonElement;
              if (button) button.disabled = true;
            }}>
              <label className="block mb-2 font-semibold" style={{ color: '#3a3124' }}>
                Email
              </label>
              <input 
                type="email" 
                required 
                placeholder="you@example.com"
                className="w-full max-w-[420px] p-3 border rounded-lg mb-3"
                style={{ 
                  borderColor: '#decbb0',
                  borderRadius: '8px'
                }}
              />
              <Button 
                type="submit"
                className="font-semibold px-6 py-3 rounded-lg transition-all hover:translate-y-[-2px]"
                style={{ 
                  background: '#c97a40',
                  color: '#fff'
                }}
              >
                Send me the 3-Day Reset
              </Button>
              <p className="text-sm mt-2" style={{ color: '#6b5b46' }}>
                By subscribing, you agree to our <Link to="/privacy" className="underline">Privacy Policy</Link>. Unsubscribe anytime.
              </p>
            </form>
          </div>

          {/* Quote */}
          <blockquote 
            className="panel p-6"
            style={{
              background: '#fffdf9',
              border: '1px solid #e9ddcc',
              borderRadius: '14px',
              fontStyle: 'italic'
            }}
          >
            <p className="text-lg mb-2" style={{ color: '#3a3124' }}>
              "Good food doesn't need to be complicated. It needs to be honest, fresh, and made with love."
            </p>
            <footer 
              style={{ 
                fontFamily: "'Homemade Apple', cursive", 
                color: '#c97a40',
                fontStyle: 'normal'
              }}
            >
              — Grandma
            </footer>
          </blockquote>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm" style={{ color: '#856a4a' }}>
        © 2025 Grandma's Kitchen — All Rights Reserved
      </footer>
    </div>
  );
};

export default Reset;
