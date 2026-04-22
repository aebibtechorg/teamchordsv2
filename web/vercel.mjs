const API_HOST = process.env['services__api__https__0'];
const backend = API_HOST.replace(/\/$/, '');

export default {
    framework: "vite",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    rewrites: [
        { source: '/api/:path*', destination: `${backend}/api/:path*` },
        { source: '/hubs/:path*', destination: `${backend}/hubs/:path*` },
        { source: '/(.*)', destination: '/index.html' }
    ]
};
