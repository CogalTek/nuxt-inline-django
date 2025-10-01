// app/bridge/index.ts
import { createApp, defineComponent, h, reactive } from 'vue'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

// Enregistre ici les composants que tu veux rendre utilisables dans Django :
import UserCard from '@/components/UserCard.vue'

const registry: Record<string, any> = {
	'UserCard': UserCard,
	'user-card': UserCard,
}

// Parse :prop="..." (number, boolean, array, object, string)
function parseLiteral(input: string) {
	try {
		const needsQuoting = /^[A-Za-z_][A-Za-z0-9_]*$/.test(input)
		const expr = needsQuoting ? `'${input}'` : input
		// eslint-disable-next-line no-new-func
		return new Function(`return (${expr})`)()
	} catch {
		return input
	}
}
const toCamel = (s: string) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

function readProps(el: Element) {
	const out: Record<string, any> = {}
	for (const name of el.getAttributeNames()) {
		const val = el.getAttribute(name)
		if (val == null) continue
		if (name.startsWith(':')) {
			out[toCamel(name.slice(1))] = parseLiteral(val)
		} else if (name !== 'class' && name !== 'style') {
			out[toCamel(name)] = val
		}
	}
	const json = el.getAttribute('data-props')
	if (json) {
		try { Object.assign(out, JSON.parse(json)) } catch {}
	}
	return out
}

function mountOne(el: Element, Comp: any, vuetify: any) {
	const state = reactive({ props: readProps(el) })
	const mo = new MutationObserver(() => Object.assign(state.props, readProps(el)))
	mo.observe(el, { attributes: true })

	const Root = defineComponent({
		name: 'NuxtInlineRoot',
		setup: () => () => h(Comp, state.props),
	})
	const app = createApp(Root)
	app.use(vuetify)
	app.mount(el)
}

export function mountAll() {
	const vuetify = createVuetify()
	const names = Object.entries(registry)
	const selectors = new Set(
		names.flatMap(([name]) => [name, name.replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '')])
	)
	selectors.forEach((sel) => {
		document.querySelectorAll(sel).forEach((el) => {
			// Trouve la clé réelle du composant, peu importe le casing utilisé dans le DOM
			const entry = names.find(([n]) => n === sel || n === (sel.includes('-') ? sel : sel))
			if (entry) mountOne(el, entry[1], vuetify)
		})
	})
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', mountAll)
} else {
	mountAll()
}
