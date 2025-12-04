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
  }, 3000);
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

function formatarDataCurta(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =============== STATUS EVENTO ===============
function getStatusEvento(evento) {
  const agora = new Date();
  const dataInicio = new Date(evento.data_inicio);
  const dataFim = new Date(evento.data_fim);

  if (agora > dataFim) return "encerrado";
  if (agora >= dataInicio && agora <= dataFim) return "em-andamento";
  return "ativo";
}

// =============== BACKEND CALLS ===============
async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/usuarios/current_user/`, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 401) throw new Error("unauthenticated");
  if (!res.ok) throw new Error(`Erro ao buscar usuário (HTTP ${res.status})`);

  return await res.json();
}

async function getEventosOrganizador() {
  const res = await fetch(`${API_BASE_URL}/eventos/organizador/`, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 401) throw new Error("unauthenticated");
  if (!res.ok) throw new Error(`Erro ao carregar eventos (HTTP ${res.status})`);

  return await res.json();
}

async function getEstatisticasOrganizador() {
  const res = await fetch(`${API_BASE_URL}/eventos/estatisticas/`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Erro ao carregar estatísticas (HTTP ${res.status})`);
  }

  return await res.json();
}

async function deletarEvento(eventoId) {
  const res = await fetch(`${API_BASE_URL}/eventos/${eventoId}/`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Erro ao deletar evento");
  }

  return true;
}

