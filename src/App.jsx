import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Post from './pages/Post';

/**
 * App — Root component with HashRouter for GitHub Pages compatibility.
 * Routes:
 *   /          → Home (post listing)
 *   /blog/:slug → Individual blog post
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="blog/:slug" element={<Post />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
