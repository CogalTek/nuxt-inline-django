import { createApp, h, defineAsyncComponent } from 'vue'

export default defineNuxtPlugin(() => {
    if (!process.client) return

    const mountAll = async () => {
        const nodes = document.querySelectorAll('[data-nuxt-component]:not([data-nuxt-mounted])')
        nodes.forEach(async (el) => {
            const name = el.getAttribute('data-nuxt-component')!
            const propsJson = el.getAttribute('data-props') || '{}'
            let props: Record<string, any> = {}
            try { props = JSON.parse(propsJson) } catch {}

            const loader = async () => {
                try {
                    const candidates = [
                        () => import(`~/components/${name}.vue`),
                        () => import(`~/components/${name}/index.vue`),
                    ]
                    for (const c of candidates) {
                        try { return (await c()).default } catch {}
                    }
                } catch (e) {}
                console.warn(`[nuxt-multimount] Component not found: ${name}`)
                return { render: () => h('div', { style: 'color:red' }, `Missing component: ${name}`) }
            }

            const Comp = defineAsyncComponent(loader)
            const app = createApp({ render: () => h(Comp, props) })

            const nuxtApp = useNuxtApp()
            const vuetify = (nuxtApp as any).$vuetify || (nuxtApp as any).vuetify
            if (vuetify) app.use(vuetify)

            app.mount(el as Element)
            ;(el as HTMLElement).dataset.nuxtMounted = 'true'
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