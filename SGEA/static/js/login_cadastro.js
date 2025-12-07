// Toggle entre painéis
const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");

if (registerBtn)
  registerBtn.addEventListener("click", () =>
    container.classList.add("active")
  );
if (loginBtn)
  loginBtn.addEventListener("click", () =>
    container.classList.remove("active")
  );

// Toast helper
function showToast(msg, ms = 1500) {
  const t = document.getElementById("toast");
  if (!t) return alert(msg);
  t.textContent = msg;
  t.style.opacity = "1";
  setTimeout(() => {
    t.style.opacity = "0";
  }, ms);
}

// =================== Máscaras CPF / Telefone ===================
// Formata CPF: 000.000.000-00
function maskCPF(value) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.replace(/^(\d{3})(\d+)$/, "$1.$2");
  if (digits.length <= 9) return digits.replace(/^(\d{3})(\d{3})(\d+)$/, "$1.$2.$3");
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
}

// Formata telefone: XX XXXXX-XXXX (aceita 10 ou 11 dígitos; para 10 digitos usa X XXXX-XXXX)
function maskPhone(value) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return digits.replace(/^(\d{2})(\d+)$/, "$1 $2");
  if (digits.length <= 10) {
    // caso 10 dígitos: 2 + 4 + 4 -> ex: "11 9876-5432"
    return digits.replace(/^(\d{2})(\d{4})(\d+)$/, "$1 $2-$3");
  }
  // 11 dígitos: 2 + 5 + 4 -> "11 99876-5432"
  return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "$1 $2-$3");
}

// Aplica máscaras nos inputs
const cpfEl = document.getElementById("cad-cpf");
const telEl = document.getElementById("cad-telefone");

if (cpfEl) {
  cpfEl.addEventListener("input", (e) => {
    const cur = e.target.selectionStart;
    const before = e.target.value;
    e.target.value = maskCPF(e.target.value);
    // nota: simples tentativa de preservar cursor (pode não ser perfeita em todos browsers)
    const diff = e.target.value.length - before.length;
    e.target.selectionStart = e.target.selectionEnd = Math.max(0, cur + diff);
  });
  // no paste: limpar qualquer caractere não numérico e aplicar máscara
  cpfEl.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    e.target.value = maskCPF(text);
  });
}

if (telEl) {
  telEl.addEventListener("input", (e) => {
    const cur = e.target.selectionStart;
    const before = e.target.value;
    e.target.value = maskPhone(e.target.value);
    const diff = e.target.value.length - before.length;
    e.target.selectionStart = e.target.selectionEnd = Math.max(0, cur + diff);
  });
  telEl.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    e.target.value = maskPhone(text);
  });
}

// =================== BACKEND: integração com Django API ===================
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Registro no backend
async function registerBackend(payload) {
  console.log("Enviando dados para registro:", payload);

  const res = await fetch(`${API_BASE_URL}/usuarios/registro/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  console.log("Resposta do servidor:", res.status, res.statusText);

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ error: "Erro desconhecido" }));
    console.error("Erro detalhado:", errorData);
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  const responseData = await res.json();
  console.log("Registro bem-sucedido:", responseData);
  return responseData;
}

// Login no backend
async function loginBackend(credentials) {
  const res = await fetch(`${API_BASE_URL}/usuarios/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }
  return await res.json();
}

// Logout no backend
async function logoutBackend() {
  const res = await fetch(`${API_BASE_URL}/usuarios/logout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Erro no logout: HTTP ${res.status}`);
  }
  return await res.json();
}

// Função auxiliar para obter cookie CSRF
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// =================== FALLBACK: localStorage (DESENVOLVIMENTO) ===================
// Armazena usuários em 'sgea_users' (apenas para dev). NÃO usar em produção para senhas em texto.
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("sgea_users") || "[]");
  } catch {
    return [];
  }
}
function saveUsers(list) {
  localStorage.setItem("sgea_users", JSON.stringify(list));
}

function setSessionUser(userObj) {
  // Salva usuário "logado" em sgea_user (usado pelo resto da aplicação)
  localStorage.setItem("sgea_user", JSON.stringify(userObj));
}

// =================== Validação de senha ===================
function isPasswordValid(pw) {
  if (!pw || pw.length < 8) return false;
  // precisa de ao menos uma letra, um número e um caractere especial
  const hasLetter = /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw);
  return hasLetter && hasNumber && hasSpecial;
}

// =================== Confirmação de senha (front) ===================
const senhaEl = document.getElementById("cad-senha");
const senhaConfirmEl = document.getElementById("cad-senha-confirm");
const senhaConfirmMsgEl = document.getElementById("senha-confirm-msg");

function validatePasswordMatch() {
  if (!senhaEl || !senhaConfirmEl || !senhaConfirmMsgEl) return true;

  const senha = senhaEl.value;
  const confirm = senhaConfirmEl.value;

  // Se o campo de confirmação estiver vazio, não mostra erro
  if (!confirm) {
    senhaConfirmMsgEl.textContent = "";
    return true;
  }

  if (senha !== confirm) {
    senhaConfirmMsgEl.textContent = "As senhas não coincidem.";
    return false;
  } else {
    senhaConfirmMsgEl.textContent = "";
    return true;
  }
}

// Validação em tempo real
if (senhaEl && senhaConfirmEl) {
  senhaEl.addEventListener("input", validatePasswordMatch);
  senhaConfirmEl.addEventListener("input", validatePasswordMatch);
}

