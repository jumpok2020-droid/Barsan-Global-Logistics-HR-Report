import { N8N_LOGIN_WEBHOOK, N8N_RESETPASS_WEBHOOK, N8N_REGISTER_WEBHOOK, WEBHOOK_TIMEOUT_MS } from "../constants";

export async function postLoginWebhook(payload: any) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const res = await fetch(N8N_LOGIN_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    // n8n may respond 200 / 201 / 204 which are all successful
    if (!res.ok && res.status !== 204) {
      const text = await res.text().catch(() => "");
      throw new Error(`Webhook error ${res.status}: ${text}`);
    }
    // In case n8n returns a json body
    let data: any = null;
    try { data = await res.json(); } catch {}
    return { ok: true, data };
  } catch (err: any) {
    clearTimeout(t);
    return { ok: false, error: err?.message || "Webhook request failed" };
  }
}

export async function postResetPasswordWebhook(email: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), WEBHOOK_TIMEOUT_MS);
  const payload = { email };

  try {
    const res = await fetch(N8N_RESETPASS_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Webhook error ${res.status}: ${text}`);
    }
    return { ok: true };
  } catch (err: any) {
    clearTimeout(t);
    return { ok: false, error: err?.message || "Webhook request failed" };
  }
}

export async function postRegisterWebhook(payload: { name: string, email: string, password: string }) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const res = await fetch(N8N_REGISTER_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      const text = await res.text().catch(() => "An unknown error occurred.");
      // Handle specific error for existing user
      if (res.status === 409 || text.toLowerCase().includes('duplicate')) {
          throw new Error('This email address is already registered.');
      }
      throw new Error(`Webhook error ${res.status}: ${text}`);
    }
    return { ok: true };
  } catch (err: any) {
    clearTimeout(t);
    return { ok: false, error: err?.message || "Webhook request failed" };
  }
}