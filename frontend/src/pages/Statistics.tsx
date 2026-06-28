import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const severityColors = ['#ff4757', '#ffa502', '#00d4ff', '#2ed573'];
const categoryColors: Record<string, string> = {
  fire: '#ff6b35',
  medical: '#e63946',
  flood: '#457b9d',
  earthquake: '#6d597a',
  infrastructure: '#b56576',
  hazard: '#e56b6f',
  other: '#6c757d',
};

export function Statistics() {
  const [stats, setStats] = useState<{
    incidents_by_severity: Record<string, number>;
    incidents_by_category: Record<string, number>;
    total_incidents: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiService.getDashboard();
      setStats({
        incidents_by_severity: data.incidents_by_severity,
        incidents_by_category: data.incidents_by_category,
        total_incidents: data.total_incidents,
      });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const severityChart = stats ? {
    labels: ['P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low'],
    datasets: [{
      label: 'Incidents',
      data: ['P1', 'P2', 'P3', 'P4'].map((s) => stats.incidents_by_severity[s] || 0),
      backgroundColor: severityColors.map((c) => c + '80'),
      borderColor: severityColors,
      borderWidth: 2,
    }],
  } : null;

  const categoryChart = stats ? {
    labels: Object.keys(stats.incidents_by_category).map(
      (k) => k.charAt(0).toUpperCase() + k.slice(1)
    ),
    datasets: [{
      data: Object.values(stats.incidents_by_category),
      backgroundColor: Object.keys(stats.incidents_by_category).map(
        (k) => (categoryColors[k] || '#6c757d') + '80'
      ),
      borderColor: Object.keys(stats.incidents_by_category).map(
        (k) => categoryColors[k] || '#6c757d'
      ),
      borderWidth: 2,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#a0a0a0', font: { size: 11 } },
      },
    },
    scales: {
      x: { ticks: { color: '#606060' }, grid: { color: '#1a1a1a' } },
      y: { ticks: { color: '#606060' }, grid: { color: '#1a1a1a' } },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Statistics</h1>
          <p className="text-sm text-gray-500 mt-1">Analytics and incident trends</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : !stats || stats.total_incidents === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">No Data Available</p>
          <p className="text-sm text-gray-500 mt-1">Statistics will appear once incidents are reported</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">
              Incidents by Severity
            </h3>
            <div className="h-64">
              {severityChart && <Bar data={severityChart} options={chartOptions} />}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">
              Incidents by Category
            </h3>
            <div className="h-64">
              {categoryChart && <Pie data={categoryChart} options={chartOptions} />}
            </div>
          </div>

          <div className="card lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">
              Severity Distribution
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {['P1', 'P2', 'P3', 'P4'].map((sev, idx) => {
                const count = stats.incidents_by_severity[sev] || 0;
                const total = Object.values(stats.incidents_by_severity).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={sev} className="text-center p-4 rounded-lg bg-dark-700/50">
                    <p className="text-2xl font-bold font-mono" style={{ color: severityColors[idx] }}>
                      {count}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{sev}</p>
                    <div className="w-full bg-dark-600 rounded-full h-1.5 mt-2">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: severityColors[idx] }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
