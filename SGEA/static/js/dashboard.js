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

  if (type === "success") {
    toast.style.borderColor = "rgba(34,197,94,0.6)"; // verde
  } else if (type === "error") {
    toast.style.borderColor = "rgba(239,68,68,0.7)"; // vermelho
  } else {
    toast.style.borderColor = "rgba(139,92,246,0.4)"; // primary
  }

  toast.classList.remove("translate-x-[400px]");

  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.classList.add("translate-x-[400px]");
  }, 2500);
}

// =============== FORMATAR DATA ===============
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

// =============== CHAMADAS BACKEND ===============
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

async function getEventosDisponiveis() {
  const res = await fetch(`${API_BASE_URL}/eventos/disponiveis/`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Erro ao carregar eventos (HTTP ${res.status})`);
  }

  return await res.json();
}

async function inscreverNoEvento(eventoId) {
  const res = await fetch(`${API_BASE_URL}/inscricoes/`, {
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
    const mensagem = data.error || "Erro ao realizar inscrição.";
    throw new Error(mensagem);
  }

  return data;
}

// =============== UI: CRIAR CARD DE EVENTO ===============
function criarCardEvento(evento, userPerfil) {
  const div = document.createElement("div");
  div.className =
    "group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800/60 rounded-2xl overflow-hidden hover:border-primary-500 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/20 hover:-translate-y-1";

  const titulo = evento.titulo || "Evento sem título";
  const descricao =
    evento.descricao || "Evento cadastrado na plataforma SGEA Campus.";
  const local = evento.local || "Local a definir";
  const dataInicio = formatarDataHora(evento.data_inicio);
  const dataFim = formatarDataHora(evento.data_fim);
  const capacidade = evento.capacidade_par ?? "—";

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
      <div class="relative h-40 overflow-hidden">
        <img
          src="${bannerUrl}"
          alt="Banner do evento"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
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
      <div class="relative h-40 bg-gradient-to-br from-purple-600/20 to-blue-600/20 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
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

      <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/70">
        <span class="text-xs text-slate-400 inline-flex items-center gap-1">
          <i class="bx bx-group text-sm text-primary-400"></i>
          Capacidade: ${capacidade}
        </span>
        <button
          class="btn-inscricao inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg font-medium text-sm transition-all duration-200"
          data-evento-id="${evento.id}"
        >
          <span>Inscrever-se</span>
          <i class="bx bx-right-arrow-alt text-lg"></i>
        </button>
      </div>
    </div>
  `;

  // Se for organizador, não deixa se inscrever
  if ((userPerfil || "").trim().toLowerCase() === "organizador") {
    const btn = div.querySelector(".btn-inscricao");
    if (btn) {
      btn.classList.add("bg-slate-700", "cursor-not-allowed", "opacity-60");
      btn.disabled = true;
      const span = btn.querySelector("span");
      if (span) span.textContent = "Organizador";
    }
  }

  return div;
}

// =============== LÓGICA DE PÁGINA ===============
async function initDashboard() {
  const eventosBox = document.getElementById("eventos-box");
  const emptyState = document.getElementById("empty-state");
  const btnCriar = document.getElementById("btn-criar-evento");
  const userNameSpan = document.getElementById("user-name");
  const btnLogout = document.getElementById("btn-logout");
  const btnLogoutMobile = document.getElementById("btn-logout-mobile");

  const btnPainelOrgDesktop = document.getElementById("btn-painel-organizador");
  const btnPainelOrgMobile = document.getElementById(
    "btn-painel-organizador-mobile"
  );

  // links de menu
  const linkMeusEventos = document.getElementById("link-meus-eventos");
  const linkMeusCertificados = document.getElementById(
    "link-meus-certificados"
  );
  const linkMeusEventosMobile = document.getElementById(
    "link-meus-eventos-mobile"
  );
  const linkMeusCertificadosMobile = document.getElementById(
    "link-meus-certificados-mobile"
  );
  const linkAdmin = document.getElementById("link-admin");
  const linkAdminMobile = document.getElementById("link-admin-mobile");

  try {
    // 1) Garante usuário autenticado
    const user = await getCurrentUser();

    if (userNameSpan) {
      userNameSpan.textContent = `Olá, ${user.nome || user.email}`;
    }

    console.log("Usuário no dashboard:", user);

    const perfilNormalizado = (user.perfil || "").trim().toLowerCase();

    // CONTROLE DE ITENS DO MENU POR PERFIL
    if (perfilNormalizado === "organizador") {
      // Organizador NÃO vê "Meus eventos" e "Meus certificados"
      if (linkMeusEventos) linkMeusEventos.classList.add("hidden");
      if (linkMeusCertificados) linkMeusCertificados.classList.add("hidden");
      if (linkMeusEventosMobile)
        linkMeusEventosMobile.classList.add("hidden");
      if (linkMeusCertificadosMobile)
        linkMeusCertificadosMobile.classList.add("hidden");

      // Organizador vê Admin
      if (linkAdmin) linkAdmin.classList.remove("hidden");
      if (linkAdminMobile) linkAdminMobile.classList.remove("hidden");

      // Organizador vê painel do organizador
      if (btnPainelOrgDesktop)
        btnPainelOrgDesktop.classList.remove("hidden");
      if (btnPainelOrgMobile) btnPainelOrgMobile.classList.remove("hidden");

      // Se tiver botão de criar evento, mostra para organizador
      if (btnCriar) {
        btnCriar.classList.remove("hidden");
        btnCriar.classList.add("flex");
        btnCriar.addEventListener("click", () => {
          window.location.href = "/criar_evento/";
        });
      }
    } else {
      // Aluno / outros:
      // vê Meus eventos e Meus certificados (já aparecem por padrão)
      // NÃO vê Admin nem painel do organizador
      if (linkAdmin) linkAdmin.classList.add("hidden");
      if (linkAdminMobile) linkAdminMobile.classList.add("hidden");

      if (btnPainelOrgDesktop)
        btnPainelOrgDesktop.classList.add("hidden");
      if (btnPainelOrgMobile)
        btnPainelOrgMobile.classList.add("hidden");
    }

    async function handleLogout() {
      try {
        await fetch(`${API_BASE_URL}/usuarios/logout/`, {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {
        console.error("Erro no logout:", e);
      } finally {
        localStorage.removeItem("sgea_user");
        window.location.href = "/";
      }
    }

    if (btnLogout) btnLogout.addEventListener("click", handleLogout);
    if (btnLogoutMobile)
      btnLogoutMobile.addEventListener("click", handleLogout);

    // 2) Carrega eventos disponíveis
    const eventos = await getEventosDisponiveis();

    console.log("Eventos disponíveis (dashboard):", eventos);

    if (!eventos || !Array.isArray(eventos) || eventos.length === 0) {
      if (emptyState) {
        emptyState.querySelector("h3").textContent = "Nenhum evento disponível";
        emptyState.querySelector("p").textContent =
          "Volte mais tarde para conferir novos eventos.";
      }
      return;
    }

    if (emptyState) {
      emptyState.style.display = "none";
    }

    if (!eventosBox) return;

    eventosBox.innerHTML = "";
    eventos.forEach((evento) => {
      const card = criarCardEvento(evento, user.perfil);
      eventosBox.appendChild(card);
    });

    // 3) Inscrição nos eventos
    eventosBox.addEventListener("click", async (e) => {
      const btn = e.target.closest(".btn-inscricao");
      if (!btn) return;

      const eventoId = btn.getAttribute("data-evento-id");
      if (!eventoId) return;

      btn.disabled = true;
      btn.classList.add("opacity-60");
      const spanEl = btn.querySelector("span");
      const originalText = spanEl?.textContent || "Inscrever-se";
      if (spanEl) spanEl.textContent = "Enviando...";

      try {
        await inscreverNoEvento(Number(eventoId));
        showToast("Inscrição realizada com sucesso!", "success");
        if (spanEl) spanEl.textContent = "Inscrito";
      } catch (err) {
        console.error(err);
        if (err.message === "unauthenticated") {
          showToast("Você precisa estar logado para se inscrever.", "error");
          setTimeout(() => {
            window.location.href = "/login/";
          }, 1200);
        } else {
          showToast(err.message || "Erro ao realizar inscrição.", "error");
          btn.disabled = false;
          btn.classList.remove("opacity-60");
          if (spanEl) spanEl.textContent = originalText;
        }
      }
    });
  } catch (err) {
    console.error(err);
    if (err.message === "unauthenticated") {
      window.location.href = "/login/";
      return;
    }

    if (emptyState) {
      emptyState.querySelector("h3").textContent = "Erro ao carregar eventos";
      emptyState.querySelector("p").textContent =
        "Tente novamente em alguns instantes.";
    }
    showToast("Erro ao carregar dados. Tente novamente mais tarde.", "error");
  }
}

// =============== START ===============
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});
