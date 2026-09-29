import { useEffect, useState } from 'react'
import { Trash2, Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminResidences() {
  const [residences, setResidences] = useState([])
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [buildingsText, setBuildingsText] = useState('')
  const [newBuildingText, setNewBuildingText] = useState({})
  const [error, setError] = useState('')

  const loadResidences = () => {
    supabase
      .from('residences')
      .select('id, name, area, is_deliverable, residence_buildings(id, name)')
      .then(({ data }) => {
        setResidences((data || []).map((r) => ({ ...r, buildings: r.residence_buildings })))
      })
  }

  useEffect(() => {
    loadResidences()
  }, [])

  const updateResidenceField = (id, field, value) => {
    setResidences((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const saveResidence = async (r) => {
    setError('')
    const { error: saveError } = await supabase
      .from('residences')
      .update({ name: r.name, area: r.area, is_deliverable: r.is_deliverable })
      .eq('id', r.id)
    if (saveError) setError(saveError.message)
  }

  const deleteResidence = async (id) => {
    setError('')
    const { error: deleteError } = await supabase.from('residences').delete().eq('id', id)
    if (deleteError) {
      setError('Could not delete — this residence has existing orders. Mark it not deliverable instead.')
      return
    }
    setResidences((prev) => prev.filter((r) => r.id !== id))
  }

  const addBuilding = async (residenceId) => {
    const text = (newBuildingText[residenceId] || '').trim()
    if (!text) return
    setError('')
    const { data, error: insertError } = await supabase
      .from('residence_buildings')
      .insert({ residence_id: residenceId, name: text })
      .select()
      .single()
    if (insertError) {
      setError(insertError.message)
      return
    }
    setResidences((prev) => prev.map((r) => (r.id === residenceId ? { ...r, buildings: [...r.buildings, data] } : r)))
    setNewBuildingText((prev) => ({ ...prev, [residenceId]: '' }))
  }

  const deleteBuilding = async (residenceId, buildingId) => {
    setError('')
    const { error: deleteError } = await supabase.from('residence_buildings').delete().eq('id', buildingId)
    if (deleteError) {
      setError('Could not remove that building — it has existing orders tied to it.')
      return
    }
    setResidences((prev) =>
      prev.map((r) => (r.id === residenceId ? { ...r, buildings: r.buildings.filter((b) => b.id !== buildingId) } : r))
    )
  }

  const addResidence = async (e) => {
    e.preventDefault()
    setError('')
    const { data: residence, error: insertError } = await supabase.from('residences').insert({ name, area }).select().single()
    if (insertError || !residence) {
      setError(insertError?.message || 'Could not add residence.')
      return
    }

    const buildingNames = buildingsText.split(',').map((b) => b.trim()).filter(Boolean)
    let buildings = []
    if (buildingNames.length) {
      const { data: insertedBuildings } = await supabase
        .from('residence_buildings')
        .insert(buildingNames.map((n) => ({ residence_id: residence.id, name: n })))
        .select()
      buildings = insertedBuildings || []
    }

    setResidences((prev) => [...prev, { ...residence, buildings }])
    setName('')
    setArea('')
    setBuildingsText('')
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 24 }}>Residences & delivery areas</h1>

      {error && <p style={{ color: 'var(--berry-600)', marginBottom: 16 }}>{error}</p>}

      {residences.map((r) => (
        <div className="card" key={r.id} style={{ margin: '0 0 16px', maxWidth: 640 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <input style={{ flex: 1 }} value={r.name} onChange={(e) => updateResidenceField(r.id, 'name', e.target.value)} />
            <input style={{ flex: 1 }} value={r.area} onChange={(e) => updateResidenceField(r.id, 'area', e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {r.buildings.map((b) => (
              <span key={b.id} className="chip">
                {b.name}
                <button onClick={() => deleteBuilding(r.id, b.id)} aria-label={`Remove ${b.name}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              placeholder="New building name"
              value={newBuildingText[r.id] || ''}
              onChange={(e) => setNewBuildingText((prev) => ({ ...prev, [r.id]: e.target.value }))}
            />
            <button className="btn btn-outline" onClick={() => addBuilding(r.id)}>
              <Plus size={14} style={{ marginRight: 6 }} />
              Add
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={r.is_deliverable !== false}
              onChange={(e) => updateResidenceField(r.id, 'is_deliverable', e.target.checked)}
            />
            Currently deliverable
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => saveResidence(r)}>
              Save
            </button>
            <ConfirmDialog
              title="Delete this residence?"
              message={`"${r.name}" and all its buildings will be removed. Existing order history is protected and can't be deleted if orders reference it.`}
              confirmLabel="Delete"
              danger
              onConfirm={() => deleteResidence(r.id)}
              trigger={(open) => (
                <button className="btn btn-danger-ghost" onClick={open}>
                  <Trash2 size={14} style={{ marginRight: 6 }} />
                  Delete
                </button>
              )}
            />
          </div>
        </div>
      ))}

      <h3>Add a residence</h3>
      <form onSubmit={addResidence} className="card" style={{ margin: 0, maxWidth: 420 }}>
        <div className="field">
          <label htmlFor="res-name">Res name</label>
          <input id="res-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="res-area">Area / town / township</label>
          <input id="res-area" required value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="res-buildings">Buildings (comma-separated)</label>
          <input
            id="res-buildings"
            placeholder="Block A, Block B, Block C"
            value={buildingsText}
            onChange={(e) => setBuildingsText(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }}>Add residence</button>
      </form>
    </div>
  )
}