# Nuxt Inline (Vuetify) inside Django — No Iframe

## Dev (HMR)
```bash
docker compose up --build
# Django: http://localhost:8000  (loads Nuxt dev scripts with HMR)
# Nuxt:   http://localhost:3000
```

## Prod (build + copy assets)
```bash
# inside nuxt-inline/
npm install
npm run build
# copy .output/public to django/app/static/nuxt-inline/
# then run Django without the dev scripts, e.g. visit http://localhost:8000/prod/
```

In your Django templates you can drop placeholders like:
```html
<div data-nuxt-component="MyComponent" data-props='{"msg":"Hello"}'></div>
```
and the component will mount there (client-side, no iframe).