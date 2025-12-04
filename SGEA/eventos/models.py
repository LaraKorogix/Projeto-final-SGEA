from django.db import models
import secrets

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

    class Meta:
        db_table = "usuarios"


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
