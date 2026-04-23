const API_HOST = process.env['services__api__https__0'] || 'https://api-tc2.aebibtech.com';
const backend = API_HOST.replace(/\/$/, '');

export const config = {
    rewrites: [
        { source: '/api/:path*', destination: `${backend}/api/:path*` },
        { source: '/hubs/:path*', destination: `${backend}/hubs/:path*` },
        { source: '^/((?!api|hubs).*)', destination: '/index.html' }
    ]
};

export default config;