async function atualizarEvento(eventoId, formData) {
  const res = await fetch(`${API_BASE_URL}/eventos/${eventoId}/`, {
    method: "PATCH",
    credentials: "include",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Erro ao atualizar evento");
  }

  return data;
}

// =============== CARD DO EVENTO ===============
let eventosCache = [];
let filtroAtual = "todos";
let buscaAtual = "";

function criarCardEvento(evento) {
  const div = document.createElement("div");
  div.className =
    "card-evento group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800/60 rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10";
  div.dataset.eventoId = evento.id;
  div.dataset.status = getStatusEvento(evento);

  const titulo = evento.titulo || "Evento sem título";
  const descricao = evento.descricao || "Sem descrição";
  const local = evento.local || "Local a definir";
  const dataInicio = formatarDataCurta(evento.data_inicio);
  const dataFim = formatarDataCurta(evento.data_fim);
  const capacidade = evento.capacidade_par ?? "—";
  const inscricoes = evento.inscritos_count ?? 0;
  const bannerUrl = evento.banner_url || evento.banner || "";

  const status = getStatusEvento(evento);
  let statusBadge = "";

  if (status === "ativo") {
    statusBadge =
      '<span class="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400">Ativo</span>';
  } else if (status === "em-andamento") {
    statusBadge =
      '<span class="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-semibold text-blue-400">Em andamento</span>';
  } else {
    statusBadge =
      '<span class="px-3 py-1 bg-slate-600/10 border border-slate-600/30 rounded-full text-xs font-semibold text-slate-400">Encerrado</span>';
  }

  const percentualOcupacao =
    capacidade && capacidade > 0
      ? Math.round((inscricoes / capacidade) * 100)
      : 0;

  div.innerHTML = `
    <div class="relative h-32 overflow-hidden">
      <img
        src="${bannerUrl}"
        alt="Banner do evento ${titulo}"
        class="w-full h-full object-cover ${bannerUrl ? "" : "hidden"}"
        onerror="this.classList.add('hidden')"
      />
      <div class="absolute inset-0 bg-gradient-to-br from-slate-950/50 via-slate-900/10 to-slate-950/80"></div>
      <div class="absolute top-3 left-4 right-4 flex items-start justify-between">
        <div class="text-xs text-slate-300">
          <div class="flex items-center gap-1 mb-1">
            <i class="bx bx-calendar text-sm text-primary-400"></i>
            <span>${dataInicio}</span>
          </div>
        </div>
        ${statusBadge}
      </div>
    </div>

    <div class="p-5">
      <h3 class="text-xl font-bold mb-2 text-white group-hover:text-primary-400 transition-colors line-clamp-1">
        ${titulo}
      </h3>

      <div class="flex items-center gap-4 mb-3 text-xs text-slate-400">
        <span class="inline-flex items-center gap-1">
          <i class="bx bx-map text-sm text-primary-400"></i>
          ${local}
        </span>
        <span class="inline-flex items-center gap-1">
          <i class="bx bx-time text-sm text-primary-400"></i>
          até ${dataFim}
        </span>
      </div>

      <p class="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed break-words">
        ${descricao}
      </p>

      <div class="mb-4">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Inscrições</span>
          <span class="font-semibold">${inscricoes} / ${capacidade}</span>
        </div>
        <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500" style="width: ${Math.min(
            percentualOcupacao,
            100
          )}%"></div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn-ver-detalhes flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium text-sm transition-all duration-200">
          <i class="bx bx-detail text-base"></i>
          <span>Ver detalhes</span>
        </button>

        <button class="btn-editar p-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 rounded-lg text-blue-400 transition-all duration-200" title="Editar evento">
          <i class="bx bx-edit text-xl"></i>
        </button>

        <button class="btn-deletar p-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 rounded-lg text-red-400 transition-all duration-200" title="Deletar evento">
          <i class="bx bx-trash text-xl"></i>
        </button>
      </div>
    </div>
  `;

  // Handlers
  const btnVerDetalhes = div.querySelector(".btn-ver-detalhes");
  const btnEditar = div.querySelector(".btn-editar");
  const btnDeletar = div.querySelector(".btn-deletar");

  if (btnVerDetalhes) {
    btnVerDetalhes.addEventListener("click", () => abrirModalDetalhes(evento));
  }

  if (btnEditar) {
    btnEditar.addEventListener("click", () => abrirModalEditar(evento));
  }

  if (btnDeletar) {
    btnDeletar.addEventListener("click", async () => {
      if (!confirm(`Tem certeza que deseja deletar o evento "${titulo}"?`)) {
        return;
      }

      try {
        await deletarEvento(evento.id);
        showToast("Evento deletado com sucesso!", "success");
        div.style.opacity = "0";
        div.style.transform = "scale(0.95)";
        setTimeout(() => {
          div.remove();
          verificarEstadoVazio();
          atualizarEstatisticas();
        }, 300);
      } catch (err) {
        console.error(err);
        showToast(err.message || "Erro ao deletar evento.", "error");
      }
    });
  }

  return div;
}

// =============== ESTATÍSTICAS ===============
async function atualizarEstatisticas() {
  try {
    const stats = await getEstatisticasOrganizador();

    const statEventos = document.getElementById("stat-eventos");
    const statProximos = document.getElementById("stat-proximos");
    const statInscricoes = document.getElementById("stat-inscricoes");

    if (statEventos) {
      statEventos.classList.remove("shimmer");
      statEventos.textContent = stats.total_eventos || 0;
    }
    if (statProximos) {
      statProximos.classList.remove("shimmer");
      statProximos.textContent = stats.total_proximos || 0;
    }
    if (statInscricoes) {
      statInscricoes.classList.remove("shimmer");
      statInscricoes.textContent = stats.total_inscricoes || 0;
    }
  } catch (err) {
    console.error("Erro ao carregar estatísticas:", err);
  }
}

// =============== FILTROS & EMPTY STATE ===============
function aplicarFiltros() {
  const cards = document.querySelectorAll(".card-evento");
  let visibleCount = 0;

  cards.forEach((card) => {
    const status = card.dataset.status;
    const titulo = card.querySelector("h3").textContent.toLowerCase();

    let matchFiltro = false;
    if (filtroAtual === "todos") {
      matchFiltro = true;
    } else if (filtroAtual === "ativos") {
      matchFiltro = status === "ativo" || status === "em-andamento";
    } else if (filtroAtual === "encerrados") {
      matchFiltro = status === "encerrado";
    }

    const matchBusca = buscaAtual === "" || titulo.includes(buscaAtual);

    if (matchFiltro && matchBusca) {
      card.classList.remove("hidden");
      visibleCount++;
    } else {
      card.classList.add("hidden");
    }
  });

  verificarEstadoVazio(visibleCount === 0);
}

function verificarEstadoVazio(forcarVazio = false) {
  const eventosBox = document.getElementById("eventos-box");
  const emptyState = document.getElementById("empty-state");
  const loadingState = document.getElementById("loading-state");

  if (loadingState) loadingState.classList.add("hidden");

  const cards = eventosBox?.querySelectorAll(".card-evento:not(.hidden)");
  const temEventos = !forcarVazio && cards && cards.length > 0;

  if (eventosBox) {
    if (temEventos) {
      eventosBox.classList.remove("hidden");
    } else {
      eventosBox.classList.add("hidden");
    }
  }

  if (emptyState) {
    if (temEventos) {
      emptyState.classList.add("hidden");
    } else {
      emptyState.classList.remove("hidden");
    }
  }
}

// =============== MODAL EDITAR ===============
let eventoEditando = null;

function abrirModalEditar(evento) {
  eventoEditando = evento;

  const modal = document.getElementById("modal-editar-evento");
  if (!modal) return;

  const inputTitulo = document.getElementById("edit-titulo");
  const inputLocal = document.getElementById("edit-local");
  const inputDataInicio = document.getElementById("edit-data-inicio");
  const inputDataFim = document.getElementById("edit-data-fim");
  const inputCapacidade = document.getElementById("edit-capacidade");
  const inputDescricao = document.getElementById("edit-descricao");
  const inputBanner = document.getElementById("edit-banner");

  if (inputTitulo) inputTitulo.value = evento.titulo || "";
  if (inputLocal) inputLocal.value = evento.local || "";

  // converter ISO -> datetime-local
  function isoParaDatetimeLocal(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    const ano = d.getFullYear();
    const mes = pad(d.getMonth() + 1);
    const dia = pad(d.getDate());
    const hora = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${ano}-${mes}-${dia}T${hora}:${min}`;
  }

  if (inputDataInicio)
    inputDataInicio.value = isoParaDatetimeLocal(evento.data_inicio);
  if (inputDataFim)
    inputDataFim.value = isoParaDatetimeLocal(evento.data_fim);
  if (inputCapacidade)
    inputCapacidade.value =
      evento.capacidade_par !== undefined && evento.capacidade_par !== null
        ? evento.capacidade_par
        : "";
  if (inputDescricao) inputDescricao.value = evento.descricao || "";
  if (inputBanner) inputBanner.value = "";

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function fecharModalEditar() {
  const modal = document.getElementById("modal-editar-evento");
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  const formEditar = document.getElementById("form-editar-evento");
  if (formEditar) formEditar.reset();
  eventoEditando = null;
}

// =============== MODAL DETALHES ===============
function abrirModalDetalhes(evento) {
  const modal = document.getElementById("modal-detalhes-evento");
  if (!modal) return;

  const tituloEl = document.getElementById("det-titulo");
  const bannerEl = document.getElementById("det-banner");
  const statusBadge = document.getElementById("det-status-badge");
  const dataInicioEl = document.getElementById("det-data-inicio");
  const dataFimEl = document.getElementById("det-data-fim");
  const descEl = document.getElementById("det-descricao");
  const localEl = document.getElementById("det-local");
  const capEl = document.getElementById("det-capacidade");
  const inscEl = document.getElementById("det-inscritos");

  if (tituloEl) tituloEl.textContent = evento.titulo || "Evento sem título";

  const bannerUrl = evento.banner_url || evento.banner || "";
  if (bannerEl) {
    if (bannerUrl) {
      bannerEl.src = bannerUrl;
      bannerEl.classList.remove("hidden");
    } else {
      bannerEl.src = "";
      bannerEl.classList.add("hidden");
    }
  }

  const status = getStatusEvento(evento);
  if (statusBadge) {
    if (status === "ativo") {
      statusBadge.textContent = "Ativo";
      statusBadge.className =
        "px-3 py-1 bg-emerald-500/10 border border-emerald-500/40 rounded-full text-xs font-semibold text-emerald-300";
    } else if (status === "em-andamento") {
      statusBadge.textContent = "Em andamento";
      statusBadge.className =
        "px-3 py-1 bg-blue-500/10 border border-blue-500/40 rounded-full text-xs font-semibold text-blue-300";
    } else {
      statusBadge.textContent = "Encerrado";
      statusBadge.className =
        "px-3 py-1 bg-slate-600/10 border border-slate-600/40 rounded-full text-xs font-semibold text-slate-300";
    }
  }

  if (dataInicioEl)
    dataInicioEl.textContent = `Início: ${formatarDataHora(
      evento.data_inicio
    )}`;
  if (dataFimEl)
    dataFimEl.textContent = `Término: ${formatarDataHora(evento.data_fim)}`;

  if (descEl) descEl.textContent = evento.descricao || "Sem descrição.";
  if (localEl) localEl.textContent = evento.local || "Local a definir";
  if (capEl)
    capEl.textContent =
      evento.capacidade_par != null
        ? `${evento.capacidade_par} vagas`
        : "—";
  if (inscEl) {
    const qtd = evento.inscritos_count ?? 0;
    inscEl.textContent =
      qtd === 1 ? "1 participante" : `${qtd} participantes`;
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function fecharModalDetalhes() {
  const modal = document.getElementById("modal-detalhes-evento");
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
}

// =============== INIT PÁGINA ===============
async function initPainelOrganizador() {
  const eventosBox = document.getElementById("eventos-box");
  const btnNovoEvento = document.getElementById("btn-novo-evento");
  const btnLogout = document.getElementById("btn-logout");
  const btnLogoutMobile = document.getElementById("btn-logout-mobile");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const inputBusca = document.getElementById("input-busca");
  const btnsCriarPrimeiro = document.querySelectorAll(".btn-criar-primeiro");

  // Modais criar
  const modalCriar = document.getElementById("modal-criar-evento");
  const btnFecharModal = document.getElementById("btn-fechar-modal");
  const btnCancelarModal = document.getElementById("btn-cancelar-modal");
  const formCriarEvento = document.getElementById("form-criar-evento");
  const inputBanner = document.getElementById("input-banner");
  const bannerPreview = document.getElementById("banner-preview");
  const bannerPreviewImg = document.getElementById("banner-preview-img");
  const btnRemoverBanner = document.getElementById("btn-remover-banner");
  const uploadArea = document.getElementById("upload-area");

  // Modal editar
  const modalEditar = document.getElementById("modal-editar-evento");
  const btnFecharModalEditar = document.getElementById(
    "btn-fechar-modal-editar"
  );
  const btnCancelarModalEditar = document.getElementById(
    "btn-cancelar-modal-editar"
  );
  const formEditarEvento = document.getElementById("form-editar-evento");

  // Modal detalhes
  const modalDetalhes = document.getElementById("modal-detalhes-evento");
  const btnFecharDetalhes1 = document.getElementById(
    "btn-fechar-modal-detalhes"
  );
  const btnFecharDetalhes2 = document.getElementById(
    "btn-fechar-modal-detalhes-2"
  );

  try {
    const user = await getCurrentUser();
    const perfilNormalizado = (user.perfil || "").trim().toLowerCase();

    if (perfilNormalizado !== "organizador") {
      showToast(
        "Acesso negado. Apenas organizadores podem acessar esta página.",
        "error"
      );
      setTimeout(() => {
        window.location.href = "/dashboard/";
      }, 2000);
      return;
    }

    // Logout
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

    // Abrir/fechar modal criar
    function abrirModalCriar() {
      if (!modalCriar) return;
      modalCriar.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }

    function fecharModalCriar() {
      if (!modalCriar) return;
      modalCriar.classList.add("hidden");
      document.body.style.overflow = "auto";
      if (formCriarEvento) formCriarEvento.reset();
      if (bannerPreview) bannerPreview.classList.add("hidden");
      if (uploadArea) uploadArea.classList.remove("hidden");
    }

    if (btnNovoEvento) btnNovoEvento.addEventListener("click", abrirModalCriar);
    btnsCriarPrimeiro.forEach((btn) =>
      btn.addEventListener("click", abrirModalCriar)
    );
    if (btnFecharModal) btnFecharModal.addEventListener("click", fecharModalCriar);
    if (btnCancelarModal)
      btnCancelarModal.addEventListener("click", fecharModalCriar);
    if (modalCriar) {
      modalCriar.addEventListener("click", (e) => {
        if (e.target === modalCriar) fecharModalCriar();
      });
    }

    // Preview banner (criar)
    if (inputBanner) {
      inputBanner.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            showToast("A imagem deve ter no máximo 5MB", "error");
            inputBanner.value = "";
            return;
          }

          if (!file.type.startsWith("image/")) {
            showToast("Por favor, selecione uma imagem válida", "error");
            inputBanner.value = "";
            return;
          }

          const reader = new FileReader();
          reader.onload = (ev) => {
            if (bannerPreviewImg) bannerPreviewImg.src = ev.target.result;
            if (bannerPreview) bannerPreview.classList.remove("hidden");
            if (uploadArea) uploadArea.classList.add("hidden");
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (btnRemoverBanner) {
      btnRemoverBanner.addEventListener("click", () => {
        if (inputBanner) inputBanner.value = "";
        if (bannerPreview) bannerPreview.classList.add("hidden");
        if (uploadArea) uploadArea.classList.remove("hidden");
      });
    }

    // Submit criar
    if (formCriarEvento) {
      formCriarEvento.addEventListener("submit", async (e) => {
        e.preventDefault();

        const btnSalvar = document.getElementById("btn-salvar-evento");
        if (btnSalvar) {
          btnSalvar.disabled = true;
          btnSalvar.innerHTML =
            '<i class="bx bx-loader-alt bx-spin text-xl"></i><span>Criando...</span>';
        }

        try {
          const formData = new FormData(formCriarEvento);

          const response = await fetch(`${API_BASE_URL}/eventos/`, {
            method: "POST",
            credentials: "include",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Erro ao criar evento");
          }

          await response.json();
          showToast("Evento criado com sucesso!", "success");

          fecharModalCriar();
          await carregarEventos();
          await atualizarEstatisticas();
        } catch (err) {
          console.error(err);
          showToast(err.message || "Erro ao criar evento", "error");
        } finally {
          const btnSalvar = document.getElementById("btn-salvar-evento");
          if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.innerHTML =
              '<i class="bx bx-check text-xl"></i><span>Criar Evento</span>';
          }
        }
      });
    }

    // Fechar modal editar
    if (btnFecharModalEditar)
      btnFecharModalEditar.addEventListener("click", fecharModalEditar);
    if (btnCancelarModalEditar)
      btnCancelarModalEditar.addEventListener("click", fecharModalEditar);
    if (modalEditar) {
      modalEditar.addEventListener("click", (e) => {
        if (e.target === modalEditar) fecharModalEditar();
      });
    }

    // Submit editar
    if (formEditarEvento) {
      formEditarEvento.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!eventoEditando) return;

        const btnSalvar = document.getElementById("btn-salvar-editar");
        if (btnSalvar) {
          btnSalvar.disabled = true;
          btnSalvar.innerHTML =
            '<i class="bx bx-loader-alt bx-spin text-xl"></i><span>Salvando...</span>';
        }

        try {
          const formData = new FormData(formEditarEvento);
          const dataAtualizada = await atualizarEvento(
            eventoEditando.id,
            formData
          );

          showToast("Evento atualizado com sucesso!", "success");

          // Atualiza cache
          eventosCache = eventosCache.map((ev) =>
            ev.id === eventoEditando.id ? { ...ev, ...dataAtualizada } : ev
          );

          await carregarEventos(false); // recarrega da cache
          await atualizarEstatisticas();
          fecharModalEditar();
        } catch (err) {
          console.error(err);
          showToast(err.message || "Erro ao atualizar evento", "error");
        } finally {
          const btnSalvar = document.getElementById("btn-salvar-editar");
          if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.innerHTML =
              '<i class="bx bx-check text-xl"></i><span>Salvar alterações</span>';
          }
        }
      });
    }

    // Modal detalhes – fechar
    if (btnFecharDetalhes1)
      btnFecharDetalhes1.addEventListener("click", fecharModalDetalhes);
    if (btnFecharDetalhes2)
      btnFecharDetalhes2.addEventListener("click", fecharModalDetalhes);
    if (modalDetalhes) {
      modalDetalhes.addEventListener("click", (e) => {
        if (e.target === modalDetalhes) fecharModalDetalhes();
      });
    }

    // Carregar dados
    await atualizarEstatisticas();
    await carregarEventos();

    // Filtros
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterButtons.forEach((b) => {
          b.classList.remove("active", "bg-primary-600", "text-white");
          b.classList.add("text-slate-400");
        });

        btn.classList.add("active", "bg-primary-600", "text-white");
        btn.classList.remove("text-slate-400");

        filtroAtual = btn.dataset.filter;
        aplicarFiltros();
      });
    });

    if (inputBusca) {
      inputBusca.addEventListener("input", (e) => {
        buscaAtual = e.target.value.toLowerCase().trim();
        aplicarFiltros();
      });
    }
  } catch (err) {
    console.error(err);

    if (err.message === "unauthenticated") {
      window.location.href = "/login/";
      return;
    }

    const emptyState = document.getElementById("empty-state");
    const loadingState = document.getElementById("loading-state");

    if (loadingState) loadingState.classList.add("hidden");
    if (emptyState) {
      emptyState.classList.remove("hidden");
      const h3 = emptyState.querySelector("h3");
      const p = emptyState.querySelector("p");
      if (h3) h3.textContent = "Erro ao carregar eventos";
      if (p) p.textContent = "Tente novamente em alguns instantes.";
    }

    showToast("Erro ao carregar dados. Tente novamente mais tarde.", "error");
  }
}

async function carregarEventos(buscarDoServidor = true) {
  const eventosBox = document.getElementById("eventos-box");
  if (!eventosBox) return;

  if (buscarDoServidor) {
    eventosCache = await getEventosOrganizador();
  }

  if (!eventosCache || !Array.isArray(eventosCache) || eventosCache.length === 0) {
    eventosBox.innerHTML = "";
    verificarEstadoVazio(true);
    return;
  }

  eventosBox.innerHTML = "";
  eventosCache.forEach((evento) => {
    const card = criarCardEvento(evento);
    eventosBox.appendChild(card);
  });

  verificarEstadoVazio();
  aplicarFiltros();
}

// =============== START ===============
document.addEventListener("DOMContentLoaded", () => {
  initPainelOrganizador();
});
