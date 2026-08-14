import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import StarField from './StarField';

/**
 * Layout — The parent theme shell wrapping every page.
 * Contains the atmospheric starfield, header, main content outlet, and footer.
 * This is the component that defines the "atmosphere" of the blog —
 * dark, quiet, spacious, with luminous friends twinkling overhead.
 */
export default function Layout() {
  return (
    <>
      <StarField />
      <div className="layout">
        <Header />
        <main className="layout__main">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}
