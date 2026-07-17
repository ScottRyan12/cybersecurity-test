import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useNotifications } from '../../context/NotificationContext';

export default function NewEngagement() {
  const [targets, setTargets] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', target_id: '', test_type: 'black_box', scope: '', rules_of_engagement: '', objectives: '', start_date: '', end_date: '', tester_ids: [] });
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/targets?limit=100').then(d => setTargets(d.targets)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/engagements', form);
      addToast('Engagement created', 'success');
      navigate(`/engagements/${data.engagement.id}`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const update = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  return (
    <div>
      <div className="page-header"><h1>New Engagement</h1></div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '700px' }}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><h3>Engagement Details</h3></div>
          <div className="form-group"><label>Engagement Name *</label><input className="form-control" value={form.name} onChange={update('name')} required placeholder="e.g. Q4 External Pentest - Acme Corp" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group"><label>Target *</label><select className="form-control" value={form.target_id} onChange={update('target_id')} required><option value="">Select target</option>{targets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div className="form-group"><label>Test Type</label><select className="form-control" value={form.test_type} onChange={update('test_type')}><option value="black_box">Black Box</option><option value="white_box">White Box</option><option value="gray_box">Gray Box</option><option value="red_team">Red Team</option></select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group"><label>Start Date</label><input type="date" className="form-control" value={form.start_date} onChange={update('start_date')} /></div>
            <div className="form-group"><label>End Date</label><input type="date" className="form-control" value={form.end_date} onChange={update('end_date')} /></div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><h3>Scope & Objectives</h3></div>
          <div className="form-group"><label>Scope</label><textarea className="form-control" value={form.scope} onChange={update('scope')} rows={3} placeholder="Define the testing scope..." /></div>
          <div className="form-group"><label>Rules of Engagement</label><textarea className="form-control" value={form.rules_of_engagement} onChange={update('rules_of_engagement')} rows={3} placeholder="Define rules and boundaries..." /></div>
          <div className="form-group"><label>Objectives</label><textarea className="form-control" value={form.objectives} onChange={update('objectives')} rows={3} placeholder="Define testing objectives..." /></div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>{loading ? 'Creating...' : 'Create Engagement'}</button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/engagements')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
