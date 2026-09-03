import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import LoadingScreen from './LoadingScreen';
import ConsentNotice from './ConsentNotice';

/**
 * Layout — The parent theme shell wrapping every page.
 * Contains the loading screen overlay, header, main content outlet, footer, and privacy notice.
 */
export default function Layout() {
  return (
    <div className="layout">
      <LoadingScreen />
      <Header />
      <main className="layout__main">
        <Outlet />
      </main>
      <Footer />
      <ConsentNotice />
    </div>
  );
}
