import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Fire-and-forget: a failed receipt email should never block the order
// flow, so this never throws — it just logs and moves on.
export async function sendOrderReceiptEmail(params) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('[BMS Treats] EmailJS env vars are missing — skipping receipt email. See .env.example.')
    return
  }
  console.log('[BMS Treats] Sending receipt email with params:', params)

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUBLIC_KEY })
    console.log('[BMS Treats] Receipt email sent successfully.')
  } catch (err) {
    console.error('[BMS Treats] Failed to send receipt email:', err)
  }
}