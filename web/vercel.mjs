import path from 'path'

const API_HOST = process.env.services__api__https__0;

export default {
    framework: "vite",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    rewrites: [
        {
            source: "/api/:path*",
            destination: path.join(API_HOST, '/api/:path*')
        },
        {
            source: "/hubs/:path*",
            destination: path.join(API_HOST, '/hubs/:path*')
        },
        {
            source: "/(.*)",
            destination: "/index.html"
        }
    ]
};
