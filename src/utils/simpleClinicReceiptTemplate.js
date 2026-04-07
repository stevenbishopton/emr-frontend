/**
 * XPrinter T80A Optimized 80mm Thermal Receipt Template
 * Paper: 80mm width, ~72mm printable area
 * Printer: XPrinter T80A (ESC/POS compatible)
 * Optimized for: 203 DPI, thermal printing
 */

export const generateSimpleClinicReceipt = (data) => {
  const {
    clinicInfo,
    receiptInfo,
    patientInfo,
    items,
    totals,
    contactInfo
  } = data;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return 'N0.00';
    return `N${parseFloat(amount).toFixed(2)}`;
  };

  // Build items list dynamically
  const itemsList = [];
  if (items?.drugs) itemsList.push({ name: 'DRUGS', details: items.drugs });
  if (items?.labTests) itemsList.push({ name: 'LAB TESTS', details: items.labTests });
  if (items?.room) itemsList.push({ name: 'ROOM/WARD', details: items.room });
  if (items?.consultation) itemsList.push({ name: 'CONSULTATION', details: items.consultation });
  if (items?.procedure) itemsList.push({ name: 'PROCEDURE', details: items.procedure });
  if (items?.radiology) itemsList.push({ name: 'RADIOLOGY', details: items.radiology });
  if (items?.nursing) itemsList.push({ name: 'NURSING CARE', details: items.nursing });
  if (items?.pharmacy) itemsList.push({ name: 'PHARMACY', details: items.pharmacy });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=80mm, initial-scale=1.0"/>
      <title>Receipt</title>
      <style>
        @page { 
          size: 72mm auto; 
          margin: 0;
          padding: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body { 
          font-family: 'Courier New', 'Monaco', monospace;
          font-size: 9pt;
          line-height: 1.2;
          width: 72mm;
          max-width: 72mm;
          padding: 2mm;
          background: white;
          color: black;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .receipt {
          width: 100%;
        }
        /* Center line helper */
        .center {
          text-align: center;
        }
        .bold {
          font-weight: bold;
        }
        /* Header - Hospital Info */
        .header {
          text-align: center;
          margin-bottom: 2mm;
        }
        .hospital-name {
          font-size: 13pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5pt;
        }
        .hospital-subtitle {
          font-size: 11pt;
          font-weight: bold;
          color: #000;
        }
        .slogan {
          font-size: 8pt;
          font-style: italic;
          margin: 1mm 0;
        }
        .contact {
          font-size: 7.5pt;
          line-height: 1.3;
        }
        /* Divider */
        .divider {
          border-top: 1px dashed #000;
          margin: 2mm 0;
        }
        .divider-thick {
          border-top: 2px solid #000;
          margin: 2mm 0;
        }
        /* Info Section */
        .info-section {
          font-size: 8pt;
          margin-bottom: 2mm;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5mm;
        }
        .info-label {
          font-weight: bold;
        }
        /* Patient */
        .patient-section {
          text-align: center;
          font-size: 10pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 2mm 0;
          padding: 1mm 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
        }
        /* Items */
        .items-section {
          font-size: 8pt;
          margin: 2mm 0;
        }
        .item {
          margin-bottom: 1.5mm;
        }
        .item-name {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 8.5pt;
        }
        .item-details {
          padding-left: 2mm;
          font-size: 8pt;
          word-wrap: break-word;
          line-height: 1.2;
        }
        /* Totals */
        .totals-section {
          margin: 2mm 0;
          padding: 1mm 0;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 11pt;
          font-weight: bold;
        }
        .total-amount {
          font-size: 12pt;
        }
        /* Payment Method */
        .payment-method {
          text-align: center;
          font-size: 8pt;
          margin: 2mm 0;
        }
        /* Footer */
        .footer {
          text-align: center;
          font-size: 8pt;
          margin-top: 2mm;
        }
        .motto {
          font-style: italic;
          font-size: 8.5pt;
          margin-bottom: 1mm;
        }
        .thank-you {
          font-weight: bold;
          font-size: 9pt;
          margin-top: 2mm;
        }
        .cut-line {
          text-align: center;
          font-size: 7pt;
          margin-top: 3mm;
          padding-top: 2mm;
          border-top: 2px dashed #000;
        }
        /* Barcode area if needed */
        .barcode-area {
          text-align: center;
          margin: 2mm 0;
          font-family: monospace;
          font-size: 8pt;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        
        <!-- Hospital Header -->
        <div class="header">
          <div class="hospital-name">${clinicInfo?.name || 'GODREIGNS'}</div>
          <div class="hospital-subtitle">${clinicInfo?.subtitle || 'CLINIC & MATERNITY'}</div>
          <div class="slogan">${contactInfo?.motto || 'we treat God heals'}</div>
          <div class="contact">${contactInfo?.phone || '08130561183, 08054861764'}</div>
          ${contactInfo?.email ? `<div class="contact">${contactInfo.email}</div>` : ''}
        </div>

        <div class="divider"></div>

        <!-- Receipt Info -->
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Rcpt:</span>
            <span>${receiptInfo?.receiptNumber || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span>${formatDate(receiptInfo?.date)} ${formatTime(receiptInfo?.date)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Dept:</span>
            <span>${receiptInfo?.department || 'CASHIER'}</span>
          </div>
          ${receiptInfo?.cashier ? `
          <div class="info-row">
            <span class="info-label">Cashier:</span>
            <span>${receiptInfo.cashier}</span>
          </div>
          ` : ''}
        </div>

        <div class="divider"></div>

        <!-- Patient -->
        <div class="patient-section">
          ${patientInfo?.name || 'WALK-IN PATIENT'}
        </div>

        <div class="divider"></div>

        <!-- Items -->
        <div class="items-section">
          ${itemsList.map(item => `
            <div class="item">
              <div class="item-name">${item.name}</div>
              <div class="item-details">${item.details}</div>
            </div>
          `).join('')}
          ${itemsList.length === 0 ? '<div class="item"><div class="item-name">GENERAL SERVICES</div></div>' : ''}
        </div>

        <!-- Total -->
        <div class="totals-section">
          <div class="total-row">
            <span>TOTAL AMOUNT</span>
            <span class="total-amount">${formatCurrency(totals?.total)}</span>
          </div>
        </div>

        <!-- Payment Method -->
        ${receiptInfo?.paymentMethod ? `
          <div class="payment-method">
            <strong>Paid via:</strong> ${receiptInfo.paymentMethod}
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <div class="motto">${contactInfo?.motto || 'we treat God heals'}</div>
          <div class="thank-you">THANK YOU!</div>
          <div style="font-size: 7pt; margin-top: 2mm;">
            Please keep this receipt
          </div>
        </div>

        <!-- Cut Line -->
        <div class="cut-line">
          *** END ***
        </div>

      </div>
    </body>
    </html>
  `;
};

export const generatePrintableSimpleClinicReceipt = (data) => {
  const receiptHTML = generateSimpleClinicReceipt(data);
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=72mm, initial-scale=1.0">
        <style>
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              width: 72mm;
              font-family: 'Courier New', monospace;
            }
            @page {
              size: 72mm auto;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        ${receiptHTML}
      </body>
    </html>
  `;
};

