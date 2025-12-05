# 📋 Documentação de Endpoints da API - SGEA Campus

**Base URL:** `http://127.0.0.1:8000/api`

> **Nota:** Todos os endpoints que requerem autenticação devem usar `credentials: 'include'` para enviar cookies de sessão.

---

## 🔐 1. Autenticação e Usuários

### 1.1 Registro de Usuário
- **Endpoint:** `/usuarios/registro/`
- **Método:** `POST`
- **Autenticação:** Não
- **Headers:**
  ```json
  {
    "Content-Type": "application/json",
    "X-CSRFToken": "<token>"
  }
  ```
- **Payload:**
  ```json
  {
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "instituicao_ensino": "Universidade Federal",
    "telefone": "11999999999",  // apenas dígitos
    "cpf": "12345678900",        // apenas dígitos
    "perfil": "aluno",           // "aluno" | "professor" | "organizador"
    "senha": "senha123"
  }
  ```
- **Resposta (201):**
  ```json
  {
    "id": 1,
    "email": "joao@exemplo.com",
    "nome": "João Silva",
    "perfil": "aluno",
    "telefone": "11999999999",
    "instituicao_ensino": "Universidade Federal",
    "criado_em": "2025-01-01T10:00:00Z",
    "message": "Usuário registrado com sucesso"
  }
  ```
- **Erros:**
  - `400`: Email já cadastrado ou dados inválidos
  - `500`: Erro interno do servidor

---

### 1.2 Login
- **Endpoint:** `/usuarios/login/`
- **Método:** `POST`
- **Autenticação:** Não
- **Headers:**
  ```json
  {
    "Content-Type": "application/json",
    "X-CSRFToken": "<token>"
  }
  ```
- **Payload:**
  ```json
  {
    "email": "joao@exemplo.com",
    "senha": "senha123"
  }
  ```
- **Resposta (200):**
  ```json
  {
    "id": 1,
    "email": "joao@exemplo.com",
    "nome": "João Silva",
    "perfil": "aluno",
    "telefone": "11999999999",
    "instituicao_ensino": "Universidade Federal",
    "criado_em": "2025-01-01T10:00:00Z",
    "message": "Login realizado com sucesso"
  }
  ```
- **Erros:**
  - `401`: Credenciais inválidas
  - `400`: Dados incompletos

---

### 1.3 Logout
- **Endpoint:** `/usuarios/logout/`
- **Método:** `POST`
- **Autenticação:** Sim (cookie de sessão)
- **Headers:**
  ```json
  {
    "Content-Type": "application/json",
    "X-CSRFToken": "<token>"
  }
  ```
- **Payload:** Vazio
- **Resposta (200):**
  ```json
  {
    "message": "Logout realizado com sucesso"
  }
  ```

---

### 1.4 Obter Usuário Atual
- **Endpoint:** `/usuarios/current_user/`
- **Método:** `GET`
- **Autenticação:** Sim (cookie de sessão)
- **Payload:** Não aplicável
- **Resposta (200):**
  ```json
  {
    "id": 1,
    "email": "joao@exemplo.com",
    "nome": "João Silva",
    "perfil": "aluno",
    "telefone": "11999999999",
    "instituicao_ensino": "Universidade Federal",
    "cpf": "12345678900",
    "criado_em": "2025-01-01T10:00:00Z"
  }
  ```
- **Erros:**
  - `401`: Usuário não autenticado

---

## 📅 2. Eventos

### 2.1 Listar Eventos Disponíveis
- **Endpoint:** `/eventos/disponiveis/`
- **Método:** `GET`
- **Autenticação:** Sim
- **Descrição:** Retorna todos os eventos nos quais o usuário ainda NÃO está inscrito
- **Payload:** Não aplicável
- **Resposta (200):**
  ```json
  [
    {
      "id": 1,
      "titulo": "Semana Acadêmica de Tecnologia",
      "descricao": "Evento de tecnologia...",
      "local": "Auditório Principal",
      "data_inicio": "2025-03-01T09:00:00Z",
      "data_fim": "2025-03-05T18:00:00Z",
      "capacidade_par": 100,
      "categoria": 1,
      "organizador": 5,
      "banner": "/media/banners/evento1.jpg",  // ou null
      "banner_url": "http://127.0.0.1:8000/media/banners/evento1.jpg",  // campo calculado
      "criado_em": "2025-01-15T10:00:00Z"
    }
  ]
  ```

