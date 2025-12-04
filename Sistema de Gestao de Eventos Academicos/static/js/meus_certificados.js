// =============== CONFIG API ===============
const API_BASE_URL = "http://127.0.0.1:8000/api";

// =============== MENU MOBILE ===============
const menuIcon = document.getElementById("menu-icon");
const mobileMenu = document.getElementById("mobile-menu");

if (menuIcon && mobileMenu) {
  menuIcon.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// =============== TOAST ===============
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return alert(message);

  const span = toast.querySelector("span");
  if (span) span.textContent = message;

  const dot = toast.querySelector(".w-2");

  if (type === "success") {
    toast.style.borderColor = "rgba(34,197,94,0.6)";
    if (dot) dot.style.backgroundColor = "#22c55e";
  } else if (type === "error") {
    toast.style.borderColor = "rgba(239,68,68,0.7)";
    if (dot) dot.style.backgroundColor = "#ef4444";
  } else if (type === "warning") {
    toast.style.borderColor = "rgba(245,158,11,0.6)";
    if (dot) dot.style.backgroundColor = "#f59e0b";
  } else {
    toast.style.borderColor = "rgba(139,92,246,0.4)";
    if (dot) dot.style.backgroundColor = "#8b5cf6";
  }

  toast.classList.remove("translate-x-[400px]");

  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.classList.add("translate-x-[400px]");
  }, 2500);
}

