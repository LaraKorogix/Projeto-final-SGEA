from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework import serializers

from .models import Usuario, Categoria, Evento, Inscricao, Certificado


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            "id",
            "nome",
            "email",
            "telefone",
            "instituicao_ensino",
            "perfil",
            "criado_em",
            "senha",
        ]
        extra_kwargs = {
            "senha": {"write_only": True}
        }

    def create(self, validated_data):
        if "senha" in validated_data:
            validated_data["senha"] = make_password(validated_data["senha"])
        return super().create(validated_data)


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = "__all__"


class EventoSerializer(serializers.ModelSerializer):
    categorias = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Categoria.objects.all(),
        required=False,
    )
    organizador_nome = serializers.CharField(
        source="organizador.nome",
        read_only=True,
    )
    inscritos_count = serializers.SerializerMethodField()

    # arquivo de imagem
    banner = serializers.ImageField(required=False, allow_null=True)
    # URL completa para o front
    banner_url = serializers.SerializerMethodField()

    class Meta:
        model = Evento
        fields = [
            "id",
            "titulo",
            "descricao",
            "data_inicio",
            "data_fim",
            "local",
            "capacidade_par",
            "organizador",
            "organizador_nome",
            "categorias",
            "inscritos_count",
            "banner",
            "banner_url",
        ]
        extra_kwargs = {
            "titulo": {"required": True},
            "data_inicio": {"required": True},
            "data_fim": {"required": True},
            "local": {"required": True},
        }

    def validate(self, data):
        # --- valida datas ---
        data_inicio = data.get("data_inicio")
        data_fim = data.get("data_fim")

        if data_inicio and data_fim:
            # garante que ambos sejam timezone-aware
            if timezone.is_naive(data_inicio):
                data_inicio = timezone.make_aware(
                    data_inicio, timezone.get_current_timezone()
                )
            if timezone.is_naive(data_fim):
                data_fim = timezone.make_aware(
                    data_fim, timezone.get_current_timezone()
                )

            # joga de volta para o dict normalizado
            data["data_inicio"] = data_inicio
            data["data_fim"] = data_fim

            # fim > início
            if data_fim <= data_inicio:
                raise serializers.ValidationError(
                    {
                        "data_fim": "A data de término deve ser posterior à data de início"
                    }
                )

            # ✅ travamento se o evento estiver claramente no passado
            # pequena margem de 5 minutos para evitar erro por diferença mínima de horário
            agora = timezone.now()
            margem = timedelta(minutes=5)
            if data_inicio < (agora - margem):
                raise serializers.ValidationError(
                    {"data_inicio": "A data de início não pode ser no passado"}
                )

        # --- valida capacidade ---
        if "capacidade_par" in data:
            if data["capacidade_par"] is None:
                data["capacidade_par"] = 0
            elif not isinstance(data["capacidade_par"], int):
                raise serializers.ValidationError(
                    {"capacidade_par": "A capacidade deve ser um número inteiro"}
                )
            elif data["capacidade_par"] < 0:
                raise serializers.ValidationError(
                    {"capacidade_par": "A capacidade não pode ser negativa"}
                )

        return data

    def get_inscritos_count(self, obj):
        return obj.inscricao_set.count()

    def get_banner_url(self, obj):
        """
        Retorna URL absoluta do banner (http://127.0.0.1:8000/media/...)
        para o front usar direto.
        """
        request = self.context.get("request")
        if obj.banner:
            url = obj.banner.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

    def create(self, validated_data):
        categorias = validated_data.pop("categorias", [])
        evento = Evento.objects.create(**validated_data)
        if categorias:
            evento.categorias.set(categorias)
        return evento

    def update(self, instance, validated_data):
        categorias = validated_data.pop("categorias", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if categorias is not None:
            instance.categorias.set(categorias)
        return instance


class InscricaoSerializer(serializers.ModelSerializer):
    evento_titulo = serializers.CharField(
        source="evento.titulo",
        read_only=True,
    )
    usuario_nome = serializers.CharField(
        source="usuario.nome",
        read_only=True,
    )

    class Meta:
        model = Inscricao
        fields = [
            "id",
            "evento",
            "evento_titulo",
            "usuario",
            "usuario_nome",
            "data_inscricao",
            "presenca",
        ]


class CertificadoSerializer(serializers.ModelSerializer):
    # ✅ URL absoluta do arquivo para o front usar em download
    arquivo_url = serializers.SerializerMethodField()

    class Meta:
        model = Certificado
        fields = "__all__"
        read_only_fields = ["codigo_validacao", "data_emissao"]

    def get_arquivo_url(self, obj):
        request = self.context.get("request")
        if obj.arquivo:
            url = obj.arquivo.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None


class AuditLogSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.nome', read_only=True, allow_null=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True, allow_null=True)
    acao_display = serializers.CharField(source='get_acao_display', read_only=True)

    class Meta:
        from .models import AuditLog
        model = AuditLog
        fields = [
            "id",
            "usuario",
            "usuario_nome",
            "usuario_email",
            "acao",
            "acao_display",
            "detalhes",
            "ip_address",
            "data_hora",
            "evento_id",
            "inscricao_id",
            "certificado_id",
        ]
        read_only_fields = fields

