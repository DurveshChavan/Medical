import React, { useEffect, useState } from 'react';
import ChartCard from '@/components/ChartCard';
import { analysisAPI } from '@/api/analysis';
import TopNSelector from '../components/AdvancedAnalytics/TopNSelector';
import SeasonalToggle from '../components/AdvancedAnalytics/SeasonalToggle';
import SalesTrendChart from '../components/AdvancedAnalytics/SalesTrendChart';
import SARIMAForecastChart from '../components/AdvancedAnalytics/SarimaForecastChart';
import ProphetForecastChart from '../components/AdvancedAnalytics/ProphetForecastChart';

interface MedicineData {
  medicine_id: number;
  medicine_name: string;
  total_quantity: number;
  sales_trends: {
    dates: string[];
    quantities: number[];
    seasons: string[];
  };
  sarima_forecast: {
    success: boolean;
    error?: string;
    historical_dates: string[];
    historical_quantities: number[];
    forecast_dates: string[];
    forecast_values: number[];
    lower_bound: number[];
    upper_bound: number[];
  };
  prophet_forecast: {
    success: boolean;
    error?: string;
    dates: string[];
    actual: (number | null)[];
    forecast: number[];
    lower: (number | null)[];
    upper: (number | null)[];
    yearly_seasonality: number[];
  };
}

const AdvancedAnalyticsPage: React.FC = () => {
  const [medicines, setMedicines] = useState<MedicineData[]>([]);
  const [topN, setTopN] = useState(3);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  // Debug function to log season changes
  const handleSeasonChange = (season: string | null) => {
    console.log('AdvancedAnalyticsPage: Season changed to:', season);
    setSelectedSeason(season);
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdvancedAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`🔄 Fetching advanced analytics for top ${topN} medicines...`);
        
        const data = await analysisAPI.getAdvancedAnalytics(topN);
        
        if (data.success) {
          setMedicines(data.medicines);
          console.log(`✅ Advanced analytics loaded successfully for ${data.medicines.length} medicines`);
        } else {
          setError('Failed to load advanced analytics');
        }
        
        setLoading(false);
        
      } catch (error) {
        console.error('❌ Error fetching advanced analytics:', error);
        setError('Failed to load advanced analytics data');
        setLoading(false);
      }
    };

    fetchAdvancedAnalytics();
  }, [topN]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
      }}>
        <div className="animate-pulse" style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-muted)' 
        }}>
          Loading advanced analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)'
      }}>
        <div style={{ 
          fontSize: '1.25rem', 
          color: 'var(--error)',
          textAlign: 'center'
        }}>
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Advanced Analytics</h1>
        <p className="page-description">
          Time-series forecasting and trend analysis for top medicines (3 chart types)
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-lg)', 
          marginTop: 'var(--spacing-lg)',
          flexWrap: 'wrap'
        }}>
          <TopNSelector 
            value={topN} 
            onChange={setTopN} 
            min={3} 
            max={10} 
          />
          <SeasonalToggle 
            selected={selectedSeason} 
            onChange={handleSeasonChange} 
          />
        </div>
      </div>

      {medicines.length > 0 && (
        <>
          {/* Section 1: Sales Trends */}
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--text-primary)'
            }}>
              1. Sales Trends for High-Volume Medicines
            </h2>
            <div className="grid grid-cols-1" style={{ gap: 'var(--spacing-lg)' }}>
              {medicines.map((medicine, idx) => (
                <ChartCard 
                  key={`trends-${medicine.medicine_id}`}
                  title={`${idx + 1}. ${medicine.medicine_name}`}
                  subtitle={`Total Quantity Sold: ${medicine.total_quantity.toLocaleString()} units`}
                >
                  <SalesTrendChart 
                    data={medicine.sales_trends} 
                    highlightSeason={selectedSeason}
                  />
                </ChartCard>
              ))}
            </div>
          </div>

          {/* Section 2: SARIMA Forecast */}
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--text-primary)'
            }}>
              2. SARIMA Time-Series Forecast (12 weeks ahead)
            </h2>
            <div className="grid grid-cols-1" style={{ gap: 'var(--spacing-lg)' }}>
              {medicines.map((medicine, idx) => (
                <ChartCard 
                  key={`sarima-${medicine.medicine_id}`}
                  title={`${idx + 1}. ${medicine.medicine_name}`}
                  subtitle={medicine.sarima_forecast.success ? 
                    "12-week forecast with 95% confidence interval" : 
                    `Forecast unavailable: ${medicine.sarima_forecast.error}`
                  }
                >
                  <SARIMAForecastChart data={medicine.sarima_forecast} />
                </ChartCard>
              ))}
            </div>
          </div>

          {/* Section 3: Prophet Forecast */}
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--text-primary)'
            }}>
              3. Prophet Time-Series Forecast (3 months ahead)
            </h2>
            <div className="grid grid-cols-1" style={{ gap: 'var(--spacing-lg)' }}>
              {medicines.map((medicine, idx) => (
                <ChartCard 
                  key={`prophet-${medicine.medicine_id}`}
                  title={`${idx + 1}. ${medicine.medicine_name}`}
                  subtitle={medicine.prophet_forecast.success ? 
                    "3-month forecast with seasonal decomposition" : 
                    `Forecast unavailable: ${medicine.prophet_forecast.error}`
                  }
                >
                  <ProphetForecastChart data={medicine.prophet_forecast} />
                </ChartCard>
              ))}
            </div>
          </div>

        </>
      )}

      {medicines.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--spacing-xl)',
          color: 'var(--text-muted)'
        }}>
          No medicine data available for analysis
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalyticsPage;
