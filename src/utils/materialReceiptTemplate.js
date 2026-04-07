/**
 * Material Design Receipt Template
 * Consistent styling for all receipts and bills across EMR system
 */

export const generateMaterialReceipt = (data, type = 'bill') => {
  const {
    patientInfo,
    items,
    totals,
    header,
    footer,
    metadata
  } = data;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  const getReceiptTitle = () => {
    switch (type) {
      case 'bill':
        return 'MEDICAL BILL';
      case 'purchase':
        return 'PURCHASE RECEIPT';
      case 'radiograph':
        return 'RADIOGRAPHY REPORT';
      case 'prescription':
        return 'PRESCRIPTION RECEIPT';
      default:
        return 'MEDICAL RECEIPT';
    }
  };

  return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8f9fa;">
        <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header Section -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">${getReceiptTitle()}</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${header?.subtitle || 'Healthcare Management System'}</p>
          </div>

          <!-- Patient Information Section -->
          <div style="padding: 24px; background: #f8f9fa;">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <div style="background: #e3f2fd; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a2 2 0 0 0-2 2H4a2 2 0 0 0-2 2v-2M7 13a2 2 0 0 0 2 2H5a2 2 0 0 0 2z" fill="currentColor"/>
                </svg>
              </div>
              <div style="flex: 1; color: #1f2937;">
                <div>
                  <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${patientInfo?.name || 'Patient Information'}</h3>
                  <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">${patientInfo?.id ? `ID: ${patientInfo.id}` : ''}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">${patientInfo?.code ? `Code: ${patientInfo.code}` : ''}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">${patientInfo?.date ? `Date: ${formatDate(patientInfo.date)}` : ''}</p>
                </div>
              </div>
            </div>

          <!-- Items Table Section -->
          <div style="padding: 24px;">
            <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #1f2937;">${items?.title || 'Item Details'}</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin: 0; background: white;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Description</th>
                  <th style="padding: 12px 8px; text-align: center; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Quantity</th>
                  <th style="padding: 12px 8px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Unit Price</th>
                  <th style="padding: 12px 8px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${items?.list?.map((item, index) => `
                  <tr style="${index % 2 === 0 ? 'background: #fafbfb;' : ''}">
                    <td style="padding: 12px 8px; text-align: left; font-size: 12px; color: #374151; ${index % 2 === 0 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">${item.description || '-'}</td>
                    <td style="padding: 12px 8px; text-align: center; font-size: 12px; color: #374151; ${index % 2 === 0 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">${item.quantity || '-'}</td>
                    <td style="padding: 12px 8px; text-align: right; font-size: 12px; color: #374151; ${index % 2 === 0 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">${formatCurrency(item.unitPrice)}</td>
                    <td style="padding: 12px 8px; text-align: right; font-size: 12px; font-weight: 600; color: #1f2937; ${index % 2 === 0 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">${formatCurrency(item.total || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Totals Section -->
          ${totals ? `
            <div style="padding: 24px; background: #f8f9fa;">
              <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #1f2937;">Payment Summary</h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">Subtotal</p>
                  <p style="margin: 0; font-size: 24px; font-weight: 600; color: #1f2937;">${formatCurrency(totals.subtotal)}</p>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">${totals?.taxLabel || 'Tax'}</p>
                  <p style="margin: 0; font-size: 24px; font-weight: 600; color: #1f2937;">${formatCurrency(totals.tax || 0)}</p>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">Total</p>
                  <p style="margin: 0; font-size: 24px; font-weight: 600; color: #1f2937;">${formatCurrency(totals.total)}</p>
                </div>
              </div>
            </div>
          ` : ''}
          
          <!-- Notes Section -->
          ${metadata?.notes ? `
            <div style="padding: 24px; background: #f8f9fa;">
              <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #1f2937;">Notes</h3>
              <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; font-size: 12px; color: #374151; line-height: 1.5;">${metadata.notes}</p>
              </div>
            </div>
          ` : ''}

          <!-- Footer Section -->
          <div style="background: #f8f9fa; color: white; padding: 24px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">${footer?.text || 'Thank you for choosing our healthcare services.'}</p>
            <p style="margin: 8px 0 0; font-size: 10px; color: #9ca3af;">
              ${footer?.details || 'This is an official document generated by the Hospital EMR System.'} | 
              Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}
            </p>
          </div>
        </div>
      </div>
  `;
};

export const generatePrintableReceipt = (data, type = 'bill') => {
  const getReceiptTitle = () => {
    switch (type) {
      case 'bill':
        return 'MEDICAL BILL';
      case 'purchase':
        return 'PURCHASE RECEIPT';
      case 'radiograph':
        return 'RADIOGRAPHY REPORT';
      case 'prescription':
        return 'PRESCRIPTION RECEIPT';
      default:
        return 'MEDICAL RECEIPT';
    }
  };

  const receiptHTML = generateMaterialReceipt(data, type);
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${getReceiptTitle()}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media print {
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 0; 
              background: #f8f9fa;
            }
            .no-print { 
              display: none !important; 
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
