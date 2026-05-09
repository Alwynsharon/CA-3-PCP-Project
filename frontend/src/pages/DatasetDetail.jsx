import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

export default function DatasetDetail() {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/datasets/${id}`)
      .then((res) => setDataset(res.data.dataset))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dataset'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container">Loading...</div>;

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="error">{error}</div>
          <Link to="/">Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h2>{dataset.name}</h2>
        <p><span className="badge">{dataset.category}</span></p>
        <p><strong>Description:</strong> {dataset.description || '—'}</p>
        <h3>Content (read-only)</h3>
        <pre style={{ background: '#f9fafb', padding: 12, borderRadius: 6, whiteSpace: 'pre-wrap' }}>
          {dataset.content || '(empty)'}
        </pre>
        <p style={{ fontSize: 12, color: '#6b7280' }}>
          Created by {dataset.createdBy?.name} on {new Date(dataset.createdAt).toLocaleString()}
        </p>
        <Link to="/">Back to dashboard</Link>
      </div>
    </div>
  );
}
