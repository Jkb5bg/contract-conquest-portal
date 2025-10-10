'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ClientProfile } from '@/types/profile';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Input,
  Badge,
  LoadingSpinner,
  ProgressBar,
  Alert,
} from '@/components/ui';
import {
  BuildingOfficeIcon,
  IdentificationIcon,
  BriefcaseIcon,
  MapPinIcon,
  ShieldCheckIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function ConsistentProfilePage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [newCapability, setNewCapability] = useState('');
  const [agencies, setAgencies] = useState<string[]>([]);
  const [newAgency, setNewAgency] = useState('');
  const [naicsPrimary, setNaicsPrimary] = useState<string[]>([]);
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
      setCapabilities(profileData.capabilities || []);
      setAgencies(profileData.past_performance_agencies || []);
      setNaicsPrimary(profileData.primary_naics || []);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.put('/profile/update', {
        ...profile,
        capabilities,
        past_performance_agencies: agencies,
        primary_naics: naicsPrimary,
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const addItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    if (item && !list.includes(item)) {
      setList([...list, item]);
    }
  };

  const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    setList(list.filter(i => i !== item));
  };

  const calculateCompleteness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.company_name && profile.email) score += 20;
    if (profile.cage_code || profile.uei) score += 15;
    if (capabilities.length >= 3) score += 25;
    if (agencies.length > 0) score += 20;
    if (naicsPrimary.length > 0) score += 20;
    return score;
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: BuildingOfficeIcon },
    { id: 'identifiers', label: 'Identifiers', icon: IdentificationIcon },
    { id: 'capabilities', label: 'Capabilities', icon: BriefcaseIcon },
    { id: 'experience', label: 'Experience', icon: SparklesIcon },
    { id: 'preferences', label: 'Preferences', icon: MapPinIcon },
    { id: 'certifications', label: 'Certifications', icon: ShieldCheckIcon },
  ];

  if (loading || !profile) {
    return <LoadingSpinner size="lg" />;
  }

  const completeness = calculateCompleteness();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20">
        <CardBody>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Your Profile</h1>
              <p className="text-gray-300">
                Keep your profile up to date for better opportunity matches
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white mb-1">{completeness}%</div>
              <p className="text-sm text-gray-400">Complete</p>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={completeness} max={100} color="purple" />
          </div>
        </CardBody>
      </Card>

      {message.text && (
        <Alert
          type={message.type as never}
          message={message.text}
          onClose={() => setMessage({ type: '', text: '' })}
        />
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Section Navigation */}
        <div className="col-span-3">
          <Card>
            <CardBody>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <section.icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{section.label}</span>
                    {((section.id === 'capabilities' && capabilities.length >= 3) ||
                      (section.id === 'identifiers' && (profile.cage_code || profile.uei)) ||
                      (section.id === 'experience' && agencies.length > 0)) && (
                      <CheckCircleIcon className="h-4 w-4 ml-auto text-green-400" />
                    )}
                  </button>
                ))}
              </nav>
            </CardBody>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-white">
                {sections.find(s => s.id === activeSection)?.label}
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Basic Info */}
              {activeSection === 'basic' && (
                <>
                  <Input
                    label="Company Name"
                    value={profile.company_name}
                    onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={profile.email}
                    disabled
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Minimum Contract Value"
                      type="number"
                      value={profile.contract_value_range.min}
                      onChange={(e) => setProfile({
                        ...profile,
                        contract_value_range: {
                          ...profile.contract_value_range,
                          min: parseInt(e.target.value)
                        }
                      })}
                    />
                    <Input
                      label="Maximum Contract Value"
                      type="number"
                      value={profile.contract_value_range.max}
                      onChange={(e) => setProfile({
                        ...profile,
                        contract_value_range: {
                          ...profile.contract_value_range,
                          max: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                </>
              )}

              {/* Identifiers */}
              {activeSection === 'identifiers' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="CAGE Code"
                      placeholder="5-character code"
                      maxLength={5}
                      value={profile.cage_code || ''}
                      onChange={(e) => setProfile({ ...profile, cage_code: e.target.value })}
                    />
                    <Input
                      label="UEI"
                      placeholder="12-character UEI"
                      maxLength={12}
                      value={profile.uei || ''}
                      onChange={(e) => setProfile({ ...profile, uei: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Primary NAICS Codes
                    </label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="6-digit NAICS"
                        maxLength={6}
                        value={newNaics}
                        onChange={(e) => setNewNaics(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem(naicsPrimary, setNaicsPrimary, newNaics);
                            setNewNaics('');
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          addItem(naicsPrimary, setNaicsPrimary, newNaics);
                          setNewNaics('');
                        }}
                        icon={<PlusIcon className="h-5 w-5" />}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {naicsPrimary.map((naics) => (
                        <Badge key={naics} variant="primary">
                          {naics}
                          <button
                            onClick={() => removeItem(naicsPrimary, setNaicsPrimary, naics)}
                            className="ml-2 hover:text-white"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Capabilities */}
              {activeSection === 'capabilities' && (
                <div>
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add a capability..."
                      value={newCapability}
                      onChange={(e) => setNewCapability(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addItem(capabilities, setCapabilities, newCapability);
                          setNewCapability('');
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        addItem(capabilities, setCapabilities, newCapability);
                        setNewCapability('');
                      }}
                      icon={<PlusIcon className="h-5 w-5" />}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {capabilities.map((cap) => (
                      <div
                        key={cap}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <span className="text-white">{cap}</span>
                        <button
                          onClick={() => removeItem(capabilities, setCapabilities, cap)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {capabilities.length < 3 && (
                    <p className="text-sm text-yellow-400 mt-4">
                      Add at least 3 capabilities for better opportunity matching
                    </p>
                  )}
                </div>
              )}

              {/* Experience */}
              {activeSection === 'experience' && (
                <div>
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add an agency..."
                      value={newAgency}
                      onChange={(e) => setNewAgency(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addItem(agencies, setAgencies, newAgency);
                          setNewAgency('');
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        addItem(agencies, setAgencies, newAgency);
                        setNewAgency('');
                      }}
                      icon={<PlusIcon className="h-5 w-5" />}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {agencies.map((agency) => (
                      <div
                        key={agency}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <span className="text-white">{agency}</span>
                        <button
                          onClick={() => removeItem(agencies, setAgencies, agency)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
            <CardFooter>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">
                  Changes are saved automatically
                </p>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  isLoading={saving}
                >
                  Save Changes
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}