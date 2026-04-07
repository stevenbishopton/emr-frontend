import React from "react";
import ReactDOMServer from "react-dom/server";
import ClinicReceipt from "../components/ClinicReceipt";

/**
 * Generate a printable receipt HTML string using the unified ClinicReceipt component
 * @param {Object} data - The receipt data
 * @param {string} type - The type of receipt (discharge, pharmacy, lab, patient-dept, etc.)
 * @returns {string} - The complete HTML string ready for printing
 */
export const generateClinicReceipt = (data, type = "bill") => {
  const receiptElement = React.createElement(ClinicReceipt, { data, type });
  const receiptHTML = ReactDOMServer.renderToStaticMarkup(receiptElement);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${getReceiptTitle(type)}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
          }
          @page {
            size: 80mm 210mm;
            margin: 0;
          }
          body {
            width: 80mm;
            max-width: 80mm;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        ${receiptHTML}
      </body>
    </html>
  `;
};

/**
 * Open a print window with the clinic receipt
 * @param {Object} data - The receipt data
 * @param {string} type - The type of receipt
 */
export const printClinicReceipt = (data, type = "bill") => {
  const html = generateClinicReceipt(data, type);
  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

/**
 * Helper function to get receipt title
 */
const getReceiptTitle = (type) => {
  switch (type) {
    case "discharge":
      return "Discharge Bill - God Reigns Clinic";
    case "pharmacy":
      return "Pharmacy Bill - God Reigns Clinic";
    case "lab":
      return "Laboratory Bill - God Reigns Clinic";
    case "radiograph":
      return "Radiography Bill - God Reigns Clinic";
    case "patient-dept":
      return "Patient Department Bill - God Reigns Clinic";
    case "purchase":
      return "Purchase Receipt - God Reigns Clinic";
    default:
      return "Clinic Bill - God Reigns Clinic";
  }
};

/**
 * Format bill data for discharge receipts
 * @param {Object} admission - Admission data
 * @param {Array} bills - Array of bill items
 * @param {Object} patient - Patient info
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Formatted receipt data
 */
export const formatDischargeReceiptData = (admission, bills, patient, metadata = {}) => {
  const items = bills.map((bill) => ({
    description: bill.purpose || bill.description || "Service",
    amount: parseFloat(bill.amount || 0),
    quantity: bill.quantity || 1,
    category: bill.category || "Service",
  }));

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    clinicInfo: {
      name: "GOD REIGNS CLINIC & MATERNITY",
      phones: "08130561183, 08054861764",
      address: metadata.address || "",
    },
    patientInfo: {
      name: patient?.name || admission?.patientNames || "Patient",
      id: patient?.id || admission?.patientId,
      code: patient?.code || admission?.patientCode,
    },
    admissionInfo: admission
      ? {
          admissionDate: admission.admissionDate || admission.createdAt,
          dischargeDate: admission.dischargeDate || new Date(),
          roomNumber: admission.roomNumber || admission.room?.roomNumber,
          bedNumber: admission.bedNumber || admission.bed?.bedNumber,
        }
      : null,
    items: items,
    totals: {
      total: total,
      subtotal: total,
      amountInWords: metadata.amountInWords || numberToWords(total) + " Naira Only",
    },
    metadata: {
      receiptNo: metadata.receiptNo || `GR-${Date.now()}`,
      date: metadata.date || new Date(),
      department: metadata.department || "CASHIER",
      paymentMethod: metadata.paymentMethod || "Cash",
      issuer: metadata.issuer || "Reception",
      timeIssued: metadata.timeIssued || new Date(),
      notes: metadata.notes || "",
    },
    footer: {
      text: "Thank you for choosing God Reigns Clinic & Maternity.",
      tagline: "We Treat, God Heals",
      details: "This is an official receipt. Please keep for your records.",
    },
  };
};

/**
 * Format bill data for simple patient department bills
 * @param {Object} bill - Single bill object
 * @param {Object} patient - Patient info
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Formatted receipt data
 */
export const formatPatientDeptReceiptData = (bill, patient, metadata = {}) => {
  return {
    clinicInfo: {
      name: "GOD REIGNS CLINIC & MATERNITY",
      phones: "08130561183, 08054861764",
    },
    patientInfo: {
      name: patient?.name || bill?.patientNames || "Patient",
      id: patient?.id || bill?.patientId,
    },
    items: [
      {
        description: bill?.purpose || "Service",
        amount: parseFloat(bill?.amount || 0),
        quantity: 1,
        category: bill?.category || "Department Service",
      },
    ],
    totals: {
      total: parseFloat(bill?.amount || 0),
      subtotal: parseFloat(bill?.amount || 0),
      amountInWords: metadata.amountInWords || numberToWords(parseFloat(bill?.amount || 0)) + " Naira Only",
    },
    metadata: {
      receiptNo: metadata.receiptNo || `GR-${bill?.id || Date.now()}`,
      date: bill?.timeIssued || metadata.date || new Date(),
      department: metadata.department || "CASHIER",
      paymentMethod: metadata.paymentMethod || bill?.paymentMethod || "Cash",
      issuer: bill?.issuer || metadata.issuer || "Reception",
      timeIssued: bill?.timeIssued || new Date(),
      notes: bill?.notes || metadata.notes || "",
    },
    footer: {
      text: "Thank you for choosing God Reigns Clinic & Maternity.",
      tagline: "We Treat, God Heals",
      details: "This is an official receipt. Please keep for your records.",
    },
  };
};

/**
 * Format bill data for multiple bills (grouped by patient)
 * @param {Array} bills - Array of bill objects
 * @param {Object} patient - Patient info
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Formatted receipt data
 */
export const formatMultipleBillsReceiptData = (bills, patient, metadata = {}) => {
  const items = bills.map((bill) => ({
    description: bill.purpose || "Service",
    amount: parseFloat(bill.amount || 0),
    quantity: 1,
    category: bill.category || "Department Service",
  }));

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    clinicInfo: {
      name: "GOD REIGNS CLINIC & MATERNITY",
      phones: "08130561183, 08054861764",
    },
    patientInfo: {
      name: patient?.name || bills[0]?.patientNames || "Patient",
      id: patient?.id || bills[0]?.patientId,
    },
    items: items,
    totals: {
      total: total,
      subtotal: total,
      amountInWords: metadata.amountInWords || numberToWords(total) + " Naira Only",
    },
    metadata: {
      receiptNo: metadata.receiptNo || `GR-${Date.now()}`,
      date: metadata.date || new Date(),
      department: metadata.department || "CASHIER",
      paymentMethod: metadata.paymentMethod || "Cash",
      issuer: metadata.issuer || "Reception",
      timeIssued: metadata.timeIssued || new Date(),
      notes: metadata.notes || `${bills.length} services billed`,
    },
    footer: {
      text: "Thank you for choosing God Reigns Clinic & Maternity.",
      tagline: "We Treat, God Heals",
      details: "This is an official receipt. Please keep for your records.",
    },
  };
};

/**
 * Convert number to words
 * @param {number} num - The number to convert
 * @returns {string} - The number in words
 */
function numberToWords(num) {
  if (num === 0) return "Zero";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const thousands = ["", "Thousand", "Million", "Billion"];

  function convertChunk(n) {
    let result = "";

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + " ";
      n = 0;
    }

    if (n > 0) {
      result += ones[n] + " ";
    }

    return result.trim();
  }

  let word = "";
  let chunkCount = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      const chunkWords = convertChunk(chunk);
      word = chunkWords + (thousands[chunkCount] ? " " + thousands[chunkCount] : "") + " " + word;
    }
    num = Math.floor(num / 1000);
    chunkCount++;
  }

  return word.trim();
}

export default {
  generateClinicReceipt,
  printClinicReceipt,
  formatDischargeReceiptData,
  formatPatientDeptReceiptData,
  formatMultipleBillsReceiptData,
};
