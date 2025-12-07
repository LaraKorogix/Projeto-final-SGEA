from django.db import models
import secrets
import binascii
import os

from io import BytesIO
from django.core.files.base import ContentFile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import textwrap


class Usuario(models.Model):
    PERFIL_CHOICES = [
        ("aluno", "Aluno"),
        ("professor", "Professor"),
        ("organizador", "Organizador"),
    ]
    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    senha = models.CharField(max_length=128)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    instituicao_ensino = models.CharField(max_length=255, blank=True, null=True)
    perfil = models.CharField(max_length=20, choices=PERFIL_CHOICES)
    criado_em = models.DateTimeField(auto_now_add=True)
    email_confirmado = models.BooleanField(default=False)
    codigo_confirmacao = models.CharField(max_length=64, blank=True, null=True)

    class Meta:
        db_table = "usuarios"

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False


class ApiToken(models.Model):
    key = models.CharField(max_length=40, primary_key=True)
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='auth_token')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "api_tokens"

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = binascii.hexlify(os.urandom(20)).decode()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.key


class Categoria(models.Model):
    nome = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "categorias"


class Evento(models.Model):
    titulo = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, null=True)
    data_inicio = models.DateTimeField()
    data_fim = models.DateTimeField()
    local = models.CharField(max_length=255)
    capacidade_par = models.IntegerField(blank=True, null=True)
    organizador = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, related_name="eventos"
    )

    # ✅ Banner do evento (upload de imagem)
    banner = models.ImageField(
        upload_to="banners/",  # vai salvar em media/banners/
        blank=True,
        null=True,
    )

    categorias = models.ManyToManyField("Categoria", through="EventoCategoria")

    class Meta:
        db_table = "eventos"


class EventoCategoria(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)

    class Meta:
        db_table = "evento_categoria"
        unique_together = ("evento", "categoria")


class Inscricao(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    data_inscricao = models.DateTimeField(auto_now_add=True)
    presenca = models.IntegerField(
        default=0,
        choices=[
            (0, "Ausente"),
            (1, "Presente"),
        ],
    )

    class Meta:
        db_table = "inscricoes"
        unique_together = ("evento", "usuario")


class Certificado(models.Model):
    inscricao = models.OneToOneField(Inscricao, on_delete=models.CASCADE)
    codigo_validacao = models.CharField(max_length=64, unique=True)
    data_emissao = models.DateTimeField(auto_now_add=True)

    # URL opcional (se quiser usar externamente)
    url_certificado = models.URLField(blank=True, null=True)

    # ✅ Arquivo real do certificado (PDF)
    arquivo = models.FileField(
        upload_to="certificados/", blank=True, null=True
    )

    class Meta:
        db_table = "certificados"

    def gerar_pdf(self):
        """
        Gera um PDF genérico com o texto:
        'Certificamos que X, na qualidade de Y, compareceu ao evento Z,
        realizado em DD/MM/AAAA, no período de HH:MM às HH:MM.'
        e grava no campo arquivo.
        """
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        participante = self.inscricao.usuario.nome
        # usa o label das choices (Aluno / Professor / Organizador)
        cargo = self.inscricao.usuario.get_perfil_display()
        evento = self.inscricao.evento.titulo
        inicio = self.inscricao.evento.data_inicio
        fim = self.inscricao.evento.data_fim

        data_str = inicio.strftime("%d/%m/%Y")
        hora_inicio = inicio.strftime("%H:%M")
        hora_fim = fim.strftime("%H:%M")

        titulo = "CERTIFICADO DE PARTICIPAÇÃO"
        texto = (
            f"Certificamos que {participante}, na qualidade de {cargo}, "
            f"compareceu ao evento \"{evento}\", realizado em {data_str}, "
            f"no período de {hora_inicio} às {hora_fim}."
        )
        rodape = f"Código de validação: {self.codigo_validacao}"

        # Título
        p.setFont("Helvetica-Bold", 20)
        p.drawCentredString(width / 2, height - 120, titulo)

        # Texto principal (com quebra de linha simples)
        p.setFont("Helvetica", 12)
        text_obj = p.beginText(80, height - 180)
        for line in textwrap.wrap(texto, width=80):
            text_obj.textLine(line)
        p.drawText(text_obj)

        # Rodapé
        p.setFont("Helvetica", 10)
        p.drawString(80, 80, rodape)

        p.showPage()
        p.save()

        buffer.seek(0)
        filename = f"certificado_{self.id}.pdf"
        self.arquivo.save(filename, ContentFile(buffer.read()), save=False)
        buffer.close()

        # opcional: sincronizar url_certificado com o FileField
        try:
            self.url_certificado = self.arquivo.url
        except Exception:
            pass

    def save(self, *args, **kwargs):
        creating = self.pk is None

        # Garante que exista um código de validação
        if not self.codigo_validacao:
            self.codigo_validacao = secrets.token_urlsafe(32)

        # Primeiro salva para ter um ID
        super().save(*args, **kwargs)

        # Se acabou de criar ou ainda não tem arquivo, gera o PDF
        if creating or not self.arquivo:
            self.gerar_pdf()
            super().save(update_fields=["arquivo", "url_certificado"])


class AuditLog(models.Model):
    """Modelo para registrar ações críticas do sistema para auditoria."""

    ACAO_CHOICES = [
        ("usuario_criado", "Usuário Criado"),
        ("usuario_login", "Login de Usuário"),
        ("evento_criado", "Evento Criado"),
        ("evento_alterado", "Evento Alterado"),
        ("evento_excluido", "Evento Excluído"),
        ("evento_consultado", "Evento Consultado"),
        ("inscricao_criada", "Inscrição Criada"),
        ("inscricao_cancelada", "Inscrição Cancelada"),
        ("presenca_marcada", "Presença Marcada"),
        ("certificado_gerado", "Certificado Gerado"),
        ("certificado_consultado", "Certificado Consultado"),
    ]

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="logs_auditoria"
    )
    acao = models.CharField(max_length=50, choices=ACAO_CHOICES)
    detalhes = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    data_hora = models.DateTimeField(auto_now_add=True)

    # Referências opcionais para entidades relacionadas
    evento_id = models.IntegerField(blank=True, null=True)
    inscricao_id = models.IntegerField(blank=True, null=True)
    certificado_id = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-data_hora"]

    def __str__(self):
        return f"{self.data_hora} - {self.get_acao_display()} - {self.usuario}"

    @classmethod
    def registrar(cls, acao, usuario=None, detalhes=None, ip=None, evento_id=None, inscricao_id=None, certificado_id=None):
        """Método utilitário para criar um registro de auditoria."""
        return cls.objects.create(
            usuario=usuario,
            acao=acao,
            detalhes=detalhes,
            ip_address=ip,
            evento_id=evento_id,
            inscricao_id=inscricao_id,
            certificado_id=certificado_id,
        )

