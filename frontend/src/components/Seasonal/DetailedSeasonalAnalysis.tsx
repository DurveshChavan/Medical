import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  IndianRupee,
  Hash,
  Target,
  BarChart3,
  ShoppingCart
} from 'lucide-react';
import { analysisAPI } from '@/api/analysis';
import { useSeasonalColors } from '@/hooks/useSeasonalColors';

interface DetailedSeasonalAnalysisProps {
  season: string;
}

interface SeasonalAnalysisData {
  season: string;
  timeline: {
    duration: string;
    order_deadline: string;
    peak_period: string;
    months: number[];
  };
  inventory_requirements: {
    total_medicines: number;
    total_units: number;
    estimated_investment: number;
    daily_avg_sales: number;
  };
  priority_breakdown: {
    critical: { count: number; investment: number; percentage: number };
    high: { count: number; investment: number; percentage: number };
    medium: { count: number; investment: number; percentage: number };
    low: { count: number; investment: number; percentage: number };
  };
  critical_actions: string[];
  top_5_medicines: Array<{
    name: string;
    category: string;
    order_quantity: number;
    estimated_cost: number;
    daily_need: number;
    priority: string;
    current_stock: number;
    reorder_level: number;
  }>;
  ordering_calendar: Array<{
    period: string;
    action: string;
    medicines: number;
    quantity: number;
    budget: number;
  }>;
  current_season: string;
}

