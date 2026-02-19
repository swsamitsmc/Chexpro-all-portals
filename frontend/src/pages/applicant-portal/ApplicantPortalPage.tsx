import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format, subYears } from 'date-fns';
import { 
  Shield, CheckCircle, AlertCircle, Loader2, Upload, Plus, X, 
  ChevronRight, ChevronLeft, Eraser, Copy, Check
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface ApplicantData {
  applicantId: string;
  firstName: string;
  lastName: string;
  email: string;
  portalStep: number;
  portalCompleted: boolean;
  order?: {
    orderId: string;
    orderNumber: string;
    positionTitle: string;
    clientName: string;
    packageName?: string;
  };
}

interface FormData {
  // Step 1: Personal Info
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  gender: string;
  sin: string;
  // Step 2: Current Address
  currentAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    residenceType: string;
    yearsAtAddress: number;
  };
  // Step 3: Address History
  addressHistory: Array<{
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    fromMonth: string;
    fromYear: string;
    toMonth: string;
    toYear: string;
    current: boolean;
  }>;
  // Step 4: Employment
  employmentHistory: Array<{
    employer: string;
    jobTitle: string;
    startMonth: string;
    startYear: string;
    endMonth: string;
    endYear: string;
    current: boolean;
    supervisorName: string;
    supervisorContact: string;
    reasonForLeaving: string;
    canContact: boolean;
  }>;
  // Step 5: Education
  educationHistory: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationMonth: string;
    graduationYear: string;
    inProgress: boolean;
    studentId: string;
  }>;
  // Step 6: Additional Info
  otherNames: string[];
  professionalLicenses: string;
  criminalRecord: 'none' | 'has_record';
  criminalDetails: string;
  consentGiven: boolean;
}

const initialFormData: FormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  gender: '',
  sin: '',
  currentAddress: {
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Canada',
    residenceType: '',
    yearsAtAddress: 0,
  },
  addressHistory: [{
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Canada',
    fromMonth: '',
    fromYear: '',
    toMonth: '',
    toYear: '',
    current: false,
  }],
  employmentHistory: [{
    employer: '',
    jobTitle: '',
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    current: false,
    supervisorName: '',
    supervisorContact: '',
    reasonForLeaving: '',
    canContact: true,
  }],
  educationHistory: [{
    institution: '',
    degree: '',
    fieldOfStudy: '',
    graduationMonth: '',
    graduationYear: '',
    inProgress: false,
    studentId: '',
  }],
  otherNames: [],
  professionalLicenses: '',
  criminalRecord: 'none',
  criminalDetails: '',
  consentGiven: false,
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = Array.from({ length: 50 }, (_, i) => String(2025 - i));

