import { useTheme } from './useTheme';

export const useSeasonalColors = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const getSeasonColor = (season: string) => {
    if (isDarkMode) {
      switch (season) {
        case 'summer':
          return '#FF8C42';
        case 'monsoon':
          return '#66B3FF';
        case 'winter':
          return '#1E40AF';
        default:
          return 'var(--primary)';
      }
    } else {
      switch (season) {
        case 'summer':
          return '#FF6B35';
        case 'monsoon':
          return '#4A90E2';
        case 'winter':
          return '#1E40AF';
        default:
          return 'var(--primary)';
      }
    }
  };

  const getUrgencyColor = (urgency: string) => {
    if (isDarkMode) {
      switch (urgency) {
        case 'critical':
          return '#FF8C42';
        case 'high':
          return '#66B3FF';
        case 'medium':
          return '#1E40AF';
        default:
          return 'var(--muted-foreground)';
      }
    } else {
      switch (urgency) {
        case 'critical':
          return '#FF6B35';
        case 'high':
          return '#4A90E2';
        case 'medium':
          return '#1E40AF';
        default:
          return 'var(--muted-foreground)';
      }
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) {
      return isDarkMode ? '#FF8C42' : '#FF6B35';
    }
    if (rank === 2) {
      return isDarkMode ? '#66B3FF' : '#4A90E2';
    }
    if (rank === 3) {
      return isDarkMode ? '#1E40AF' : '#1E40AF';
    }
    return 'var(--muted-foreground)';
  };

  return {
    getSeasonColor,
    getUrgencyColor,
    getRankColor,
    isDarkMode
  };
};
