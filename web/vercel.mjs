import { deploymentEnv, routes } from '@vercel/config/v1'; 

const API_HOST = deploymentEnv('services__api__https__0');
const backend = API_HOST.replace(/\/$/, '');

export const config = {
    rewrites: [
        routes.rewrite('/api/:path*', `${backend}/api/:path*`),
        routes.rewrite('/hubs/:path*', `${backend}/hubs/:path*`),
        routes.rewrite('/(.*)', '/index.html')
    ]
}
