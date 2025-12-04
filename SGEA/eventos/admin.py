from django.contrib import admin
from .models import Usuario, Categoria, Evento, Inscricao, Certificado


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'email', 'perfil', 'instituicao_ensino')
    search_fields = ('nome', 'email')
    list_filter = ('perfil', 'instituicao_ensino')


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome')
    search_fields = ('nome',)


@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    list_display = ('id', 'titulo', 'data_inicio', 'data_fim', 'local', 'organizador')
    search_fields = ('titulo', 'local')
    list_filter = ('data_inicio', 'local')
    date_hierarchy = 'data_inicio'


@admin.register(Inscricao)
class InscricaoAdmin(admin.ModelAdmin):
    list_display = ('id', 'evento', 'usuario', 'data_inscricao', 'presenca')
    list_filter = ('presenca', 'data_inscricao', 'evento')
    search_fields = ('evento__titulo', 'usuario__nome')


@admin.register(Certificado)
class CertificadoAdmin(admin.ModelAdmin):
    list_display = ('id', 'inscricao', 'codigo_validacao', 'data_emissao')
    search_fields = ('codigo_validacao', 'inscricao__usuario__nome')
    list_filter = ('data_emissao',)
