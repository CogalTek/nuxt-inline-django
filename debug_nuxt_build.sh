#!/bin/bash

echo "🔍 Analysing Nuxt build output..."

cd nuxt-inline

# Build si pas déjà fait
if [ ! -d ".output" ]; then
    echo "Building Nuxt..."
    npm run build
fi

echo ""
echo "📁 Structure de .output/public/ :"
tree .output/public/ -L 3 2>/dev/null || find .output/public/ -type f | head -20

echo ""
echo "📄 Fichiers HTML :"
find .output/public/ -name "*.html" -type f

echo ""
echo "📄 Fichiers JS :"
find .output/public/ -name "*.js" -type f

echo ""
echo "📄 Fichiers CSS :"
find .output/public/ -name "*.css" -type f

echo ""
echo "📋 Contenu de index.html (pour voir les références) :"
cat .output/public/index.html 2>/dev/null || cat .output/public/200.html

echo ""
echo "🔍 Recherche de manifests :"
find .output/ -name "*manifest*.json" -type f