import json
import os
from django import template
from django.conf import settings

register = template.Library()

@register.simple_tag
def nuxt_assets(prefix: str = 'nuxt-inline') -> str:
    """
    Inject <link> and <script> tags for the Nuxt entry based on the Vite manifest.
    Expect the generated files to live at: STATIC_ROOT / <prefix> / _nuxt / manifest.json
    Usage in template:
        {% load nuxt %}
        {% nuxt_assets 'nuxt-inline' %}
    """
    manifest_path = os.path.join(settings.STATIC_ROOT, prefix, '_nuxt', 'manifest.json')
    if not os.path.exists(manifest_path):
        return ''

    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    # Find first entry with isEntry=true
    entry = next((v for v in manifest.values() if v.get('isEntry')), None)
    if not entry:
        return ''

    static = settings.STATIC_URL.rstrip('/')
    base = f"{static}/{prefix}/_nuxt"
    tags = []

    # Preload imports
    for imp in entry.get('imports', []):
        fobj = manifest.get(imp, {})
        if fobj.get('file'):
            tags.append(f'<link rel="modulepreload" href="{base}/{fobj["file"]}">')

    # Styles
    for css in entry.get('css', []):
        tags.append(f'<link rel="stylesheet" href="{base}/{css}">' )

    # Entry script
    if entry.get('file'):
        tags.append(f'<script type="module" src="{base}/{entry["file"]}"></script>')

    return "\n".join(tags)
