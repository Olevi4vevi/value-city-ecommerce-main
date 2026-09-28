import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ProductForm.css';

const API = 'http://localhost:5000/api/products';
const CATEGORIES_API = 'http://localhost:5000/api/categories';
const UPLOAD_API = 'http://localhost:5000/api/upload';

const NAME_MAX = 100;
const DESC_MAX = 500;

const GRADES = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem('token')}` };
}

function blockBadKeys(e) {
  if (['e', 'E', '+'].includes(e.key)) e.preventDefault();
}

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    condition_grade: 'good',
    image_url: '',
  });

  useEffect(() => {
    Promise.all([
      axios.get(CATEGORIES_API, { headers: authHeaders() }),
      axios.get(`${API}/${id}`, { headers: authHeaders() }),
    ])
      .then(([catRes, prodRes]) => {
        setCategories(catRes.data);
        const p = prodRes.data;
        setForm({
          name: p.name || '',
          description: p.description || '',
          category_id: p.category_id || '',
          price: p.price || '',
          condition_grade: p.condition_grade || 'good',
          image_url: p.image_url || '',
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load this item.');
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' && value.length > NAME_MAX) return;
    if (name === 'description' && value.length > DESC_MAX) return;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setUploading(true);

    const data = new FormData();
    data.append('image', file);

    try {
      const res = await axios.post(UPLOAD_API, data, { headers: authHeaders() });
      setForm(prev => ({ ...prev, image_url: res.data.url }));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not upload that image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Give the item a name.');
    if (form.price === '' || Number(form.price) < 0) return setError('Enter a valid price.');

    setSaving(true);
    try {
      await axios.put(`${API}/${id}`, form, { headers: authHeaders() });
      navigate('/admin/products', { state: { toast: `"${form.name.trim()}" updated` } });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save changes. Try again.');
      setSaving(false);
    }
  };

  if (loading) return <p className="pf-loading">Loading item…</p>;

  return (
    <form onSubmit={handleSubmit} className="pf">
      <header className="pf-head">
        <div>
          <span className="eyebrow">Editing listing</span>
          <h1>{form.name || 'Item'}</h1>
        </div>
        <div className="pf-acts">
          <button type="button" onClick={() => navigate('/admin/products')}>Cancel</button>
          <button type="submit" className="pf-save" disabled={saving || uploading}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </header>

      {error && <p className="pf-error">{error}</p>}

      <div className="pf-body">
        <div className="pf-col">
          <section className="pf-card">
            <span className="eyebrow">The item</span>
            <label>
              <span className="pf-label-row">
                <span className="eyebrow">Name</span>
                <span className="pf-count">{form.name.length}/{NAME_MAX}</span>
              </span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={NAME_MAX}
              />
            </label>
            <label>
              <span className="pf-label-row">
                <span className="eyebrow">Description</span>
                <span className="pf-count">{form.description.length}/{DESC_MAX}</span>
              </span>
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                maxLength={DESC_MAX}
              />
            </label>
          </section>

          <section className="pf-card">
            <span className="eyebrow">Condition</span>
            <div className="grades">
              {GRADES.map(g => (
                <button
                  key={g.value}
                  type="button"
                  className={`grade${form.condition_grade === g.value ? ' is-on' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, condition_grade: g.value }))}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </section>

          <section className="pf-card">
            <span className="eyebrow">Price</span>
            <label>
              <span className="eyebrow">Price (FJD)</span>
              <input
                className="mono"
                type="number"
                step="0.01"
                min="0"
                max="999999"
                name="price"
                value={form.price}
                onChange={handleChange}
                onKeyDown={blockBadKeys}
              />
            </label>
            <p className="pf-note">Stock is adjusted on the Stock page, not here.</p>
          </section>
        </div>

        <div className="pf-col">
          <section className="pf-card">
            <span className="eyebrow">Photo</span>
            <div className="pf-preview">
              {uploading
                ? <span className="eyebrow">Uploading…</span>
                : form.image_url
                  ? <img src={form.image_url} alt="" />
                  : <span className="eyebrow">No photo yet</span>}
            </div>

            <label className="pf-file">
              <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
              <span>{uploading ? 'Uploading…' : form.image_url ? 'Replace photo' : 'Choose photo'}</span>
            </label>

            {form.image_url && !uploading && (
              <button
                type="button"
                className="pf-clear"
                onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
              >
                Remove photo
              </button>
            )}

            <p className="pf-note">JPG, PNG, WEBP or GIF. Maximum 5MB.</p>
          </section>

          <section className="pf-card">
            <span className="eyebrow">Section</span>
            <label>
              <span className="eyebrow">Category</span>
              <select name="category_id" value={form.category_id} onChange={handleChange}>
                <option value="">Uncategorised</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <Link to="/admin/categories" className="pf-link">Manage sections</Link>
          </section>
        </div>
      </div>
    </form>
  );
}

export default EditProduct;