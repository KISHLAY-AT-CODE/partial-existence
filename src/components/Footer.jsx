import { siteConfig } from '../site.config';

/**
 * Footer — Quote, author attribution, and copyright from site.config.js
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="site-footer">
      <p className="footer__quote">
        {siteConfig.footer.quote}
        {siteConfig.footer.attribution && (
          <span className="footer__attribution">{siteConfig.footer.attribution}</span>
        )}
      </p>
      <p className="footer__copy">
        &copy; {year} {siteConfig.title} &mdash; {siteConfig.author}
      </p>
    </footer>
  );
}
