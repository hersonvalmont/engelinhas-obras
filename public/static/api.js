// ══════════════════════════════════════════════════════════════
// ENGELINHAS OBRAS — API CLIENT
// Substitui localStorage por chamadas REST ao backend Node.js
// ══════════════════════════════════════════════════════════════

const API_BASE = window.location.origin;
let _token = localStorage.getItem('engelinhas_jwt') || '';

// ── Helpers ───────────────────────────────────────────────────
async function apiFetch(method, path, body = null, isFormData = false) {
  const headers = { 'Authorization': 'Bearer ' + _token };
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(API_BASE + '/api' + path, opts);

  if (res.status === 401) {
    // Token expirado — forçar logout
    apiLogout();
    return null;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ erro: 'Erro desconhecido.' }));
    throw new Error(err.erro || 'Erro ' + res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

const apiGet    = (path)        => apiFetch('GET',    path);
const apiPost   = (path, body)  => apiFetch('POST',   path, body);
const apiPut    = (path, body)  => apiFetch('PUT',    path, body);
const apiPatch  = (path, body)  => apiFetch('PATCH',  path, body);
const apiDelete = (path)        => apiFetch('DELETE', path);

// ── AUTH ──────────────────────────────────────────────────────
async function apiLogin(email, senha) {
  const res = await fetch(API_BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), senha })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Credenciais inválidas.');
  _token = data.token;
  localStorage.setItem('engelinhas_jwt', _token);
  return data.usuario;
}

function apiLogout() {
  _token = '';
  localStorage.removeItem('engelinhas_jwt');
  localStorage.removeItem('engelinhas_session');
  const cache = JSON.parse(localStorage.getItem('engelinhas_login_cache') || 'null');
  document.getElementById('app').classList.remove('visible');
  document.getElementById('login-screen').style.display = 'flex';
  if (cache) {
    document.getElementById('inp-empresa').value = cache.empresa || '';
    document.getElementById('inp-email').value   = cache.email   || '';
  }
  document.getElementById('inp-senha').value = '';
}

async function apiMe() {
  return apiGet('/auth/me');
}

// ── USUÁRIOS ──────────────────────────────────────────────────
const apiUsuarios = {
  listar:  ()       => apiGet('/usuarios'),
  criar:   (body)   => apiPost('/usuarios', body),
  editar:  (id, b)  => apiPut('/usuarios/' + id, b),
  toggle:  (id)     => apiPatch('/usuarios/' + id + '/toggle'),
  excluir: (id)     => apiDelete('/usuarios/' + id),
};

// ── OBRAS ─────────────────────────────────────────────────────
const apiObras = {
  listar:  ()       => apiGet('/obras'),
  criar:   (body)   => apiPost('/obras', body),
  editar:  (id, b)  => apiPut('/obras/' + id, b),
  excluir: (id)     => apiDelete('/obras/' + id),
};

// ── FUNCIONÁRIOS ──────────────────────────────────────────────
const apiFuncionarios = {
  listar:  ()       => apiGet('/funcionarios'),
  criar:   (body)   => apiPost('/funcionarios', body),
  editar:  (id, b)  => apiPut('/funcionarios/' + id, b),
  toggle:  (id)     => apiPatch('/funcionarios/' + id + '/toggle'),
  excluir: (id)     => apiDelete('/funcionarios/' + id),
};

// ── ASOs ──────────────────────────────────────────────────────
const apiAsos = {
  listar:  ()       => apiGet('/asos'),
  criar:   (body)   => apiPost('/asos', body),
  editar:  (id, b)  => apiPut('/asos/' + id, b),
  excluir: (id)     => apiDelete('/asos/' + id),
};

// ── ATAS ──────────────────────────────────────────────────────
const apiAtas = {
  listar:  ()       => apiGet('/atas'),
  criar:   (body)   => apiPost('/atas', body),
  editar:  (id, b)  => apiPut('/atas/' + id, b),
  excluir: (id)     => apiDelete('/atas/' + id),
};

// ── DOCUMENTOS (EPI / contratos / etc.) ───────────────────────
const apiDocumentos = {
  listar:  (tipo)   => apiGet('/documentos' + (tipo ? '?tipo=' + tipo : '')),
  criar:   (body)   => apiPost('/documentos', body),
  editar:  (id, b)  => apiPut('/documentos/' + id, b),
  excluir: (id)     => apiDelete('/documentos/' + id),
};

// ── ARQUIVOS ──────────────────────────────────────────────────
const apiArquivos = {
  listar: (entidade, entidade_id) =>
    apiGet('/arquivos?entidade=' + entidade + '&entidade_id=' + entidade_id),

  upload: async (entidade, entidade_id, files) => {
    const fd = new FormData();
    fd.append('entidade', entidade);
    fd.append('entidade_id', entidade_id);
    for (const f of files) fd.append('files', f);
    return apiFetch('POST', '/arquivos/upload', fd, true);
  },

  download: (id, nomeOrig) => {
    const a = document.createElement('a');
    a.href = API_BASE + '/api/arquivos/' + id + '/download';
    a.download = nomeOrig || 'arquivo';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  excluir: (id) => apiDelete('/arquivos/' + id),
};

// ── Verificar sessão salva ao carregar ────────────────────────
async function apiVerificarSessao() {
  if (!_token) return null;
  try {
    const user = await apiMe();
    return user;
  } catch(e) {
    _token = '';
    localStorage.removeItem('engelinhas_jwt');
    return null;
  }
}
