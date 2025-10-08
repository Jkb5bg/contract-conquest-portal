'use client';
import { useState, useEffect, Key, ReactElement, ReactNode, ReactPortal} from 'react';
import {apiClient} from '@/lib/api';
import {ClientProfile, ProfileCompleteness} from '@/types/profile';
import {useAuth} from '@/contexts/AuthContext';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    PlusIcon,
    XMarkIcon,
    BuildingOfficeIcon,
    IdentificationIcon,
    BriefcaseIcon,
    MapPinIcon,
    ShieldCheckIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
    const {user} = useAuth();
    const [profile, setProfile] = useState<ClientProfile | null>(null);
    const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('basic');
    const [successMessage, setSuccessMessage] = useState('');

    // Form states
    const [capabilities, setCapabilities] = useState<string[]>([]);
    const [newCapability, setNewCapability] = useState('');
    const [agencies, setAgencies] = useState<string[]>([]);
    const [newAgency, setNewAgency] = useState('');
    const [naicsPrimary, setNaicsPrimary] = useState<string[]>([]);
    const [naicsSecondary, setNaicsSecondary] = useState<string[]>([]);
    const [newNaics, setNewNaics] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/profile/me');
            const profileData = response.data;
            setProfile(profileData);

            // Initialize form states
            setCapabilities(profileData.capabilities || []);
            setAgencies(profileData.past_performance_agencies || []);
            setNaicsPrimary(profileData.primary_naics || []);
            setNaicsSecondary(profileData.secondary_naics || []);

            // Calculate completeness
            calculateCompleteness(profileData);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateCompleteness = (profileData: ClientProfile) => {
        const sections = {
            basic: !!(profileData.company_name && profileData.email),
            identifiers: !!(profileData.cage_code || profileData.uei),
            capabilities: profileData.capabilities.length >= 3,
            experience: profileData.past_performance_agencies.length > 0,
            preferences: profileData.geographic_preferences.length > 0,
            certifications: profileData.set_aside_eligibilities.length > 0
        };

        const missingFields = [];
        const recommendations = [];

        if (!sections.identifiers) {
            missingFields.push('CAGE Code or UEI');
            recommendations.push('Adding your CAGE or UEI helps verify your business');
        }
        if (!sections.capabilities) {
            missingFields.push('Business Capabilities');
            recommendations.push('List at least 3 core capabilities to improve matching');
        }
        if (!sections.experience) {
            missingFields.push('Past Performance');
            recommendations.push('Add agencies you\'ve worked with for better matches');
        }
        if (!sections.certifications) {
            recommendations.push('Add certifications to access set-aside opportunities');
        }

        const completedSections = Object.values(sections).filter(Boolean).length;
        const overall = Math.round((completedSections / Object.keys(sections).length) * 100);

        setCompleteness({
            overall,
            sections,
            missingFields,
            recommendations
        });
    };

    const handleSave = async (section: string) => {
        try {
            setSaving(true);

            const updates: Partial<ClientProfile> = {
                ...profile,
                capabilities,
                past_performance_agencies: agencies,
                primary_naics: naicsPrimary,
                secondary_naics: naicsSecondary
            };

            await apiClient.put('/profile/update', updates);

            setSuccessMessage('Profile updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);

            calculateCompleteness(updates as ClientProfile);
        } catch (error) {
            console.error('Failed to save profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const addCapability = () => {
        if (newCapability && !capabilities.includes(newCapability)) {
            setCapabilities([...capabilities, newCapability]);
            setNewCapability('');
        }
    };

    const removeCapability = (cap: string) => {
        setCapabilities(capabilities.filter(c => c !== cap));
    };

    const addAgency = () => {
        if (newAgency && !agencies.includes(newAgency)) {
            setAgencies([...agencies, newAgency]);
            setNewAgency('');
        }
    };

    const removeAgency = (agency: string) => {
        setAgencies(agencies.filter(a => a !== agency));
    };

    const addNaics = (isPrimary: boolean) => {
        if (newNaics && newNaics.match(/^\d{6}$/)) {
            if (isPrimary && !naicsPrimary.includes(newNaics)) {
                setNaicsPrimary([...naicsPrimary, newNaics]);
            } else if (!isPrimary && !naicsSecondary.includes(newNaics)) {
                setNaicsSecondary([...naicsSecondary, newNaics]);
            }
            setNewNaics('');
        }
    };

    if (loading || !profile) {
        return (
            <div className="flex justify-center items-center h-64">
                <div
                    className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const sections = [
        {id: 'basic', label: 'Basic Info', icon: BuildingOfficeIcon},
        {id: 'identifiers', label: 'Identifiers', icon: IdentificationIcon},
        {id: 'capabilities', label: 'Capabilities', icon: BriefcaseIcon},
        {id: 'experience', label: 'Experience', icon: SparklesIcon},
        {id: 'preferences', label: 'Preferences', icon: MapPinIcon},
        {id: 'certifications', label: 'Certifications', icon: ShieldCheckIcon}
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg">
                    {successMessage}
                </div>
            )}

            {/* Profile Completeness Card */}
            <div
                className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Profile Strength</h3>
                    <span className="text-3xl font-bold text-white">{completeness?.overall}%</span>
                </div>

                <div className="mb-4">
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-500"
                            style={{width: `${completeness?.overall}%`}}
                        ></div>
                    </div>
                </div>

                {completeness?.recommendations && completeness.recommendations.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm text-gray-400">Recommendations to improve matches:</p>
                        {completeness.recommendations.map((rec: string | number | bigint | boolean | ReactElement | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement | Iterable<ReactNode> | null | undefined> | null | undefined, idx: Key | null | undefined) => (
              <div key={idx} className="flex items-start text-sm">
                <ExclamationCircleIcon className="h-4 w-4 text-yellow-400 mr-2 mt-0.5" />
                <span className="text-gray-300">{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Profile Form */}
      <div className="flex gap-6">
        {/* Section Navigation */}
        <div className="w-64">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeSection === section.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <section.icon className="h-5 w-5 mr-3" />
                  {section.label}
                  {completeness?.sections[section.id as keyof typeof completeness.sections] && (
                    <CheckCircleIcon className="h-4 w-4 ml-auto text-green-400" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            {/* Basic Info Section */}
            {activeSection === 'basic' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={profile.company_name}
                    onChange={(e) => setProfile({...profile, company_name: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact support to change your email</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Min Contract Value</label>
                    <input
                      type="number"
                      value={profile.contract_value_range.min}
                      onChange={(e) => setProfile({
                        ...profile,
                        contract_value_range: {
                          ...profile.contract_value_range,
                          min: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Max Contract Value</label>
                    <input
                      type="number"
                      value={profile.contract_value_range.max}
                      onChange={(e) => setProfile({
                        ...profile,
                        contract_value_range: {
                          ...profile.contract_value_range,
                          max: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Capabilities Section */}
            {activeSection === 'capabilities' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Business Capabilities</h3>
                <p className="text-sm text-gray-400 mb-4">List your core business capabilities and services</p>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newCapability}
                    onChange={(e) => setNewCapability(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCapability()}
                    placeholder="Add a capability..."
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  />
                  <button
                    onClick={addCapability}
                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {capabilities.map((cap) => (
                    <div key={cap} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white">{cap}</span>
                      <button
                        onClick={() => removeCapability(cap)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NAICS Codes Section */}
            {activeSection === 'identifiers' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Business Identifiers & NAICS</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CAGE Code</label>
                    <input
                      type="text"
                      value={profile.cage_code || ''}
                      onChange={(e) => setProfile({...profile, cage_code: e.target.value})}
                      placeholder="5-character code"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">UEI</label>
                    <input
                      type="text"
                      value={profile.uei || ''}
                      onChange={(e) => setProfile({...profile, uei: e.target.value})}
                      placeholder="12-character UEI"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Primary NAICS Codes</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newNaics}
                      onChange={(e) => setNewNaics(e.target.value)}
                      placeholder="6-digit NAICS code"
                      maxLength={6}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                    <button
                      onClick={() => addNaics(true)}
                      className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {naicsPrimary.map((naics) => (
                      <span key={naics} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                        {naics}
                        <button
                          onClick={() => setNaicsPrimary(naicsPrimary.filter(n => n !== naics))}
                          className="ml-2 text-purple-400 hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleSave(activeSection)}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}