# 📋 Documentação de Endpoints da API - SGEA

**Base URL:** `http://127.0.0.1:8000/api`

> **Autenticação:** Token (`Authorization: Token <token>`) ou Sessão (`credentials: 'include'`)

---

## 🔐 1. Autenticação e Usuários

### 1.1 Registro de Usuário
- **Endpoint:** `POST /usuarios/registro/`
- **Autenticação:** Não
- **Payload:**
```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "instituicao_ensino": "Universidade Federal",
  "telefone": "11999999999",
  "cpf": "12345678900",
  "perfil": "aluno",
  "senha": "Senha@123"
}
```
- **Resposta (201):**
```json
{
  "id": 1,
  "email": "joao@exemplo.com",
  "nome": "João Silva",
  "perfil": "aluno",
  "message": "Cadastro realizado! Verifique seu email para confirmar.",
  "email_enviado": true
}
```
- **Notas:**
  - Email de confirmação é enviado automaticamente
  - Senha deve ter 8+ caracteres, letras, números e caracteres especiais

---

### 1.2 Login
- **Endpoint:** `POST /usuarios/login/`
- **Autenticação:** Não
- **Payload:**
```json
{
  "email": "joao@exemplo.com",
  "senha": "Senha@123"
}
```
- **Resposta (200):**
```json
{
  "id": 1,
  "email": "joao@exemplo.com",
  "nome": "João Silva",
  "perfil": "aluno",
  "token": "abc123...",
  "message": "Login realizado com sucesso"
}
```
- **Erros:**
  - `401`: Credenciais inválidas
  - `403`: Email não confirmado

---

### 1.3 Confirmar Email
- **Endpoint:** `GET /usuarios/confirmar_email/?codigo=XXX`
- **Autenticação:** Não
- **Resposta:** Redireciona para `/login/?msg=email_confirmado`

---

### 1.4 Reenviar Confirmação
- **Endpoint:** `POST /usuarios/reenviar_confirmacao/`
- **Autenticação:** Não
- **Payload:**
```json
{
  "email": "joao@exemplo.com"
}
```
- **Resposta (200):**
```json
{
  "message": "Email de confirmação reenviado"
}
```

---

