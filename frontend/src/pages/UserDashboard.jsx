import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function UserDashboard() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/datasets')
      .then((res) => setDatasets(res.data.datasets))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load datasets'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>My Datasets</h2>
        <p>Datasets explicitly assigned to you by an administrator.</p>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <p>Loading...</p>
        ) : datasets.length === 0 ? (
          <p>No datasets have been assigned to you yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d._id}>
                  <td>{d.name}</td>
                  <td>{d.category}</td>
                  <td>{d.description}</td>
                  <td><Link to={`/datasets/${d._id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
