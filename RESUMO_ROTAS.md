# 📋 Resumo Rápido das Rotas - SGEA

**Base URL:** `http://127.0.0.1:8000/api`

## 🔐 Autenticação e Usuários

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/usuarios/registro/` | POST | ❌ | Cadastro (envia email de confirmação) |
| `/usuarios/login/` | POST | ❌ | Login (retorna token) |
| `/usuarios/logout/` | POST | ✅ | Logout |
| `/usuarios/current_user/` | GET | ✅ | Dados do usuário logado |
| `/usuarios/confirmar_email/?codigo=XXX` | GET | ❌ | Confirmar email pelo link |
| `/usuarios/reenviar_confirmacao/` | POST | ❌ | Reenviar email de confirmação |

---

## 📅 Eventos

| Endpoint | Método | Auth | Perfil | Descrição |
|----------|--------|------|--------|-----------|
| `/eventos/disponiveis/` | GET | ✅ | Todos | Eventos disponíveis |
| `/eventos/meus_eventos/` | GET | ✅ | Todos | Eventos inscritos |
| `/eventos/` | POST | ✅ | Organizador | Criar evento |
| `/eventos/{id}/` | PUT/PATCH | ✅ | Organizador | Atualizar evento |
| `/eventos/{id}/` | DELETE | ✅ | Organizador | Deletar evento |
| `/eventos/organizador/` | GET | ✅ | Organizador | Meus eventos criados |
| `/eventos/estatisticas/` | GET | ✅ | Organizador | Estatísticas do organizador |
| `/eventos/{id}/participantes/` | GET | ✅ | Organizador | Listar participantes |

---

## 📝 Inscrições

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/inscricoes/` | POST | ✅ | Inscrever-se em evento |
| `/inscricoes/minhas_inscricoes/` | GET | ✅ | Listar minhas inscrições |
| `/inscricoes/cancelar_inscricao/` | POST | ✅ | Cancelar inscrição |
| `/inscricoes/{id}/marcar_presenca/` | POST | ✅ | Marcar presença (org.) |

---

## 🎓 Certificados

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/certificados/` | GET | ✅ | Listar meus certificados |
| `/certificados/validar/?codigo=XXX` | GET | ❌ | Validar certificado (público) |

> **Nota:** Certificados só são gerados para usuários com **presença confirmada**.

---

## 📂 Categorias

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/categorias/` | GET | ❌ | Listar categorias |

---

## 📊 Logs de Auditoria (Organizadores)

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/audit-logs/` | GET | ✅ | Consultar logs de auditoria |

**Filtros disponíveis:**
- `?data=2025-12-07` - Por data específica
- `?usuario_email=aluno@sgea.com` - Por email do usuário
- `?usuario_id=5` - Por ID do usuário
- `?acao=usuario_login` - Por tipo de ação

**Ações auditadas:**
- `usuario_criado`, `usuario_login`
- `evento_criado`, `evento_alterado`, `evento_excluido`, `evento_consultado`
- `inscricao_criada`, `inscricao_cancelada`, `presenca_marcada`
- `certificado_gerado`, `certificado_consultado`

---

## 🔑 Autenticação

### Por Token (API/Swagger)
```
Header: Authorization: Token <seu_token>
```

### Por Sessão (Frontend)
```javascript
fetch(url, { credentials: 'include' })
```

---

## ⚡ Rate Limiting (Throttling)

| Endpoint | Limite |
|----------|--------|
| `/eventos/*` | 20 requisições/dia |
| `/inscricoes/*` | 50 requisições/dia |

---

## 📊 Legendas

- ✅ = Requer autenticação
- ❌ = Público (sem autenticação)
- **Organizador** = Apenas perfil "organizador"
- **Todos** = Qualquer usuário autenticado

---

## 🎯 Payloads Principais

### Registro de Usuário
```json
{
  "nome": "string",
  "email": "string",
  "instituicao_ensino": "string",
  "telefone": "string (opcional)",
  "cpf": "string (opcional)",
  "perfil": "aluno | professor | organizador",
  "senha": "string (min 8, com letras, números e caracteres especiais)"
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
  "data_inicio": "2025-12-10T09:00:00Z",
  "data_fim": "2025-12-10T18:00:00Z",
  "capacidade_par": 100,
  "categoria": 1
}
```

### Inscrição
```json
{
  "evento": 1
}
```

---

## 🚨 Regras de Negócio

### ✅ Permitido
- Alunos/Professores podem se inscrever em eventos
- Organizadores podem criar/editar/deletar seus eventos
- Certificados são gerados para **presença confirmada**
- Validação de certificados é pública

### ❌ NÃO Permitido
- Inscrição duplicada no mesmo evento
- Inscrição em evento lotado
- Inscrição em evento já finalizado
- Evento com data de início no passado
- Login sem confirmar email
- Senha sem caracteres especiais

---

**Atualizado:** 07/12/2024 | **Versão:** 2.0
