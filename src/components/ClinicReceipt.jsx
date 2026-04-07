import React from "react";

/**
 * Simplified Clinic Receipt Template for 80mm Thermal Printer
 * Used for all receipts across God Reigns Clinic & Maternity
 */

const ClinicReceipt = ({ data, type = "bill" }) => {
  const {
    clinicInfo,
    patientInfo,
    admissionInfo,
    items,
    totals,
    footer,
    metadata,
  } = data;

  // Get logo from localStorage or clinicInfo
  const logoUrl = clinicInfo?.logo || localStorage.getItem('clinicLogo');

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getReceiptTitle = () => {
    switch (type) {
      case "discharge": return "DISCHARGE BILL";
      case "pharmacy": return "PHARMACY BILL";
      case "lab": return "LAB BILL";
      case "radiograph": return "X-RAY BILL";
      case "patient-dept": return "DEPT BILL";
      default: return "RECEIPT";
    }
  };

  // Check if items have qty or quantity
  const getQty = (item) => item.qty || item.quantity || 1;
  const getItemTotal = (item) => {
    const price = item.unitPrice || item.price || item.cost || 0;
    return price * getQty(item);
  };

  // Check if this is a detailed bill (discharge) or simple bill
  const isDetailedBill = type === "discharge" || (items?.length > 0 && items[0]?.category);

  return (
    <div
      style={{
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        padding: "20px",
        background: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {/* HEADER WITH LOGO */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
            color: "white",
            padding: "24px",
            textAlign: "center",
          }}
        >
          {/* Logo - Uses localStorage or defaults to placeholder */}
          <div style={{ marginBottom: "16px" }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Clinic Logo"
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "contain",
                  borderRadius: "50%",
                  background: "white",
                  padding: "5px",
                  border: "3px solid white",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div 
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: "white",
                display: logoUrl ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                border: "3px solid rgba(255,255,255,0.5)",
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1e3a8a",
              }}
            >
              GR
            </div>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "600",
            }}
          >
            {clinicInfo?.name || localStorage.getItem('clinicName') || "GOD REIGNS CLINIC & MATERNITY"}
          </h1>

          <p style={{ margin: "6px 0 0", fontSize: "14px", opacity: 0.9 }}>
            {clinicInfo?.phones || localStorage.getItem('clinicPhone') || "08130561183, 08054861764"}
          </p>

          <p
            style={{
              marginTop: "12px",
              fontSize: "16px",
              letterSpacing: "2px",
              fontWeight: "500",
              textTransform: "uppercase",
            }}
          >
            {getReceiptTitle()}
          </p>
        </div>

        {/* RECEIPT METADATA */}
        {metadata?.receiptNo && (
          <div
            style={{
              padding: "16px 24px",
              background: "#eff6ff",
              borderBottom: "1px solid #dbeafe",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>Receipt No: </span>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                {metadata.receiptNo}
              </span>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>Date: </span>
              <span style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                {formatDate(metadata.date || new Date())}
              </span>
            </div>
            {metadata.department && (
              <div>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Department: </span>
                <span style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                  {metadata.department}
                </span>
              </div>
            )}
          </div>
        )}

        {/* PATIENT INFO */}
        <div
          style={{
            padding: "24px",
            background: "#f8f9fa",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: "16px",
              color: "#374151",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Patient Information
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>Name: </span>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                {patientInfo?.name || "N/A"}
              </span>
            </div>
            {patientInfo?.id && (
              <div>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Patient ID: </span>
                <span style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                  {patientInfo.id}
                </span>
              </div>
            )}
            {patientInfo?.code && (
              <div>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Code: </span>
                <span style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                  {patientInfo.code}
                </span>
              </div>
            )}
          </div>

          {/* Admission Info (for discharge bills) */}
          {admissionInfo && (
            <div
              style={{
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                gap: "40px",
                flexWrap: "wrap",
                fontSize: "14px",
              }}
            >
              {admissionInfo.admissionDate && (
                <p>
                  <span style={{ color: "#6b7280" }}>Admission Date: </span>
                  <span style={{ fontWeight: "500" }}>
                    {formatDate(admissionInfo.admissionDate)}
                  </span>
                </p>
              )}
              {admissionInfo.dischargeDate && (
                <p>
                  <span style={{ color: "#6b7280" }}>Discharge Date: </span>
                  <span style={{ fontWeight: "500" }}>
                    {formatDate(admissionInfo.dischargeDate)}
                  </span>
                </p>
              )}
              {admissionInfo.roomNumber && (
                <p>
                  <span style={{ color: "#6b7280" }}>Room: </span>
                  <span style={{ fontWeight: "500" }}>{admissionInfo.roomNumber}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* BILL ITEMS */}
        <div style={{ padding: "24px" }}>
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: "16px",
              color: "#374151",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {items?.title || "Bill Details"}
          </h3>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e5e7eb",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Service / Item
                </th>
                {isDetailedBill && (
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #e5e7eb",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Qty
                  </th>
                )}
                <th
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    borderBottom: "2px solid #e5e7eb",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {items?.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    background: index % 2 === 0 ? "#fafbfb" : "white",
                  }}
                >
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: "500" }}>
                        {item.description || item.name || "Item"}
                      </span>
                      {item.category && (
                        <span
                          style={{
                            display: "block",
                            fontSize: "11px",
                            color: "#6b7280",
                            marginTop: "2px",
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                    </div>
                  </td>
                  {isDetailedBill && (
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        borderBottom: "1px solid #e5e7eb",
                        fontSize: "13px",
                        color: "#374151",
                      }}
                    >
                      {item.quantity || 1}
                    </td>
                  )}
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#1f2937",
                    }}
                  >
                    {formatCurrency(item.amount || item.price || item.total || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTAL SECTION */}
        <div
          style={{
            padding: "24px",
            background: "#f8f9fa",
            borderTop: "2px solid #e5e7eb",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Total Amount Due
              </p>
              {totals?.amountInWords && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "13px",
                    color: "#374151",
                    fontStyle: "italic",
                  }}
                >
                  {totals.amountInWords}
                </p>
              )}
            </div>

            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#1e3a8a",
                }}
              >
                {formatCurrency(totals?.total)}
              </p>
              {totals?.subtotal !== totals?.total && (
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
                  Subtotal: {formatCurrency(totals?.subtotal)}
                </p>
              )}
            </div>
          </div>

          {/* Payment Method */}
          {metadata?.paymentMethod && (
            <div style={{ marginTop: "16px", fontSize: "14px" }}>
              <span style={{ color: "#6b7280" }}>Payment Method: </span>
              <span style={{ fontWeight: "500", color: "#1f2937" }}>
                {metadata.paymentMethod}
              </span>
            </div>
          )}

          {/* Issuer Info */}
          {metadata?.issuer && (
            <div style={{ marginTop: "12px", fontSize: "14px" }}>
              <span style={{ color: "#6b7280" }}>Issued By: </span>
              <span style={{ fontWeight: "500", color: "#1f2937" }}>
                {metadata.issuer}
              </span>
              {metadata.timeIssued && (
                <span style={{ color: "#6b7280", marginLeft: "8px" }}>
                  at {new Date(metadata.timeIssued).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* NOTES */}
        {metadata?.notes && (
          <div
            style={{
              padding: "16px 24px",
              background: "#eff6ff",
              borderTop: "1px solid #dbeafe",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "#374151",
                fontWeight: "600",
              }}
            >
              Notes:
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#4b5563" }}>
              {metadata.notes}
            </p>
          </div>
        )}

        {/* FOOTER */}
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            fontSize: "12px",
            color: "#6b7280",
            background: "#f8f9fa",
            borderTop: "2px solid #e5e7eb",
          }}
        >
          <p style={{ margin: 0, fontWeight: "500" }}>
            {footer?.text || "Thank you for choosing our healthcare services."}
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "14px",
              color: "#dc2626",
              fontStyle: "italic",
              fontWeight: "500",
            }}
          >
            {footer?.tagline || localStorage.getItem('clinicTagline') || "We Treat, God Heals"}
          </p>
          <p style={{ margin: "12px 0 0", fontSize: "10px", color: "#9ca3af" }}>
            {footer?.details ||
              "This is an official receipt from God Reigns Clinic & Maternity."}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#9ca3af" }}>
            Generated on {new Date().toLocaleDateString("en-GB")} at{" "}
            {new Date().toLocaleTimeString("en-GB")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClinicReceipt;