const DetailedSeasonalAnalysis: React.FC<DetailedSeasonalAnalysisProps> = ({ season }) => {
  const [data, setData] = useState<SeasonalAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getSeasonColor, getUrgencyColor, isDarkMode } = useSeasonalColors();

  useEffect(() => {
    fetchDetailedAnalysis();
  }, [season]);

  const fetchDetailedAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analysisAPI.getDetailedSeasonalAnalysis(season);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching detailed seasonal analysis:', err);
      setError('Failed to load detailed seasonal analysis');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getPriorityColor = (priority: string) => {
    const urgencyColor = getUrgencyColor(priority);
    return {
      color: urgencyColor,
      background: `${urgencyColor}15`,
      border: `${urgencyColor}30`
    };
  };

  const getSeasonStyles = () => {
    const seasonColor = getSeasonColor(season);
    return {
      headerGradient: `linear-gradient(135deg, ${seasonColor} 0%, ${seasonColor}CC 100%)`,
      cardBackground: isDarkMode ? 'var(--surface)' : '#ffffff',
      textPrimary: isDarkMode ? '#f8fafc' : '#0f172a',
      textSecondary: isDarkMode ? '#94a3b8' : '#475569',
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
      shadowColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'
    };
  };

  const styles = getSeasonStyles();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        color: styles.textSecondary
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: `3px solid ${styles.borderColor}`,
          borderTop: `3px solid ${getSeasonColor(season)}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        color: styles.textSecondary
      }}>
        <AlertTriangle size={48} color="var(--destructive)" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--destructive)' }}>{error || 'No data available'}</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 'var(--spacing-xl)',
      height: '100%',
      minHeight: 0
    }}>
      {/* Header */}
      <div style={{
        background: styles.headerGradient,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        color: 'white',
        boxShadow: `0 4px 20px ${getSeasonColor(season)}20`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: 'var(--spacing-sm)',
              fontFamily: 'DM Sans, sans-serif',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              📋 {data.season} SEASON - ORDERING RECOMMENDATIONS
              {season === 'all' && (
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: '400',
                  marginLeft: 'var(--spacing-sm)',
                  opacity: 0.9
                }}>
                  (Current Season: {data.current_season.toUpperCase()})
                </span>
              )}
            </h2>
            <p style={{ 
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.9rem'
            }}>
              {season === 'all' 
                ? `Comprehensive analysis and ordering guide for current season (${data.current_season.toLowerCase()})`
                : `Comprehensive analysis and ordering guide for ${data.season.toLowerCase()} season`
              }
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>Current Season</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{data.current_season.toUpperCase()}</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginTop: 'var(--spacing-xs)' }}>
              {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Season Timeline */}
      <div style={{
        background: styles.cardBackground,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        border: `1px solid ${styles.borderColor}`,
        boxShadow: `0 2px 8px ${styles.shadowColor}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <Calendar size={20} color={getSeasonColor(season)} style={{ marginRight: 'var(--spacing-sm)' }} />
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: styles.textPrimary 
          }}>🗓️ SEASON TIMELINE</h3>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'var(--spacing-md)' 
        }}>
          <div style={{
            background: `${getSeasonColor(season)}15`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            border: `1px solid ${getSeasonColor(season)}30`
          }}>
            <div style={{ fontSize: '0.8rem', color: getSeasonColor(season), fontWeight: '500' }}>Duration</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: styles.textPrimary, marginTop: 'var(--spacing-xs)' }}>
              {data.timeline.duration}
            </div>
          </div>
          <div style={{
            background: `${getUrgencyColor('high')}15`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            border: `1px solid ${getUrgencyColor('high')}30`
          }}>
            <div style={{ fontSize: '0.8rem', color: getUrgencyColor('high'), fontWeight: '500' }}>Order Deadline</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: styles.textPrimary, marginTop: 'var(--spacing-xs)' }}>
              {data.timeline.order_deadline}
            </div>
          </div>
          <div style={{
            background: `${getUrgencyColor('critical')}15`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            border: `1px solid ${getUrgencyColor('critical')}30`
          }}>
            <div style={{ fontSize: '0.8rem', color: getUrgencyColor('critical'), fontWeight: '500' }}>Peak Period</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: styles.textPrimary, marginTop: 'var(--spacing-xs)' }}>
              {data.timeline.peak_period}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Requirements */}
      <div style={{
        background: styles.cardBackground,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        border: `1px solid ${styles.borderColor}`,
        boxShadow: `0 2px 8px ${styles.shadowColor}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <Package size={20} color={getSeasonColor(season)} style={{ marginRight: 'var(--spacing-sm)' }} />
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: styles.textPrimary 
          }}>📊 INVENTORY REQUIREMENTS</h3>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'var(--spacing-md)' 
        }}>
          <div style={{
            background: `${getSeasonColor(season)}15`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            border: `1px solid ${getSeasonColor(season)}30`
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Hash size={16} color={getSeasonColor(season)} style={{ marginRight: 'var(--spacing-xs)' }} />
              <div>
                <div style={{ fontSize: '0.8rem', color: getSeasonColor(season), fontWeight: '500' }}>Total Medicines</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: styles.textPrimary }}>
                  {data.inventory_requirements.total_medicines}
                </div>
              </div>
            </div>
          </div>
          <div style={{
            background: `${getUrgencyColor('medium')}15`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            border: `1px solid ${getUrgencyColor('medium')}30`
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Package size={16} color={getUrgencyColor('medium')} style={{ marginRight: 'var(--spacing-xs)' }} />
              <div>
                <div style={{ fontSize: '0.8rem', color: getUrgencyColor('medium'), fontWeight: '500' }}>Total Units Needed</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: styles.textPrimary }}>
                  {formatNumber(data.inventory_requirements.total_units)}
                </div>
              </div>
            </div>
          </div>
          <div style={{
            background: `${getUrgencyColor('high')}15`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            border: `1px solid ${getUrgencyColor('high')}30`
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IndianRupee size={16} color={getUrgencyColor('high')} style={{ marginRight: 'var(--spacing-xs)' }} />
              <div>
                <div style={{ fontSize: '0.8rem', color: getUrgencyColor('high'), fontWeight: '500' }}>Estimated Investment</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: styles.textPrimary }}>
                  {formatCurrency(data.inventory_requirements.estimated_investment)}
                </div>
              </div>
            </div>
          </div>
          <div style={{
            background: `${getUrgencyColor('critical')}15`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            border: `1px solid ${getUrgencyColor('critical')}30`
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp size={16} color={getUrgencyColor('critical')} style={{ marginRight: 'var(--spacing-xs)' }} />
              <div>
                <div style={{ fontSize: '0.8rem', color: getUrgencyColor('critical'), fontWeight: '500' }}>Daily Avg Sales</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: styles.textPrimary }}>
                  {data.inventory_requirements.daily_avg_sales} units/medicine
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div style={{
        background: styles.cardBackground,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        border: `1px solid ${styles.borderColor}`,
        boxShadow: `0 2px 8px ${styles.shadowColor}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <Target size={20} color={getSeasonColor(season)} style={{ marginRight: 'var(--spacing-sm)' }} />
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: styles.textPrimary 
          }}>🎯 PRIORITY BREAKDOWN</h3>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'var(--spacing-md)' 
        }}>
          {Object.entries(data.priority_breakdown).map(([priority, info]) => {
            const priorityColors = getPriorityColor(priority);
            return (
              <div key={priority} style={{
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
                border: `2px solid ${priorityColors.border}`,
                background: priorityColors.background
              }}>
                <div style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: '500', 
                  color: priorityColors.color,
                  textTransform: 'uppercase'
                }}>{priority}</div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: styles.textPrimary,
                  marginTop: 'var(--spacing-xs)'
                }}>{info.count} medicines</div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  marginTop: 'var(--spacing-xs)',
                  color: styles.textSecondary
                }}>{formatCurrency(info.investment)} ({info.percentage}%)</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical Actions */}
      <div style={{
        background: styles.cardBackground,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        border: `1px solid ${styles.borderColor}`,
        boxShadow: `0 2px 8px ${styles.shadowColor}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <AlertTriangle size={20} color={getUrgencyColor('critical')} style={{ marginRight: 'var(--spacing-sm)' }} />
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: styles.textPrimary 
          }}>🚨 CRITICAL ACTIONS REQUIRED</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {data.critical_actions.map((action, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-sm)',
              background: `${getUrgencyColor('critical')}15`,
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${getUrgencyColor('critical')}30`
            }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: getUrgencyColor('critical'),
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {index + 1}
                </div>
              </div>
              <div style={{ 
                color: getUrgencyColor('critical'),
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>{action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Must-Order Medicines */}
      <div style={{
        background: styles.cardBackground,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        border: `1px solid ${styles.borderColor}`,
        boxShadow: `0 2px 8px ${styles.shadowColor}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <ShoppingCart size={20} color={getSeasonColor(season)} style={{ marginRight: 'var(--spacing-sm)' }} />
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: styles.textPrimary 
          }}>💊 TOP 5 MUST-ORDER MEDICINES</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {data.top_5_medicines.map((medicine, index) => (
            <div key={index} style={{
              border: `1px solid ${styles.borderColor}`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-md)',
              background: styles.cardBackground,
              transition: 'box-shadow 0.2s ease'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: getUrgencyColor('critical'),
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 style={{ 
                      fontWeight: '600', 
                      color: styles.textPrimary,
                      fontSize: '1rem'
                    }}>{medicine.name}</h4>
                    <p style={{ 
                      fontSize: '0.8rem', 
                      color: styles.textSecondary 
                    }}>{medicine.category}</p>
                  </div>
                </div>
                <div style={{
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  background: getPriorityColor(medicine.priority).background,
                  color: getPriorityColor(medicine.priority).color,
                  border: `1px solid ${getPriorityColor(medicine.priority).border}`
                }}>
                  {medicine.priority.toUpperCase()} - ORDER IMMEDIATELY
                </div>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: 'var(--spacing-md)',
                fontSize: '0.8rem'
              }}>
                <div>
                  <div style={{ color: styles.textSecondary }}>Order Quantity</div>
                  <div style={{ fontWeight: '600', color: styles.textPrimary }}>
                    {formatNumber(medicine.order_quantity)} units
                  </div>
                </div>
                <div>
                  <div style={{ color: styles.textSecondary }}>Estimated Cost</div>
                  <div style={{ fontWeight: '600', color: styles.textPrimary }}>
                    {formatCurrency(medicine.estimated_cost)}
                  </div>
                </div>
                <div>
                  <div style={{ color: styles.textSecondary }}>Daily Need</div>
                  <div style={{ fontWeight: '600', color: styles.textPrimary }}>
                    {medicine.daily_need} units/day
                  </div>
                </div>
                <div>
                  <div style={{ color: styles.textSecondary }}>Current Stock</div>
                  <div style={{ fontWeight: '600', color: styles.textPrimary }}>
                    {medicine.current_stock} units
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ordering Calendar */}
      <div style={{
        background: styles.cardBackground,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        border: `1px solid ${styles.borderColor}`,
        boxShadow: `0 2px 8px ${styles.shadowColor}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <BarChart3 size={20} color={getSeasonColor(season)} style={{ marginRight: 'var(--spacing-sm)' }} />
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: styles.textPrimary 
          }}>📅 ORDERING CALENDAR</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {data.ordering_calendar.map((week, index) => (
            <div key={index} style={{
              border: `1px solid ${styles.borderColor}`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-md)',
              background: styles.cardBackground
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: getSeasonColor(season),
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 style={{ 
                      fontWeight: '600', 
                      color: styles.textPrimary,
                      fontSize: '1rem'
                    }}>{week.period}</h4>
                    <p style={{ 
                      fontSize: '0.8rem', 
                      color: styles.textSecondary 
                    }}>{week.action}</p>
                  </div>
                </div>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: 'var(--spacing-sm)',
                fontSize: '0.8rem'
              }}>
                <div style={{
                  background: `${getSeasonColor(season)}15`,
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--spacing-sm)',
                  border: `1px solid ${getSeasonColor(season)}30`
                }}>
                  <div style={{ color: getSeasonColor(season), fontWeight: '500' }}>Medicines</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: styles.textPrimary }}>
                    {week.medicines}
                  </div>
                </div>
                <div style={{
                  background: `${getUrgencyColor('medium')}15`,
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--spacing-sm)',
                  border: `1px solid ${getUrgencyColor('medium')}30`
                }}>
                  <div style={{ color: getUrgencyColor('medium'), fontWeight: '500' }}>Quantity</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: styles.textPrimary }}>
                    {formatNumber(week.quantity)} units
                  </div>
                </div>
                <div style={{
                  background: `${getUrgencyColor('high')}15`,
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--spacing-sm)',
                  border: `1px solid ${getUrgencyColor('high')}30`
                }}>
                  <div style={{ color: getUrgencyColor('high'), fontWeight: '500' }}>Budget</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: styles.textPrimary }}>
                    {formatCurrency(week.budget)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailedSeasonalAnalysis;
