import { deploymentEnv } from '@vercel/config/v1';

//const API_HOST = deploymentEnv('services__api__https__0') || 'https://api-tc2.aebibtech.com';
//const backend = API_HOST.replace(/\/$/, '');
//const backend = 'https://api-tc2.aebibtech.com';

export const config = {
    rewrites: [
        { source: '/api/:path*', destination: 'https://api-tc2.aebibtech.com/api/:path*' },
        { source: '/hubs/:path*', destination: 'https://api-tc2.aebibtech.com/hubs/:path*' },
        { source: '/(.*)', destination: '/index.html' }
    ]
};

export default config;