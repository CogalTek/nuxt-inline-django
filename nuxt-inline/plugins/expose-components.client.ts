// Expose certains composants au DOM "extérieur" (Django)
// Adapte les imports à tes composants réels
import UserCard from '@/components/UserCard.vue'

declare global {
	interface Window {
		NUXT_INLINE_COMPONENTS?: Record<string, any>
	}
}

export default defineNuxtPlugin((_nuxtApp) => {
	if (!window.NUXT_INLINE_COMPONENTS) {
		window.NUXT_INLINE_COMPONENTS = {}
	}
	// Map en PascalCase : "UserCard" => composant
	// Tu peux en ajouter d'autres ici
	window.NUXT_INLINE_COMPONENTS.UserCard = UserCard
})
