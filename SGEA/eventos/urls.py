from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, CategoriaViewSet, EventoViewSet,
    InscricaoViewSet, CertificadoViewSet, AuditLogViewSet
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'eventos', EventoViewSet)
router.register(r'inscricoes', InscricaoViewSet)
router.register(r'certificados', CertificadoViewSet)
router.register(r'audit-logs', AuditLogViewSet)

urlpatterns = router.urls
