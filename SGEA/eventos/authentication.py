from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import Usuario, ApiToken


class ApiTokenAuthentication(BaseAuthentication):
    keyword = 'Token'

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == self.keyword.lower():
                token_key = parts[1]
                try:
                    token = ApiToken.objects.select_related('usuario').get(key=token_key)
                    return (token.usuario, token)
                except ApiToken.DoesNotExist:
                    raise AuthenticationFailed('Token inválido')

        user_id = request.session.get('user_id')
        if user_id:
            try:
                usuario = Usuario.objects.get(id=user_id)
                return (usuario, None)
            except Usuario.DoesNotExist:
                pass

        return None
