import { routes } from '@vercel/config/v1';

const API_HOST = process.env['services__api__https__0'] || 'https://api.example.com';
const backend = API_HOST.replace(/\/$/, '');


export const config = {
    trailingSlash: false,
    rewrites: [
        routes.rewrite('/api/:path*', backend + '/api/:path*'),
        routes.rewrite('/hubs/:path*', backend + '/hubs/:path*'),
        routes.rewrite('/(.*)', '/index.html')
    ]
};

export default config;