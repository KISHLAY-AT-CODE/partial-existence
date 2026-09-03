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
      <div className="footer__saas-badge" id="footer-saas-badge">
        <span className="footer__saas-dot" />
        <span>
          Maintained by{' '}
          <a
            href="https://partial-existence.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__saas-link"
          >
            Partial Existence Services
          </a>
        </span>
      </div>
    </footer>
  );
}
