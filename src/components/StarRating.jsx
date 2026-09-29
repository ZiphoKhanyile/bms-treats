import { Star } from 'lucide-react'

// value: current rating (supports .5 display via rounding for read-only mode)
// interactive: if true, renders clickable stars and calls onChange(rating)
export default function StarRating({ value = 0, count, interactive = false, onChange, size = 16 }) {
  const stars = [1, 2, 3, 4, 5]

  return (
    <span className="star-rating" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ display: 'inline-flex' }}>
        {stars.map((s) => (
          <button
            key={s}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(s)}
            style={{
              background: 'none',
              border: 'none',
              padding: 1,
              cursor: interactive ? 'pointer' : 'default',
              color: s <= Math.round(value) ? '#e0a13c' : '#e0d6c6',
            }}
            aria-label={`${s} star${s > 1 ? 's' : ''}`}
          >
            <Star size={size} fill={s <= Math.round(value) ? '#e0a13c' : 'none'} strokeWidth={1.5} />
          </button>
        ))}
      </span>
      {typeof count === 'number' && (
        <span style={{ fontSize: '0.82rem', color: 'var(--cocoa-500)' }}>
          {value.toFixed(1)} ({count})
        </span>
      )}
    </span>
  )
}