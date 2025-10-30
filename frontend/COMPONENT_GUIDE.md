# Component Usage Guide

## Quick Reference

### KPICard - Display Key Metrics

```tsx
import KPICard from '@/components/KPICard';

<KPICard 
  metric={{
    label: 'Total Revenue',
    value: '₹12.45L',
    change: 12.5,
    changeType: 'increase',
    icon: 'TrendingUp',
    color: 'var(--success)'
  }} 
/>
```

**Props:**
- `label` - Metric title (e.g., "Total Revenue")
- `value` - Display value (string or number)
- `change` - Percentage change (optional)
- `changeType` - 'increase' | 'decrease' | 'neutral'
- `color` - CSS color value (optional)

---

### SalesChart - Sales & Revenue Visualization

```tsx
import SalesChart from '@/components/SalesChart';

const salesData = [
  { date: '2024-01', sales: 4235, revenue: 98450, transactions: 1234 },
  { date: '2024-02', sales: 4567, revenue: 105230, transactions: 1345 }
];

<SalesChart 
  data={salesData} 
  type="area"  // or "line"
/>
```

**Props:**
- `data` - Array of SalesData objects
- `type` - 'area' | 'line' (default: 'area')

---

### CategoryChart - Category Distribution

```tsx
import CategoryChart from '@/components/CategoryChart';

const categoryData = [
  { name: 'Pain Relief', value: 28, count: 45 },
  { name: 'Antibiotics', value: 22, count: 38 }
];

<CategoryChart data={categoryData} />
```

**Props:**
- `data` - Array with name, value, count, color (optional)

---

### SeasonalTrendsChart - Monthly Seasonal Comparison

```tsx
import SeasonalTrendsChart from '@/components/SeasonalTrendsChart';

const trendsData = [
  { month: 'Jan', Summer: 120, Monsoon: 230, Winter: 450, AllSeason: 320 }
];

<SeasonalTrendsChart data={trendsData} />
```

**Props:**
- `data` - Array with month and seasonal values

---

### InventoryTable - Searchable Inventory Table

```tsx
import InventoryTable from '@/components/InventoryTable';

const inventory = [
  {
    id: 1,
    name: 'Paracetamol',
    category: 'Pain Relief',
    stock: 1234,
    price: 15,
    status: 'In Stock',
    supplier: 'PharmaCorp'
  }
];

<InventoryTable 
  items={inventory}
  onItemClick={(item) => console.log(item)}
/>
```

**Props:**
- `items` - Array of InventoryItem objects
- `onItemClick` - Optional click handler

---

### SeasonCard - Seasonal Analysis Display

```tsx
import SeasonCard from '@/components/SeasonCard';

const analysis = {
  season: 'Summer',
  medicines: [...],
  demand_score: 87.5,
  recommendations: [...]
};

<SeasonCard 
  analysis={analysis}
  onClick={() => handleClick()}
/>
```

**Props:**
- `analysis` - SeasonalAnalysis object
- `onClick` - Optional click handler

---

### ChartCard - Chart Container

```tsx
import ChartCard from '@/components/ChartCard';

<ChartCard 
  title="Sales Trends"
  subtitle="Monthly overview"
  action={<button>Export</button>}
>
  <SalesChart data={data} />
</ChartCard>
```

**Props:**
- `title` - Card title
- `subtitle` - Optional subtitle
- `action` - Optional action button/element
- `children` - Chart or content to display

---

### Sidebar - Navigation

```tsx
import Sidebar from '@/components/Sidebar';

<Sidebar />
```

No props required. Automatically handles routing.

---

### Navbar - Top Navigation

```tsx
import Navbar from '@/components/Navbar';

<Navbar title="Dashboard" />
```

**Props:**
- `title` - Page title to display

---

## Custom Hooks

### useTheme - Theme Management

```tsx
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  );
}
```

**Returns:**
- `theme` - Current theme ('light' | 'dark')
- `toggleTheme` - Function to toggle theme
- `setTheme` - Function to set specific theme

---

## Type Definitions

All types are available in `@/types`:

```tsx
import type { 
  Medicine,
  SalesData,
  InventoryItem,
  SeasonalAnalysis,
  KPIMetric
} from '@/types';
```

---

## Styling Examples

### Using CSS Variables

```tsx
<div style={{ 
  color: 'var(--text-primary)',
  background: 'var(--surface)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-md)'
}}>
  Content
</div>
```

### Using Utility Classes

```tsx
<div className="card">
  <h3 className="card-header">Title</h3>
  <button className="btn btn-primary">Action</button>
  <span className="badge badge-success">Active</span>
</div>
```

### Grid Layouts

```tsx
<div className="grid grid-cols-4">
  <KPICard metric={metric1} />
  <KPICard metric={metric2} />
  <KPICard metric={metric3} />
  <KPICard metric={metric4} />
</div>
```

---

## API Integration Examples

### Fetching Data

```tsx
import { getDashboardStats } from '@/services/api';

const [stats, setStats] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  fetchData();
}, []);
```

### Uploading Data

```tsx
import { uploadSalesData } from '@/services/api';

const handleUpload = async (file: File) => {
  try {
    const response = await uploadSalesData(file);
    console.log('Upload successful:', response);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

---

## Best Practices

1. **Always use TypeScript types** for props and state
2. **Handle loading states** when fetching data
3. **Handle errors** in try-catch blocks
4. **Use CSS variables** for consistent theming
5. **Keep components focused** - single responsibility
6. **Extract reusable logic** into custom hooks
7. **Use path aliases** (`@/components/*`) for cleaner imports

---

Happy Component Building! 🎨

