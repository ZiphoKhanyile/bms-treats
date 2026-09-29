import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function AddressStep() {
  const navigate = useNavigate()
  const [residences, setResidences] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [residenceId, setResidenceId] = useState('')
  const [buildingId, setBuildingId] = useState('')
  const [room, setRoom] = useState('')

  useEffect(() => {
    if (!sessionStorage.getItem('bms_order_draft')) {
      navigate('/')
    }
    supabase
      .from('residences')
      .select('id, name, area, residence_buildings(id, name)')
      .eq('is_deliverable', true)
      .then(({ data, error }) => {
        if (!error) {
          setResidences(
            (data || []).map((r) => ({
              id: r.id,
              name: r.name,
              area: r.area,
              buildings: r.residence_buildings.map((b) => ({ id: b.id, name: b.name })),
            }))
          )
        }
        setLoading(false)
      })
  }, [navigate])

  const filtered = residences.filter((r) =>
    `${r.name} ${r.area}`.toLowerCase().includes(query.toLowerCase())
  )
  const selectedResidence = residences.find((r) => r.id === residenceId)

  const canContinue = residenceId && buildingId && room.trim().length > 0

  const handleContinue = () => {
    const draft = JSON.parse(sessionStorage.getItem('bms_order_draft') || '{}')
    draft.residenceId = residenceId
    draft.residenceName = selectedResidence?.name
    draft.buildingId = buildingId
    draft.buildingName = selectedResidence?.buildings.find((b) => b.id === buildingId)?.name || ''
    draft.room = room
    sessionStorage.setItem('bms_order_draft', JSON.stringify(draft))
    navigate('/checkout/payment')
  }

  return (
    <div className="container" style={{ maxWidth: 520, margin: '0 auto', padding: '48px 24px' }}>
      <div className="checkout-steps">
        <span className="active">1. Delivery address</span>
        <span>›</span>
        <span>2. Payment</span>
      </div>

      <h1 style={{ fontSize: '1.6rem' }}>Where should we deliver?</h1>

      {loading && <p>Loading residences…</p>}

      {!loading && residences.length === 0 && (
        <p style={{ color: 'var(--berry-600)' }}>
          No deliverable residences are set up yet — add one from the admin Residences page.
        </p>
      )}

      {!loading && residences.length > 0 && (
        <>
      <div className="field">
        <label htmlFor="res-search">Search your residence</label>
        <input
          id="res-search"
          placeholder="Start typing your res name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="field-hint">Only residences BMS Treats currently delivers to are shown.</span>
      </div>

      <div className="field">
        <label htmlFor="res-select">Residence</label>
        <select
          id="res-select"
          value={residenceId}
          onChange={(e) => {
            setResidenceId(e.target.value)
            setBuildingId('')
          }}
        >
          <option value="">Select a residence…</option>
          {filtered.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.area}
            </option>
          ))}
        </select>
      </div>

      {selectedResidence && (
        <div className="field">
          <label htmlFor="building-select">Building</label>
          <select
            id="building-select"
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
          >
            <option value="">Select a building…</option>
            {selectedResidence.buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor="room">Room number</label>
        <input
          id="room"
          placeholder="e.g. 214"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <span className="field-hint">
          Since more than one BMS Treats customer can live in the same res, this makes sure your
          order reaches the right door.
        </span>
      </div>

      <button className="btn btn-primary" disabled={!canContinue} onClick={handleContinue} style={{ width: '100%' }}>
        Continue to payment
      </button>
        </>
      )}
    </div>
  )
}