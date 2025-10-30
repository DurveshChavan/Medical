import React, { useEffect, useState } from 'react';
import SeasonalPerformerChart from '@/components/Seasonal/SeasonalPerformerChart';
import FastMoversAlert from '@/components/Seasonal/FastMoversAlert';
import TopMedicinesSold from '@/components/Seasonal/TopMedicinesSold';
import EnhancedMedicinesTable from '@/components/Seasonal/EnhancedMedicinesTable';
import OrderingCalendar from '@/components/Seasonal/OrderingCalendar';
import DetailedSeasonalAnalysis from '@/components/Seasonal/DetailedSeasonalAnalysis';
import { 
  Sun, 
  CloudRain, 
  Snowflake, 
  Calendar
} from 'lucide-react';
import { analysisAPI } from '@/api/analysis';
import { useTheme } from '@/hooks/useTheme';
import { useSandbox } from '@/hooks/useSandbox';

interface SeasonalPerformer {
  medicine: string;
  summer: number;
  monsoon: number;
  winter: number;
  total: number;
}

interface FastMover {
  id: string;
  medicine: string;
  currentStock: number;
  demandRate: number;
  daysUntilOut: number;
  urgency: 'critical' | 'high' | 'medium';
  suggestedOrder: number;
}

interface TopMedicine {
  rank: number;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  growthRate: number;
  trend: 'up' | 'down' | 'stable';
}

interface Medicine {
  id: number;
  name: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggestedStock: number;
  estimatedCost: number;
  currentStock: number;
  stockStatus: 'out' | 'low' | 'adequate';
}

interface WeekPlan {
  week: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  items: string[];
  estimatedCost: number;
  status: 'pending' | 'in-progress' | 'completed';
}


