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
import {InformationCircleIcon} from "@heroicons/react/16/solid";

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
  const [geographicPreferences, setGeographicPreferences] = useState<string[]>([]);
  const [newGeographic, setNewGeographic] = useState('');
  const [setAsideEligibilities, setSetAsideEligibilities] = useState<string[]>([]);

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
      setGeographicPreferences(profileData.geographic_preferences || []);
      setSetAsideEligibilities(profileData.set_aside_eligibilities || []);
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
        geographic_preferences: geographicPreferences,
        set_aside_eligibilities: setAsideEligibilities,
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const addItem = (list: string[], setList: (items: string[]) => void, item: string, clearInput?: () => void) => {
    if (item && !list.includes(item)) {
      setList([...list, item]);
      if (clearInput) clearInput();
    }
  };

  const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    setList(list.filter(i => i !== item));
  };

  const toggleSetAside = (value: string) => {
    if (setAsideEligibilities.includes(value)) {
      setSetAsideEligibilities(setAsideEligibilities.filter(s => s !== value));
    } else {
      setSetAsideEligibilities([...setAsideEligibilities, value]);
    }
  };

  const calculateCompleteness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.company_name && profile.email) score += 15;
    if (profile.cage_code || profile.uei) score += 15;
    if (capabilities.length >= 3) score += 20;
    if (agencies.length > 0) score += 15;
    if (naicsPrimary.length > 0) score += 15;
    if (geographicPreferences.length > 0) score += 10;
    if (setAsideEligibilities.length > 0) score += 10;
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

    // Set-aside options
  const setAsideOptions = [
    { value: 'SBA', label: 'Small Business (SBA)', description: 'Total receipts/employees below SBA size standards' },
    { value: 'SDVOSB', label: 'Service-Disabled Veteran-Owned', description: 'At least 51% owned by service-disabled veterans' },
    { value: 'WOSB', label: 'Women-Owned Small Business', description: 'At least 51% owned by women' },
    { value: 'HUBZone', label: 'HUBZone', description: 'Located in Historically Underutilized Business Zone' },
    { value: '8(a)', label: '8(a) Business Development', description: 'SBA-certified economically disadvantaged business' },
    { value: 'VetCert', label: 'Veteran-Owned', description: 'At least 51% owned by veterans' },
  ];

  // Geographic examples
  const geographicExamples = [
    'Washington DC Metro Area',
    'California',
    'CONUS (Continental US)',
    'East Coast',
    'Southwest Region',
    'Nationwide',
    'International',
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
                      (section.id === 'experience' && agencies.length > 0) ||
                      (section.id === 'preferences' && geographicPreferences.length > 0) ||
                      (section.id === 'certifications' && setAsideEligibilities.length > 0)) && (
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
                            addItem(naicsPrimary, setNaicsPrimary, newNaics, () => setNewNaics(''));
                          }
                        }}
                      />
                      <Button
                        onClick={() => addItem(naicsPrimary, setNaicsPrimary, newNaics, () => setNewNaics(''))}
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
                  <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">Examples of capabilities:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-200">
                        <li>Software Development & Cloud Migration</li>
                        <li>Cybersecurity & Risk Assessment</li>
                        <li>Project Management (PMP Certified)</li>
                        <li>Data Analytics & Business Intelligence</li>
                        <li>Network Infrastructure Design</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add a capability..."
                      value={newCapability}
                      onChange={(e) => setNewCapability(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addItem(capabilities, setCapabilities, newCapability, () => setNewCapability(''));
                        }
                      }}
                    />
                    <Button
                      onClick={() => addItem(capabilities, setCapabilities, newCapability, () => setNewCapability(''))}
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
                  <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">Add agencies you&#39;ve worked with:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-200">
                        <li>Department of Defense (DoD)</li>
                        <li>Department of Homeland Security (DHS)</li>
                        <li>General Services Administration (GSA)</li>
                        <li>Veterans Affairs (VA)</li>
                        <li>National Institutes of Health (NIH)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add an agency..."
                      value={newAgency}
                      onChange={(e) => setNewAgency(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addItem(agencies, setAgencies, newAgency, () => setNewAgency(''));
                        }
                      }}
                    />
                    <Button
                      onClick={() => addItem(agencies, setAgencies, newAgency, () => setNewAgency(''))}
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

              {/* Preferences */}
              {activeSection === 'preferences' && (
                <div>
                  <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">Where do you want to work? Add geographic preferences:</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {geographicExamples.map((example) => (
                          <button
                            key={example}
                            onClick={() => addItem(geographicPreferences, setGeographicPreferences, example)}
                            className="px-2 py-1 bg-blue-500/20 text-blue-200 rounded text-xs hover:bg-blue-500/30 transition-colors"
                          >
                            + {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Geographic Preferences
                  </label>
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add a location or region..."
                      value={newGeographic}
                      onChange={(e) => setNewGeographic(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addItem(geographicPreferences, setGeographicPreferences, newGeographic, () => setNewGeographic(''));
                        }
                      }}
                    />
                    <Button
                      onClick={() => addItem(geographicPreferences, setGeographicPreferences, newGeographic, () => setNewGeographic(''))}
                      icon={<PlusIcon className="h-5 w-5" />}
                    >
                      Add
                    </Button>
                  </div>

                  {geographicPreferences.length > 0 ? (
                    <div className="space-y-2">
                      {geographicPreferences.map((location) => (
                        <div
                          key={location}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center">
                            <MapPinIcon className="h-5 w-5 text-purple-400 mr-3" />
                            <span className="text-white">{location}</span>
                          </div>
                          <button
                            onClick={() => removeItem(geographicPreferences, setGeographicPreferences, location)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10 border-dashed">
                      <MapPinIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No geographic preferences added yet</p>
                      <p className="text-gray-500 text-xs mt-1">Add locations to help us find relevant opportunities</p>
                    </div>
                  )}
                </div>
              )}

              {/* Certifications */}
              {activeSection === 'certifications' && (
                <div>
                  <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">Set-aside certifications:</p>
                      <p className="text-blue-200">Select all certifications that apply to your business. These help match you with set-aside opportunities.</p>
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    Set-Aside Eligibilities
                  </label>

                  <div className="space-y-3">
                    {setAsideOptions.map((option) => {
                      const isSelected = setAsideEligibilities.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => toggleSetAside(option.value)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'bg-green-500/20 border-green-500/50 shadow-lg'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <ShieldCheckIcon className={`h-5 w-5 mr-2 ${isSelected ? 'text-green-400' : 'text-gray-400'}`} />
                                <span className={`font-semibold ${isSelected ? 'text-green-300' : 'text-white'}`}>
                                  {option.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 ml-7">{option.description}</p>
                            </div>
                            <div className={`flex-shrink-0 ml-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-400'
                            }`}>
                              {isSelected && (
                                <CheckCircleIcon className="h-4 w-4 text-white" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {setAsideEligibilities.length === 0 && (
                    <div className="mt-4 text-center py-8 bg-white/5 rounded-lg border border-white/10 border-dashed">
                      <ShieldCheckIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No certifications selected</p>
                      <p className="text-gray-500 text-xs mt-1">Select your set-aside eligibilities above</p>
                    </div>
                  )}

                  {setAsideEligibilities.length > 0 && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-300 font-medium mb-2">
                        ✓ You have {setAsideEligibilities.length} certification(s) selected
                      </p>
                      <p className="text-xs text-green-200">
                        These will be used to match you with set-aside opportunities
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
            <CardFooter>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">
                  Changes are saved when you click Save Changes
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