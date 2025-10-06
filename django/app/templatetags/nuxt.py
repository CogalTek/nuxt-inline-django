# django/app/templatetags/nuxt.py
from __future__ import annotations
import os
import re
import json
from typing import Dict, Any, List, Optional

from django import template
from django.conf import settings
from django.utils.safestring import mark_safe

register = template.Library()

# ------------------------------
# Helpers communs
# ------------------------------

def _static_url() -> str:
	# ex: "/static/"
	return getattr(settings, "STATIC_URL", "/static/")

def _prefix_root_on_disk(prefix: str) -> str:
	"""
	Retourne le dossier sur disque où se trouvent les assets copiés.
	Essaye d'abord STATIC_ROOT, sinon retombe sur le dossier source du repo.
	"""
	candidates: List[str] = []
	if getattr(settings, "STATIC_ROOT", None):
		candidates.append(os.path.join(settings.STATIC_ROOT, prefix))
	# chemin source (utile en dev sans collectstatic)
	candidates.append(os.path.join(settings.BASE_DIR, "django", "app", "static", prefix))
	for p in candidates:
		if os.path.isdir(p):
			return p
	# par défaut, premier candidat
	return candidates[0]

def _rewrite_all_nuxt_paths(html: str, prefix: str) -> str:
	"""
	Réécrit TOUTES les formes de /_nuxt/... vers /static/<prefix>/_nuxt/...
	- attributs href/src
	- contenus des <script> (importmap, window.__NUXT__.config, fetch("/_nuxt/..."), etc.)
	- guillemets simples ou doubles, et fallback sans guillemets
	"""
	static_url = _static_url().rstrip("/")
	base = f"{static_url}/{prefix}/_nuxt/"
	# guillemets doubles
	html = re.sub(r'("/_nuxt/)', f'"{base}', html)
	# guillemets simples
	html = re.sub(r"('/_nuxt/)", f"'{base}", html)
	# sans guillemets (limite au début de mot pour éviter faux-positifs)
	html = re.sub(r'(?<![a-zA-Z0-9_])/_nuxt/', base, html)
	return html

# ------------------------------
# PROD: injection depuis index.html
# ------------------------------

def _load_index_chunks(prefix: str) -> Dict[str, str]:
	"""
	Lit .*/static/<prefix>/index.html et extrait:
	- head_tags: importmap + <link rel="stylesheet"> + preloads/prefetch + script module entry
	- mount_tags: div#__nuxt + div#teleports + payload JSON + config window.__NUXT__
	"""
	root = _prefix_root_on_disk(prefix)
	index_path = os.path.join(root, "index.html")
	if not os.path.exists(index_path):
		return {"head_tags": "", "mount_tags": ""}

	with open(index_path, "r", encoding="utf-8") as f:
		html = f.read()

	head_bits: List[str] = []
	# importmap
	m = re.search(r'<script type="importmap">.*?</script>', html, re.S)
	if m:
		head_bits.append(m.group(0))
	# feuilles de style
	head_bits += re.findall(r'<link[^>]+rel="stylesheet"[^>]*>', html)
	# preloads / prefetch
	head_bits += re.findall(r'<link[^>]+rel="(?:modulepreload|prefetch)"[^>]*>', html)
	# script module d'entrée
	m2 = re.search(r'<script type="module"[^>]*></script>', html)
	if m2:
		head_bits.append(m2.group(0))

	# Corps / montages
	body_bits: List[str] = []
	for pat in [
		r'<div id="__nuxt"></div>',
		r'<div id="teleports"></div>',
		r'<script type="application/json"[^>]*?>.*?</script>',  # payload
		r'<script>window.__NUXT__=.*?</script>',                 # config
	]:
		mm = re.search(pat, html, re.S)
		if mm:
			body_bits.append(mm.group(0))

	head_tags = _rewrite_all_nuxt_paths("\n".join(head_bits), prefix)
	mount_tags = _rewrite_all_nuxt_paths("\n".join(body_bits), prefix)
	return {"head_tags": head_tags, "mount_tags": mount_tags}

# ------------------------------
# DEV: injection depuis manifest Vite
# ------------------------------

