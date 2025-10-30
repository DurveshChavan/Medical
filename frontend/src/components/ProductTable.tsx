import React from 'react';
import { MoreVertical } from 'lucide-react';

interface ProductTableRow {
  id: string | number;
  header: string;
  sectionType: string;
  target: number;
  limit: number;
  reviewer: string;
}

interface ProductTableProps {
  data: ProductTableRow[];
  onRowClick?: (row: ProductTableRow) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ data, onRowClick }) => {
  const columns = [
    { key: 'header', label: 'Header', width: '35%' },
    { key: 'sectionType', label: 'Section Type', width: '25%' },
    { key: 'target', label: 'Target', width: '15%' },
    { key: 'limit', label: 'Limit', width: '15%' },
    { key: 'reviewer', label: 'Reviewer', width: '10%' }
  ];

  const getSectionBadgeStyle = (type: string) => {
    const styles: Record<string, any> = {
      'Cover page': { 
        background: 'var(--card-hover)', 
        color: 'var(--foreground)',
        border: '1px solid var(--border)'
      },
      'Table of contents': { 
        background: 'var(--card-hover)', 
        color: 'var(--foreground)',
        border: '1px solid var(--border)'
      },
      'Narrative': { 
        background: 'var(--card-hover)', 
        color: 'var(--foreground)',
        border: '1px solid var(--border)'
      },
      'Technical content': { 
        background: 'var(--card-hover)', 
        color: 'var(--foreground)',
        border: '1px solid var(--border)'
      }
    };
    return styles[type] || styles['Cover page'];
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        <thead>
          <tr style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--background)'
          }}>
            <th style={{ 
              width: '40px',
              padding: 'var(1rem) var(1.5rem)',
              textAlign: 'center'
            }}>
              <input 
                type="checkbox" 
                style={{ 
                  width: '16px', 
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: 'var(--primary)'
                }} 
              />
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  width: col.width,
                  padding: 'var(1rem) var(1.5rem)',
                  textAlign: 'left',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: 'var(--muted-foreground)',
                  textTransform: 'none'
                }}
              >
                {col.label}
              </th>
            ))}
            <th style={{ width: '40px', padding: 'var(1rem)' }}></th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              style={{
                borderBottom: index < data.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background-color var(150ms ease-in-out)',
                cursor: onRowClick ? 'pointer' : 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <td style={{ 
                padding: 'var(1rem) var(1.5rem)',
                textAlign: 'center'
              }}>
                <input 
                  type="checkbox" 
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: 'var(--primary)'
                  }} 
                />
              </td>
              <td style={{ 
                padding: 'var(1rem) var(1.5rem)',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--foreground)'
              }}>
                {row.header}
              </td>
              <td style={{ 
                padding: 'var(1rem) var(1.5rem)'
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  ...getSectionBadgeStyle(row.sectionType)
                }}>
                  {row.sectionType}
                </span>
              </td>
              <td style={{ 
                padding: 'var(1rem) var(1.5rem)'
              }}>
                <div style={{
                  width: '48px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  fontFamily: 'Space Mono, monospace',
                  color: 'var(--foreground)'
                }}>
                  {row.target}
                </div>
              </td>
              <td style={{ 
                padding: 'var(1rem) var(1.5rem)'
              }}>
                <div style={{
                  width: '48px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  fontFamily: 'Space Mono, monospace',
                  color: 'var(--foreground)'
                }}>
                  {row.limit}
                </div>
              </td>
              <td style={{ 
                padding: 'var(1rem) var(1.5rem)',
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)'
              }}>
                {row.reviewer}
              </td>
              <td style={{ 
                padding: 'var(1rem)',
                textAlign: 'center'
              }}>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'all var(150ms ease-in-out)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--card-hover)';
                    e.currentTarget.style.color = 'var(--foreground)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--muted-foreground)';
                  }}
                >
                  <MoreVertical size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;

