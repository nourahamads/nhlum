// Cloudflare Worker: hides your Anthropic API key from the browser.
// Deploy: dash.cloudflare.com → Workers → create → paste this file.
// Settings → Variables: secret ANTHROPIC_API_KEY (required); ACCESS_CODES = comma-separated codes you sell (optional);
// ALLOWED_ORIGIN = https://nourahamads.github.io (recommended).
// Then set V2D_ENDPOINT in voice.html to the Worker URL and run build_standalone.py.
const SYSTEM = 'أنت محرر لغوي محترف. ستتلقى نصًا مفرّغًا من تسجيل صوتي. أعد كتابته بلغة سليمة وسلسة وواضحة مع الحفاظ التام على المعنى والمعلومات والأرقام والأسماء. صحّح الأخطاء النحوية والإملائية وأخطاء التفريغ الواضحة، واحذف حشو الكلام والتكرار، وحوّل اللهجة العامية إلى فصحى مبسطة إن كان النص عربيًا، وأضف علامات الترقيم. لا تضف معلومات جديدة ولا تلخّص ولا تعلّق. اكتب بنفس لغة النص الأصلية. أعد النص المحسّن فقط دون أي مقدمة أو شرح.';
const STYLES = {
  para: 'نسّق الناتج في فقرات قصيرة مفصولة بسطر فارغ.',
  formal: 'استخدم أسلوبًا رسميًا مهنيًا، ونسّق الناتج في فقرات قصيرة مفصولة بسطر فارغ.',
  bullets: 'نسّق الناتج كنقاط، كل نقطة في سطر يبدأ بالرمز • .',
  numbered: 'نسّق الناتج كقائمة مرقمة، كل بند في سطر يبدأ برقم ثم نقطة.'
};
export default {
  async fetch(req, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type, X-Access-Code', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    const reply = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return reply({ error: 'method not allowed' }, 405);
    if (env.ACCESS_CODES) {
      const ok = env.ACCESS_CODES.split(',').map(s => s.trim()).filter(Boolean);
      if (!ok.includes(req.headers.get('X-Access-Code') || '')) return reply({ error: 'رمز الدخول غير صحيح' }, 401);
    }
    let body; try { body = await req.json(); } catch { return reply({ error: 'bad json' }, 400); }
    const text = String(body.text || '').slice(0, 20000);
    if (!text.trim()) return reply({ error: 'empty text' }, 400);
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 4096, system: SYSTEM + ' ' + (STYLES[body.style] || STYLES.para), messages: [{ role: 'user', content: text }] })
    });
    const j = await r.json();
    if (!r.ok) return reply({ error: (j.error && j.error.message) || 'upstream error' }, 502);
    return reply({ text: (j.content || []).map(c => c.text || '').join('').trim() });
  }
};
