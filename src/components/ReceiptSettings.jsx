import React, { useState, useEffect } from 'react';
import { Settings, Upload, X } from "lucide-react";

/**
 * Receipt Settings Component
 * Allows users to upload/configure clinic logo for receipts
 */
const ReceiptSettings = ({ onClose, onSave }) => {
  const [logo, setLogo] = useState(null);
  const [clinicName, setClinicName] = useState("God Reigns Clinic & Maternity");
  const [clinicPhone, setClinicPhone] = useState("08130561183, 08054861764");
  const [tagline, setTagline] = useState("We Treat, God Heals");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedLogo = localStorage.getItem('clinicLogo');
    const savedName = localStorage.getItem('clinicName');
    const savedPhone = localStorage.getItem('clinicPhone');
    const savedTagline = localStorage.getItem('clinicTagline');
    
    if (savedLogo) setLogo(savedLogo);
    if (savedName) setClinicName(savedName);
    if (savedPhone) setClinicPhone(savedPhone);
    if (savedTagline) setTagline(savedTagline);
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setLogo(base64);
        localStorage.setItem('clinicLogo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem('clinicName', clinicName);
    localStorage.setItem('clinicPhone', clinicPhone);
    localStorage.setItem('clinicTagline', tagline);
    if (onSave) onSave({ logo, clinicName, clinicPhone, tagline });
    setShowSettings(false);
  };

  const SettingsModal = () => (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={() => setShowSettings(false)}
    >
      <div 
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          maxWidth: '400px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Receipt Settings</h2>
          <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Logo Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Clinic Logo
          </label>
          
          {logo ? (
            <div style={{ marginBottom: '12px' }}>
              <img 
                src={logo} 
                alt="Clinic Logo Preview" 
                style={{ 
                  width: '100px', 
                  height: '100px', 
                  objectFit: 'contain',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#f9fafb'
                }} 
              />
            </div>
          ) : (
            <div style={{ 
              width: '100px', 
              height: '100px', 
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              background: '#f9fafb',
              color: '#6b7280',
              fontSize: '12px'
            }}>
              No logo
            </div>
          )}
          
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            style={{ display: 'none' }}
            id="logo-upload"
          />
          <label 
            htmlFor="logo-upload"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#2563eb',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <Upload size={16} />
            {logo ? 'Change Logo' : 'Upload Logo'}
          </label>
          {logo && (
            <button
              onClick={() => {
                setLogo(null);
                localStorage.removeItem('clinicLogo');
              }}
              style={{
                marginLeft: '8px',
                padding: '8px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Remove
            </button>
          )}
        </div>

        {/* Clinic Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
            Clinic Name
          </label>
          <input
            type="text"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Clinic Phone */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
            Phone Numbers
          </label>
          <input
            type="text"
            value={clinicPhone}
            onChange={(e) => setClinicPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Tagline */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
            Tagline
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          style={{
            width: '100%',
            padding: '12px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setShowSettings(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          background: '#f3f4f6',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        <Settings size={16} />
        Receipt Settings
      </button>
      
      {showSettings && <SettingsModal />}
    </>
  );
};

// Helper function to get receipt settings
export const getReceiptSettings = () => {
  return {
    logo: localStorage.getItem('clinicLogo'),
    clinicName: localStorage.getItem('clinicName') || "God Reigns Clinic & Maternity",
    clinicPhone: localStorage.getItem('clinicPhone') || "08130561183, 08054861764",
    tagline: localStorage.getItem('clinicTagline') || "We Treat, God Heals",
  };
};

export default ReceiptSettings;
