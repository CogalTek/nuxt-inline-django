export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: false,
    app: {
        baseURL: '/',
    },
    experimental: {
        appManifest: false
    },
    components: [
        { path: '~/components', pathPrefix: false },
    ],

    css: [
        'vuetify/styles',
        '@mdi/font/css/materialdesignicons.css',
    ],

    build: {
        transpile: ['vuetify'],
    },

    nitro: {
        preset: 'static'
    },
    devServer: {
        host: '0.0.0.0',
        port: 3000,
    },
    vite: {
        server: {
            port: 3000,
            host: '0.0.0.0',
            hmr: {
                protocol: 'ws',
                host: 'localhost',
                port: 3000
            },
            cors: {
                origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
            },
        },
        vue: {
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => false,
                }
            }
        },
        ssr: {
            noExternal: ['vuetify'],
        },
        optimizeDeps: {
            exclude: ['vuetify'],
        },
    },
})