export default function ApplicantPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApplicantData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [signature, setSignature] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/applicant-portal/${token}`);
        setData(res.data.data);
        if (res.data.data.portalCompleted) {
          setSubmitted(true);
          setCurrentStep(7);
        } else {
          setCurrentStep(Math.min((res.data.data.portalStep || 0) + 1, 7));
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('This invitation link is invalid. Please contact the company that requested your background check.');
        } else if (err.response?.status === 410) {
          setError('This invitation link has expired (links are valid for 14 days). Please contact the company that requested your background check.');
        } else {
          setError('Failed to load application data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Save data function
  const saveData = async (step: number) => {
    if (!data?.applicantId) return;
    setSaving(true);
    try {
      let payload: any = {};
      
      switch (step) {
        case 1:
          payload = {
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth,
            email: formData.email,
            phone: formData.phone,
            gender: formData.gender,
            sin: formData.sin,
          };
          break;
        case 2:
          payload = { currentAddress: formData.currentAddress };
          break;
        case 3:
          payload = { 
            addressHistory: formData.addressHistory.map(a => ({
              street: a.street,
              city: a.city,
              province: a.province,
              postalCode: a.postalCode,
              country: a.country,
              from: a.fromMonth && a.fromYear ? `${a.fromMonth} ${a.fromYear}` : undefined,
              to: a.current ? undefined : (a.toMonth && a.toYear ? `${a.toMonth} ${a.toYear}` : undefined),
            })).filter(a => a.street)
          };
          break;
        case 4:
          payload = {
            employmentHistory: formData.employmentHistory.map(e => ({
              employer: e.employer,
              jobTitle: e.jobTitle,
              startDate: e.startMonth && e.startYear ? `${e.startMonth} ${e.startYear}` : undefined,
              endDate: e.current ? undefined : (e.endMonth && e.endYear ? `${e.endMonth} ${e.endYear}` : undefined),
              supervisorName: e.supervisorName,
              supervisorContact: e.supervisorContact,
              reasonForLeaving: e.reasonForLeaving,
              canContact: e.canContact,
            })).filter(e => e.employer)
          };
          break;
        case 5:
          payload = {
            educationHistory: formData.educationHistory.map(e => ({
              institution: e.institution,
              degree: e.degree,
              fieldOfStudy: e.fieldOfStudy,
              graduationDate: e.inProgress ? undefined : (e.graduationMonth && e.graduationYear ? `${e.graduationMonth} ${e.graduationYear}` : undefined),
              studentId: e.studentId,
            })).filter(e => e.institution)
          };
          break;
        case 6:
          payload = {
            additionalInfo: {
              otherNames: formData.otherNames,
              professionalLicenses: formData.professionalLicenses,
              criminalRecord: formData.criminalRecord,
              criminalDetails: formData.criminalDetails,
            }
          };
          break;
      }
      
      await axios.put(`${API_URL}/applicant-portal/${token}/data`, payload);
    } catch (err) {
      console.error('Save error:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Handle next step
  const handleNext = async () => {
    try {
      await saveData(currentStep);
      setCurrentStep(prev => Math.min(prev + 1, 7));
    } catch {
      alert('Failed to save data. Please try again.');
    }
  };

  // Handle previous step
  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Document upload handler
  const handleDocUpload = async (docType: string, file: File) => {
    if (!data?.applicantId) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', docType);
    
    try {
      await axios.post(`${API_URL}/applicants/${data.applicantId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedDocs(prev => ({ ...prev, [docType]: true }));
    } catch (err) {
      alert('Failed to upload document');
    }
  };

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignature(canvas.toDataURL('image/png'));
  };

  // Handle final submit
  const handleSubmit = async () => {
    if (!data?.applicantId || !token) return;
    
    // Validate required items
    if (!uploadedDocs['id_front']) {
      alert('Please upload your photo ID (front)');
      return;
    }
    if (!formData.consentGiven) {
      alert('Please accept the consent acknowledgment');
      return;
    }
    if (!signature) {
      alert('Please provide your signature');
      return;
    }

    try {
      // Save signature
      await axios.post(`${API_URL}/applicant-portal/${token}/consent`, {
        consentGiven: true,
        signature,
      });
      
      // Submit
      await axios.post(`${API_URL}/applicant-portal/${token}/submit`);
      setSubmitted(true);
    } catch (err) {
      alert('Failed to submit application. Please try again.');
    }
  };

  // Check status
  const checkStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/applicant-portal/${token}/status`);
      setStatusData(res.data.data);
    } catch (err) {
      console.error('Status check failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted Successfully</h2>
          <p className="text-gray-600 mb-4">
            Thank you, {data?.firstName}. Your background check is now in progress.
          </p>
          <p className="text-sm text-gray-500 mb-6">Order Reference: {data?.order?.orderNumber}</p>
          <button
            onClick={checkStatus}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Check My Status
          </button>
          {statusData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">Status: {statusData.orderStatus}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">ChexPro</h1>
              <p className="text-xs text-gray-500">Secure Background Check Portal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Submitted by {data?.order?.clientName}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">Step {currentStep} of 7</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(step => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {currentStep === 1 && (
            <StepPersonalInfo formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 2 && (
            <StepCurrentAddress formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 3 && (
            <StepAddressHistory formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 4 && (
            <StepEmployment formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 5 && (
            <StepEducation formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 6 && (
            <StepAdditionalInfo formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 7 && (
            <StepDocumentsAndSignature
              formData={formData}
              setFormData={setFormData}
              uploadedDocs={uploadedDocs}
              onUpload={handleDocUpload}
              signature={signature}
              canvasRef={canvasRef}
              onStartDraw={startDrawing}
              onDraw={draw}
              onStopDraw={stopDrawing}
              onClear={clearSignature}
              onSaveSignature={saveSignature}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          
          {currentStep < 7 ? (
            <button
              onClick={handleNext}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
}

// Step Components
function StepPersonalInfo({ formData, setFormData }: { formData: FormData; setFormData: any }) {
  const maxDate = format(subYears(new Date(), 18), 'yyyy-MM-dd');
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Personal Information</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
          <input
            type="text"
            value={formData.middleName}
            onChange={e => setFormData({ ...formData, middleName: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
          <input
            type="date"
            max={maxDate}
            value={formData.dateOfBirth}
            onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input
            type="tel"
            placeholder="+1-XXX-XXX-XXXX"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            value={formData.gender}
            onChange={e => setFormData({ ...formData, gender: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Social Insurance Number
          <span className="text-gray-400 font-normal ml-2">(Optional - encrypted with AES-256)</span>
        </label>
        <input
          type="password"
          value={formData.sin}
          onChange={e => setFormData({ ...formData, sin: e.target.value })}
          placeholder="•••-••-••••"
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          Only collected if required for your specific check type. Encrypted with AES-256 and stored securely.
        </p>
      </div>
    </div>
  );
}

function StepCurrentAddress({ formData, setFormData }: { formData: FormData; setFormData: any }) {
  const addr = formData.currentAddress;
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Current Address</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
        <input
          type="text"
          value={addr.street}
          onChange={e => setFormData({ ...formData, currentAddress: { ...addr, street: e.target.value } })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input
            type="text"
            value={addr.city}
            onChange={e => setFormData({ ...formData, currentAddress: { ...addr, city: e.target.value } })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Province/State *</label>
          <input
            type="text"
            value={addr.province}
            onChange={e => setFormData({ ...formData, currentAddress: { ...addr, province: e.target.value } })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postal/ZIP Code *</label>
          <input
            type="text"
            value={addr.postalCode}
            onChange={e => setFormData({ ...formData, currentAddress: { ...addr, postalCode: e.target.value } })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
          <input
            type="text"
            value={addr.country}
            onChange={e => setFormData({ ...formData, currentAddress: { ...addr, country: e.target.value } })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Residence Type</label>
          <select
            value={addr.residenceType}
            onChange={e => setFormData({ ...formData, currentAddress: { ...addr, residenceType: e.target.value } })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Select...</option>
            <option value="own">Own</option>
            <option value="rent">Rent</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Years at this address *</label>
        <input
          type="number"
          min="0"
          max="99"
          value={addr.yearsAtAddress}
          onChange={e => setFormData({ ...formData, currentAddress: { ...addr, yearsAtAddress: parseInt(e.target.value) || 0 } })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          required
        />
      </div>
    </div>
  );
}

function StepAddressHistory({ formData, setFormData }: { formData: FormData; setFormData: any }) {
  const addAddress = () => {
    setFormData({
      ...formData,
      addressHistory: [...formData.addressHistory, {
        street: '', city: '', province: '', postalCode: '', country: 'Canada',
        fromMonth: '', fromYear: '', toMonth: '', toYear: '', current: false
      }]
    });
  };

  const removeAddress = (index: number) => {
    if (formData.addressHistory.length > 1) {
      const updated = formData.addressHistory.filter((_, i) => i !== index);
      setFormData({ ...formData, addressHistory: updated });
    }
  };

  const updateAddress = (index: number, field: string, value: any) => {
    const updated = [...formData.addressHistory];
    (updated[index] as any)[field] = value;
    setFormData({ ...formData, addressHistory: updated });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Address History (Past 7 Years)</h2>
      <p className="text-gray-600">Please add all addresses where you have lived in the past 7 years, starting from most recent.</p>

      {formData.addressHistory.map((addr, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Address {idx + 1}</h3>
            {formData.addressHistory.length > 1 && (
              <button onClick={() => removeAddress(idx)} className="text-red-500">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Street Address"
                value={addr.street}
                onChange={e => updateAddress(idx, 'street', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="City"
                value={addr.city}
                onChange={e => updateAddress(idx, 'city', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Province/State"
                value={addr.province}
                onChange={e => updateAddress(idx, 'province', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Postal Code"
                value={addr.postalCode}
                onChange={e => updateAddress(idx, 'postalCode', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Country"
                value={addr.country}
                onChange={e => updateAddress(idx, 'country', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex gap-2">
              <select
                value={addr.fromMonth}
                onChange={e => updateAddress(idx, 'fromMonth', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Month</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={addr.fromYear}
                onChange={e => updateAddress(idx, 'fromYear', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              {!addr.current ? (
                <>
                  <select
                    value={addr.toMonth}
                    onChange={e => updateAddress(idx, 'toMonth', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Month</option>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={addr.toYear}
                    onChange={e => updateAddress(idx, 'toYear', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </>
              ) : (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addr.current}
                    onChange={e => updateAddress(idx, 'current', e.target.checked)}
                  />
                  <span className="text-sm">I still live here</span>
                </label>
              )}
            </div>
          </div>
          
          <div className="mt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addr.current}
                onChange={e => updateAddress(idx, 'current', e.target.checked)}
              />
              <span className="text-sm">I still live here</span>
            </label>
          </div>
        </div>
      ))}

      <button onClick={addAddress} className="flex items-center gap-2 text-blue-600">
        <Plus className="w-4 h-4" /> Add Previous Address
      </button>
    </div>
  );
}

function StepEmployment({ formData, setFormData }: { formData: FormData; setFormData: any }) {
  const addEmployer = () => {
    if (formData.employmentHistory.length < 3) {
      setFormData({
        ...formData,
        employmentHistory: [...formData.employmentHistory, {
          employer: '', jobTitle: '', startMonth: '', startYear: '',
          endMonth: '', endYear: '', current: false,
          supervisorName: '', supervisorContact: '', reasonForLeaving: '', canContact: true
        }]
      });
    }
  };

  const removeEmployer = (index: number) => {
    if (formData.employmentHistory.length > 1) {
      const updated = formData.employmentHistory.filter((_, i) => i !== index);
      setFormData({ ...formData, employmentHistory: updated });
    }
  };

  const updateEmployer = (index: number, field: string, value: any) => {
    const updated = [...formData.employmentHistory];
    (updated[index] as any)[field] = value;
    setFormData({ ...formData, employmentHistory: updated });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Employment History</h2>
      <p className="text-gray-600">Please provide your employment history for the past 5 years.</p>

      {formData.employmentHistory.map((emp, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Employer {idx + 1}</h3>
            {formData.employmentHistory.length > 1 && (
              <button onClick={() => removeEmployer(idx)} className="text-red-500">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Employer / Company Name *"
                value={emp.employer}
                onChange={e => updateEmployer(idx, 'employer', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Job Title / Position *"
                value={emp.jobTitle}
                onChange={e => updateEmployer(idx, 'jobTitle', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex gap-2">
              <select
                value={emp.startMonth}
                onChange={e => updateEmployer(idx, 'startMonth', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Start Month</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={emp.startYear}
                onChange={e => updateEmployer(idx, 'startYear', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              {!emp.current ? (
                <>
                  <select
                    value={emp.endMonth}
                    onChange={e => updateEmployer(idx, 'endMonth', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">End Month</option>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={emp.endYear}
                    onChange={e => updateEmployer(idx, 'endYear', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </>
              ) : (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={emp.current}
                    onChange={e => updateEmployer(idx, 'current', e.target.checked)}
                  />
                  <span className="text-sm">Currently employed</span>
                </label>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={emp.current}
              onChange={e => updateEmployer(idx, 'current', e.target.checked)}
            />
            <span className="text-sm">I currently work here</span>
          </label>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <input
                type="text"
                placeholder="Supervisor Name (optional)"
                value={emp.supervisorName}
                onChange={e => updateEmployer(idx, 'supervisorName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Supervisor Email/Phone (optional)"
                value={emp.supervisorContact}
                onChange={e => updateEmployer(idx, 'supervisorContact', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {!emp.current && (
            <div className="mt-4">
              <textarea
                placeholder="Reason for Leaving (optional)"
                value={emp.reasonForLeaving}
                onChange={e => updateEmployer(idx, 'reasonForLeaving', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={2}
              />
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm mb-2">May we contact this employer?</p>
            <label className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`canContact-${idx}`}
                  checked={emp.canContact}
                  onChange={() => updateEmployer(idx, 'canContact', true)}
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`canContact-${idx}`}
                  checked={!emp.canContact}
                  onChange={() => updateEmployer(idx, 'canContact', false)}
                />
                <span className="text-sm">No</span>
              </label>
            </label>
          </div>
        </div>
      ))}

      {formData.employmentHistory.length < 3 && (
        <button onClick={addEmployer} className="flex items-center gap-2 text-blue-600">
          <Plus className="w-4 h-4" /> Add Previous Employer
        </button>
      )}
    </div>
  );
}

function StepEducation({ formData, setFormData }: { formData: FormData; setFormData: any }) {
  const addEducation = () => {
    if (formData.educationHistory.length < 3) {
      setFormData({
        ...formData,
        educationHistory: [...formData.educationHistory, {
          institution: '', degree: '', fieldOfStudy: '',
          graduationMonth: '', graduationYear: '', inProgress: false, studentId: ''
        }]
      });
    }
  };

  const removeEducation = (index: number) => {
    if (formData.educationHistory.length > 1) {
      const updated = formData.educationHistory.filter((_, i) => i !== index);
      setFormData({ ...formData, educationHistory: updated });
    }
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...formData.educationHistory];
    (updated[index] as any)[field] = value;
    setFormData({ ...formData, educationHistory: updated });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Education History</h2>

      {formData.educationHistory.map((edu, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Education {idx + 1}</h3>
            {formData.educationHistory.length > 1 && (
              <button onClick={() => removeEducation(idx)} className="text-red-500">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Institution / School Name *"
                value={edu.institution}
                onChange={e => updateEducation(idx, 'institution', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Degree / Diploma / Certificate *"
                value={edu.degree}
                onChange={e => updateEducation(idx, 'degree', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <input
                type="text"
                placeholder="Field of Study (optional)"
                value={edu.fieldOfStudy}
                onChange={e => updateEducation(idx, 'fieldOfStudy', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Student ID (optional)"
                value={edu.studentId}
                onChange={e => updateEducation(idx, 'studentId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={edu.inProgress}
                onChange={e => updateEducation(idx, 'inProgress', e.target.checked)}
              />
              <span className="text-sm">Did not graduate / In progress</span>
            </label>
          </div>

          {!edu.inProgress && (
            <div className="flex gap-2 mt-4">
              <select
                value={edu.graduationMonth}
                onChange={e => updateEducation(idx, 'graduationMonth', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Month</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={edu.graduationYear}
                onChange={e => updateEducation(idx, 'graduationYear', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      ))}

      {formData.educationHistory.length < 3 && (
        <button onClick={addEducation} className="flex items-center gap-2 text-blue-600">
          <Plus className="w-4 h-4" /> Add Education
        </button>
      )}
    </div>
  );
}

function StepAdditionalInfo({ formData, setFormData }: { formData: FormData; setFormData: any }) {
  const addOtherName = () => {
    setFormData({ ...formData, otherNames: [...formData.otherNames, ''] });
  };

  const removeOtherName = (index: number) => {
    const updated = formData.otherNames.filter((_, i) => i !== index);
    setFormData({ ...formData, otherNames: updated });
  };

  const updateOtherName = (index: number, value: string) => {
    const updated = [...formData.otherNames];
    updated[index] = value;
    setFormData({ ...formData, otherNames: updated });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Additional Information</h2>

      {/* Other Names */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Have you ever used a different name (maiden name, alias)?
        </label>
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={formData.otherNames.length > 0}
            onChange={e => {
              if (e.target.checked && formData.otherNames.length === 0) {
                setFormData({ ...formData, otherNames: [''] });
              } else if (!e.target.checked) {
                setFormData({ ...formData, otherNames: [] });
              }
            }}
          />
          <span className="text-sm">Yes</span>
        </label>
        {formData.otherNames.map((name, idx) => (
          <div key={idx} className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Other name"
              value={name}
              onChange={e => updateOtherName(idx, e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            />
            <button onClick={() => removeOtherName(idx)} className="text-red-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
        {formData.otherNames.length > 0 && (
          <button onClick={addOtherName} className="text-blue-600 text-sm mt-2">
            + Add another
          </button>
        )}
      </div>

      {/* Professional Licenses */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Professional Licenses or Certifications (optional)
        </label>
        <textarea
          value={formData.professionalLicenses}
          onChange={e => setFormData({ ...formData, professionalLicenses: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          rows={3}
          placeholder="List any professional licenses or certifications..."
        />
      </div>

      {/* Criminal Disclosure */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Criminal Record Disclosure *
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="criminalRecord"
              checked={formData.criminalRecord === 'none'}
              onChange={() => setFormData({ ...formData, criminalRecord: 'none', criminalDetails: '' })}
            />
            <span className="text-sm">I do not have a criminal record</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="criminalRecord"
              checked={formData.criminalRecord === 'has_record'}
              onChange={() => setFormData({ ...formData, criminalRecord: 'has_record' })}
            />
            <span className="text-sm">I have a criminal record or outstanding charges</span>
          </label>
        </div>
        {formData.criminalRecord === 'has_record' && (
          <textarea
            value={formData.criminalDetails}
            onChange={e => setFormData({ ...formData, criminalDetails: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
            rows={3}
            placeholder="Please provide brief details (nature of offense, date, jurisdiction). This does not automatically disqualify you."
          />
        )}
      </div>

      {/* Consent */}
      <div className="border-t pt-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={formData.consentGiven}
            onChange={e => setFormData({ ...formData, consentGiven: e.target.checked })}
            className="mt-1"
          />
          <span className="text-sm text-gray-700">
            I confirm that all information provided is accurate and complete. I consent to 
            Chexpro.com and its authorized partners conducting a background check on my behalf. 
            I understand my rights under applicable privacy legislation (PIPEDA). *
          </span>
        </label>
      </div>
    </div>
  );
}

function StepDocumentsAndSignature({
  formData,
  setFormData,
  uploadedDocs,
  onUpload,
  signature,
  canvasRef,
  onStartDraw,
  onDraw,
  onStopDraw,
  onClear,
  onSaveSignature,
  onSubmit
}: {
  formData: FormData;
  setFormData: any;
  uploadedDocs: Record<string, boolean>;
  onUpload: (docType: string, file: File) => void;
  signature: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onStartDraw: (e: React.MouseEvent | React.TouchEvent) => void;
  onDraw: (e: React.MouseEvent | React.TouchEvent) => void;
  onStopDraw: () => void;
  onClear: () => void;
  onSaveSignature: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Document Upload & E-Signature</h2>

      {/* Documents Section */}
      <div>
        <h3 className="font-medium mb-4">Documents</h3>
        
        <div className="space-y-4">
          <DocumentUpload
            label="Government-issued Photo ID - Front *"
            uploaded={uploadedDocs['id_front']}
            onUpload={(f) => onUpload('id_front', f)}
            required
          />
          <DocumentUpload
            label="Government-issued Photo ID - Back"
            uploaded={uploadedDocs['id_back']}
            onUpload={(f) => onUpload('id_back', f)}
            checkboxLabel="Not applicable — I uploaded a passport"
          />
          <DocumentUpload
            label="Proof of Current Address (optional)"
            uploaded={uploadedDocs['proof_of_address']}
            onUpload={(f) => onUpload('proof_of_address', f)}
          />
          <DocumentUpload
            label="Additional Documents (optional, multiple files)"
            uploaded={uploadedDocs['additional']}
            onUpload={(f) => onUpload('additional', f)}
            multiple
          />
        </div>
      </div>

      {/* E-Signature Section */}
      <div className="border-t pt-6">
        <h3 className="font-medium mb-2">E-Signature</h3>
        <p className="text-sm text-gray-600 mb-4">Please sign below to authorize this background check</p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            className="border border-gray-200 bg-gray-50 w-full cursor-crosshair"
            onMouseDown={onStartDraw}
            onMouseMove={onDraw}
            onMouseUp={onStopDraw}
            onMouseLeave={onStopDraw}
            onTouchStart={onStartDraw}
            onTouchMove={onDraw}
            onTouchEnd={onStopDraw}
          />
          <p className="text-xs text-gray-400 text-center mt-2">Sign here</p>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button onClick={onClear} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Eraser className="w-4 h-4" /> Clear
          </button>
          <button onClick={onSaveSignature} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Check className="w-4 h-4" /> Save Signature
          </button>
        </div>

        {signature && (
          <div className="mt-4">
            <p className="text-sm text-green-600">Signature saved ✓</p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="border-t pt-6">
        <button
          onClick={onSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          Submit Application
        </button>
      </div>
    </div>
  );
}

function DocumentUpload({
  label,
  uploaded,
  onUpload,
  required,
  checkboxLabel,
  multiple
}: {
  label: string;
  uploaded?: boolean;
  onUpload: (file: File) => void;
  required?: boolean;
  checkboxLabel?: string;
  multiple?: boolean;
}) {
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      await onUpload(multiple ? files[0] : files[0]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </span>
          {uploaded && <CheckCircle className="w-5 h-5 text-green-500" />}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          ) : (
            <Upload className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-sm text-blue-600">Upload</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.heic"
            multiple={multiple}
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </div>
      {checkboxLabel && (
        <label className="flex items-center gap-2 mt-2">
          <input type="checkbox" className="rounded" />
          <span className="text-sm text-gray-600">{checkboxLabel}</span>
        </label>
      )}
    </div>
  );
}
