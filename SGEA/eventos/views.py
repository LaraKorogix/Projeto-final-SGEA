from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import render, redirect
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from datetime import datetime
import secrets

from .models import Usuario, Categoria, Evento, Inscricao, Certificado, ApiToken, AuditLog
from .serializers import (
    UsuarioSerializer,
    CategoriaSerializer,
    EventoSerializer,
    InscricaoSerializer,
    CertificadoSerializer,
    AuditLogSerializer,
)
from .throttles import ConsultaEventosThrottle, InscricaoParticipantesThrottle


def get_client_ip(request):
    """Obtém o IP do cliente da requisição."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR')


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by("-id")
    serializer_class = UsuarioSerializer

    def get_permissions(self):
        if self.action in ['login', 'registro']:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
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

            if not usuario.email_confirmado:
                return Response(
                    {
                        "error": "Email não confirmado. Verifique sua caixa de entrada.",
                        "email_nao_confirmado": True,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if check_password(senha, usuario.senha):
                token, _ = ApiToken.objects.get_or_create(usuario=usuario)

                request.session["user_id"] = usuario.pk
                request.session["user_email"] = usuario.email
                request.session["user_perfil"] = usuario.perfil

                # Registrar auditoria de login
                AuditLog.registrar(
                    acao="usuario_login",
                    usuario=usuario,
                    detalhes=f"Login realizado com sucesso",
                    ip=get_client_ip(request),
                )

                serializer = self.get_serializer(usuario)
                response_data = serializer.data
                response_data["token"] = token.key
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

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def registro(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()

            # Gerar código de confirmação
            codigo = secrets.token_urlsafe(32)
            usuario.codigo_confirmacao = codigo
            usuario.email_confirmado = False
            usuario.save()

            # Enviar email de confirmação
            link_confirmacao = f"{settings.SITE_URL}/api/usuarios/confirmar_email/?codigo={codigo}"

            try:
                html_message = render_to_string('emails/email_confirmacao.html', {
                    'nome': usuario.nome,
                    'codigo': codigo[:8].upper(),
                    'link_confirmacao': link_confirmacao,
                })

                send_mail(
                    subject='Confirme seu cadastro no SGEA',
                    message=f'Olá {usuario.nome}, confirme seu email acessando: {link_confirmacao}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[usuario.email],
                    html_message=html_message,
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Erro ao enviar email: {e}")

            # Registrar auditoria de criação de usuário
            AuditLog.registrar(
                acao="usuario_criado",
                usuario=usuario,
                detalhes=f"Novo usuário cadastrado: {usuario.email}",
                ip=get_client_ip(request),
            )

            response_data = serializer.data
            response_data["message"] = "Cadastro realizado! Verifique seu email para confirmar."
            response_data["email_enviado"] = True

            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"])
    def logout(self, request):
        if hasattr(request, 'auth') and request.auth:
            request.auth.delete()
        request.session.flush()
        return Response(
            {"message": "Logout realizado com sucesso"},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def current_user(self, request):
        if request.user and hasattr(request.user, 'pk'):
            serializer = self.get_serializer(request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(
            {"error": "Usuário não autenticado"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def confirmar_email(self, request):
        codigo = request.query_params.get("codigo")

        if not codigo:
            return Response(
                {"error": "Código de confirmação não fornecido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            usuario = Usuario.objects.get(codigo_confirmacao=codigo)

            if usuario.email_confirmado:
                return redirect('/login/?msg=email_ja_confirmado')

            usuario.email_confirmado = True
            usuario.codigo_confirmacao = None
            usuario.save()

            # Cria token para login automático
            token, _ = ApiToken.objects.get_or_create(usuario=usuario)

            return redirect('/login/?msg=email_confirmado')

        except Usuario.DoesNotExist:
            return redirect('/login/?msg=codigo_invalido')

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def reenviar_confirmacao(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Email é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            usuario = Usuario.objects.get(email=email)

            if usuario.email_confirmado:
                return Response(
                    {"message": "Email já confirmado"},
                    status=status.HTTP_200_OK,
                )

            # Gerar novo código
            codigo = secrets.token_urlsafe(32)
            usuario.codigo_confirmacao = codigo
            usuario.save()

            link_confirmacao = f"{settings.SITE_URL}/api/usuarios/confirmar_email/?codigo={codigo}"

            html_message = render_to_string('emails/email_confirmacao.html', {
                'nome': usuario.nome,
                'codigo': codigo[:8].upper(),
                'link_confirmacao': link_confirmacao,
            })

            send_mail(
                subject='Confirme seu cadastro no SGEA',
                message=f'Olá {usuario.nome}, confirme seu email: {link_confirmacao}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[usuario.email],
                html_message=html_message,
                fail_silently=False,
            )

            return Response(
                {"message": "Email de confirmação reenviado"},
                status=status.HTTP_200_OK,
            )

        except Usuario.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all().order_by("nome")
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]


class EventoViewSet(viewsets.ModelViewSet):
    queryset = Evento.objects.all().order_by("-data_inicio")
    serializer_class = EventoSerializer
    throttle_classes = [ConsultaEventosThrottle]

    def create(self, request, *args, **kwargs):
        if not request.user or not hasattr(request.user, 'pk'):
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if request.user.perfil != "organizador":
            return Response(
                {"error": "Apenas organizadores podem criar eventos"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            organizador = request.user
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
        if not request.user or not hasattr(request.user, 'pk'):
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        usuario = request.user
        if usuario.perfil == "organizador":
            eventos = Evento.objects.filter(organizador=usuario)
        else:
            eventos = Evento.objects.filter(
                inscricao__usuario=usuario
            ).distinct()

        eventos = eventos.order_by("-data_inicio")
        serializer = self.get_serializer(eventos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="organizador")
    def eventos_do_organizador(self, request):
        if not request.user or not hasattr(request.user, 'pk'):
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if request.user.perfil != "organizador":
            return Response(
                {"error": "Apenas organizadores podem acessar esta lista"},
                status=status.HTTP_403_FORBIDDEN,
            )

        eventos = Evento.objects.filter(
            organizador=request.user
        ).order_by("-data_inicio")
        serializer = self.get_serializer(eventos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="estatisticas")
    def estatisticas(self, request):
        if not request.user or not hasattr(request.user, 'pk'):
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if request.user.perfil != "organizador":
            return Response(
                {"error": "Apenas organizadores podem acessar estatísticas"},
                status=status.HTTP_403_FORBIDDEN,
            )

        eventos = Evento.objects.filter(organizador=request.user)
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
    throttle_classes = [InscricaoParticipantesThrottle]

    def create(self, request, *args, **kwargs):
        if not request.user or not hasattr(request.user, 'pk'):
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
            usuario = request.user

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

            # Registrar auditoria de inscrição
            AuditLog.registrar(
                acao="inscricao_criada",
                usuario=usuario,
                detalhes=f"Inscrição no evento: {evento.titulo}",
                ip=get_client_ip(request),
                evento_id=evento.id,
                inscricao_id=inscricao.id,
            )

            serializer = self.get_serializer(inscricao)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Evento.DoesNotExist:
            return Response(
                {"error": "Evento não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=["get"])
    def minhas_inscricoes(self, request):
        if not request.user or not hasattr(request.user, 'pk'):
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        inscricoes = Inscricao.objects.filter(
            usuario=request.user
        ).order_by("-data_inscricao")
        serializer = self.get_serializer(inscricoes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def marcar_presenca(self, request, pk=None):
        inscricao = self.get_object()
        inscricao.presenca = 1
        inscricao.save()
        return Response({"status": "Presenca marcada"})

    @action(detail=False, methods=["post"], url_path="cancelar")
    def cancelar_inscricao(self, request):
        if not request.user or not hasattr(request.user, 'pk'):
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
                evento_id=evento_id, usuario=request.user
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
        if not self.request.user or not hasattr(self.request.user, 'pk'):
            return Certificado.objects.none()
        return Certificado.objects.filter(
            inscricao__usuario=self.request.user
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
        if not request.user or not hasattr(request.user, 'pk'):
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        agora = timezone.now()
        # Apenas gera certificados para quem tem presença confirmada
        inscricoes_concluidas = Inscricao.objects.filter(
            usuario=request.user,
            evento__data_fim__lte=agora,
            presenca=1,  # Apenas quem teve presença confirmada
        )

        for insc in inscricoes_concluidas:
            cert, created = Certificado.objects.get_or_create(inscricao=insc)
            if created:
                # Registrar auditoria de certificado gerado
                AuditLog.registrar(
                    acao="certificado_gerado",
                    usuario=request.user,
                    detalhes=f"Certificado gerado para evento: {insc.evento.titulo}",
                    ip=get_client_ip(request),
                    evento_id=insc.evento.id,
                    inscricao_id=insc.id,
                    certificado_id=cert.id,
                )
            if not cert.arquivo:
                cert.save()

        # Registrar auditoria de consulta
        AuditLog.registrar(
            acao="certificado_consultado",
            usuario=request.user,
            detalhes="Lista de certificados consultada",
            ip=get_client_ip(request),
        )

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


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para consulta de logs de auditoria (apenas organizadores)."""
    queryset = AuditLog.objects.all().order_by("-data_hora")
    serializer_class = AuditLogSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        # Verifica se é organizador
        if not request.user or not hasattr(request.user, 'pk'):
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if request.user.perfil != "organizador":
            return Response(
                {"error": "Apenas organizadores podem consultar logs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = self.get_queryset()

        # Filtro por data (formato: YYYY-MM-DD)
        data_str = request.query_params.get("data")
        if data_str:
            try:
                data = datetime.strptime(data_str, "%Y-%m-%d").date()
                queryset = queryset.filter(data_hora__date=data)
            except ValueError:
                pass

        # Filtro por usuário (email ou id)
        usuario_email = request.query_params.get("usuario_email")
        usuario_id = request.query_params.get("usuario_id")

        if usuario_email:
            queryset = queryset.filter(usuario__email__icontains=usuario_email)
        if usuario_id:
            queryset = queryset.filter(usuario_id=usuario_id)

        # Filtro por tipo de ação
        acao = request.query_params.get("acao")
        if acao:
            queryset = queryset.filter(acao=acao)

        # Paginação simples
        limit = int(request.query_params.get("limit", 50))
        offset = int(request.query_params.get("offset", 0))
        queryset = queryset[offset:offset + limit]

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


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
