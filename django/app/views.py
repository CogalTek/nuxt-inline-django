from django.shortcuts import render

def home(request):
    # Dev HMR (Nuxt dev server at :3000)
    return render(request, "base.html", {})

def prod(request):
    # Production template that reads manifest and injects assets
    return render(request, "prod.html", {})