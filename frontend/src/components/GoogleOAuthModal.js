import React, { useState } from 'react';

export default function GoogleOAuthModal({ isOpen, onClose, currentClientId, onSaveClientId }) {
  const [clientIdInput, setClientIdInput] = useState(currentClientId || '');
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!clientIdInput.trim()) {
      alert('Please enter a valid Google OAuth Client ID.');
      return;
    }
    onSaveClientId(clientIdInput.trim());
    onClose();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  return (
    <div className="google-oauth-modal-overlay" onClick={onClose}>
      <div className="google-oauth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>⚙️ Real Google OAuth 2.0 Configuration &amp; Diagnostic</h3>
            <span className="modal-subtitle">Official Google Identity Services Setup for SENTINEL-AI</span>
          </div>
          <button className="btn-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body-content">
          {/* Diagnostic Error 401 Explanation */}
          <div className="oauth-diagnostic-alert">
            <div className="diag-icon">⚠️</div>
            <div className="diag-text">
              <strong>Understanding "Error 401: invalid_client"</strong>
              <p>
                Google returns <code>Error 401: invalid_client (The OAuth client was not found)</code> when:
              </p>
              <ul>
                <li>The Google Client ID is blank, has whitespace/typos, or has not been registered in Google Cloud Console yet.</li>
                <li>The OAuth Client ID in Google Cloud is NOT set to <strong>Web application</strong>.</li>
                <li>The <strong>Authorized JavaScript origins</strong> does not include <code>http://localhost:3000</code>.</li>
              </ul>
            </div>
          </div>

          {/* 3-Step Setup Instructions */}
          <div className="oauth-setup-steps">
            <h4>Quick 3-Step Official Google Cloud Setup:</h4>
            <ol>
              <li>
                Open the official <strong><a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Credentials Console ↗</a></strong>
              </li>
              <li>
                Click <strong>+ CREATE CREDENTIALS → OAuth client ID</strong>:
                <div className="sub-settings-box">
                  <div><strong>Application type:</strong> Web application</div>
                  <div><strong>Name:</strong> SENTINEL-AI Web App</div>
                  <div className="origin-copy-row">
                    <span><strong>Authorized JavaScript origins:</strong> <code>http://localhost:3000</code></span>
                    <button type="button" className="btn-copy-chip" onClick={() => copyToClipboard('http://localhost:3000')}>
                      {copiedOrigin ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div><strong>Authorized redirect URIs:</strong> <code>http://localhost:3000</code></div>
                </div>
              </li>
              <li>
                Copy the generated <strong>Client ID</strong> (looks like <code>...apps.googleusercontent.com</code>) and paste it below:
              </li>
            </ol>
          </div>

          {/* Client ID Input Field */}
          <div className="client-id-input-wrap">
            <label>YOUR GOOGLE OAUTH CLIENT ID (VITE_GOOGLE_CLIENT_ID / REACT_APP_GOOGLE_CLIENT_ID):</label>
            <input
              type="text"
              className="google-client-input"
              placeholder="e.g. 1234567890-abcdefg1234567.apps.googleusercontent.com"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
            />
          </div>

          <div className="modal-actions-footer">
            <button type="button" className="btn-save-oauth" onClick={handleSave}>
              Save &amp; Activate Google Sign-In 🚀
            </button>
            <button type="button" className="btn-cancel-oauth" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
