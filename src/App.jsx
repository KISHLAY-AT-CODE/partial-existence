import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Post from './pages/Post';
import { AuthProvider } from './context/AuthContext';
import AuthModal from './components/AuthModal';

/**
 * App — Root component with HashRouter for GitHub Pages compatibility.
 * Routes:
 *   /          → Home (post listing)
 *   /blog/:slug → Individual blog post
 */
export default function App() {
  useEffect(() => {
    const basePath = import.meta.env.BASE_URL || '/';
    document.documentElement.style.setProperty(
      '--bg-image',
      `url("${basePath}mushishi-bg.jpg")`
    );
  }, []);
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="blog/:slug" element={<Post />} />
          </Route>
        </Routes>
      </HashRouter>
      <AuthModal />
    </AuthProvider>
  );
}