// =================== Cadastro (registro) ===================
const formCadastro = document.getElementById("form-cadastro");
if (formCadastro) {
  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();

    // validações HTML5
    if (!formCadastro.checkValidity()) {
      formCadastro.reportValidity();
      return;
    }

    const nome = document.getElementById("cad-nome").value.trim();
    const email = document
      .getElementById("cad-email")
      .value.trim()
      .toLowerCase();
    const instituicao_ensino = document
      .getElementById("cad-instituicao")
      .value.trim();
    // valores mascarados
    const telefoneMask = document.getElementById("cad-telefone").value.trim();
    const cpfMask = document.getElementById("cad-cpf").value.trim();
    const perfil = document.getElementById("cad-perfil").value;
    const senha = document.getElementById("cad-senha").value;
    const senhaConfirm = document.getElementById("cad-senha-confirm").value;

    // Confirmação de senha
    if (senha !== senhaConfirm) {
      if (senhaConfirmMsgEl) {
        senhaConfirmMsgEl.textContent = "As senhas não coincidem.";
      }
      showToast("As senhas não coincidem.");
      return;
    }

    // Validações extras
    if (!email || !senha || !nome) {
      showToast("Preencha os campos obrigatórios.");
      return;
    }

    // Validação de senha (mínimo 8, contendo letra e número)
    if (!isPasswordValid(senha)) {
      showToast("Senha inválida: mínimo 8 caracteres, contendo letras, números e caracteres especiais.");
      return;
    }

    // Extrai apenas dígitos de CPF e Telefone para envio
    const cpfDigits = cpfMask.replace(/\D/g, "");
    const telDigits = telefoneMask.replace(/\D/g, "");

    // se desejar tornar cpf/telefone opcionais no payload, ajuste aqui.
    const payload = {
      nome,
      email,
      instituicao_ensino,
      telefone: telDigits || null,
      cpf: cpfDigits || null,
      perfil,
      senha,
    };

    try {
      // =================== INTEGRAR COM BACKEND ===================
      const resp = await registerBackend(payload);
      // resp = { id, email, nome, perfil, telefone, instituicao_ensino, criado_em, message }
      setSessionUser({
        id: resp.id,
        email: resp.email,
        nome: resp.nome,
        perfil: resp.perfil,
        telefone: resp.telefone,
        instituicao_ensino: resp.instituicao_ensino,
      });
      showToast("Cadastro realizado! Redirecionando...");
      setTimeout(() => (window.location.href = '/dashboard/'), 900);
      return;

      // =================== FALLBACK LOCAL (comentado) ===================
      const users = getUsers();
      // verifica existência por email
      if (users.find((u) => u.email === email)) {
        showToast("Já existe uma conta com esse email.");
        return;
      }

      // NotA: em produção NUNCA salve senhas em texto claro; use hashing e TLS.
      const newUser = {
        id: "u" + Date.now(),
        nome,
        email,
        instituicao_ensino,
        telefone: telDigits,
        cpf: cpfDigits,
        perfil,
        senha,
      };
      users.push(newUser);
      saveUsers(users);

      // define sessão local e redireciona
      setSessionUser({
        email: newUser.email,
        nome: newUser.nome,
        perfil: newUser.perfil,
      });
      showToast("Cadastro realizado! Redirecionando...");
      setTimeout(() => (window.location.href = '/dashboard/'), 900);
    } catch (err) {
      console.error("Erro ao cadastrar:", err);
      let errorMessage = "Erro ao cadastrar. Tente novamente.";

      // Tenta extrair mensagem de erro mais específica
      if (err.message) {
        if (err.message.includes("email")) {
          errorMessage = "Erro: Email já está em uso ou inválido.";
        } else if (err.message.includes("senha")) {
          errorMessage = "Erro: Senha inválida.";
        } else if (err.message.includes("nome")) {
          errorMessage = "Erro: Nome inválido.";
        } else {
          errorMessage = `Erro: ${err.message}`;
        }
      }

      showToast(errorMessage);
    }
  });
}

// =================== Login ===================
const formLogin = document.getElementById("form-login");
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!formLogin.checkValidity()) {
      formLogin.reportValidity();
      return;
    }

    const email = document
      .getElementById("login-email")
      .value.trim()
      .toLowerCase();
    const senha = document.getElementById("login-senha").value;

    try {
      // =================== INTEGRAR COM BACKEND ===================
      const resp = await loginBackend({ email, senha });
      // resp = { id, email, nome, perfil, telefone, instituicao_ensino, criado_em, message }
      setSessionUser({
        id: resp.id,
        email: resp.email,
        nome: resp.nome,
        perfil: resp.perfil,
        telefone: resp.telefone,
        instituicao_ensino: resp.instituicao_ensino,
      });
      showToast("Login bem-sucedido! Redirecionando...");
      setTimeout(() => (window.location.href = '/dashboard/'), 700);
      return;

      // =================== FALLBACK LOCAL (comentado) ===================
      const users = getUsers();
      const found = users.find((u) => u.email === email && u.senha === senha);
      if (!found) {
        showToast("Email ou senha inválidos.");
        return;
      }

      setSessionUser({
        email: found.email,
        nome: found.nome,
        perfil: found.perfil,
      });
      showToast("Login bem-sucedido! Redirecionando...");
      setTimeout(() => (window.location.href = '/dashboard/'), 700);
    } catch (err) {
      console.error("Erro ao autenticar:", err);
      showToast("Erro ao autenticar. Tente novamente.");
    }
  });
}
