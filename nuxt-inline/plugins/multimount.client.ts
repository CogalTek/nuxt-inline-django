// plugins/multimount.client.ts
import { createApp, h, defineAsyncComponent } from 'vue'
import { vuetify } from '@/plugins/01.vuetify'

export default defineNuxtPlugin(() => {
	if (!process.client) return

	// 1) Indexe tous les composants dispo (lazy) via Vite
	const modules = import.meta.glob('~/components/**/*.{vue,ts}', { eager: false })

	type Loader = () => Promise<any>
	type IndexEntry = { name: string; kebab: string; flat: string; loader: Loader }

	const toKebab = (s: string) =>
		s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase()

	const normalizeFlat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

	const nameFromPath = (path: string) => {
		// ex: /components/Admin/UserCard.vue -> UserCard
		const base = path.split('/').pop() || ''
		return base.replace(/\.(vue|ts)$/, '')
	}

	// Construit un index de recherche robuste
	const index: IndexEntry[] = Object.keys(modules).map((path) => {
		const name = nameFromPath(path)
		const kebab = toKebab(name)            // UserCard -> user-card
		const flat = normalizeFlat(name)       // UserCard -> usercard
		return { name, kebab, flat, loader: modules[path] as Loader }
	})

	// Recherche en priorisant :
	// - match exact (PascalCase)
	// - match kebab-case
	// - match "flat" (sans casse ni tirets) — pour <UserCard> -> usercard
	const resolveComponent = (rawTagOrName: string): Loader | null => {
		const candidate = rawTagOrName.trim()
		const flat = normalizeFlat(candidate)
		const kebab = toKebab(candidate)

		let hit =
			index.find((e) => e.name === candidate) ||
			index.find((e) => e.kebab === candidate.toLowerCase()) ||
			index.find((e) => e.kebab === kebab) ||
			index.find((e) => e.flat === flat)

		if (!hit) {
			// Dernière chance : si c'est un tag HTML upper (USERCARD), on passe en lower puis kebab
			const lower = candidate.toLowerCase()
			const fromLowerKebab = lower.includes('-') ? lower : lower.replace(/([a-z])([A-Z])/g, '$1-$2')
			hit = index.find((e) => e.kebab === fromLowerKebab) || index.find((e) => e.flat === flat)
		}

		return hit ? hit.loader : null
	}

	const kebabToCamel = (str: string) => str.replace(/-([a-z])/g, (_m, g1) => g1.toUpperCase())

	const coerceValue = (val: string) => {
		const t = val?.trim?.() ?? val
		if (typeof t !== 'string') return t
		if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
			try { return JSON.parse(t) } catch {}
		}
		if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t)
		if (t === 'true') return true
		if (t === 'false') return false
		return t
	}

	const parsePropsFromAttributes = (el: Element): Record<string, any> => {
		const props: Record<string, any> = {}
		const vbind = el.getAttribute('v-bind') || el.getAttribute(':')

		if (vbind) {
			try { Object.assign(props, JSON.parse(vbind)) } catch (e) {
				console.warn('[nuxt-multimount] v-bind parse error:', e)
			}
		}

		for (const attr of Array.from(el.attributes)) {
			const name = attr.name
			const value = attr.value
			if (name === 'v-bind' || name === ':') continue

			if (name.startsWith(':')) {
				const key = name.slice(1)
				props[kebabToCamel(key)] = coerceValue(value)
			} else {
				props[kebabToCamel(name)] = coerceValue(value)
			}
		}
		return props
	}

	const loadComponent = async (rawName: string) => {
		// 1) data-nuxt-component="UserCard" -> tente une résolution directe par index
		// 2) balise <UserCard> ou <user-card> : rawName peut arriver en "USERCARD" -> resolveComponent gère.
		const loader = resolveComponent(rawName)
		if (loader) {
			const mod = await loader()
			return mod?.default || mod
		}
		console.warn(`[nuxt-multimount] Component not found: ${rawName}`)
		return { render: () => h('div', { style: 'color:red' }, `Missing component: ${rawName}`) }
	}

	const mountOne = async (el: Element, rawName: string, baseProps?: Record<string, any>) => {
		if ((el as HTMLElement).dataset.nuxtMounted === 'true') return
		const Comp = defineAsyncComponent(() => loadComponent(rawName))

		let props: Record<string, any> = baseProps ? { ...baseProps } : {}
		if (!baseProps) {
			const propsJson = el.getAttribute('data-props') ?? '{}'
			try { props = JSON.parse(propsJson) } catch {}
		}
		props = { ...props, ...parsePropsFromAttributes(el) }

		const app = createApp({ render: () => h(Comp, props) })
		app.use(vuetify)

		try {
			app.mount(el)
			;(el as HTMLElement).dataset.nuxtMounted = 'true'
		} catch (e) {
			console.error(`[nuxt-multimount] Failed to mount "${rawName}":`, e)
		}
	}

	const isNative = (tag: string) => document.createElement(tag).constructor !== HTMLUnknownElement

	const mountAll = async () => {
		// A) Compat data-*
		document.querySelectorAll('[data-nuxt-component]:not([data-nuxt-mounted])').forEach((el) => {
			const name = el.getAttribute('data-nuxt-component')!
			mountOne(el, name)
		})

		// B) Balises Vue-like : <UserCard>, <user-card>
		const allEls = Array.from(document.querySelectorAll('body *')).filter((el) => {
			const tag = el.tagName
			if (isNative(tag.toLowerCase())) return false
			if ((el as HTMLElement).dataset.nuxtMounted === 'true') return false
			// Heuristique : custom elements (ex: user-card) ou balises “casing” (UserCard)
			return /-/.test(tag) || /^[A-Z]/.test(tag)
		})

		for (const el of allEls) {
			const tagUpper = el.tagName // ex: 'USERCARD' ou 'USER-CARD'
			// On essaie directement le tag tel quel, puis en kebab (pour couvrir les deux styles)
			const tries = new Set<string>([
				tagUpper,                      // 'USERCARD' (reconstruit -> usercard -> UserCard par index)
				tagUpper.toLowerCase(),       // 'usercard'
				toKebab(tagUpper.toLowerCase()) // 'user-card'
			])

			const explicit = el.getAttribute('data-nuxt-component')
			if (explicit) tries.add(explicit)

			for (const cand of tries) {
				await mountOne(el, cand)
				if ((el as HTMLElement).dataset.nuxtMounted === 'true') break
			}
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', mountAll)
	} else {
		mountAll()
	}

	const obs = new MutationObserver(() => mountAll())
	obs.observe(document.documentElement, { childList: true, subtree: true })
})
