import { useEffect, useRef } from 'react';

/**
 * UtterancesComments — GitHub-based commenting system powered by Utterances.
 * Directly embeds the utterances iframe (more reliable than script injection in SPAs).
 *
 * Prerequisites:
 *   1. Install the utterances GitHub App on the repo:
 *      https://github.com/apps/utterances
 *   2. Ensure the repo is public.
 */
const REPO = 'KISHLAY-AT-CODE/partial-existence';
const THEME = 'github-dark';
const LABEL = '💬 blog-comment';

export default function UtterancesComments({ slug }) {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Build the utterances iframe URL with the post slug as the issue term
    const params = new URLSearchParams({
      repo: REPO,
      'issue-term': slug,
      label: LABEL,
      theme: THEME,
      crossorigin: 'anonymous',
      async: '',
    });

    // Construct the origin for postMessage
    const utterancesOrigin = 'https://utteranc.es';
    const iframeSrc = `${utterancesOrigin}/utterances.html?${params.toString()}`;

    // Create and configure iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'utterances-frame';
    iframe.title = 'Comments';
    iframe.scrolling = 'no';
    iframe.src = iframeSrc;
    iframe.loading = 'lazy';
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.minHeight = '270px';
    iframe.style.colorScheme = 'dark';

    // Listen for resize messages from the utterances iframe
    function handleMessage(event) {
      if (event.origin !== utterancesOrigin) return;
      if (!event.data || event.data.type !== 'resize' || !event.data.height) return;
      if (iframeRef.current) {
        iframeRef.current.style.height = `${event.data.height}px`;
      }
    }

    window.addEventListener('message', handleMessage);

    // Clear container and append
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(iframe);
    iframeRef.current = iframe;

    return () => {
      window.removeEventListener('message', handleMessage);
      iframeRef.current = null;
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
