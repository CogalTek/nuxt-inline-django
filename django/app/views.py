from django.shortcuts import render
from django.conf import settings

def home(request):
    return render(request, "base.html", {
        "debug": settings.DEBUG
    })

def prod(request):
    return render(request, "prod.html", {
        "debug": False
    })