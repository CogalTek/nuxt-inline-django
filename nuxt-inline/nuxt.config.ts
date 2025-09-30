export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: false,
    app: {
        baseURL: './',
    },
    nitro: { preset: 'static' },
    components: [
        { path: '~/components', pathPrefix: false },
    ],
    vite: {
        server: {
            port: 3000,
            host: true,
            hmr: { protocol: 'ws' },
            cors: true,
            headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': '*',
			},
        },
    },
})