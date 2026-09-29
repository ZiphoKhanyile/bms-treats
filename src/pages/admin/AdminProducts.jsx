import { useEffect, useState } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import ConfirmDialog from '../../components/ConfirmDialog'

const EMPTY_FORM = { name: 'Dessert Cup', type: 'cup', flavour: '', price: '', stock_qty: '' }

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [newImageFile, setNewImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const [error, setError] = useState('')

  const loadProducts = () => {
    supabase.from('products').select('*').order('created_at').then(({ data }) => {
      setProducts(data || [])
    })
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const updateField = (id, field, value) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const saveProduct = async (product) => {
    setError('')
    const { error: saveError } = await supabase
      .from('products')
      .update({
        name: product.type === 'tray' ? 'Dessert Tray' : 'Dessert Cup',
        type: product.type,
        flavour: product.flavour,
        price: product.price,
        stock_qty: product.stock_qty,
        is_active: product.is_active,
      })
      .eq('id', product.id)
    if (saveError) setError(saveError.message)
  }

  const deleteProduct = async (id) => {
    setError('')
    const { error: deleteError } = await supabase.from('products').delete().eq('id', id)
    if (deleteError) {
      setError('Could not delete — this product has past orders tied to it. Mark it inactive instead.')
      return
    }
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const uploadImage = async (file, productId) => {
    const ext = file.name.split('.').pop()
    const path = `${productId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data.publicUrl
  }

  const replaceImage = async (product, file) => {
    setUploadingId(product.id)
    setError('')
    try {
      const imageUrl = await uploadImage(file, product.id)
      await supabase.from('products').update({ image_url: imageUrl }).eq('id', product.id)
      updateField(product.id, 'image_url', imageUrl)
    } catch (e) {
      setError(e.message || 'Image upload failed.')
    } finally {
      setUploadingId(null)
    }
  }

  const addProduct = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { data: created, error: insertError } = await supabase
        .from('products')
        .insert({
          name: form.name,
          type: form.type,
          flavour: form.flavour,
          price: Number(form.price),
          stock_qty: Number(form.stock_qty),
        })
        .select()
        .single()
      if (insertError) throw insertError

      if (newImageFile) {
        const imageUrl = await uploadImage(newImageFile, created.id)
        await supabase.from('products').update({ image_url: imageUrl }).eq('id', created.id)
        created.image_url = imageUrl
      }

      setProducts((prev) => [...prev, created])
      setForm(EMPTY_FORM)
      setNewImageFile(null)
      e.target.reset()
    } catch (e) {
      setError(e.message || 'Could not add product.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 24 }}>Products & Stock</h1>

      {error && <p style={{ color: 'var(--berry-600)', marginBottom: 16 }}>{error}</p>}

      <table className="admin-table" style={{ marginBottom: 32 }}>
        <thead>
          <tr>
            <th>Photo</th>
            <th>Flavour</th>
            <th>Type</th>
            <th>Price (R)</th>
            <th>Stock</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.flavour} className="admin-thumb" />
                ) : (
                  <div className="admin-thumb" />
                )}
                <div style={{ marginTop: 6 }}>
                  <label className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '6px 10px', cursor: 'pointer' }}>
                    {uploadingId === p.id ? 'Uploading…' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => e.target.files[0] && replaceImage(p, e.target.files[0])}
                    />
                  </label>
                </div>
              </td>
              <td>
                <input style={{ width: 120 }} value={p.flavour} onChange={(e) => updateField(p.id, 'flavour', e.target.value)} />
              </td>
              <td>
                <select value={p.type} onChange={(e) => updateField(p.id, 'type', e.target.value)}>
                  <option value="cup">cup</option>
                  <option value="tray">tray</option>
                </select>
              </td>
              <td>
                <input
                  style={{ width: 80 }}
                  type="number"
                  value={p.price}
                  onChange={(e) => updateField(p.id, 'price', Number(e.target.value))}
                />
              </td>
              <td>
                <input
                  style={{ width: 70 }}
                  type="number"
                  value={p.stock_qty}
                  onChange={(e) => updateField(p.id, 'stock_qty', Number(e.target.value))}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={p.is_active !== false}
                  onChange={(e) => updateField(p.id, 'is_active', e.target.checked)}
                />
              </td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline" onClick={() => saveProduct(p)}>
                  <Save size={14} style={{ marginRight: 6 }} />
                  Save
                </button>
                <ConfirmDialog
                  title="Delete this product?"
                  message={`"${p.flavour}" will be permanently removed and can no longer be ordered.`}
                  confirmLabel="Delete"
                  danger
                  onConfirm={() => deleteProduct(p.id)}
                  trigger={(open) => (
                    <button className="btn btn-danger-ghost" onClick={open} aria-label="Delete product">
                      <Trash2 size={14} />
                    </button>
                  )}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Add a new product / flavour</h3>
      <form onSubmit={addProduct} className="card" style={{ margin: 0, maxWidth: 420 }}>
        <div className="field">
          <label htmlFor="p-name">Product</label>
          <select
            id="p-name"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value, name: e.target.value === 'tray' ? 'Dessert Tray' : 'Dessert Cup' })
            }
          >
            <option value="cup">Dessert Cup</option>
            <option value="tray">Dessert Tray</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="p-flavour">Flavour</label>
          <input id="p-flavour" required value={form.flavour} onChange={(e) => setForm({ ...form, flavour: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="p-price">Price (R)</label>
          <input id="p-price" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="p-stock">Starting stock</label>
          <input id="p-stock" type="number" required value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="p-image">Photo</label>
          <input id="p-image" type="file" accept="image/*" onChange={(e) => setNewImageFile(e.target.files[0] || null)} />
          <span className="field-hint">Upload a real photo of this flavour — shown on the menu and product page.</span>
        </div>
        <button className="btn btn-primary" disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Saving…' : 'Add product'}
        </button>
      </form>
    </div>
  )
}