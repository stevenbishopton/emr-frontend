import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateReceiptPDF = async (receipt) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('PURCHASE RECEIPT', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Receipt #: ${receipt.id.toString().padStart(4, '0')}`, 105, 30, { align: 'center' });
  doc.text(`Date: ${new Date(receipt.dateOfArrival).toLocaleDateString('en-GB')}`, 105, 35, { align: 'center' });

  // Client information
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('CLIENT INFORMATION', 14, 50);
  
  doc.setFontSize(10);
  doc.text(`Client Name: ${receipt.clientName}`, 14, 60);
  doc.text(`Ordered By: ${receipt.orderedBy}`, 14, 67);
  doc.text(`Date of Arrival: ${new Date(receipt.dateOfArrival).toLocaleDateString('en-GB')}`, 14, 74);

  // Items table
  const tableColumn = ['Item', 'Quantity', 'Rate (₦)', 'Amount (₦)'];
  const tableRows = receipt.purchasedItems.map(item => [
    item.name,
    item.quantity,
    `₦${parseFloat(item.rate).toLocaleString()}`,
    `₦${parseFloat(item.amount).toLocaleString()}`
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 85,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [243, 244, 246] }
  });

  // Total
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('TOTAL:', 140, finalY);
  doc.setFontSize(14);
  doc.setTextColor(34, 197, 94);
  doc.text(`₦${parseFloat(receipt.totalAmount).toLocaleString()}`, 180, finalY, { align: 'right' });

  // Notes
  if (receipt.notes) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Notes:', 14, finalY + 15);
    doc.text(receipt.notes, 14, finalY + 22, { maxWidth: 180 });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for your business!', 105, finalY + 40, { align: 'center' });
  doc.text('This is an official purchase receipt', 105, finalY + 45, { align: 'center' });

  // Save the PDF
  doc.save(`purchase-receipt-${receipt.id}.pdf`);
};

export const generateRadiographPDF = async (radiographData, patientInfo) => {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace) => {
    if (yPosition + requiredSpace > 270) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Header
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text('RADIOGRAPH REPORT', 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Hospital Info
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Hospital EMR System', 105, yPosition, { align: 'center' });
  doc.text('Radiology Department', 105, yPosition + 5, { align: 'center' });
  yPosition += 15;

  // Patient Information
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('PATIENT INFORMATION', 14, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Name: ${patientInfo?.name || 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Patient ID: ${radiographData.patientId || 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Visit ID: ${radiographData.visitId || 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Age: ${patientInfo?.age || 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Gender: ${patientInfo?.gender || 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Blood Group: ${patientInfo?.bloodGroup || 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Genotype: ${patientInfo?.genotype || 'N/A'}`, 14, yPosition);
  yPosition += 15;

  // Radiograph Details
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('RADIOGRAPH DETAILS', 14, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Radiograph ID: #${radiographData.id || 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Type: ${radiographData.radiographType || 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Order Date: ${radiographData.orderDate ? new Date(radiographData.orderDate).toLocaleDateString('en-GB') : 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Result Date: ${radiographData.resultDate ? new Date(radiographData.resultDate).toLocaleDateString('en-GB') : 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Carried Out By: ${radiographData.carriedOutBy || 'N/A'}`, 14, yPosition);
  yPosition += 15;

  // Interpretation/Results
  if (radiographData.interpretation) {
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('INTERPRETATION/RESULTS', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    
    // Split long interpretation into multiple lines
    const splitInterpretation = doc.splitTextToSize(radiographData.interpretation, 180);
    splitInterpretation.forEach(line => {
      doc.text(line, 14, yPosition);
      yPosition += 6;
    });
    yPosition += 10;
  }

  // Comments/Notes
  if (radiographData.comments) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('COMMENTS/NOTES', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    
    // Split long comments into multiple lines
    const splitComments = doc.splitTextToSize(radiographData.comments, 180);
    splitComments.forEach(line => {
      doc.text(line, 14, yPosition);
      yPosition += 6;
    });
    yPosition += 10;
  }

  // Footer Information
  checkPageBreak(30);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Report Generated:', 14, yPosition);
  doc.text(new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB'), 50, yPosition);
  yPosition += 7;
  doc.text('Generated by: Hospital EMR System', 14, yPosition);
  yPosition += 10;

  // Disclaimer
  checkPageBreak(20);
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a confidential medical document. Handle with care.', 105, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('Unauthorized reproduction is prohibited.', 105, yPosition, { align: 'center' });

  // Save the PDF
  const fileName = `radiograph-report-${radiographData.id}-${patientInfo?.name || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateMultipleRadiographsPDF = async (radiographs, patientInfo) => {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace) => {
    if (yPosition + requiredSpace > 270) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('RADIOGRAPH SUMMARY REPORT', 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Patient Information
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('PATIENT INFORMATION', 14, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Name: ${patientInfo?.name || 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Patient ID: ${patientInfo?.id || 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Age: ${patientInfo?.age || 'N/A'}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Gender: ${patientInfo?.gender || 'N/A'}`, 14, yPosition);
  yPosition += 15;

  // Radiographs Summary Table
  checkPageBreak(20);
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('RADIOGRAPHS SUMMARY', 14, yPosition);
  yPosition += 10;

  const tableColumn = ['ID', 'Type', 'Order Date', 'Result Date', 'Status'];
  const tableRows = radiographs.map(radiograph => [
    `#${radiograph.id || 'N/A'}`,
    radiograph.radiographType || 'N/A',
    radiograph.orderDate ? new Date(radiograph.orderDate).toLocaleDateString('en-GB') : 'N/A',
    radiograph.resultDate ? new Date(radiograph.resultDate).toLocaleDateString('en-GB') : 'N/A',
    radiograph.interpretation ? 'Completed' : 'Pending'
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: yPosition,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [243, 244, 246] },
    alternateRowStyles: { fillColor: [248, 249, 250] }
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Detailed Interpretations
  radiographs.forEach((radiograph, index) => {
    checkPageBreak(40);
    
    if (index > 0) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`RADIOGRAPH #${radiograph.id} - ${radiograph.radiographType}`, 14, yPosition);
    yPosition += 10;

    if (radiograph.interpretation) {
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text('Interpretation:', 14, yPosition);
      yPosition += 7;
      
      const splitInterpretation = doc.splitTextToSize(radiograph.interpretation, 180);
      splitInterpretation.forEach(line => {
        doc.text(line, 14, yPosition);
        yPosition += 6;
      });
    }

    if (radiograph.comments) {
      yPosition += 5;
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text('Comments:', 14, yPosition);
      yPosition += 7;
      
      const splitComments = doc.splitTextToSize(radiograph.comments, 180);
      splitComments.forEach(line => {
        doc.text(line, 14, yPosition);
        yPosition += 6;
      });
    }
  });

  // Footer
  yPosition += 15;
  checkPageBreak(20);
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Report Generated:', 14, yPosition);
  doc.text(new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB'), 45, yPosition);
  yPosition += 7;
  doc.text('Generated by: Hospital EMR System', 14, yPosition);

  // Save the PDF
  const fileName = `radiograph-summary-${patientInfo?.name || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};