import React, { useState, useEffect } from 'react';
import { Search, Package, AlertCircle } from 'lucide-react';
import { MedicineWithStock } from '@/api/billing';
import { billingAPI } from '@/api/billing';

interface MedicineSearchBarProps {
  onMedicineSelect: (medicine: MedicineWithStock) => void;
  onSearchResults: (medicines: MedicineWithStock[]) => void;
}

const MedicineSearchBar: React.FC<MedicineSearchBarProps> = ({
  onMedicineSelect,
  onSearchResults
}) => {
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState<MedicineWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchMedicines(query);
      } else {
        setMedicines([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const searchMedicines = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await billingAPI.searchMedicines(searchQuery);
      if (response.success && response.data) {
        setMedicines(response.data);
        onSearchResults(response.data);
        setShowResults(true);
      } else {
        setError(response.error || 'Search failed');
        setMedicines([]);
      }
    } catch (err) {
      setError('Search failed');
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineClick = (medicine: MedicineWithStock) => {
    onMedicineSelect(medicine);
    setQuery('');
    setShowResults(false);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  return (
    <div className="medicine-search-bar">
      <div className="search-input-container">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="Search medicines by name, generic name, or brand..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {loading && <div className="loading-spinner small"></div>}
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {showResults && medicines.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <Package size={16} />
            <span>Found {medicines.length} medicines</span>
          </div>
          <div className="results-list">
            {medicines.map((medicine) => (
              <div
                key={medicine.medicine_id}
                className="medicine-result-item"
                onClick={() => handleMedicineClick(medicine)}
              >
                <div className="medicine-info">
                  <h4>{medicine.medicine_name}</h4>
                  <p className="generic-name">{medicine.generic_name}</p>
                  <p className="brand">{medicine.brand}</p>
                  <div className="medicine-meta">
                    <span className="category">{medicine.category}</span>
                    <span className="dosage">{medicine.dosage_form} {medicine.strength}</span>
                    {medicine.prescription_required && (
                      <span className="prescription-required">Rx Required</span>
                    )}
                  </div>
                </div>
                <div className="medicine-stock">
                  <div className="stock-info">
                    <span className="stock-quantity">{medicine.total_stock} in stock</span>
                    <span className="price">{formatPrice(medicine.avg_price)}</span>
                  </div>
                  <button className="add-btn">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showResults && medicines.length === 0 && query.length >= 2 && !loading && (
        <div className="no-results">
          <Package size={48} />
          <p>No medicines found</p>
          <p>Try a different search term</p>
        </div>
      )}
    </div>
  );
};

export default MedicineSearchBar;
