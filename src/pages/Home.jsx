import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [params] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)

  const q = (params.get('q') || '').toLowerCase()
  const category = params.get('category') || 'all'

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (!error) setProducts(data || [])
        setLoading(false)
      })

    supabase
      .from('site_settings')
      .select('hero_video_url, hero_image_url')
      .maybeSingle()
      .then(({ data }) => setSettings(data))
  }, [])

  const filtered = products.filter((p) => {
    const matchesCategory = category === 'all' || p.type === category
    const matchesQuery = !q || p.flavour.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    return matchesCategory && matchesQuery
  })

  const trays = filtered.filter((p) => p.type === 'tray')
  const cups = filtered.filter((p) => p.type === 'cup')

  return (
    <>
      <section className="hero">
        {settings?.hero_video_url ? (
          <video
            className="hero-media"
            src={settings.hero_video_url}
            poster={settings.hero_image_url || undefined}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div className="hero-fallback" aria-hidden="true">
            <div className="floating-cup c1" />
            <div className="floating-cup c2" />
            <div className="floating-cup c3" />
            <span className="sparkle" style={{ top: '20%', left: '18%' }} />
            <span className="sparkle" style={{ top: '35%', left: '55%', animationDelay: '0.8s' }} />
            <span className="sparkle" style={{ top: '15%', left: '75%', animationDelay: '1.4s' }} />
          </div>
        )}
        <div className="hero-overlay">
          <div className="container">
            <h1>Small cups, big happiness — delivered to your res.</h1>
            <p>
              Layered cake, cream and toppings made fresh in Durban. Pick a flavour and we'll
              bring it straight to your room — cash on delivery.
            </p>
            <a href="#menu" className="btn btn-primary">
              See today's flavours
            </a>
          </div>
        </div>
      </section>

      <section className="container" id="menu">
        {loading && <p>Loading the menu…</p>}

        {!loading && filtered.length === 0 && (
          <p style={{ color: 'var(--cocoa-700)', marginTop: 40 }}>
            {products.length === 0
              ? 'No products yet — add some from the admin Products & Stock page.'
              : 'No flavours match your search.'}
          </p>
        )}

        {trays.length > 0 && (
          <>
            <div className="section-title">
              <h2>Dessert Trays</h2>
            </div>
            <div className="product-grid">
              {trays.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}

        {cups.length > 0 && (
          <>
            <div className="section-title">
              <h2>Dessert Cups</h2>
            </div>
            <div className="product-grid">
              {cups.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}
