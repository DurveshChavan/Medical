"""
Print Service - Handles invoice HTML/PDF generation
"""
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from services.billing_service import billing_service

logger = logging.getLogger(__name__)

class PrintService:
    """Service for generating printable invoices"""
    
    def __init__(self):
        self.pharmacy_name = "Konkan Pharmacy"
        self.pharmacy_address = "123 Main Street, Konkan, Maharashtra"
        self.pharmacy_phone = "+91 9876543210"
        self.pharmacy_email = "info@konkanpharmacy.com"
        self.gst_number = "27ABCDE1234F1Z5"
    
    def generate_invoice_html(self, invoice_id: int) -> Optional[str]:
        """Generate HTML for invoice printing"""
        try:
            # Get invoice details
            invoice_details = billing_service.get_invoice_details(invoice_id)
            if not invoice_details:
                return None
            
            # Generate HTML
            html = self._create_invoice_html(invoice_details)
            return html
            
        except Exception as e:
            logger.error(f"Error generating invoice HTML: {e}")
            return None
    
    def _create_invoice_html(self, invoice_data: Dict[str, Any]) -> str:
        """Create HTML content for invoice"""
        
        # Format dates
        sale_date = datetime.strptime(str(invoice_data['sale_date']), '%Y-%m-%d').strftime('%d/%m/%Y')
        created_date = datetime.strptime(str(invoice_data['created_at']), '%Y-%m-%d %H:%M:%S').strftime('%d/%m/%Y %H:%M')
        
        # Calculate subtotal
        subtotal = invoice_data['total_amount'] - invoice_data['total_gst']
        
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice #{invoice_data['invoice_id']}</title>
            <style>
                {self._get_invoice_styles()}
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <!-- Header -->
                <div class="invoice-header">
                    <div class="pharmacy-info">
                        <h1>{self.pharmacy_name}</h1>
                        <p>{self.pharmacy_address}</p>
                        <p>Phone: {self.pharmacy_phone} | Email: {self.pharmacy_email}</p>
                        <p>GST No: {self.gst_number}</p>
                    </div>
                    <div class="invoice-title">
                        <h2>INVOICE</h2>
                        <p class="invoice-number">#{invoice_data['invoice_id']}</p>
                    </div>
                </div>
                
                <!-- Invoice Details -->
                <div class="invoice-details">
                    <div class="invoice-info">
                        <p><strong>Invoice Date:</strong> {sale_date}</p>
                        <p><strong>Invoice Time:</strong> {created_date}</p>
                        <p><strong>Payment Method:</strong> {invoice_data['payment_method']}</p>
                        <p><strong>Status:</strong> {invoice_data['payment_status']}</p>
                    </div>
                    <div class="customer-info">
                        <h3>Bill To:</h3>
                        <p><strong>{invoice_data['customer_name'] or 'Walk-in Customer'}</strong></p>
                        {f"<p>{invoice_data['customer_phone']}</p>" if invoice_data['customer_phone'] else ""}
                        {f"<p>{invoice_data['customer_email']}</p>" if invoice_data['customer_email'] else ""}
                    </div>
                </div>
                
                <!-- Items Table -->
                <div class="items-section">
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Sr. No.</th>
                                <th>Medicine Name</th>
                                <th>Generic Name</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
        """
        
        # Add items
        for i, item in enumerate(invoice_data['items'], 1):
            html += f"""
                            <tr>
                                <td>{i}</td>
                                <td>{item['medicine_name']}</td>
                                <td>{item['generic_name']}</td>
                                <td>{item['quantity_sold']}</td>
                                <td>₹{item['unit_price_at_sale']:.2f}</td>
                                <td>₹{item['total_amount']:.2f}</td>
                            </tr>
            """
        
        html += f"""
                        </tbody>
                    </table>
                </div>
                
                <!-- Totals -->
                <div class="totals-section">
                    <div class="totals-table">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>₹{subtotal:.2f}</span>
                        </div>
                        <div class="total-row">
                            <span>GST (18%):</span>
                            <span>₹{invoice_data['total_gst']:.2f}</span>
                        </div>
                        <div class="total-row total-final">
                            <span><strong>Total Amount:</strong></span>
                            <span><strong>₹{invoice_data['total_amount']:.2f}</strong></span>
                        </div>
        """
        
        # Add outstanding credit if applicable
        if invoice_data['outstanding_credit'] > 0:
            html += f"""
                        <div class="total-row credit-info">
                            <span>Outstanding Credit:</span>
                            <span>₹{invoice_data['outstanding_credit']:.2f}</span>
                        </div>
            """
        
        html += f"""
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="invoice-footer">
                    <p>Thank you for your business!</p>
                    <p>For any queries, contact us at {self.pharmacy_phone}</p>
                    <p class="print-date">Printed on: {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _get_invoice_styles(self) -> str:
        """Get CSS styles for invoice"""
        return """
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: white;
            }
            
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: white;
            }
            
            .invoice-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
                margin-bottom: 20px;
            }
            
            .pharmacy-info h1 {
                font-size: 24px;
                color: #2c3e50;
                margin-bottom: 10px;
            }
            
            .pharmacy-info p {
                margin: 2px 0;
                color: #666;
            }
            
            .invoice-title h2 {
                font-size: 28px;
                color: #2c3e50;
                text-align: right;
            }
            
            .invoice-number {
                font-size: 16px;
                color: #666;
                text-align: right;
                margin-top: 5px;
            }
            
            .invoice-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            
            .invoice-info p,
            .customer-info p {
                margin: 5px 0;
            }
            
            .customer-info h3 {
                color: #2c3e50;
                margin-bottom: 10px;
            }
            
            .items-section {
                margin-bottom: 30px;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            
            .items-table th,
            .items-table td {
                padding: 8px;
                text-align: left;
                border: 1px solid #ddd;
            }
            
            .items-table th {
                background-color: #f8f9fa;
                font-weight: bold;
                color: #2c3e50;
            }
            
            .items-table tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            .totals-section {
                margin-bottom: 30px;
            }
            
            .totals-table {
                max-width: 300px;
                margin-left: auto;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                border-bottom: 1px solid #eee;
            }
            
            .total-final {
                border-top: 2px solid #333;
                border-bottom: 2px solid #333;
                font-size: 14px;
                font-weight: bold;
                margin-top: 10px;
                padding-top: 10px;
            }
            
            .credit-info {
                color: #e74c3c;
                font-weight: bold;
            }
            
            .invoice-footer {
                text-align: center;
                border-top: 1px solid #ddd;
                padding-top: 20px;
                color: #666;
            }
            
            .invoice-footer p {
                margin: 5px 0;
            }
            
            .print-date {
                font-size: 10px;
                color: #999;
            }
            
            @media print {
                body {
                    margin: 0;
                    padding: 0;
                }
                
                .invoice-container {
                    max-width: none;
                    margin: 0;
                    padding: 10px;
                }
                
                .invoice-header {
                    page-break-inside: avoid;
                }
                
                .items-table {
                    page-break-inside: avoid;
                }
            }
        """
    
    def generate_invoice_pdf(self, invoice_id: int) -> Optional[bytes]:
        """Generate PDF for invoice (placeholder - would use reportlab or similar)"""
        try:
            # This would use a PDF library like reportlab
            # For now, return None as PDF generation requires additional dependencies
            logger.info(f"PDF generation requested for invoice {invoice_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error generating invoice PDF: {e}")
            return None

# Create service instance
print_service = PrintService()