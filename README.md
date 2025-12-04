Instalação e Configuração

1️⃣ Use uma versão suportada do Python (recomendado: Python 3.11)

Antes de iniciar, instale o Python 3.11, pois ele garante compatibilidade total com o Django utilizado no projeto.

2️⃣ Crie e ative o ambiente virtual

Windows:
```
py -3.11 -m venv .venv
.venv\Scripts\activate
```
3️⃣ Instale as dependências
```
pip install django
pip install djangorestframework

```
4️⃣ Aplique as migrações
```
python manage.py makemigrations
python manage.py migrate
```
5️⃣ Crie um superusuário (opcional, para acessar o Admin)
```
python manage.py createsuperuser
```
6️⃣ Execute o servidor
```
python manage.py runserver
```

7️⃣ Acesse o sistema

🌐 Sistema principal:
http://127.0.0.1:8000/

🔐 Painel Django Admin:
http://127.0.0.1:8000/admin/