// =============== FORMATAR DATA ===============
function formatarData(isoString) {
  if (!isoString) return "Data não informada";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "Data inválida";

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// =============== BACKEND CALLS ===============
async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/usuarios/current_user/`, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 401) {
    throw new Error("unauthenticated");
  }

  if (!res.ok) {
    throw new Error(`Erro ao buscar usuário (HTTP ${res.status})`);
  }

  return await res.json();
}

async function getCertificados() {
  // O backend já:
  // - gera certificados automaticamente para eventos concluídos
  // - filtra para o usuário logado
  const res = await fetch(`${API_BASE_URL}/certificados/`, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 401) {
    throw new Error("unauthenticated");
  }

  if (!res.ok) {
    throw new Error(`Erro ao carregar certificados (HTTP ${res.status})`);
  }

  return await res.json();
}

// =============== LOGOUT ===============
async function logout() {
  try {
    await fetch(`${API_BASE_URL}/usuarios/logout/`, {
      method: "POST",
      credentials: "include",
    });
  } catch (e) {
    console.error("Erro no logout:", e);
  } finally {
    localStorage.removeItem("sgea_user");
    window.location.href = "/login/";
  }
}

const btnLogout = document.getElementById("btn-logout");
const btnLogoutMobile = document.getElementById("btn-logout-mobile");

if (btnLogout) btnLogout.addEventListener("click", logout);
if (btnLogoutMobile) btnLogoutMobile.addEventListener("click", logout);

// =============== UI: CARD DE CERTIFICADO ===============
function criarCardCertificado(cert) {
  const dataEmissao = formatarData(cert.data_emissao);
  const codigo = cert.codigo_validacao || "—";

  // Título do evento: se você quiser mandar o título no serializer,
  // pode adicionar lá um campo evento_titulo; aqui já deixo suporte.
  const eventoTitulo =
    cert.evento_titulo ||
    (cert.inscricao && cert.inscricao.evento_titulo) ||
    "Evento";

  // Carga horária (se você adicionar depois no modelo/serializer)
  const horas =
    cert.carga_horaria ||
    cert.carga_horaria_total ||
    cert.horas ||
    cert.carga ||
    null;

  // Arquivo para download:
  // Se o modelo Certificado tiver um FileField (ex: arquivo),
  // o DRF costuma retornar a URL em cert.arquivo
  const arquivoUrl = cert.arquivo_url || cert.url_pdf || cert.arquivo || null;

  const div = document.createElement("div");
  div.className =
    "group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10";

  div.innerHTML = `
    <!-- Preview do Certificado -->
    <div class="relative aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900 p-8 border-b border-slate-800/50">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDEyNywgMTI3LCAyMjcsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
      
      <div class="relative z-10 h-full flex flex-col items-center justify-center text-center">
        <i class="bx bx-badge-check text-5xl text-primary-500 mb-3"></i>
        <h3 class="text-lg font-bold text-white mb-1">Certificado</h3>
        <p class="text-sm text-slate-300 line-clamp-1">${eventoTitulo}</p>
        <p class="mt-2 text-[11px] text-slate-500">
          Código: <span class="font-mono text-slate-300">${codigo}</span>
        </p>
      </div>
    </div>

    <!-- Informações -->
    <div class="p-5">
      <div class="space-y-2 mb-4">
        <div class="flex items-center gap-2 text-slate-400 text-sm">
          <i class="bx bx-calendar text-primary-500"></i>
          <span>Emitido em ${dataEmissao}</span>
        </div>
        ${
          horas
            ? `<div class="flex items-center gap-2 text-slate-400 text-sm">
                 <i class="bx bx-time text-primary-500"></i>
                 <span>${horas} horas</span>
               </div>`
            : ""
        }
      </div>

      <!-- Botões -->
      <div class="flex gap-2">
        ${
          arquivoUrl
            ? `<a href="${arquivoUrl}" target="_blank" rel="noopener noreferrer"
                 class="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 rounded-lg font-medium transition-all duration-200 text-sm flex items-center justify-center gap-2 group/btn">
                  <i class="bx bx-download text-lg"></i>
                  <span>Baixar</span>
               </a>`
            : `<button class="flex-1 px-4 py-2.5 bg-slate-700 cursor-not-allowed rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                 <i class="bx bx-download text-lg"></i>
                 <span>Download indisponível</span>
               </button>`
        }

        <button class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all duration-200 flex items-center justify-center tooltip-validate"
                data-codigo="${codigo}">
          <i class="bx bx-search-alt-2 text-lg"></i>
        </button>
      </div>
    </div>
  `;

  return div;
}

// =============== INIT PAGE ===============
async function initCertificadosPage() {
  const emptyState = document.getElementById("empty-state");
  const emptyTitle = document.getElementById("empty-title");
  const emptyText = document.getElementById("empty-text");
  const subtitle = document.getElementById("subtitle");
  const subtitleExtra = document.getElementById("subtitle-extra");
  const grid = document.getElementById("certificados-grid");
  const btnPainelOrganizador = document.getElementById("btn-painel-organizador");

  try {
    // 1) Usuário autenticado
    const user = await getCurrentUser();

    if (user.perfil && user.perfil.toLowerCase() === "organizador") {
      if (btnPainelOrganizador) {
        btnPainelOrganizador.classList.remove("hidden");
      }
    }

    // 2) Pede certificados (o backend já gera automaticamente se o evento acabou)
    const certificados = await getCertificados();

    if (!Array.isArray(certificados) || certificados.length === 0) {
      if (subtitle) {
        subtitle.textContent = "Ainda não há certificados disponíveis.";
      }
      if (subtitleExtra) {
        subtitleExtra.textContent =
          "Após participar de eventos e eles serem concluídos, seus certificados aparecerão automaticamente aqui.";
      }
      if (emptyTitle) {
        emptyTitle.textContent = "Nenhum certificado disponível";
      }
      if (emptyText) {
        emptyText.textContent =
          "Participe de eventos e, após a conclusão, os certificados serão gerados automaticamente.";
      }
      return;
    }

    // Se tem certificados, esconde o empty state
    if (emptyState) {
      emptyState.style.display = "none";
    }
    if (subtitle) {
      subtitle.textContent = "Aqui estão os certificados já emitidos para você.";
    }
    if (subtitleExtra) {
      subtitleExtra.textContent = "";
    }

    if (!grid) return;
    grid.innerHTML = "";

    certificados.forEach((cert) => {
      const card = criarCardCertificado(cert);
      grid.appendChild(card);
    });

    // 3) Clique para validar certificado
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".tooltip-validate");
      if (!btn) return;

      const codigo = btn.getAttribute("data-codigo");
      if (!codigo || codigo === "—") {
        showToast("Código de validação indisponível.", "error");
        return;
      }

      const urlValidacao = `${API_BASE_URL}/certificados/validar/?codigo=${encodeURIComponent(
        codigo
      )}`;
      window.open(urlValidacao, "_blank");
    });
  } catch (err) {
    console.error(err);

    if (err.message === "unauthenticated") {
      window.location.href = "/login/";
      return;
    }

    if (emptyTitle) {
      emptyTitle.textContent = "Erro ao carregar certificados";
    }
    if (emptyText) {
      emptyText.textContent = "Tente novamente mais tarde.";
    }
    showToast(
      "Erro ao carregar certificados. Tente novamente mais tarde.",
      "error"
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initCertificadosPage();
});
