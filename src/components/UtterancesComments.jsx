import { useEffect, useRef } from 'react';

/**
 * UtterancesComments — GitHub-based commenting system powered by Utterances.
 * Maps each blog post to a GitHub Issue by its slug (pathname).
 *
 * Prerequisites:
 *   1. Install the utterances GitHub App on the repo:
 *      https://github.com/apps/utterances
 *   2. Ensure the repo is public.
 */
export default function UtterancesComments({ slug }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous utterances widget if re-rendering
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.setAttribute('repo', 'KISHLAY-AT-CODE/partial-existence');
    script.setAttribute('issue-term', slug || 'pathname');
    script.setAttribute('theme', 'github-dark');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('label', '💬 blog-comment');
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [slug]);

  return (
    <div
      ref={containerRef}
      className="utterances-wrapper"
      id={`utterances-${slug}`}
    />
  );
}
