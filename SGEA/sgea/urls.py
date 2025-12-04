# C:\...\sgea\projeto\sgea\urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

print(">>>> CARREGANDO sgea/urls.py DO PROJETO <<<<")
print(">>>> CARREGANDO sgea/urls.py DO PROJETO <<<<")

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include('eventos.urls')),

    # Páginas HTML do front
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('login/', TemplateView.as_view(template_name='login_cadastro.html'), name='login'),
    path('dashboard/', TemplateView.as_view(template_name='dashboard.html'), name='dashboard'),
    path('meus-eventos/', TemplateView.as_view(template_name='meus_eventos.html'), name='meus_eventos'),
    path('meus-certificados/', TemplateView.as_view(template_name='meus_certificados.html'), name='meus_certificados'),
    path('painel-organizador/', TemplateView.as_view(template_name='painel_organizador.html'), name='painel_organizador'),
    path('criar-evento/', TemplateView.as_view(template_name='criar_evento.html'), name='criar_evento'),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
