// =============== CONFIG API ===============
const API_BASE_URL = "http://127.0.0.1:8000/api";

console.log(">>> CARREGANDO meus_eventos.js (layout bonito + remover v10) <<<");

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

  if (type === "success") {
    toast.style.borderColor = "rgba(34,197,94,0.6)";
  } else if (type === "error") {
    toast.style.borderColor = "rgba(239,68,68,0.7)";
  } else {
    toast.style.borderColor = "rgba(139,92,246,0.4)";
  }

  toast.classList.remove("translate-x-[400px]");

  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.classList.add("translate-x-[400px]");
  }, 2500);
}

// =============== DATE HELPERS ===============
function formatarDataHora(isoString) {
  if (!isoString) return "Data não informada";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "Data inválida";

  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusEvento(evento) {
  const agora = new Date();
  const inicio = evento.data_inicio ? new Date(evento.data_inicio) : null;
  const fim = evento.data_fim ? new Date(evento.data_fim) : null;

  if (inicio && inicio > agora) return "proximos";
  if (inicio && fim && agora >= inicio && agora <= fim) return "andamento";
  if (fim && fim < agora) return "concluidos";

  return "todos";
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

async function getMeusEventos() {
  const res = await fetch(`${API_BASE_URL}/eventos/meus_eventos/`, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 401) {
    throw new Error("unauthenticated");
  }

  if (!res.ok) {
    throw new Error(`Erro ao carregar eventos (HTTP ${res.status})`);
  }

  return await res.json();
}

async function cancelarInscricao(eventoId) {
  const res = await fetch(`${API_BASE_URL}/inscricoes/cancelar/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ evento: eventoId }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    throw new Error("unauthenticated");
  }

  if (!res.ok) {
    const mensagem = data.error || "Erro ao remover inscrição.";
    throw new Error(mensagem);
  }

  return data;
}

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

// =============== UI: CRIAR CARD DE EVENTO ===============
function criarCardEvento(evento) {
  console.log("Renderizando card para evento:", evento.id);

  // CARD PRINCIPAL: agora é flex-col e sem overflow-hidden
  const div = document.createElement("div");
  div.className =
    "group bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-2xl hover:border-primary-500 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/20 hover:-translate-y-1 flex flex-col";
  div.dataset.eventoId = evento.id;

  const titulo = evento.titulo || "Evento sem título";
  const descricao =
    evento.descricao || "Evento cadastrado na plataforma SGEA Campus.";
  const local = evento.local || "Local a definir";
  const dataInicio = formatarDataHora(evento.data_inicio);
  const dataFim = formatarDataHora(evento.data_fim);
  const capacidade = evento.capacidade_par ?? "—";

  const status = getStatusEvento(evento);
  let statusLabel = "Evento";
  let statusColor = "bg-slate-700 text-slate-200";

  if (status === "proximos") {
    statusLabel = "Próximo";
    statusColor = "bg-blue-600/80 text-white";
  } else if (status === "andamento") {
    statusLabel = "Em andamento";
    statusColor = "bg-amber-500/80 text-slate-900";
  } else if (status === "concluidos") {
    statusLabel = "Concluído";
    statusColor = "bg-emerald-500/80 text-slate-900";
  }

  // Banner
  let bannerUrl = null;
  if (evento.banner_url) {
    bannerUrl = evento.banner_url;
  } else if (evento.banner) {
    try {
      const apiOrigin = new URL(API_BASE_URL).origin;
      if (evento.banner.startsWith("http")) {
        bannerUrl = evento.banner;
      } else if (evento.banner.startsWith("/")) {
        bannerUrl = apiOrigin + evento.banner;
      } else {
        bannerUrl = apiOrigin + "/" + evento.banner;
      }
    } catch (e) {
      bannerUrl = evento.banner;
    }
  }

  const headerHtml = bannerUrl
    ? `
      <div class="relative h-40 w-full overflow-hidden rounded-t-2xl">
        <img
          src="${bannerUrl}"
          alt="Banner do evento"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent"></div>
        <div class="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold ${statusColor}">
          ${statusLabel}
        </div>
        <div class="absolute bottom-3 left-4 text-xs text-slate-100 flex flex-col gap-1">
          <span class="inline-flex items-center gap-1">
            <i class="bx bx-time text-base text-primary-300"></i>
            ${dataInicio}
          </span>
          <span class="inline-flex items-center gap-1">
            <i class="bx bx-time-five text-base text-primary-300"></i>
            até ${dataFim}
          </span>
        </div>
      </div>
    `
    : `
      <div class="relative h-40 w-full rounded-t-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
        <div class="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold ${statusColor}">
          ${statusLabel}
        </div>
        <div class="absolute bottom-3 left-4 text-xs text-slate-300 flex flex-col gap-1">
          <span class="inline-flex items-center gap-1">
            <i class="bx bx-time text-base text-primary-400"></i>
            ${dataInicio}
          </span>
          <span class="inline-flex items-center gap-1">
            <i class="bx bx-time-five text-base text-primary-400"></i>
            até ${dataFim}
          </span>
        </div>
      </div>
    `;

  // Conteúdo do card
  div.innerHTML = `
    ${headerHtml}
    <div class="p-5 flex flex-col gap-3">
      <h3 class="text-lg font-semibold group-hover:text-primary-400 transition-colors line-clamp-1">
        ${titulo}
      </h3>
      <p class="text-xs text-slate-400 inline-flex items-center gap-1">
        <i class="bx bx-map text-sm text-primary-400"></i>
        ${local}
      </p>
      <p class="text-slate-400 text-sm line-clamp-2">
        ${descricao}
      </p>

      <div class="mt-3 flex items-center justify-between gap-2">
        <span class="text-xs text-slate-400 inline-flex items-center gap-1">
          <i class="bx bx-group text-sm text-primary-400"></i>
          Capacidade: ${capacidade}
        </span>

        <button
          class="btn-remover inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 shadow-md shadow-red-900/40"
          data-evento-id="${evento.id}"
        >
          <i class="bx bx-x-circle text-base"></i>
          <span>Remover inscrição</span>
        </button>
      </div>
    </div>
  `;

  console.log(
    "Botão remover dentro do card?",
    div.querySelector(".btn-remover")
  );

  return div;
}


// =============== INIT PAGE ===============
async function initMeusEventos() {
  const eventosBox = document.getElementById("eventos-box");
  const loadingState = document.getElementById("loading-state");
  const emptyState = document.getElementById("empty-state");

  try {
    const user = await getCurrentUser();
    const perfilUsuario = (user.perfil || "").trim().toLowerCase();

    const btnPainelDesktop = document.getElementById("btn-painel-organizador");
    const btnPainelMobile = document.getElementById(
      "btn-painel-organizador-mobile"
    );

    if (perfilUsuario === "organizador") {
      if (btnPainelDesktop) btnPainelDesktop.classList.remove("hidden");
      if (btnPainelMobile) btnPainelMobile.classList.remove("hidden");
    }

    const eventos = await getMeusEventos();
    console.log("Meus eventos (initMeusEventos):", eventos);

    if (loadingState) loadingState.classList.add("hidden");

    if (!Array.isArray(eventos) || eventos.length === 0) {
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }

    if (!eventosBox) return;

    emptyState.classList.add("hidden");
    eventosBox.classList.remove("hidden");
    eventosBox.innerHTML = "";

    eventos.forEach((evento) => {
      const card = criarCardEvento(evento);
      eventosBox.appendChild(card);
    });

    // Clique em "Remover inscrição"
    eventosBox.addEventListener("click", async (e) => {
      const btn = e.target.closest(".btn-remover");
      if (!btn) return;

      const eventoId = btn.getAttribute("data-evento-id");
      if (!eventoId) return;

      const card = btn.closest(".group");
      const spanText = btn.querySelector("span");
      const originalText = spanText ? spanText.textContent : "Remover inscrição";

      btn.disabled = true;
      btn.classList.add("opacity-60");
      if (spanText) spanText.textContent = "Removendo...";

      try {
        await cancelarInscricao(Number(eventoId));
        showToast("Inscrição removida com sucesso!", "success");

        if (card && card.parentNode) {
          card.parentNode.removeChild(card);
        }

        if (eventosBox.children.length === 0 && emptyState) {
          emptyState.classList.remove("hidden");
        }
      } catch (err) {
        console.error(err);
        if (err.message === "unauthenticated") {
          showToast("Você precisa estar logado.", "error");
          setTimeout(() => {
            window.location.href = "/login/";
          }, 1200);
        } else {
          showToast(err.message || "Erro ao remover inscrição.", "error");
          btn.disabled = false;
          btn.classList.remove("opacity-60");
          if (spanText) spanText.textContent = originalText;
        }
      }
    });
  } catch (err) {
    console.error(err);

    if (err.message === "unauthenticated") {
      window.location.href = "/login/";
      return;
    }

    if (loadingState) loadingState.classList.add("hidden");
    if (emptyState) emptyState.classList.remove("hidden");
    showToast(
      "Erro ao carregar seus eventos. Tente novamente mais tarde.",
      "error"
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initMeusEventos();
});
