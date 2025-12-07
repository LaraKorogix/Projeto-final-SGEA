# 🎓 SGEA - Sistema de Gerenciamento de Eventos Acadêmicos

Sistema completo para gerenciamento de eventos acadêmicos com autenticação, inscrições, certificados automáticos e auditoria.

## ✨ Funcionalidades Principais

- ✅ **Autenticação** por Token e Sessão
- ✅ **Confirmação de Email** com código/link
- ✅ **CRUD de Eventos** com validação de datas
- ✅ **Inscrições** com controle de vagas
- ✅ **Certificados Automáticos** (PDF) para presença confirmada
- ✅ **Logs de Auditoria** para organizadores
- ✅ **Throttling/Rate Limiting** na API
- ✅ **Swagger/OpenAPI** para documentação

---

## 🚀 Instalação Rápida

### 1️⃣ Clone e crie o ambiente virtual
```bash
py -3.11 -m venv .venv
.venv\Scripts\activate
```

### 2️⃣ Instale as dependências
```bash
pip install django djangorestframework django-cors-headers reportlab drf-yasg
```

### 3️⃣ Aplique as migrações e crie dados de teste
```bash
cd SGEA
python manage.py migrate
python manage.py seed_data
```

### 4️⃣ Execute o servidor
```bash
python manage.py runserver
```

---

## 🔑 Usuários de Teste

| Perfil | Email | Senha |
|--------|-------|-------|
| **Organizador** | organizador@sgea.com | Admin@123 |
| **Aluno** | aluno@sgea.com | Aluno@123 |
| **Professor** | professor@sgea.com | Professor@123 |

---

## 🌐 URLs do Sistema

| URL | Descrição |
|-----|-----------|
| http://127.0.0.1:8000/ | Página inicial |
| http://127.0.0.1:8000/login/ | Login/Cadastro |
| http://127.0.0.1:8000/dashboard/ | Dashboard do usuário |
| http://127.0.0.1:8000/painel-organizador/ | Painel do organizador |
| http://127.0.0.1:8000/swagger/ | Documentação Swagger |
| http://127.0.0.1:8000/admin/ | Django Admin |

---

## 📋 API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/usuarios/registro/` | Cadastro (envia email) |
| POST | `/api/usuarios/login/` | Login (retorna token) |
| POST | `/api/usuarios/logout/` | Logout |
| GET | `/api/usuarios/current_user/` | Usuário atual |
| GET | `/api/usuarios/confirmar_email/` | Confirmar email |
| POST | `/api/usuarios/reenviar_confirmacao/` | Reenviar email |

### Eventos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/eventos/disponiveis/` | Eventos disponíveis |
| GET | `/api/eventos/meus_eventos/` | Minhas inscrições |
| POST | `/api/eventos/` | Criar evento (org.) |
| GET | `/api/eventos/organizador/` | Meus eventos (org.) |

### Inscrições
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/inscricoes/` | Inscrever-se |
| POST | `/api/inscricoes/cancelar_inscricao/` | Cancelar |

### Certificados
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/certificados/` | Meus certificados |
| GET | `/api/certificados/validar/` | Validar código |

### Auditoria (Organizadores)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/audit-logs/` | Consultar logs |

---

## 🔐 Autenticação

### Token (API)
```bash
# Login retorna token
curl -X POST http://127.0.0.1:8000/api/usuarios/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"organizador@sgea.com","senha":"Admin@123"}'

# Use o token nas requisições
curl http://127.0.0.1:8000/api/eventos/ \
  -H "Authorization: Token SEU_TOKEN_AQUI"
```

### Sessão (Frontend)
```javascript
fetch('/api/usuarios/login/', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, senha })
});
```

---

## 📁 Estrutura do Projeto

```
SGEA/
├── eventos/
│   ├── models.py        # Usuario, Evento, Inscricao, Certificado, AuditLog
│   ├── views.py         # ViewSets da API
│   ├── serializers.py   # Serializers DRF
│   ├── authentication.py# Autenticação customizada
│   └── throttles.py     # Rate limiting
├── templates/           # Templates HTML
├── static/js/           # JavaScript frontend
└── sgea/settings.py     # Configurações Django
```

---

## 📧 Configuração de Email (Produção)

Edite `sgea/settings.py`:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'seu_email@gmail.com'
EMAIL_HOST_PASSWORD = 'sua_senha_de_app'
```

---

**Versão:** 2.0 | **Atualizado:** 07/12/2024
