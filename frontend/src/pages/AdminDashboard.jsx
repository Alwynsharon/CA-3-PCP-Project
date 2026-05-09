import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function AdminDashboard() {
  const [datasets, setDatasets] = useState([]);
  const [users, setUsers] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Create dataset form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [content, setContent] = useState('');

  // Assign access form
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      const [d, u, m] = await Promise.all([
        api.get('/datasets'),
        api.get('/users'),
        api.get('/access'),
      ]);
      setDatasets(d.data.datasets);
      setUsers(u.data.users);
      setMappings(m.data.mappings);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const flash = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const createDataset = async (e) => {
    e.preventDefault();
    try {
      await api.post('/datasets', { name, description, category, content });
      setName(''); setDescription(''); setCategory('general'); setContent('');
      flash('Dataset created');
      reload();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to create dataset', true);
    }
  };

  const assignAccess = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedDataset) return;
    try {
      await api.post('/access', { userId: selectedUser, datasetId: selectedDataset });
      flash('Access granted');
      reload();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to assign access', true);
    }
  };

  const revoke = async (mappingId) => {
    try {
      await api.delete(`/access/${mappingId}`);
      flash('Access revoked');
      reload();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to revoke', true);
    }
  };

  const deleteDataset = async (id) => {
    if (!confirm('Delete this dataset and all its access mappings?')) return;
    try {
      await api.delete(`/datasets/${id}`);
      flash('Dataset deleted');
      reload();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to delete', true);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  const regularUsers = users.filter((u) => u.role === 'USER');

  return (
    <div className="container">
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="row">
        <div className="card">
          <h3>Create Dataset</h3>
          <form onSubmit={createDataset} className="form" style={{ margin: 0 }}>
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label>Category<input value={category} onChange={(e) => setCategory(e.target.value)} /></label>
            <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label>
            <label>Content<textarea value={content} onChange={(e) => setContent(e.target.value)} /></label>
            <button className="btn" type="submit">Create</button>
          </form>
        </div>

        <div className="card">
          <h3>Assign Dataset Access</h3>
          <form onSubmit={assignAccess} className="form" style={{ margin: 0 }}>
            <label>User
              <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} required>
                <option value="">— select user —</option>
                {regularUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </label>
            <label>Dataset
              <select value={selectedDataset} onChange={(e) => setSelectedDataset(e.target.value)} required>
                <option value="">— select dataset —</option>
                {datasets.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </label>
            <button className="btn" type="submit">Grant Access</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h3>All Datasets ({datasets.length})</h3>
        {datasets.length === 0 ? <p>No datasets yet.</p> : (
          <table>
            <thead><tr><th>Name</th><th>Category</th><th>Description</th><th>Created By</th><th></th></tr></thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d._id}>
                  <td><Link to={`/datasets/${d._id}`}>{d.name}</Link></td>
                  <td>{d.category}</td>
                  <td>{d.description}</td>
                  <td>{d.createdBy?.name}</td>
                  <td><button className="btn danger" onClick={() => deleteDataset(d._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Access Mappings ({mappings.length})</h3>
        {mappings.length === 0 ? <p>No access has been granted yet.</p> : (
          <table>
            <thead><tr><th>User</th><th>Dataset</th><th>Granted By</th><th>Granted At</th><th></th></tr></thead>
            <tbody>
              {mappings.map((m) => (
                <tr key={m._id}>
                  <td>{m.user?.name} <small>({m.user?.email})</small></td>
                  <td>{m.dataset?.name}</td>
                  <td>{m.grantedBy?.name}</td>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                  <td><button className="btn danger" onClick={() => revoke(m._id)}>Revoke</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
