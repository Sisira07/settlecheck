import { useState } from 'react'
import { api } from '../api.js'
import { useToast } from '../components/Toast.jsx'

export default function SeedData() {
  const [counts, setCounts] = useState({ clean: 30, split: 10, merged: 8, broken: 6 });
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  const handleChange = (field) => (e) =>
    setCounts(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.generateData(counts.clean, counts.split, counts.merged, counts.broken);
      push(`Seeded ${data.orders} orders and ${data.settlements} settlements`, 'success');
    } catch (err) {
      push('Could not reach the API — is the backend running?', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'clean', label: 'Clean matches', hint: 'Straightforward 1:1 pairs — caught by Pass 1' },
    { key: 'split', label: 'Split settlements', hint: 'One order, 2–3 settlements — needs Pass 2' },
    { key: 'merged', label: 'Merged batches', hint: '2–3 orders, one settlement — needs Pass 2' },
    { key: 'broken', label: 'Broken records', hint: 'No match exists — should raise exceptions' },
  ];

  return (
    <section className="view active">
      <header className="view-head">
        <span className="eyebrow">Step one</span>
        <h1>Seed a synthetic batch</h1>
        <p className="lede">
          Generates orders and settlements across four cases on purpose: clean 1:1 pairs, split
          settlements, merged batches, and genuinely broken records with no match at all. A fixed
          random seed means every run is reproducible for a demo.
        </p>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="field-grid">
          {fields.map(f => (
            <label className="field" key={f.key}>
              <span>{f.label}</span>
              <input type="number" min="0" value={counts[f.key]} onChange={handleChange(f.key)} />
              <small>{f.hint}</small>
            </label>
          ))}
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Generating…' : 'Generate batch'}
        </button>
      </form>
    </section>
  );
}