---

### 2.2 Listar Meus Eventos (Inscritos)
- **Endpoint:** `/eventos/meus_eventos/`
- **Método:** `GET`
- **Autenticação:** Sim
- **Descrição:** Retorna todos os eventos nos quais o usuário está inscrito
- **Payload:** Não aplicável
- **Resposta (200):**
  ```json
  [
    {
      "id": 1,
      "titulo": "Semana Acadêmica de Tecnologia",
      "descricao": "Evento de tecnologia...",
      "local": "Auditório Principal",
      "data_inicio": "2025-03-01T09:00:00Z",
      "data_fim": "2025-03-05T18:00:00Z",
      "capacidade_par": 100,
      "categoria": 1,
      "organizador": 5,
      "banner": "/media/banners/evento1.jpg",
      "banner_url": "http://127.0.0.1:8000/media/banners/evento1.jpg",
      "criado_em": "2025-01-15T10:00:00Z"
    }
  ]
  ```

---

### 2.3 Criar Evento (Organizador)
- **Endpoint:** `/eventos/`
- **Método:** `POST`
- **Autenticação:** Sim (apenas organizadores)
- **Headers:**
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Payload:**
  ```json
  {
    "titulo": "Semana Acadêmica de Tecnologia",
    "descricao": "Descrição do evento",  // opcional
    "local": "Auditório Principal",
    "data_inicio": "2025-03-01T09:00:00Z",  // formato ISO 8601
    "data_fim": "2025-03-05T18:00:00Z",     // formato ISO 8601
    "capacidade_par": 100,                   // opcional (null se não informado)
    "categoria": 1                           // ID da categoria, opcional (null se não informado)
  }
  ```
- **Resposta (201):**
  ```json
  {
    "id": 1,
    "titulo": "Semana Acadêmica de Tecnologia",
    "descricao": "Descrição do evento",
    "local": "Auditório Principal",
    "data_inicio": "2025-03-01T09:00:00Z",
    "data_fim": "2025-03-05T18:00:00Z",
    "capacidade_par": 100,
    "categoria": 1,
    "organizador": 5,
    "banner": null,
    "criado_em": "2025-01-15T10:00:00Z",
    "message": "Evento criado com sucesso"
  }
  ```
- **Erros:**
  - `401`: Usuário não autenticado
  - `403`: Apenas organizadores podem criar eventos
  - `400`: Dados inválidos (ex: data_fim anterior a data_inicio)

---

### 2.4 Atualizar Evento (Organizador)
- **Endpoint:** `/eventos/{id}/`
- **Método:** `PUT` ou `PATCH`
- **Autenticação:** Sim (apenas o organizador criador)
- **Payload:** Mesma estrutura do criar, com campos opcionais para PATCH
- **Resposta (200):** Dados do evento atualizado

---

### 2.5 Deletar Evento (Organizador)
- **Endpoint:** `/eventos/{id}/`
- **Método:** `DELETE`
- **Autenticação:** Sim (apenas o organizador criador)
- **Resposta (204):** Sem conteúdo

---

## 📝 3. Inscrições

### 3.1 Inscrever-se em Evento
- **Endpoint:** `/inscricoes/`
- **Método:** `POST`
- **Autenticação:** Sim
- **Headers:**
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Payload:**
  ```json
  {
    "evento": 1  // ID do evento
  }
  ```
- **Resposta (201):**
  ```json
  {
    "id": 10,
    "usuario": 3,
    "evento": 1,
    "data_inscricao": "2025-01-20T14:30:00Z",
    "status": "confirmada",
    "message": "Inscrição realizada com sucesso"
  }
  ```
