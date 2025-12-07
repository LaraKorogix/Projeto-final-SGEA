from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from eventos.models import Usuario, Categoria, Evento, ApiToken


class Command(BaseCommand):
    help = 'Cria dados iniciais para testes do sistema SGEA'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando seeding de dados...\n')

        # Criar categorias
        categorias_data = [
            'Tecnologia',
            'Ciências',
            'Artes',
            'Esportes',
            'Saúde',
            'Negócios',
        ]

        for nome in categorias_data:
            cat, created = Categoria.objects.get_or_create(nome=nome)
            if created:
                self.stdout.write(f'  ✓ Categoria criada: {nome}')

        # Criar usuários de teste
        usuarios_data = [
            {
                'nome': 'Organizador SGEA',
                'email': 'organizador@sgea.com',
                'senha': 'Admin@123',
                'perfil': 'organizador',
                'telefone': '11999999999',
                'instituicao_ensino': 'Universidade SGEA',
            },
            {
                'nome': 'Aluno SGEA',
                'email': 'aluno@sgea.com',
                'senha': 'Aluno@123',
                'perfil': 'aluno',
                'telefone': '11988888888',
                'instituicao_ensino': 'Universidade SGEA',
            },
            {
                'nome': 'Professor SGEA',
                'email': 'professor@sgea.com',
                'senha': 'Professor@123',
                'perfil': 'professor',
                'telefone': '11977777777',
                'instituicao_ensino': 'Universidade SGEA',
            },
        ]

        organizador = None
        for user_data in usuarios_data:
            usuario, created = Usuario.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'nome': user_data['nome'],
                    'senha': make_password(user_data['senha']),
                    'perfil': user_data['perfil'],
                    'telefone': user_data['telefone'],
                    'instituicao_ensino': user_data['instituicao_ensino'],
                }
            )

            if created:
                self.stdout.write(f'  ✓ Usuário criado: {user_data["email"]}')
                ApiToken.objects.get_or_create(usuario=usuario)
            else:
                self.stdout.write(f'  → Usuário já existe: {user_data["email"]}')

            if user_data['perfil'] == 'organizador':
                organizador = usuario

        # Criar eventos de exemplo
        if organizador:
            agora = timezone.now()
            cat_tech = Categoria.objects.filter(nome='Tecnologia').first()
            cat_ciencias = Categoria.objects.filter(nome='Ciências').first()

            eventos_data = [
                {
                    'titulo': 'Semana de Tecnologia 2025',
                    'descricao': 'Evento anual de tecnologia com palestras, workshops e hackathon.',
                    'local': 'Auditório Principal - Bloco A',
                    'data_inicio': agora + timedelta(days=7),
                    'data_fim': agora + timedelta(days=12),
                    'capacidade_par': 200,
                },
                {
                    'titulo': 'Workshop de Python',
                    'descricao': 'Aprenda Python do básico ao avançado em um dia intensivo.',
                    'local': 'Laboratório de Informática - Sala 101',
                    'data_inicio': agora + timedelta(days=14),
                    'data_fim': agora + timedelta(days=14, hours=8),
                    'capacidade_par': 30,
                },
                {
                    'titulo': 'Feira de Ciências 2025',
                    'descricao': 'Apresentação de projetos científicos dos alunos.',
                    'local': 'Ginásio Poliesportivo',
                    'data_inicio': agora + timedelta(days=21),
                    'data_fim': agora + timedelta(days=23),
                    'capacidade_par': 500,
                },
            ]

            for idx, evento_data in enumerate(eventos_data):
                evento, created = Evento.objects.get_or_create(
                    titulo=evento_data['titulo'],
                    organizador=organizador,
                    defaults={
                        'descricao': evento_data['descricao'],
                        'local': evento_data['local'],
                        'data_inicio': evento_data['data_inicio'],
                        'data_fim': evento_data['data_fim'],
                        'capacidade_par': evento_data['capacidade_par'],
                    }
                )

                if created:
                    if idx < 2 and cat_tech:
                        evento.categorias.add(cat_tech)
                    elif cat_ciencias:
                        evento.categorias.add(cat_ciencias)
                    self.stdout.write(f'  ✓ Evento criado: {evento_data["titulo"]}')
                else:
                    self.stdout.write(f'  → Evento já existe: {evento_data["titulo"]}')

        # Criar superusuário Django para /admin/
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@sgea.com',
                password='Admin@123'
            )
            self.stdout.write('  ✓ Superusuário Django criado: admin / Admin@123')
        else:
            self.stdout.write('  → Superusuário Django já existe: admin')

        # Marcar usuários como confirmados (email_confirmado=True)
        Usuario.objects.all().update(email_confirmado=True)
        self.stdout.write('  ✓ Usuários marcados com email_confirmado=True')

        self.stdout.write(self.style.SUCCESS('\n✅ Seeding concluído com sucesso!'))
        self.stdout.write('\nUsuários de teste (SGEA):')
        self.stdout.write('  • organizador@sgea.com / Admin@123')
        self.stdout.write('  • aluno@sgea.com / Aluno@123')
        self.stdout.write('  • professor@sgea.com / Professor@123')
        self.stdout.write('\nSuperusuário Django (/admin/):')
        self.stdout.write('  • admin / Admin@123')

