import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const severityColors = ['#c42b2b', '#a67c00', '#666666', '#2b7a42'];
const categoryPalette = ['#666666', '#444444', '#555555', '#777777', '#5a5a5a', '#6b6b6b', '#808080'];

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#9a9a9a', font: { size: 10, family: 'Inter' }, boxWidth: 10, padding: 12 } },
  },
  scales: {
    x: { ticks: { color: '#666666', font: { size: 10 } }, grid: { color: '#1e1e1e' } },
    y: { ticks: { color: '#666666', font: { size: 10 } }, grid: { color: '#1e1e1e' } },
  },
};

export function Statistics() {
  useDocumentTitle('Analytics');
  const [stats, setStats] = useState<{
    incidents_by_severity: Record<string, number>;
    incidents_by_category: Record<string, number>;
    total_incidents: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const d = await apiService.getDashboard();
      setStats({
        incidents_by_severity: d.incidents_by_severity,
        incidents_by_category: d.incidents_by_category,
        total_incidents: d.total_incidents,
      });
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); const i = setInterval(fetch, 15000); return () => clearInterval(i); }, [fetch]);

  const severityData = stats ? {
    labels: ['P1 Critical', 'P2 High', 'P3 Medium', 'P4 Low'],
    datasets: [{
      label: 'Incidents',
      data: ['P1', 'P2', 'P3', 'P4'].map((s) => stats.incidents_by_severity[s] || 0),
      backgroundColor: severityColors.map((c) => c + '80'),
      borderColor: severityColors,
      borderWidth: 1,
      borderRadius: 0,
    }],
  } : null;

  const categoryData = stats && Object.keys(stats.incidents_by_category).length > 0 ? {
    labels: Object.keys(stats.incidents_by_category).map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{
      data: Object.values(stats.incidents_by_category),
      backgroundColor: categoryPalette.slice(0, Object.keys(stats.incidents_by_category).length).map((c) => c + '80'),
      borderColor: categoryPalette,
      borderWidth: 1,
    }],
  } : null;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Incident distribution and trends</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border">
          <div className="bg-surface-100 p-6 space-y-4">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-64 w-full" />
          </div>
          <div className="bg-surface-100 p-6 space-y-4">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-64 w-full rounded-full" />
          </div>
        </div>
      ) : !stats || stats.total_incidents === 0 ? (
        <div className="empty-state py-16">
          <pre className="empty-state-icon">{'{ "data": [] }'}</pre>
          <p className="empty-state-title">No data available</p>
          <p className="empty-state-text">Charts populate once incidents are reported.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border">
          <div className="bg-surface-100 p-6">
            <p className="section-title mb-5">By Severity</p>
            <div className="h-64">
              {severityData && <Bar data={severityData} options={chartOpts} />}
            </div>
          </div>
          <div className="bg-surface-100 p-6">
            <p className="section-title mb-5">By Category</p>
            <div className="h-64">
              {categoryData ? <Pie data={categoryData} options={chartOpts} /> : (
                <div className="empty-state h-full">
                  <pre className="empty-state-icon">{'{ }'}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