- **Erros:**
  - `401`: Usuário não autenticado
  - `400`: 
    - Já está inscrito neste evento
    - Evento lotado (capacidade atingida)
    - Evento já finalizado
    - Organizadores não podem se inscrever em eventos

---

### 3.2 Cancelar Inscrição
- **Endpoint:** `/inscricoes/cancelar/`
- **Método:** `POST`
- **Autenticação:** Sim
- **Headers:**
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Payload:**
  ```json
  {
    "evento": 1  // ID do evento
  }
  ```
- **Resposta (200):**
  ```json
  {
    "message": "Inscrição removida com sucesso"
  }
  ```
- **Erros:**
  - `401`: Usuário não autenticado
  - `404`: Inscrição não encontrada

---

## 🎓 4. Certificados

### 4.1 Listar Meus Certificados
- **Endpoint:** `/certificados/`
- **Método:** `GET`
- **Autenticação:** Sim
- **Descrição:** Retorna certificados gerados automaticamente para eventos concluídos
- **Payload:** Não aplicável
- **Resposta (200):**
  ```json
  [
    {
      "id": 1,
      "usuario": 3,
      "inscricao": 10,
      "evento_titulo": "Semana Acadêmica de Tecnologia",  // campo adicional
      "codigo_validacao": "CERT-2025-ABC123",
      "data_emissao": "2025-03-06T00:00:00Z",
      "carga_horaria": 40,  // opcional, pode ser null
      "arquivo": "/media/certificados/cert_1.pdf",  // ou null
      "arquivo_url": "http://127.0.0.1:8000/media/certificados/cert_1.pdf"  // campo calculado
    }
  ]
  ```

---

### 4.2 Validar Certificado
- **Endpoint:** `/certificados/validar/`
- **Método:** `GET`
- **Autenticação:** Não
- **Query Parameters:**
  - `codigo`: Código de validação do certificado
- **Exemplo:** `/certificados/validar/?codigo=CERT-2025-ABC123`
- **Resposta (200):**
  ```json
  {
    "valido": true,
    "certificado": {
      "codigo_validacao": "CERT-2025-ABC123",
      "nome_participante": "João Silva",
      "evento_titulo": "Semana Acadêmica de Tecnologia",
      "data_emissao": "2025-03-06T00:00:00Z",
      "carga_horaria": 40
    }
  }
  ```
- **Resposta (404):**
  ```json
  {
    "valido": false,
    "error": "Certificado não encontrado"
  }
  ```

---

## 📂 5. Categorias

### 5.1 Listar Categorias
- **Endpoint:** `/categorias/`
- **Método:** `GET`
- **Autenticação:** Sim
- **Descrição:** Retorna todas as categorias disponíveis para eventos
- **Payload:** Não aplicável
- **Resposta (200):**
  ```json
  [
    {
      "id": 1,
      "nome": "Tecnologia"
    },
    {
      "id": 2,
      "nome": "Ciências"
    },
    {
      "id": 3,
      "nome": "Artes"
    }
  ]
  ```

---

## 🔧 6. Painel do Organizador

### 6.1 Listar Eventos do Organizador
- **Endpoint:** `/eventos/meus_organizados/` (ou usar filtro em `/eventos/`)
- **Método:** `GET`
- **Autenticação:** Sim (apenas organizadores)
- **Descrição:** Retorna eventos criados pelo organizador logado
- **Resposta (200):** Array de eventos (mesma estrutura de 2.1)

---

### 6.2 Listar Participantes de um Evento
- **Endpoint:** `/eventos/{evento_id}/participantes/`
- **Método:** `GET`
- **Autenticação:** Sim (apenas o organizador criador)
- **Resposta (200):**
  ```json
  [
    {
      "id": 10,
      "usuario": {
        "id": 3,
        "nome": "João Silva",
        "email": "joao@exemplo.com",
        "telefone": "11999999999"
      },
      "data_inscricao": "2025-01-20T14:30:00Z",
      "status": "confirmada"
    }
  ]
  ```