### 1.5 Logout
- **Endpoint:** `POST /usuarios/logout/`
- **Autenticação:** Sim
- **Resposta (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

### 1.6 Usuário Atual
- **Endpoint:** `GET /usuarios/current_user/`
- **Autenticação:** Sim
- **Resposta (200):**
```json
{
  "id": 1,
  "email": "joao@exemplo.com",
  "nome": "João Silva",
  "perfil": "aluno",
  "email_confirmado": true
}
```

---

## 📅 2. Eventos

### 2.1 Listar Eventos Disponíveis
- **Endpoint:** `GET /eventos/disponiveis/`
- **Autenticação:** Sim
- **Resposta (200):** Array de eventos disponíveis para inscrição

---

### 2.2 Listar Meus Eventos (Inscritos)
- **Endpoint:** `GET /eventos/meus_eventos/`
- **Autenticação:** Sim
- **Resposta (200):** Array de eventos que o usuário está inscrito

---

### 2.3 Criar Evento (Organizador)
- **Endpoint:** `POST /eventos/`
- **Autenticação:** Sim (apenas organizadores)
- **Content-Type:** `application/json` ou `multipart/form-data` (com banner)
- **Payload:**
```json
{
  "titulo": "Semana de Tecnologia",
  "descricao": "Descrição do evento",
  "local": "Auditório Principal",
  "data_inicio": "2025-12-10T09:00:00Z",
  "data_fim": "2025-12-15T18:00:00Z",
  "capacidade_par": 100,
  "categoria": 1
}
```
- **Resposta (201):** Dados do evento criado

---

### 2.4 Eventos do Organizador
- **Endpoint:** `GET /eventos/organizador/`
- **Autenticação:** Sim (apenas organizadores)
- **Resposta (200):** Array de eventos criados pelo organizador

---

### 2.5 Estatísticas do Organizador
- **Endpoint:** `GET /eventos/estatisticas/`
- **Autenticação:** Sim (apenas organizadores)
- **Resposta (200):**
```json
{
  "total_eventos": 5,
  "total_proximos": 2,
  "total_inscricoes": 150
}
```

---

### 2.6 Participantes do Evento
- **Endpoint:** `GET /eventos/{id}/participantes/`
- **Autenticação:** Sim (apenas organizador do evento)
- **Resposta (200):** Array de inscrições com dados dos participantes

---

## 📝 3. Inscrições

### 3.1 Inscrever-se em Evento
- **Endpoint:** `POST /inscricoes/`
- **Autenticação:** Sim
- **Payload:**
```json
{
  "evento": 1
}
```
- **Resposta (201):** Dados da inscrição
- **Erros:**
  - `400`: Já inscrito / Evento lotado

---

### 3.2 Minhas Inscrições
- **Endpoint:** `GET /inscricoes/minhas_inscricoes/`
- **Autenticação:** Sim
- **Resposta (200):** Array de inscrições do usuário

---

### 3.3 Cancelar Inscrição
- **Endpoint:** `POST /inscricoes/cancelar_inscricao/`
- **Autenticação:** Sim
- **Payload:**
```json
{
  "evento": 1
}
```
- **Resposta (200):**
```json
{
  "message": "Inscrição removida com sucesso"
}
```

---

### 3.4 Marcar Presença
- **Endpoint:** `POST /inscricoes/{id}/marcar_presenca/`
- **Autenticação:** Sim (organizador)
- **Resposta (200):**
```json
{
  "status": "Presenca marcada"
}
```

---

## 🎓 4. Certificados

### 4.1 Listar Meus Certificados
- **Endpoint:** `GET /certificados/`
- **Autenticação:** Sim
- **Descrição:** Lista certificados de eventos concluídos (apenas presença confirmada)
- **Resposta (200):**
```json
[
  {
    "id": 1,
    "inscricao": 10,
    "codigo_validacao": "XXXX...",
    "data_emissao": "2025-12-16T00:00:00Z",
    "arquivo_url": "http://127.0.0.1:8000/media/certificados/cert_1.pdf"
  }
]
```

---

### 4.2 Validar Certificado
- **Endpoint:** `GET /certificados/validar/?codigo=XXX`
- **Autenticação:** Não (público)
- **Resposta (200):** Dados do certificado se válido
- **Resposta (404):** Certificado inválido

---

## 📂 5. Categorias

### 5.1 Listar Categorias
- **Endpoint:** `GET /categorias/`
- **Autenticação:** Não
- **Resposta (200):**
```json
[
  { "id": 1, "nome": "Tecnologia" },
  { "id": 2, "nome": "Ciências" }
]
```

---

## 📊 6. Logs de Auditoria

### 6.1 Consultar Logs
- **Endpoint:** `GET /audit-logs/`
- **Autenticação:** Sim (apenas organizadores)
- **Query Parameters:**
  - `data`: Filtrar por data (YYYY-MM-DD)
  - `usuario_email`: Filtrar por email
  - `usuario_id`: Filtrar por ID
  - `acao`: Filtrar por tipo de ação
  - `limit`: Limite de resultados (default: 50)
  - `offset`: Paginação

- **Exemplo:** `GET /audit-logs/?data=2025-12-07&acao=usuario_login`

- **Resposta (200):**
```json
[
  {
    "id": 1,
    "usuario": 5,
    "usuario_nome": "João Silva",
    "usuario_email": "joao@exemplo.com",
    "acao": "usuario_login",
    "acao_display": "Login de Usuário",
    "detalhes": "Login realizado com sucesso",
    "ip_address": "127.0.0.1",
    "data_hora": "2025-12-07T10:30:00Z"
  }
]
```

**Ações registradas:**
- `usuario_criado`, `usuario_login`
- `evento_criado`, `evento_alterado`, `evento_excluido`, `evento_consultado`
- `inscricao_criada`, `inscricao_cancelada`, `presenca_marcada`
- `certificado_gerado`, `certificado_consultado`

---

## ⚡ 7. Rate Limiting (Throttling)

| Endpoint | Limite |
|----------|--------|
| `/eventos/*` | 20 requisições/dia |
| `/inscricoes/*` | 50 requisições/dia |

---

## 📖 8. Swagger/OpenAPI

- **Swagger UI:** `http://127.0.0.1:8000/swagger/`
- **ReDoc:** `http://127.0.0.1:8000/redoc/`

Para autenticar no Swagger:
1. Clique em "Authorize"
2. Digite: `Token SEU_TOKEN_AQUI`

---

## 🐛 Tratamento de Erros

```json
{
  "error": "Mensagem descritiva do erro"
}
```

**Códigos HTTP:**
- `200`: Sucesso
- `201`: Criado
- `400`: Dados inválidos
- `401`: Não autenticado
- `403`: Sem permissão / Email não confirmado
- `404`: Não encontrado
- `429`: Rate limit excedido

---

**Versão:** 2.0 | **Atualizado:** 07/12/2024
