import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('standalone UI keeps credentials in memory, authenticates and renders chat as text', async () => {
 const code = await readFile(new URL('./ui.js', import.meta.url), 'utf8');
 const elements = new Map();
 const make = () => ({value:'', textContent:'', hidden:false, disabled:false, children:[], append(x){this.children.push(x)}, replaceChildren(){this.children=[]}});
 const el = id => { if (!elements.has(id)) elements.set(id, make()); return elements.get(id); };
 const requests=[];
 const fetch = async (url, options) => { requests.push({url,options}); if (url.includes('/auth/v1/token')) return {ok:true,json:async()=>({access_token:'fake-token'})}; if (url.endsWith('/status')) return {ok:true,json:async()=>({status:'connected'})}; if (url.endsWith('/chats')) return {ok:true,json:async()=>({chats:[{jid:'test',messages:[{text:'<script>fake</script>',fromMe:false}]}]})}; return {ok:true,json:async()=>({code:'ABCDEFGH'})}; };
 vm.runInNewContext(code, {location:{protocol:'http:',hostname:'127.0.0.1',port:'8000'}, document:{getElementById:el,createElement:make}, fetch, URL, AbortSignal, setTimeout, clearTimeout});
 el('project').value='https://example.supabase.co'; el('key').value='x'.repeat(30); el('email').value='test@example.invalid'; el('password').value='fake-password';
 await el('signin').onclick(); assert.equal(el('password').value,''); assert.equal(el('session').hidden,false);
 await el('refresh').onclick(); assert.equal(el('chats').children[1].textContent,'<script>fake</script>'); assert.equal(requests[1].options.headers.authorization,'Bearer fake-token');
 el('signout').onclick(); assert.equal(el('session').hidden,true); assert.equal(el('chats').children.length,0); assert.equal(el('status').textContent,'');
});

test('UI does not activate on non-loopback origins', async () => {
 const code = await readFile(new URL('./ui.js', import.meta.url), 'utf8');
 vm.runInNewContext(code, {location:{protocol:'https:',hostname:'example.org',port:''}});
});
