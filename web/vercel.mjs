import { routes } from '@vercel/config/v1';

const API_HOST = process.env['services__api__https__0'] || 'https://api.example.com';
const backend = API_HOST.replace(/\/$/, '');


export const config = {
    rewrites: [
        routes.rewrite('/api/:path*', backend + '/api/:path*'),
        routes.rewrite('/hubs/:path*', backend + '/hubs/:path*'),
        routes.rewrite('/(.*)', '/index.html')
        // { source: '/api/:path*', destination: backend + '/api/:path*' },
        // { source: '/hubs/:path*', destination: backend + '/hubs/:path*' },
        // { source: '/(.*)', destination: '/index.html' }
    ]
};

export default config;