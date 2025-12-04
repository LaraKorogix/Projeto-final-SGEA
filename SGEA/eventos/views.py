from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from django.shortcuts import render, redirect
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from django.utils.dateparse import parse_datetime  # ✅ para tratar datas corretamente

from .models import Usuario, Categoria, Evento, Inscricao, Certificado
from .serializers import (
    UsuarioSerializer,
    CategoriaSerializer,
    EventoSerializer,
    InscricaoSerializer,
    CertificadoSerializer,
)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by("-id")
    serializer_class = UsuarioSerializer

    @action(detail=False, methods=["post"])
    def login(self, request):
        email = request.data.get("email")
        senha = request.data.get("senha")

        if not email or not senha:
            return Response(
                {"error": "Email e senha são obrigatórios"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            usuario = Usuario.objects.get(email=email)
            if check_password(senha, usuario.senha):
                # cria sessão simples
                request.session["user_id"] = usuario.pk
                request.session["user_email"] = usuario.email
                request.session["user_perfil"] = usuario.perfil

                serializer = self.get_serializer(usuario)
                response_data = serializer.data
                response_data["message"] = "Login realizado com sucesso"

                return Response(response_data, status=status.HTTP_200_OK)
            return Response(
                {"error": "Credenciais inválidas"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=["post"])
    def registro(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()

            # auto-login
            request.session["user_id"] = usuario.id
            request.session["user_email"] = usuario.email
            request.session["user_perfil"] = usuario.perfil

            response_data = serializer.data
            response_data["message"] = "Usuário criado com sucesso"

            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"])
    def logout(self, request):
        request.session.flush()
        return Response(
            {"message": "Logout realizado com sucesso"},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def current_user(self, request):
        user_id = request.session.get("user_id")
        if user_id:
            try:
                usuario = Usuario.objects.get(id=user_id)
                serializer = self.get_serializer(usuario)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Usuario.DoesNotExist:
                pass
        return Response(
            {"error": "Usuário não autenticado"},
            status=status.HTTP_401_UNAUTHORIZED,
        )


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all().order_by("nome")
    serializer_class = CategoriaSerializer


class EventoViewSet(viewsets.ModelViewSet):
    queryset = Evento.objects.all().order_by("-data_inicio")
    serializer_class = EventoSerializer

    def create(self, request, *args, **kwargs):
        user_id = request.session.get("user_id")
        user_perfil = request.session.get("user_perfil")

        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user_perfil != "organizador":
            return Response(
                {"error": "Apenas organizadores podem criar eventos"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            organizador = Usuario.objects.get(id=user_id)
            data = request.data.copy()

            # campos obrigatórios
            required_fields = {
                "titulo": "Título do evento",
                "data_inicio": "Data de início",
                "data_fim": "Data de término",
                "local": "Local do evento",
            }

            missing_fields = []
            for field, field_name in required_fields.items():
                if field not in data or not data[field]:
                    missing_fields.append(field_name)

            if missing_fields:
                return Response(
                    {
                        "error": "Campos obrigatórios ausentes",
                        "missing_fields": missing_fields,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ✅ valida/normaliza datas respeitando fuso horário do Django
            for field in ["data_inicio", "data_fim"]:
                try:
                    raw_value = data.get(field)
                    if isinstance(raw_value, str):
                        # Tenta parsear como ISO 8601 (ex: 2025-12-04T20:00 ou com timezone)
                        dt = parse_datetime(raw_value)

                        if dt is None:
                            return Response(
                                {
                                    "error": f"Formato de data/hora inválido para {field}",
                                    "detail": "Use o formato ISO 8601 (ex: 2025-12-04T20:00)",
                                    "received": raw_value,
                                },
                                status=status.HTTP_400_BAD_REQUEST,
                            )

                        # Se vier sem timezone, considera fuso configurado no projeto (ex: America/Sao_Paulo)
                        if timezone.is_naive(dt):
                            dt = timezone.make_aware(
                                dt, timezone.get_current_timezone()
                            )

                        data[field] = dt

                except Exception as e:
                    return Response(
                        {
                            "error": "Formato de data inválido",
                            "detail": "Use o formato ISO 8601",
                            "example": "2025-10-11T15:30",
                            "error_details": str(e),
                            "received": data.get(field),
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # organiza dados
            data["organizador"] = organizador.pk

            if data.get("capacidade_par") is None:
                data["capacidade_par"] = 0

            serializer = self.get_serializer(data=data)
            print("Attempting to validate data:", data)

            try:
                serializer.is_valid(raise_exception=True)
                evento = serializer.save()
                print("Event created successfully:", serializer.data)
                return Response(
                    {
                        "message": "Evento criado com sucesso",
                        "data": serializer.data,
                    },
                    status=status.HTTP_201_CREATED,
                )
            except serializers.ValidationError as e:
                print("Validation error:", e.detail)
                return Response(
                    {
                        "error": "Dados inválidos",
                        "validation_errors": e.detail,
                        # não devolvemos request.data aqui para não tentar serializar arquivo binário
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            except Exception as e:
                print("Unexpected error:", str(e))
                return Response(
                    {
                        "error": "Erro ao processar dados",
                        "detail": str(e),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Usuario.DoesNotExist:
            return Response(
                {
                    "error": "Usuário não encontrado",
                    "user_id": user_id,
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            import traceback

            return Response(
                {
                    "error": "Erro ao criar evento",
                    "detail": str(e),
                    "traceback": traceback.format_exc(),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"])
    def inscritos(self, request, pk=None):
        evento = self.get_object()
        inscricoes = Inscricao.objects.filter(evento=evento)
        serializer = InscricaoSerializer(inscricoes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def disponiveis(self, request):
        """
        Eventos disponíveis para alunos:
        - data_inicio >= agora (ou seja, futuros)
        """
        eventos = Evento.objects.filter(
            data_inicio__gte=timezone.now()
        ).order_by("data_inicio")
        serializer = self.get_serializer(eventos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def meus_eventos(self, request):
        """
        Para organizador: eventos que ele criou.
        Para participante: eventos em que ele está inscrito.
        """
        user_id = request.session.get("user_id")
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            usuario = Usuario.objects.get(id=user_id)

            if usuario.perfil == "organizador":
                eventos = Evento.objects.filter(organizador=usuario)
            else:
                eventos = Evento.objects.filter(
                    inscricao__usuario=usuario
                ).distinct()

            eventos = eventos.order_by("-data_inicio")
            serializer = self.get_serializer(eventos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=["get"], url_path="organizador")
    def eventos_do_organizador(self, request):
        user_id = request.session.get("user_id")
        user_perfil = request.session.get("user_perfil")

        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user_perfil != "organizador":
            return Response(
                {"error": "Apenas organizadores podem acessar esta lista"},
                status=status.HTTP_403_FORBIDDEN,
            )

        eventos = Evento.objects.filter(
            organizador_id=user_id
        ).order_by("-data_inicio")
        serializer = self.get_serializer(eventos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="estatisticas")
    def estatisticas(self, request):
        user_id = request.session.get("user_id")
        user_perfil = request.session.get("user_perfil")

        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user_perfil != "organizador":
            return Response(
                {"error": "Apenas organizadores podem acessar estatísticas"},
                status=status.HTTP_403_FORBIDDEN,
            )

        eventos = Evento.objects.filter(organizador_id=user_id)
        total_eventos = eventos.count()
        total_proximos = eventos.filter(
            data_inicio__gte=timezone.now()
        ).count()
        total_inscricoes = Inscricao.objects.filter(
            evento__in=eventos
        ).count()

        return Response(
            {
                "total_eventos": total_eventos,
                "total_proximos": total_proximos,
                "total_inscricoes": total_inscricoes,
            },
            status=status.HTTP_200_OK,
        )


class InscricaoViewSet(viewsets.ModelViewSet):
    queryset = Inscricao.objects.all().order_by("-data_inscricao")
    serializer_class = InscricaoSerializer

    def create(self, request, *args, **kwargs):
        user_id = request.session.get("user_id")
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        evento_id = request.data.get("evento")
        if not evento_id:
            return Response(
                {"error": "ID do evento é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            evento = Evento.objects.get(id=evento_id)
            usuario = Usuario.objects.get(id=user_id)

            if Inscricao.objects.filter(
                evento=evento, usuario=usuario
            ).exists():
                return Response(
                    {"error": "Usuário já inscrito neste evento"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            inscritos = Inscricao.objects.filter(evento=evento).count()
            if evento.capacidade_par and inscritos >= evento.capacidade_par:
                return Response(
                    {"error": "Evento lotado"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            inscricao = Inscricao.objects.create(
                evento=evento, usuario=usuario
            )
            serializer = self.get_serializer(inscricao)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Evento.DoesNotExist:
            return Response(
                {"error": "Evento não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=["get"])
    def minhas_inscricoes(self, request):
        user_id = request.session.get("user_id")
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            usuario = Usuario.objects.get(id=user_id)
            inscricoes = Inscricao.objects.filter(
                usuario=usuario
            ).order_by("-data_inscricao")
            serializer = self.get_serializer(inscricoes, many=True)
            return Response(serializer.data)
        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=True, methods=["patch"])
    def marcar_presenca(self, request, pk=None):
        inscricao = self.get_object()
        inscricao.presenca = 1
        inscricao.save()
        return Response({"status": "Presenca marcada"})

    @action(detail=False, methods=["post"], url_path="cancelar")
    def cancelar_inscricao(self, request):
        user_id = request.session.get("user_id")
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        evento_id = request.data.get("evento")
        if not evento_id:
            return Response(
                {"error": "ID do evento é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            inscricao = Inscricao.objects.get(
                evento_id=evento_id, usuario_id=user_id
            )
        except Inscricao.DoesNotExist:
            return Response(
                {"error": "Inscrição não encontrada para este evento"},
                status=status.HTTP_404_NOT_FOUND,
            )

        inscricao.delete()
        return Response(
            {"message": "Inscrição removida com sucesso"},
            status=status.HTTP_200_OK,
        )


class CertificadoViewSet(viewsets.ModelViewSet):
    queryset = Certificado.objects.all().order_by("-data_emissao")
    serializer_class = CertificadoSerializer

    def get_queryset(self):
        """
        Sempre filtra certificados do usuário logado:
        certificados ligados às inscrições desse usuário.
        """
        user_id = self.request.session.get("user_id")
        if not user_id:
            return Certificado.objects.none()
        return Certificado.objects.filter(
            inscricao__usuario_id=user_id
        ).order_by("-data_emissao")

    def create(self, request, *args, **kwargs):
        inscricao_id = request.data.get("inscricao")

        try:
            inscricao = Inscricao.objects.get(id=inscricao_id)

            if Certificado.objects.filter(inscricao=inscricao).exists():
                return Response(
                    {"error": "Certificado ja emitido"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return super().create(request, *args, **kwargs)
        except Inscricao.DoesNotExist:
            return Response(
                {"error": "Inscricao nao encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def list(self, request, *args, **kwargs):
        """
        Ao listar:
        - Verifica o usuário logado
        - Encontra inscrições dele cujos eventos já terminaram
        - Gera certificados (get_or_create) para essas inscrições
        - Cada Certificado gera um PDF genérico automaticamente
        - Retorna os certificados desse usuário
        """
        user_id = request.session.get("user_id")
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            usuario = Usuario.objects.get(id=user_id)
        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

        agora = timezone.now()

        # Aqui você pode colocar presenca=1 se quiser só para presentes
        inscricoes_concluidas = Inscricao.objects.filter(
            usuario=usuario,
            evento__data_fim__lte=agora,
        )

        for insc in inscricoes_concluidas:
            cert, created = Certificado.objects.get_or_create(inscricao=insc)
            # Se já existia mas ainda não tinha arquivo (casos antigos), garante PDF
            if not cert.arquivo:
                cert.save()

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def validar(self, request):
        codigo = request.query_params.get("codigo")
        try:
            certificado = Certificado.objects.get(codigo_validacao=codigo)
            serializer = self.get_serializer(certificado)
            return Response(serializer.data)
        except Certificado.DoesNotExist:
            return Response(
                {"error": "Certificado invalido"},
                status=status.HTTP_404_NOT_FOUND,
            )


def dashboard_page(request):
    return render(request, "dashboard.html")


def painel_organizador_page(request):
    user_id = request.session.get("user_id")
    user_perfil = request.session.get("user_perfil")

    if not user_id:
        return redirect("login")

    if user_perfil != "organizador":
        return redirect("dashboard")

    eventos = Evento.objects.filter(
        organizador_id=user_id
    ).order_by("-data_inicio")

    total_eventos = eventos.count()
    total_proximos = eventos.filter(
        data_inicio__gte=timezone.now()
    ).count()
    total_inscricoes = Inscricao.objects.filter(
        evento__in=eventos
    ).count()

    categorias = Categoria.objects.all().order_by("nome")

    context = {
        "eventos": eventos,
        "total_eventos": total_eventos,
        "total_proximos": total_proximos,
        "total_inscricoes": total_inscricoes,
        "categorias": categorias,
    }

    return render(request, "painel_organizador.html", context)
