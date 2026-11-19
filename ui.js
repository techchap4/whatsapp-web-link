// Standalone loopback-only staging client. No browser storage or external scripts.
(() => {
  if (location.protocol !== 'http:' || location.hostname !== '127.0.0.1' || location.port !== '8000') return;
  const el = id => document.getElementById(id), api = 'http://127.0.0.1:8787';
  let token = null, generation = 0, clearCodeTimer;
  function clearView() { el('status').textContent = ''; el('chats').replaceChildren(); el('phone').value = ''; clearTimeout(clearCodeTimer); }
  function clearSession() { generation++; token = null; clearView(); el('session').hidden = true; el('login').hidden = false; }
  async function call(path, body) {
    if (!token) throw Error('unauthorized');
    const response = await fetch(api + path, { method: body ? 'POST' : 'GET', headers: { authorization: 'Bearer ' + token, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error('request_failed'); return response.json();
  }
  el('signin').onclick = async () => {
    el('notice').textContent = ''; el('signin').disabled = true;
    const n = ++generation, password = el('password').value; el('password').value = '';
    try {
      const url = new URL(el('project').value.trim());
      if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) || url.pathname !== '/' || url.search || url.hash || url.username || url.password || url.port) throw Error('project');
      const key = el('key').value.trim(); if (key.length < 20) throw Error('key');
      const r = await fetch(url.origin + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: key, 'content-type': 'application/json' }, body: JSON.stringify({ email: el('email').value.trim(), password }), cache: 'no-store', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw Error('sign_in'); const data = await r.json();
      if (n !== generation || typeof data.access_token !== 'string') return;
      token = data.access_token; el('login').hidden = true; el('session').hidden = false; el('notice').textContent = 'Signed in for this page only. Refreshing the page signs you out.';
    } catch { if (n === generation) el('notice').textContent = 'Sign-in failed. Check the staging project, public key and test account.'; }
    finally { el('signin').disabled = false; }
  };
  el('pair').onclick = async () => {
    const n = generation, phone = el('phone').value.trim(); clearView(); el('pair').disabled = true;
    try { if (!/^[1-9][0-9]{7,14}$/.test(phone)) throw Error('phone'); const data = await call('/pair', { phone }); if (n !== generation) return; el('status').textContent = 'Enter this code in WhatsApp Linked devices: ' + data.code; clearCodeTimer = setTimeout(() => { if (n === generation) el('status').textContent = 'Code cleared; refresh to check connection.'; }, 120000); }
    catch { if (n === generation) el('status').textContent = 'Pairing failed or unavailable.'; }
    finally { el('pair').disabled = false; }
  };
  el('refresh').onclick = async () => {
    const n = generation; clearView();
    try { const status = await call('/status'), data = await call('/chats'); if (n !== generation) return; el('status').textContent = 'Status: ' + status.status; for (const chat of data.chats) { const h = document.createElement('h3'); h.textContent = chat.jid; el('chats').append(h); for (const msg of chat.messages) { const p = document.createElement('p'); p.textContent = (msg.fromMe ? 'You: ' : '') + msg.text; el('chats').append(p); } } }
    catch { if (n === generation) el('status').textContent = 'Could not load chats; sign in again if your session expired.'; }
  };
  el('unlink').onclick = async () => { const n = generation; clearView(); try { await call('/unlink', {}); if (n === generation) el('status').textContent = 'Local data cleared. Verify and remove the device in WhatsApp Linked devices.'; } catch { if (n === generation) el('status').textContent = 'Unlink failed. Remove the device in WhatsApp.'; } };
  el('signout').onclick = () => { clearSession(); el('notice').textContent = 'Signed out locally. The worker session may still run; remove the device in WhatsApp.'; };
})();
