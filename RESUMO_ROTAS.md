# 📋 Resumo Rápido das Rotas - SGEA Campus

## 🔐 Autenticação e Usuários

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/usuarios/registro/` | POST | ❌ | Cadastro de novo usuário |
| `/usuarios/login/` | POST | ❌ | Login do usuário |
| `/usuarios/logout/` | POST | ✅ | Logout do usuário |
| `/usuarios/current_user/` | GET | ✅ | Dados do usuário logado |

---

## 📅 Eventos

| Endpoint | Método | Auth | Perfil | Descrição |
|----------|--------|------|---------|-----------|
| `/eventos/disponiveis/` | GET | ✅ | Todos | Eventos disponíveis (não inscritos) |
| `/eventos/meus_eventos/` | GET | ✅ | Todos | Eventos que estou inscrito |
| `/eventos/` | POST | ✅ | Organizador | Criar novo evento |
| `/eventos/{id}/` | PUT/PATCH | ✅ | Organizador | Atualizar evento |
| `/eventos/{id}/` | DELETE | ✅ | Organizador | Deletar evento |
| `/eventos/{id}/participantes/` | GET | ✅ | Organizador | Listar participantes |
| `/eventos/{id}/gerar_presenca/` | GET | ✅ | Organizador | Gerar lista de presença (Excel) |

---

## 📝 Inscrições

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/inscricoes/` | POST | ✅ | Inscrever-se em evento |
| `/inscricoes/cancelar/` | POST | ✅ | Cancelar inscrição |

---

## 🎓 Certificados

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/certificados/` | GET | ✅ | Listar meus certificados |
| `/certificados/validar/?codigo=XXX` | GET | ❌ | Validar certificado (público) |

---

## 📂 Categorias

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/categorias/` | GET | ✅ | Listar categorias de eventos |

---

## 📊 Legendas

- ✅ = Requer autenticação (cookie de sessão)
- ❌ = Público (sem autenticação)
- **Organizador** = Apenas usuários com perfil "organizador"
- **Todos** = Qualquer usuário autenticado

---

## 🎯 Payloads Principais

### Registro de Usuário
```json
{
  "nome": "string",
  "email": "string",
  "instituicao_ensino": "string",
  "telefone": "string (apenas dígitos)",
  "cpf": "string (apenas dígitos)",
  "perfil": "aluno | professor | organizador",
  "senha": "string (min 8 caracteres)"
}
```

### Login
```json
{
  "email": "string",
  "senha": "string"
}
```

### Criar Evento
```json
{
  "titulo": "string",
  "descricao": "string (opcional)",
  "local": "string",
  "data_inicio": "2025-03-01T09:00:00Z",
  "data_fim": "2025-03-05T18:00:00Z",
  "capacidade_par": 100,
  "categoria": 1
}
```

### Inscrição em Evento
```json
{
  "evento": 1
}
```

### Cancelar Inscrição
```json
{
  "evento": 1
}
```

---

## 🚨 Regras de Negócio Importantes

### ✅ Permitido
- Alunos/Professores podem se inscrever em eventos
- Organizadores podem criar/editar/deletar seus eventos
- Certificados são gerados automaticamente após evento concluir
- Validação de certificados é pública (sem login)

### ❌ NÃO Permitido
- Organizadores **não** podem se inscrever em eventos
- Inscrição duplicada no mesmo evento
- Inscrição em evento lotado (capacidade atingida)
- Inscrição em evento já finalizado
- Editar/deletar eventos de outros organizadores

---

## 📅 Formato de Datas

**Formato obrigatório:** ISO 8601  
**Exemplo:** `2025-03-01T09:00:00Z`

O frontend envia as datas no formato `datetime-local` convertido para ISO 8601 com sufixo `Z` (UTC).

---

## 🔑 Autenticação

- Método: **Sessão Django (Cookies)**
- Header CSRF: `X-CSRFToken` (em POST/PUT/DELETE)
- Credentials: `include` (para enviar cookies)

### Exemplo de requisição autenticada:
```javascript
fetch('http://127.0.0.1:8000/api/eventos/disponiveis/', {
  method: 'GET',
  credentials: 'include'
})
```

---

## 🎨 Resposta de Erro Padrão

```json
{
  "error": "Mensagem descritiva do erro"
}
```

**Códigos HTTP:**
- `200` - OK
- `201` - Criado
- `400` - Dados inválidos
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