def _find_vite_manifest(prefix: str) -> Optional[str]:
	"""
	Essaye différents emplacements usuels pour le manifest Vite:
	- <static>/<prefix>/.vite/manifest.json (après copie de .output/public/)
	- <repo>/django/app/static/<prefix>/.vite/manifest.json (sans collectstatic)
	- fallback: <static>/<prefix>/_nuxt/manifest.json (ancien schéma, rare)
	"""
	root = _prefix_root_on_disk(prefix)
	paths = [
		os.path.join(root, ".vite", "manifest.json"),
		os.path.join(root, "_nuxt", "manifest.json"),
	]
	for p in paths:
		if os.path.exists(p):
			return p
	return None

def _tags_from_vite_manifest(prefix: str) -> str:
	"""
	Construit les balises <link>/<script> à partir du manifest Vite.
	Attend un JSON du style Vite 4/5 (clé -> { file, isEntry, css, imports }).
	"""
	manifest_path = _find_vite_manifest(prefix)
	if manifest_path is None:
		return ""

	with open(manifest_path, "r", encoding="utf-8") as f:
		manifest: Dict[str, Any] = json.load(f)

	# Trouve la première entrée isEntry=true
	entry_obj: Optional[Dict[str, Any]] = None
	for _, v in manifest.items():
		if isinstance(v, dict) and v.get("isEntry"):
			entry_obj = v
			break
	if not entry_obj:
		return ""

	static_base = _static_url().rstrip("/") + f"/{prefix}"
	nuxt_base = f"{static_base}/_nuxt"   # si le manifest pointe vers _nuxt
	vite_base = f"{static_base}/.vite"   # si le manifest pointe vers .vite

	tags: List[str] = []

	# Préchargements (modulepreload)
	for imp in entry_obj.get("imports", []):
		fobj = manifest.get(imp, {})
		file_ = fobj.get("file")
		if not file_:
			continue
		href = f"{vite_base}/{file_}"
		if file_.startswith("_nuxt/"):
			href = f"{static_base}/{file_}"
		elif file_.startswith(".vite/"):
			href = f"{static_base}/{file_}"
		tags.append(f'<link rel="modulepreload" href="{href}">')

	# Styles
	for css in entry_obj.get("css", []):
		href = f"{vite_base}/{css}"
		if css.startswith("_nuxt/"):
			href = f"{static_base}/{css}"
		elif css.startswith(".vite/"):
			href = f"{static_base}/{css}"
		tags.append(f'<link rel="stylesheet" href="{href}">')

	# Script d’entrée
	file_main = entry_obj.get("file")
	if file_main:
		src = f"{vite_base}/{file_main}"
		if file_main.startswith("_nuxt/"):
			src = f"{static_base}/{file_main}"
		elif file_main.startswith(".vite/"):
			src = f"{static_base}/{file_main}"
		tags.append(f'<script type="module" src="{src}"></script>')

	# Pas besoin de réécriture ici: on génère déjà des URLs /static/<prefix>/...
	return "\n".join(tags)

# ------------------------------
# Tags exposés aux templates
# ------------------------------

@register.simple_tag
def nuxt_head(prefix: str = "nuxt-inline") -> str:
	"""
	Prod (settings.DEV=False): injecte balises depuis index.html exporté (hash-safe),
	avec réécriture globale de /_nuxt/.
	Dev  (settings.DEV=True) : injecte balises construites depuis manifest Vite.
	"""
	dev_mode = bool(getattr(settings, "DEV", False))
	if dev_mode:
		return mark_safe(_tags_from_vite_manifest(prefix))
	chunks = _load_index_chunks(prefix)
	return mark_safe(chunks["head_tags"])

@register.simple_tag
def nuxt_mount(prefix: str = "nuxt-inline") -> str:
	"""
	Prod: insère les divs et scripts d'initialisation extraits d'index.html,
	avec réécriture globale de /_nuxt/.
	Dev : idem si un index.html existe (sinon vide).
	"""
	dev_mode = bool(getattr(settings, "DEV", False))
	# même en dev, on peut renvoyer ces éléments si on a un index.html exporté
	chunks = _load_index_chunks(prefix)
	return mark_safe(chunks["mount_tags"])
