// plugins/vuetify.client.ts
import { createVuetify } from 'vuetify'
import 'vuetify/styles'

export default defineNuxtPlugin((nuxtApp) => {
    const vuetify = createVuetify({})
    nuxtApp.vueApp.use(vuetify)

    // Fournit le plugin aux autres (multimount, etc.)
    nuxtApp.provide('vuetify', vuetify)
})
