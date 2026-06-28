import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFound() {
  useDocumentTitle('Not Found');
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="empty-state py-24">
        <pre className="empty-state-icon">{'[ 404 ]'}</pre>
        <p className="empty-state-title">Page not found</p>
        <p className="empty-state-text">The requested path does not exist.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm mt-6">
          Return to Command Center
        </button>
      </div>
    </div>
  );
}
