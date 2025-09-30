import { createApp, h, defineAsyncComponent } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
    if (!process.client) return

    const mountAll = async () => {
        const nodes = document.querySelectorAll('[data-nuxt-component]:not([data-nuxt-mounted])')
        nodes.forEach(async (el) => {
            const name = el.getAttribute('data-nuxt-component')!
            const propsJson = el.getAttribute('data-props') || '{}'
            let props: Record<string, any> = {}
            try { props = JSON.parse(propsJson) } catch { }

            const loader = async () => {
                try {
                    const candidates = [
                        () => import(`~/components/${name}.vue`),
                        () => import(`~/components/${name}/index.vue`),
                    ]
                    for (const c of candidates) {
                        try { return (await c()).default } catch { }
                    }
                } catch (e) { }
                console.warn(`[nuxt-multimount] Component not found: ${name}`)
                return { render: () => h('div', { style: 'color:red' }, `Missing component: ${name}`) }
            }

            const Comp = defineAsyncComponent(loader)
            const app = createApp({ render: () => h(Comp, props) })

            try {
                // Access Vuetify instance provided by the vuetify plugin
                const vuetify = nuxtApp.$vuetify
                if (vuetify) {
                    app.use(vuetify)
                    console.log('[nuxt-multimount] Vuetify registered for component:', name)
                } else {
                    console.warn('[nuxt-multimount] Vuetify not found in nuxtApp.$vuetify')
                    // Try alternative access methods
                    const altVuetify = (nuxtApp as any).vuetify || (nuxtApp as any)._vuetify
                    if (altVuetify) {
                        app.use(altVuetify)
                        console.log('[nuxt-multimount] Alternative Vuetify found and registered for:', name)
                    } else {
                        console.error('[nuxt-multimount] No Vuetify instance found - v-components will not work')
                    }
                }
            } catch (e) {
                console.error('[nuxt-multimount] Error accessing Vuetify:', e)
            }

            try {
                app.mount(el as Element)
                    ; (el as HTMLElement).dataset.nuxtMounted = 'true'
            } catch (e) {
                console.error(`[nuxt-multimount] Failed to mount component ${name}:`, e)
            }
            ; (el as HTMLElement).dataset.nuxtMounted = 'true'
        })
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountAll)
    } else {
        mountAll()
    }

    const obs = new MutationObserver(() => mountAll())
    obs.observe(document.documentElement, { childList: true, subtree: true })
})