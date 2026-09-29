import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AdminSettings() {
  const [heroVideoUrl, setHeroVideoUrl] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setHeroVideoUrl(data.hero_video_url || '')
          setHeroImageUrl(data.hero_image_url || '')
        }
      })
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase
      .from('site_settings')
      .upsert({ id: '00000000-0000-0000-0000-000000000001', hero_video_url: heroVideoUrl || null, hero_image_url: heroImageUrl || null })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 24 }}>Site settings</h1>
      <form onSubmit={handleSave} className="card" style={{ margin: 0, maxWidth: 480 }}>
        <div className="field">
          <label htmlFor="hero-video">Hero video URL</label>
          <input
            id="hero-video"
            placeholder="https://... (mp4 or webm, hosted anywhere)"
            value={heroVideoUrl}
            onChange={(e) => setHeroVideoUrl(e.target.value)}
          />
          <span className="field-hint">
            A short looping clip of the desserts being made/plated works best. Leave blank to use
            the default animated hero.
          </span>
        </div>
        <div className="field">
          <label htmlFor="hero-image">Hero poster image URL (optional)</label>
          <input
            id="hero-image"
            placeholder="Shown while the video loads"
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved && <p style={{ color: 'var(--success-600)', marginTop: 10 }}>Saved.</p>}
      </form>
    </div>
  )
}
