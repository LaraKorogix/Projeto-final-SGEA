from rest_framework.throttling import UserRateThrottle


class ConsultaEventosThrottle(UserRateThrottle):
    scope = 'consulta_eventos'


class InscricaoParticipantesThrottle(UserRateThrottle):
    scope = 'inscricao_participantes'
