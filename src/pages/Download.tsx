import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";

const Download = () => {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href="https://grandmaskitchen.org/" />
      </Helmet>
      
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
            className="panel max-w-[740px] mx-auto p-8 text-center"
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
              Here you go!
            </span>
            
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#4b6043' }}>
              Download your 3-Day Real Food Reset
            </h2>

            {/* Update the PDF path to your actual file */}
            <p className="mb-4">
              <a 
                className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-lg transition-all hover:translate-y-[-2px]"
                href="/assets/pdfs/real-food-reset.pdf" 
                download
                style={{ 
                  background: '#c97a40',
                  color: '#fff',
                  textDecoration: 'none'
                }}
              >
                ⬇️ Download the PDF
              </a>
            </p>

            <p className="text-base mb-6" style={{ color: '#3a3124' }}>
              Tip: Save it to your phone Files app or print the A5 pages for your binder.
            </p>

            <hr style={{ 
              border: 'none', 
              borderTop: '1px dashed #decbb0', 
              margin: '1.5rem 0' 
            }} />

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div 
                className="flex-1 p-6"
                style={{
                  background: '#fffefb',
                  border: '1px solid #e9ddcc',
                  borderRadius: '14px'
                }}
              >
                <h3 className="text-xl font-bold mb-3" style={{ color: '#4b6043', marginTop: 0 }}>
                  Next Steps
                </h3>
                <ul className="text-left space-y-2" style={{ color: '#3a3124' }}>
                  <li>Pick your start day (tomorrow works!)</li>
                  <li>Do one shop run with the list</li>
                  <li>Batch-prep 2 base items (soup + grains)</li>
                </ul>
              </div>
              
              <div 
                className="flex-1 p-6"
                style={{
                  background: '#fffefb',
                  border: '1px solid #e9ddcc',
                  borderRadius: '14px'
                }}
              >
                <h3 className="text-xl font-bold mb-3" style={{ color: '#4b6043', marginTop: 0 }}>
                  Popular Recipes
                </h3>
                <p>
                  <Link 
                    to="/recipes" 
                    className="underline font-semibold hover:text-[#c97a40] transition-colors"
                    style={{ color: '#4b6043' }}
                  >
                    Explore Recipes
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          </section>
        </main>

        {/* Footer */}
        <footer className="text-center py-6 text-sm" style={{ color: '#856a4a' }}>
          © 2025 Grandma's Kitchen — All Rights Reserved
        </footer>
      </div>
    </>
  );
};

export default Download;
