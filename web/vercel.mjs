import { deploymentEnv, routes } from '@vercel/config/v1';

const API_HOST = deploymentEnv('services__api__https__0');
// Ensure backend is defined; if API_HOST is missing, rewrites will fail
const backend = (API_HOST || '').replace(/\/$/, '');

console.log('Backend:', backend);

export const config = {
    rewrites: [
        // 1. Proxy API requests
        routes.rewrite('/api/:path*', `${backend}/api/:path*`),

        // 2. Proxy Hubs requests
        routes.rewrite('/hubs/:path*', `${backend}/hubs/:path*`),

        // 3. SPA Catch-all: Matches everything EXCEPT paths starting with /api or /hubs
        routes.rewrite('/:path((?!api|hubs).*)', '/index.html')
    ]
}