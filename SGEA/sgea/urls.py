# C:\...\sgea\projeto\sgea\urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

print(">>>> CARREGANDO sgea/urls.py DO PROJETO <<<<")
print(">>>> CARREGANDO sgea/urls.py DO PROJETO <<<<")

schema_view = get_schema_view(
   openapi.Info(
      title="SGEA API",
      default_version='v1',
      description="API do Sistema de Gerenciamento de Eventos Acadêmicos",
   ),
   public=True,
   permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include('eventos.urls')),

    # Swagger/OpenAPI
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

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
