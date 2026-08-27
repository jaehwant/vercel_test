// comments.js — Supabase(원격) 또는 localStorage(로컬 폴백)
// 각 페이지에 <section class="cm" data-page-id="..."> 마운트 지점을 두면 자동 연결
(function () {
  const mount = document.querySelector('[data-comments-mount]');
  if (!mount) return;

  const pageId = mount.getAttribute('data-page-id') || 'default';
  const cfg = window.__COMMENTS_CONFIG__ || {};
  const hasCloud = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);

  const banner = mount.querySelector('.cm-banner');
  const listEl = mount.querySelector('.cm-list');
  const form   = mount.querySelector('.cm-form');
  const status = mount.querySelector('.cm-status');
  const bodyInput   = form.querySelector('[name=body]');
  const authorInput = form.querySelector('[name=author]');
  const submitBtn   = form.querySelector('button[type=submit]');

  // ---- Utilities ----
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
    ));
  }
  function timeAgo(t) {
    const s = (Date.now() - new Date(t).getTime()) / 1000;
    if (s < 60)      return '방금 전';
    if (s < 3600)    return Math.floor(s / 60)    + '분 전';
    if (s < 86400)   return Math.floor(s / 3600)  + '시간 전';
    if (s < 2592000) return Math.floor(s / 86400) + '일 전';
    return new Date(t).toLocaleDateString('ko-KR');
  }
  function renderList(rows) {
    if (!rows || rows.length === 0) {
      listEl.innerHTML = '<li class="cm-empty">아직 의견이 없습니다. 첫 의견을 남겨보세요.</li>';
      return;
    }
    listEl.innerHTML = rows.map((c) => {
      const author = (c.author && c.author.trim()) ? c.author.trim() : '익명';
      return (
        '<li class="cm-item">' +
          '<div class="cm-meta"><b>' + esc(author) + '</b>' + esc(timeAgo(c.created_at)) + '</div>' +
          '<div class="cm-body">' + esc(c.body) + '</div>' +
        '</li>'
      );
    }).join('');
  }
  function setStatus(msg, cls) {
    status.textContent = msg || '';
    status.className = 'cm-status' + (cls ? ' ' + cls : '');
  }

  // ---- Backend implementations ----
  const local = {
    key: 'comments:' + pageId,
    async load() {
      try {
        const raw = localStorage.getItem(this.key);
        const rows = raw ? JSON.parse(raw) : [];
        return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } catch (e) { return []; }
    },
    async insert(c) {
      const rows = await this.load();
      const row = Object.assign({ id: Date.now(), created_at: new Date().toISOString() }, c);
      rows.unshift(row);
      localStorage.setItem(this.key, JSON.stringify(rows.slice(0, 100)));
      return row;
    }
  };

  async function makeCloudBackend() {
    const mod = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = mod.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return {
      async load() {
        const { data, error } = await supabase
          .from('comments')
          .select('id, author, body, created_at')
          .eq('page_id', pageId)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return data;
      },
      async insert(c) {
        const { data, error } = await supabase
          .from('comments')
          .insert({ page_id: pageId, author: c.author || null, body: c.body })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    };
  }

  // ---- Bootstrap ----
  async function boot() {
    let backend = local;
    let mode = 'local';

    if (hasCloud) {
      try {
        backend = await makeCloudBackend();
        mode = 'cloud';
      } catch (err) {
        console.warn('Supabase 초기화 실패, localStorage 폴백:', err);
      }
    }

    // Banner
    banner.classList.add(mode === 'cloud' ? 'mode-cloud' : 'mode-local');
    banner.innerHTML =
      '<span class="dot"></span>' +
      (mode === 'cloud'
        ? '<b>공유 모드</b>· 모든 방문자의 의견을 Supabase에 저장·조회합니다.'
        : '<b>로컬 모드</b>· 의견이 이 브라우저에만 저장됩니다. 공유하려면 <code>assets/config.js</code>에 Supabase URL과 anon key를 입력하세요.');

    // Initial load
    try {
      renderList(await backend.load());
    } catch (err) {
      listEl.innerHTML = '<li class="cm-empty">불러오기 실패: ' + esc(err.message || err) + '</li>';
    }

    // Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body   = (bodyInput.value || '').trim();
      const author = (authorInput.value || '').trim();
      if (!body) { setStatus('내용을 입력해주세요', 'err'); return; }
      if (body.length > 1000) { setStatus('1000자 이내로 입력해주세요', 'err'); return; }
      if (author.length > 40) { setStatus('이름은 40자 이내', 'err'); return; }

      submitBtn.disabled = true;
      setStatus('저장 중...', 'busy');
      try {
        await backend.insert({ author, body });
        bodyInput.value = '';
        setStatus('등록되었습니다', 'ok');
        renderList(await backend.load());
        setTimeout(() => setStatus(''), 2200);
      } catch (err) {
        setStatus('오류: ' + (err.message || err), 'err');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  boot();
})();
