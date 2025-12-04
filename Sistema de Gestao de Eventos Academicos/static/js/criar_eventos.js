const API_BASE_URL = 'http://127.0.0.1:8000/api';

// --- Toast simples (mesmo esquema do dashboard) ---
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return alert(message);

  const span = toast.querySelector('span');
  if (span) span.textContent = message;

  if (type === 'success') {
    toast.style.borderColor = 'rgba(34,197,94,0.6)';
  } else if (type === 'error') {
    toast.style.borderColor = 'rgba(239,68,68,0.7)';
  } else {
    toast.style.borderColor = 'rgba(139,92,246,0.4)';
  }

  toast.classList.remove('translate-x-[400px]');
  clearTimeout(window.__toastNovoEventoTimeout);
  window.__toastNovoEventoTimeout = setTimeout(() => {
    toast.classList.add('translate-x-[400px]');
  }, 2500);
}

// --- Helper para pegar usuário atual (mesmo estilo do dashboard) ---
async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/usuarios/current_user/`, {
    method: 'GET',
    credentials: 'include',
  });

  if (res.status === 401) {
    throw new Error('unauthenticated');
  }

  if (!res.ok) {
    throw new Error(`Erro ao buscar usuário (HTTP ${res.status})`);
  }

  return await res.json();
}

// --- Carregar categorias para o select ---
async function carregarCategorias() {
  const select = document.getElementById('categoria');
  if (!select) return;

  try {
    const res = await fetch(`${API_BASE_URL}/categorias/`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Erro ao carregar categorias.');

    const categorias = await res.json();

    categorias.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.nome;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Não foi possível carregar categorias.', 'error');
  }
}

// --- Converter datetime-local para ISO 8601 aceito pelo backend ---
function datetimeLocalToISO(value) {
  if (!value) return null;
  // value vem tipo "2025-12-10T14:30"
  return value + ':00Z'; // vira "2025-12-10T14:30:00Z"
}

// --- Init página de criação ---
async function initCriarEvento() {
  const form = document.getElementById('form-criar-evento');
  const msgErro = document.getElementById('msg-erro');
  const msgSucesso = document.getElementById('msg-sucesso');

  try {
    const user = await getCurrentUser();

    const perfilNormalizado = (user.perfil || '').trim().toLowerCase();
    if (perfilNormalizado !== 'organizador') {
      showToast('Apenas organizadores podem criar eventos.', 'error');
      setTimeout(() => {
        window.location.href = '/dashboard/';
      }, 1500);
      return;
    }
  } catch (err) {
    console.error(err);
    if (err.message === 'unauthenticated') {
      window.location.href = '/login/';
      return;
    }
    showToast('Erro ao validar usuário.', 'error');
    return;
  }

  await carregarCategorias();

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (msgErro) {
      msgErro.classList.add('hidden');
      msgErro.textContent = '';
    }
    if (msgSucesso) {
      msgSucesso.classList.add('hidden');
      msgSucesso.textContent = '';
    }

    const titulo = document.getElementById('titulo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const local = document.getElementById('local').value.trim();
    const categoriaId = document.getElementById('categoria').value || null;
    const dataInicioRaw = document.getElementById('data_inicio').value;
    const dataFimRaw = document.getElementById('data_fim').value;
    const capacidadeRaw = document.getElementById('capacidade_par').value;

    if (!titulo || !local || !dataInicioRaw || !dataFimRaw) {
      if (msgErro) {
        msgErro.textContent =
          'Preencha todos os campos obrigatórios (Título, Local, Início e Término).';
        msgErro.classList.remove('hidden');
      }
      return;
    }

    const dataInicioISO = datetimeLocalToISO(dataInicioRaw);
    const dataFimISO = datetimeLocalToISO(dataFimRaw);

    if (new Date(dataFimISO) < new Date(dataInicioISO)) {
      if (msgErro) {
        msgErro.textContent =
          'A data de término não pode ser anterior à data de início.';
        msgErro.classList.remove('hidden');
      }
      return;
    }

    const capacidade = capacidadeRaw ? Number(capacidadeRaw) : null;
    if (capacidade !== null && (isNaN(capacidade) || capacidade < 0)) {
      if (msgErro) {
        msgErro.textContent =
          'Informe uma capacidade válida (número maior ou igual a zero).';
        msgErro.classList.remove('hidden');
      }
      return;
    }

    const payload = {
      titulo: titulo,
      descricao: descricao || null,
      local: local,
      data_inicio: dataInicioISO,
      data_fim: dataFimISO,
      capacidade_par: capacidade,
      categoria: categoriaId ? Number(categoriaId) : null,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/eventos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        showToast('Você precisa estar logado.', 'error');
        setTimeout(() => (window.location.href = '/login/'), 1200);
        return;
      }

      if (res.status === 403) {
        showToast('Apenas organizadores podem criar eventos.', 'error');
        return;
      }

      if (!res.ok) {
        console.error('Erro ao criar evento:', data);
        if (msgErro) {
          msgErro.textContent =
            data.error ||
            'Não foi possível criar o evento. Verifique os dados e tente novamente.';
          msgErro.classList.remove('hidden');
        }
        return;
      }

      // sucesso!
      if (msgSucesso) {
        msgSucesso.textContent = 'Evento criado com sucesso!';
        msgSucesso.classList.remove('hidden');
      }
      showToast('Evento criado com sucesso!', 'success');

      setTimeout(() => {
        window.location.href = '/painel-organizador/';
      }, 1200);
    } catch (error) {
      console.error(error);
      if (msgErro) {
        msgErro.textContent =
          'Erro inesperado ao criar o evento. Tente novamente mais tarde.';
        msgErro.classList.remove('hidden');
      }
      showToast('Erro inesperado ao criar o evento.', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCriarEvento();
});
