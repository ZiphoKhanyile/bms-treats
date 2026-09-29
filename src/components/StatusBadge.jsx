const LABELS = {
  pending: 'Pending',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status.replace('out_for_delivery', 'out')}`}>{LABELS[status] || status}</span>
}