---

### 6.3 Gerar Lista de Presença (Excel)
- **Endpoint:** `/eventos/{evento_id}/gerar_presenca/`
- **Método:** `GET`
- **Autenticação:** Sim (apenas o organizador criador)
- **Resposta:** Arquivo Excel (.xlsx) para download

---

## 📊 7. Observações Importantes

### 7.1 Autenticação
- O frontend usa **cookies de sessão** (`credentials: 'include'`)
- Todos os endpoints protegidos devem retornar `401` se não autenticado
- Tokens CSRF devem ser validados em requisições POST/PUT/DELETE

### 7.2 Permissões
- **Organizadores:**
  - Podem criar, editar e deletar seus próprios eventos
  - NÃO podem se inscrever em eventos
  - Têm acesso ao painel administrativo
  - Podem visualizar participantes de seus eventos

- **Alunos/Professores:**
  - Podem se inscrever em eventos
  - Podem cancelar suas inscrições
  - Recebem certificados automaticamente após eventos concluídos
  - NÃO podem criar eventos

### 7.3 Regras de Negócio

#### Inscrições:
- Não permitir inscrição duplicada
- Verificar capacidade máxima do evento
- Não permitir inscrição em eventos já finalizados
- Organizadores não podem se inscrever

#### Certificados:
- Gerados automaticamente quando `data_fim` < data atual
- Apenas para usuários com inscrição confirmada
- Código de validação único e verificável

#### Eventos:
- `data_fim` deve ser posterior a `data_inicio`
- Campos obrigatórios: titulo, local, data_inicio, data_fim
- Campo `banner` é opcional (FileField)

### 7.4 Formato de Datas
- Todas as datas são em formato **ISO 8601**: `YYYY-MM-DDTHH:MM:SSZ`
- Exemplo: `"2025-03-01T09:00:00Z"`
- Frontend envia no formato: `"2025-12-10T14:30:00Z"`

### 7.5 CORS
- Configure CORS para aceitar `credentials: true`
- Permita origin: `http://localhost:8000` (Django templates)

---

## 🚀 Prioridade de Implementação

### Fase 1 (Essencial):
1. ✅ Autenticação (registro, login, logout, current_user)
2. ✅ Eventos (listar disponíveis, meus eventos)
3. ✅ Inscrições (criar, cancelar)

### Fase 2 (Importante):
4. ✅ Criar eventos (organizador)
5. ✅ Categorias (listar)
6. ✅ Certificados (listar, validar)

### Fase 3 (Desejável):
7. ✅ Painel organizador (participantes)
8. ✅ Editar/deletar eventos
9. ✅ Gerar lista de presença

---

## 📝 Checklist para o Backend

- [ ] Configurar Django REST Framework
- [ ] Criar models: Usuario, Evento, Categoria, Inscricao, Certificado
- [ ] Implementar autenticação por sessão
- [ ] Criar serializers para cada model
- [ ] Implementar permissões (IsOrganizador, IsAuthenticated)
- [ ] Criar views/viewsets para cada endpoint
- [ ] Configurar CORS com credentials
- [ ] Implementar geração automática de certificados
- [ ] Adicionar validações de negócio
- [ ] Configurar upload de banners (media files)
- [ ] Testar todos os endpoints

---

## 🐛 Tratamento de Erros

Todos os endpoints devem retornar erros no formato:

```json
{
  "error": "Mensagem descritiva do erro"
}
```

**Códigos HTTP comuns:**
- `200`: Sucesso
- `201`: Criado com sucesso
- `204`: Sucesso sem conteúdo
- `400`: Dados inválidos
- `401`: Não autenticado
- `403`: Sem permissão
- `404`: Não encontrado
- `500`: Erro interno

---

**Documentação gerada em:** 04/12/2024  
**Versão:** 1.0  
**Projeto:** SGEA Campus - Sistema de Gerenciamento de Eventos Acadêmicos