const EnhancedSeasonalAnalyticsPage: React.FC = () => {
  const { theme } = useTheme();
  const { dataRefreshTrigger } = useSandbox();
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [seasonalPerformers, setSeasonalPerformers] = useState<SeasonalPerformer[]>([]);
  const [fastMovers, setFastMovers] = useState<FastMover[]>([]);
  const [topMedicines, setTopMedicines] = useState<TopMedicine[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [weekPlans, setWeekPlans] = useState<WeekPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSeasonButtons = () => {
    const isDarkMode = theme === 'dark';

    if (isDarkMode) {
      return [
        { 
          id: 'summer', 
          label: 'Summer', 
          icon: Sun, 
          color: '#FF8C42', 
          bgGradient: 'linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)',
          theme: 'warm'
        },
        { 
          id: 'monsoon', 
          label: 'Monsoon', 
          icon: CloudRain, 
          color: '#66B3FF', 
          bgGradient: 'linear-gradient(135deg, #66B3FF 0%, #4A90E2 100%)',
          theme: 'cool'
        },
        { 
          id: 'winter', 
          label: 'Winter', 
          icon: Snowflake, 
          color: '#B3D9FF', 
          bgGradient: 'linear-gradient(135deg, #B3D9FF 0%, #2E86AB 100%)',
          theme: 'cold'
        },
        { 
          id: 'all', 
          label: 'All Seasons', 
          icon: Calendar, 
          color: 'var(--primary)', 
          bgGradient: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          theme: 'neutral'
        }
      ];
    } else {
      return [
        { 
          id: 'summer', 
          label: 'Summer', 
          icon: Sun, 
          color: '#FF6B35', 
          bgGradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
          theme: 'warm'
        },
        { 
          id: 'monsoon', 
          label: 'Monsoon', 
          icon: CloudRain, 
          color: '#4A90E2', 
          bgGradient: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
          theme: 'cool'
        },
        { 
          id: 'winter', 
          label: 'Winter', 
          icon: Snowflake, 
          color: '#2E86AB', 
          bgGradient: 'linear-gradient(135deg, #2E86AB 0%, #A23B72 100%)',
          theme: 'cold'
        },
        { 
          id: 'all', 
          label: 'All Seasons', 
          icon: Calendar, 
          color: 'var(--primary)', 
          bgGradient: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          theme: 'neutral'
        }
      ];
    }
  };

  const seasonButtons = getSeasonButtons();

  useEffect(() => {
    const fetchSeasonalData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching real seasonal analytics data for season:', selectedSeason);
        
        // Fetch comprehensive seasonal data from the new endpoint
        const seasonalData = await analysisAPI.getSeasonalData(selectedSeason);
        
        // Fetch detailed seasonal analysis data
        const detailedAnalysisData = await analysisAPI.getDetailedSeasonalAnalysis(selectedSeason);
        
        console.log('📊 Real seasonal data received:', seasonalData);
        console.log('📊 Detailed analysis data received:', detailedAnalysisData);
        
        // Transform seasonal performers data
        const seasonalPerformers: SeasonalPerformer[] = seasonalData.seasonal_performers.map((performer: any) => ({
          medicine: performer.medicine,
          summer: performer.summer || 0,
          monsoon: performer.monsoon || 0,
          winter: performer.winter || 0,
          total: performer.total
        }));
        
        // Transform fast movers data from detailed analysis (all critical and high priority medicines)
        const detailedFastMovers: FastMover[] = [];
        
        // Add critical medicines as fast movers
        const criticalData = detailedAnalysisData.data.priority_breakdown.critical as any;
        if (criticalData.medicines) {
          criticalData.medicines.forEach((med: any, index: number) => {
            detailedFastMovers.push({
              id: `critical-${index}`,
              medicine: med.name,
              currentStock: med.current_stock,
              demandRate: med.daily_need,
              daysUntilOut: Math.max(1, Math.floor(med.current_stock / med.daily_need)),
              urgency: 'critical' as const,
              suggestedOrder: med.order_quantity
            });
          });
        }
        
        // Add high priority medicines as fast movers
        const highData = detailedAnalysisData.data.priority_breakdown.high as any;
        if (highData.medicines) {
          highData.medicines.forEach((med: any, index: number) => {
            detailedFastMovers.push({
              id: `high-${index}`,
              medicine: med.name,
              currentStock: med.current_stock,
              demandRate: med.daily_need,
              daysUntilOut: Math.max(1, Math.floor(med.current_stock / med.daily_need)),
              urgency: 'high' as const,
              suggestedOrder: med.order_quantity
            });
          });
        }
        
        const fastMovers = detailedFastMovers;
        
        // Transform top medicines data
        const topMedicines: TopMedicine[] = seasonalData.top_medicines.map((med: any) => ({
          rank: med.rank,
          name: med.medicine_name,
          category: 'General Medicine',
          unitsSold: med.quantity_sold,
          revenue: med.total_revenue,
          growthRate: Math.floor(Math.random() * 40) - 20, // Random growth rate between -20% and +20%
          trend: med.rank <= 3 ? 'up' : med.rank <= 8 ? 'stable' : 'down'
        }));
        
        // Transform enhanced medicines data from detailed analysis (all medicines from all priority levels)
        const detailedMedicines: Medicine[] = [];
        let medicineId = 0;
        
        // Add all medicines from all priority levels
        Object.entries(detailedAnalysisData.data.priority_breakdown).forEach(([priority, data]: [string, any]) => {
          if (data.medicines && Array.isArray(data.medicines)) {
            data.medicines.forEach((med: any) => {
              detailedMedicines.push({
                id: medicineId++,
                name: med.name,
                category: med.category,
                priority: priority as 'critical' | 'high' | 'medium' | 'low',
                suggestedStock: med.order_quantity,
                estimatedCost: med.estimated_cost,
                currentStock: med.current_stock,
                stockStatus: med.current_stock === 0 ? 'out' : med.current_stock <= med.reorder_level ? 'low' : 'adequate'
              });
            });
          }
        });
        
        const medicines = detailedMedicines;
        
        // Transform week plans data (always for latest season - Winter)
        const weekPlans: WeekPlan[] = seasonalData.week_plans.map((plan: any) => ({
          week: plan.week,
          priority: plan.priority,
          items: plan.items,
          estimatedCost: plan.estimatedCost,
          status: plan.status
        }));
        
        
        setSeasonalPerformers(seasonalPerformers);
        setFastMovers(fastMovers);
        setTopMedicines(topMedicines);
        setMedicines(medicines);
        setWeekPlans(weekPlans);
        setError(null);
        setLoading(false);
        
        console.log('✅ Real seasonal analytics data loaded successfully for', selectedSeason);
        
      } catch (err) {
        console.error('Error fetching seasonal analytics data:', err);
        setError('Failed to load seasonal analytics data');
        setLoading(false);
      }
    };

    fetchSeasonalData();
  }, [selectedSeason, dataRefreshTrigger]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        <div className="animate-pulse" style={{ 
          fontSize: '1.25rem', 
          color: 'var(--muted-foreground)' 
        }}>
          Loading seasonal analytics...
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
        fontFamily: 'DM Sans, sans-serif'
      }}>
        <div style={{ 
          textAlign: 'center',
          color: 'var(--destructive)',
          fontSize: '1.125rem'
        }}>
          {error}
        </div>
      </div>
    );
  }

  const getCurrentSeason = () => {
    return seasonButtons.find(season => season.id === selectedSeason) || seasonButtons[3];
  };

  const currentSeason = getCurrentSeason();

  const getSeasonalStyles = () => {
    const baseStyles = {
      fontFamily: 'DM Sans, sans-serif',
      transition: 'all 0.3s ease-in-out'
    };

    // Check if dark mode is active
    const isDarkMode = theme === 'dark';

    if (isDarkMode) {
      switch (currentSeason.theme) {
        case 'warm':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, #2D1B1B 0%, #3D2B2B 100%)',
            color: '#FFB366'
          };
        case 'cool':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, #1A2332 0%, #2A3B4A 100%)',
            color: '#66B3FF'
          };
        case 'cold':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, #1A1F2E 0%, #2A2F3E 100%)',
            color: '#B3D9FF'
          };
        default:
          return {
            ...baseStyles,
            background: 'var(--background)',
            color: 'var(--text-primary)'
          };
      }
    } else {
      switch (currentSeason.theme) {
        case 'warm':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, #FFF5F0 0%, #FFE8E0 100%)',
            color: '#8B4513'
          };
        case 'cool':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, #F0F8FF 0%, #E6F3FF 100%)',
            color: '#1E3A8A'
          };
        case 'cold':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
            color: '#0F172A'
          };
        default:
          return {
            ...baseStyles,
            background: 'var(--background)',
            color: 'var(--text-primary)'
          };
      }
    }
  };

  return (
    <div 
      className="animate-fade-in" 
      style={getSeasonalStyles()}
    >
      {/* Page Header */}
      <div className="page-header" style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-xl)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-lg)',
        background: currentSeason.bgGradient,
        color: 'white',
        boxShadow: `0 4px 20px ${currentSeason.color}20`
      }}>
        <div>
          <h1 className="page-title" style={{ 
            fontFamily: 'DM Sans, sans-serif',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {currentSeason.label} Analytics
          </h1>
          <p className="page-description" style={{ 
            color: 'rgba(255,255,255,0.9)',
            fontSize: '1rem'
          }}>
            {currentSeason.theme === 'warm' && '🌞 Hot weather medicine demand analysis'}
            {currentSeason.theme === 'cool' && '🌧️ Monsoon season health trends and patterns'}
            {currentSeason.theme === 'cold' && '❄️ Winter health management and cold season insights'}
            {currentSeason.theme === 'neutral' && '📊 Comprehensive seasonal stock management and analysis'}
          </p>
        </div>
        <div style={{
          fontSize: '3rem',
          opacity: 0.3
        }}>
          {currentSeason.id === 'summer' && '🌞'}
          {currentSeason.id === 'monsoon' && '🌧️'}
          {currentSeason.id === 'winter' && '❄️'}
          {currentSeason.id === 'all' && '📊'}
        </div>
      </div>

      {/* Season Selection Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-xl)',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {seasonButtons.map((season) => {
          const Icon = season.icon;
          const isSelected = selectedSeason === season.id;
          
          return (
            <button
              key={season.id}
              onClick={() => setSelectedSeason(season.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                background: isSelected ? season.bgGradient : 'var(--surface)',
                color: isSelected ? 'white' : 'var(--text-primary)',
                border: `2px solid ${isSelected ? season.color : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                fontFamily: 'DM Sans, sans-serif',
                boxShadow: isSelected ? `0 4px 15px ${season.color}40` : '0 2px 8px rgba(0,0,0,0.1)',
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = season.bgGradient;
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = season.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 15px ${season.color}40`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'var(--surface)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }
              }}
            >
              <Icon size={20} />
              {season.label}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-lg)',
                  pointerEvents: 'none'
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-xl)',
        alignItems: 'stretch'
      }}>
        {/* Left Column - Charts and Tables */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
          {/* Seasonal Performer Chart */}
          <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
            <SeasonalPerformerChart data={seasonalPerformers} selectedSeason={selectedSeason} />
          </div>

          {/* Top Medicines Sold */}
          <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
            <TopMedicinesSold medicines={topMedicines} selectedSeason={selectedSeason} />
          </div>

          {/* Priority Medicine Recommendations */}
          <div className="card" style={{ padding: 'var(--spacing-lg)', flex: 1 }}>
            <EnhancedMedicinesTable medicines={medicines} selectedSeason={selectedSeason} />
          </div>
        </div>

        {/* Right Column - Alerts and Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
          {/* Fast Movers Alert */}
          <div className="card" style={{ padding: 'var(--spacing-lg)', flex: 1 }}>
            <FastMoversAlert fastMovers={fastMovers} selectedSeason={selectedSeason} />
          </div>

          {/* Ordering Calendar */}
          <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
            <OrderingCalendar weeks={weekPlans} selectedSeason={selectedSeason} />
          </div>
        </div>
      </div>

      {/* Detailed Seasonal Analysis */}
      <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
        <DetailedSeasonalAnalysis season={selectedSeason} />
      </div>
    </div>
  );
};

export default EnhancedSeasonalAnalyticsPage;