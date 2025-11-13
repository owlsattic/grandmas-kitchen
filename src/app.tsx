import { Routes, Route, Link } from 'react-router-dom'

// Import your existing page files
import Home from './pages/Home'
import About from './pages/About'
import Recipes from './pages/Recipes'
import Shop from './pages/Shop'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Link to="/">Home</Link>
        <Link to="/recipes">Recipes</Link>
        <Link to="/shop">Shop</Link>
        <Link to="/about">About</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
