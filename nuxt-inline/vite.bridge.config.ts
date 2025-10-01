// vite.bridge.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'pathe'

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: { '@': resolve(__dirname, 'app') },
	},
	build: {
		lib: {
			entry: resolve(__dirname, 'app/bridge/index.ts'),
			name: 'NuxtInlineBridge',
			formats: ['es'],
			fileName: () => 'bridge.js',
		},
		outDir: resolve(__dirname, '.output/public/nuxt-inline/bridge'),
		emptyOutDir: true,
		sourcemap: true,
		rollupOptions: {
			// Laisse vide pour embarquer Vue runtime dans le bundle.
			// Si tu veux mutualiser Vue, mets ['vue'] ici et sers Vue ESM séparément.
			external: [],
		},
	},
})
