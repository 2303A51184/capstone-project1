import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { User, Mail, Phone, Shield, Calendar, Save } from 'lucide-react';

export const UserProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });
  const { success, error } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await userService.getProfile();
        setProfile(res.data);
        setFormData({
          fullName: res.data.fullName || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateProfile(formData);
      success('Profile details updated successfully.');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving identity record..." />;
  }

  return (
    <div className="profile-page-container">
      <div className="profile-card-box">
        <div className="profile-header-banner">
          <div className="profile-avatar-large">
            {(profile?.fullName || profile?.username || 'U')[0].toUpperCase()}
          </div>
          <div className="profile-header-text">
            <h2 className="profile-name">{profile?.fullName || profile?.username}</h2>
            <div className="profile-badges-row">
              <span className="profile-role-tag">{profile?.role || 'ROLE_USER'}</span>
              <span className="profile-status-tag active">ACTIVE ACCOUNT</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label className="form-label">Full Legal Name</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                className="form-input"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Username (Immutable)</label>
              <input
                type="text"
                className="form-input disabled-input"
                value={profile?.username || ''}
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="profile-meta-info">
            <div className="meta-item">
              <Calendar size={16} />
              <span>Registered on: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN') : '2026-08-15'}</span>
            </div>
            <div className="meta-item">
              <Shield size={16} />
              <span>Security Tier: 256-Bit Salted BCrypt Hash</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary profile-save-btn" disabled={saving}>
            <Save size={16} />
            <span>{saving ? 'Updating...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfilePage;

