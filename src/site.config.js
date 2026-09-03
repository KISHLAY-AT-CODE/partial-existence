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
    titleAccent: 'I?',
    subtitle:
      'Hello! Kishlay here, I share my reflections on programming, life, entertainment, books and the quiet discipline of building things that matter — written from the liminal space between intrusion and silence.',
    sectionTitle: 'Blogs',
  },

  // Navigation Bar Links (leave empty if no additional links needed)
  nav: [],

  // Footer Quote & Attribution
  footer: {
    quote:
      '“To exist is to intrude, to not is to die. Amid is to seek silence and tranquility, and observe the both realm of lies.”',
    attribution: '—Kishlay',
  },

  // Social Defaults (can be overridden or toggled per post in frontmatter)
  social: {
    github: 'https://github.com/KISHLAY-AT-CODE',
    linkedin: 'https://www.linkedin.com',
    youtube: 'https://www.youtube.com',
    allpoetry: 'https://allpoetry.com/partial-existence',
  },

  // Backend API URL (Cloudflare Pages deployment URL or custom domain)
  // Example: 'https://partial-existence-backend.pages.dev' (or leave '' to use VITE_API_URL / localStorage)
  apiUrl: '',

  // Multi-Tenant SaaS Blog Website Identifier
  websiteId: 'partial-existence',

  // Google reCAPTCHA v2 / Checkbox Site Key (public)
  recaptchaSiteKey: '6Le2GZ8tAAAAACYe_3v7quzqVz_FKgv-HVM9o8FK',
};

