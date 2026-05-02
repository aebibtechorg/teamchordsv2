const helpSiteId = process.env.HELP_FIREBASE_SITE_ID || process.env.HELP_FIREBASE_SITE || 'teamchords-help';
const helpSiteUrl = process.env.HELP_SITE_URL || `https://${helpSiteId}.web.app`;

// Docusaurus config for the Team Chords Help Center
module.exports = {
  title: 'Team Chords Help',
  tagline: 'Documentation and Support',
  url: helpSiteUrl,
  baseUrl: '/',
  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  favicon: '/favicon.png',
  organizationName: 'teamchords',
  projectName: 'help',
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Team Chords',
        items: [
          { to: '/', label: 'Help Center', position: 'left' },
          { to: '/support', label: 'Support', position: 'right' },
        ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Docs',
          items: [{ label: 'Getting Started', to: '/' }],
        },
        {
          title: 'Support',
          items: [{ label: 'Contact Support', to: '/support' }],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Team Chords.`,
    },
  },
};

