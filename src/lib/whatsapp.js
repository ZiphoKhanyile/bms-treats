// Converts a South African local number (e.g. "0769334328") into the
// digits-only international format wa.me links require (e.g. "27769334328").
// Already-international numbers ("27...", "+27...") pass through unchanged.
export function formatPhoneForWhatsApp(phone) {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '27' + digits.slice(1)
  return digits || null
}

// Builds a wa.me link pre-filled with the receipt text. Opening it starts a
// chat, addressed to the customer, with the message already typed — admin
// just has to hit Send from their own WhatsApp.
export function buildReceiptWhatsAppLink({
  phone,
  buyerName,
  orderId,
  itemsSummary,
  total,
  residenceName,
  buildingName,
  room,
  trackUrl,
}) {
  const number = formatPhoneForWhatsApp(phone)
  if (!number) return null

  const message =
    `Hi ${buyerName}, thanks for your BMS Treats order! 🍰\n\n` +
    `Order #${orderId.slice(0, 8)}\n${itemsSummary}\n` +
    `Total: R${total} (cash on delivery)\n` +
    `Delivering to: ${residenceName}, ${buildingName}, Room ${room}\n\n` +
    `Track your order: ${trackUrl}`

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}