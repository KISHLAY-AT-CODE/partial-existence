/**
 * site.config.js — Central Blog Template Configuration
 *
 * Edit all site branding, hero text, quotes, and navigation here.
 * Changes made here will automatically reflect across the entire blog!
 */
export const siteConfig = {
  // Main Site Branding
  title: 'Partial Existence',
  author: 'Kishlay',
  description:
    'Reflections from the Amid — essays on taste, atmosphere, philosophy, and the quiet discipline of building.',

  // Home Page About / Hero Section
  hero: {
    avatar: 'avatar.png',
    titlePrefix: 'Who am ',
    titleAccent: 'I',
    subtitle:
      'Reflections on taste, atmosphere, and the quiet discipline of building things that matter — written from the liminal space between intrusion and silence.',
    sectionTitle: 'Blog',
  },

  // Navigation Bar Links
  nav: [
    { label: 'Blog', path: '/' },
  ],

  // Footer Quote & Attribution
  footer: {
    quote:
      '“To exist is to intrude, to not is to die. Amid is to seek silence and tranquility, and observe the both realm of lies.”',
    attribution: '—Kishlay',
  },
};
