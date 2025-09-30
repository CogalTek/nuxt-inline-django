from django.contrib import admin
from django.urls import path
from app.views import home, prod

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", home, name="home"),
    path("prod/", prod, name="prod"),
]