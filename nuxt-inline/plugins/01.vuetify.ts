// plugins/01.vuetify.ts
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin((nuxtApp) => {
  console.log('🎨 Vuetify plugin loading...')
  console.log('Components:', Object.keys(components).length)
  
  const vuetify = createVuetify({
    components,
    directives,
    ssr: false,
  })

  nuxtApp.vueApp.use(vuetify)
  
  console.log('✅ Vuetify plugin loaded and exposed')
  
  return {
    provide: {
      vuetify
    }
  }
})