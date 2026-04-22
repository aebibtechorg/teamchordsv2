// web/vercel.config.js
const API_HOST = process.env.services__api__https__0 || 'https://api.example.com'; // fallback for local tests
const backend = API_HOST.replace(/\/$/, ''); // remove trailing slash if present

module.exports = {
    framework: 'vite',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    rewrites: [
        { source: '/api/:path*', destination: `${backend}/api/:path*` },
        { source: '/hubs/:path*', destination: `${backend}/hubs/:path*` },
        { source: '/(.*)', destination: '/index.html' }
    ]
};
