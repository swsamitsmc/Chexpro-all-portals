import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { get, post } from "../../lib/api";
import { formatStatus } from "../../lib/utils";
import { ChevronRight, ChevronLeft, Package, Users, Mail, Check, Loader2 } from "lucide-react";

interface PackageData {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  turnaroundTimeDays: number;
  isGlobal: boolean;
  services?: ServiceData[];
}

interface ServiceData {
  id: string;
  name: string;
  category: string;
  basePrice: string | number;
}

export default function NewOrderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Order Details
    referenceNumber: "",
    department: "",
    positionTitle: "",
    screeningReason: "Employment",
    // Step 2: Package Selection
    selectedPackageId: "" as string | null,
    customServices: [] as string[],
    useCustom: false,
    // Step 3: Applicant Entry
    applicantEntryMethod: "" as "now" | "invite" | null,
    applicantEmail: "",
    applicantPhone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch packages
  const { data: packages = [], isLoading: packagesLoading } = useQuery<PackageData[]>({
    queryKey: ["packages"],
    queryFn: () => get("/packages"),
  });

  // Fetch services for custom selection
  const { data: services = [] } = useQuery<ServiceData[]>({
    queryKey: ["services"],
    queryFn: () => get("/services"),
    enabled: formData.useCustom,
  });

  // Create order mutation
  const createOrder = useMutation({
    mutationFn: (data: any) => post("/orders", { ...data, isDraft: true }),
    onSuccess: async (order: any) => {
      // If inviting applicant, send invitation
      if (formData.applicantEntryMethod === "invite" && formData.applicantEmail) {
        await post("/applicant-portal/invite", {
          orderId: order.id,
          applicantEmail: formData.applicantEmail,
          applicantPhone: formData.applicantPhone || undefined,
        });
      }
      navigate(`/orders/${order.id}`, { 
        state: { message: "Order created successfully" }
      });
    },
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.error?.message || "Failed to create order" });
    },
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!formData.positionTitle.trim()) {
        newErrors.positionTitle = "Position title is required";
      }
    }
    
    if (currentStep === 2) {
      if (!formData.useCustom && !formData.selectedPackageId) {
        newErrors.selectedPackageId = "Please select a package";
      }
      if (formData.useCustom && formData.customServices.length === 0) {
        newErrors.customServices = "Please select at least one service";
      }
    }

    if (currentStep === 3) {
      if (!formData.applicantEntryMethod) {
        newErrors.applicantEntryMethod = "Please select an entry method";
      }
      if (formData.applicantEntryMethod === "invite" && !formData.applicantEmail) {
        newErrors.applicantEmail = "Email is required for invitation";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;

    const payload: any = {
      referenceNumber: formData.referenceNumber || undefined,
      department: formData.department || undefined,
      positionTitle: formData.positionTitle,
      screeningReason: formData.screeningReason,
    };

    if (formData.useCustom) {
      payload.customServices = formData.customServices;
    } else {
      payload.packageId = formData.selectedPackageId;
    }

    if (formData.applicantEntryMethod === "now") {
      // For "enter now", we just create the order without applicant
      // Applicant data would be entered separately
    }
    // For "invite", the applicant invitation is handled in onSuccess

    createOrder.mutate(payload);
  };

  // Calculate custom price
  const customPrice = formData.customServices.reduce((sum, svcId) => {
    const svc = services.find(s => s.id === svcId);
    return sum + (svc ? Number(svc.basePrice) : 0);
  }, 0);

  const selectedPackage = packages.find(p => p.id === formData.selectedPackageId);
  const displayPrice = formData.useCustom ? customPrice : (selectedPackage ? Number(selectedPackage.price) : 0);

  const screeningReasons = [
    { value: "Employment", label: "Employment" },
    { value: "Volunteer", label: "Volunteer" },
    { value: "Tenant", label: "Tenant" },
    { value: "Other", label: "Other" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate("/orders")} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "Order Details" },
            { num: 2, label: "Package" },
            { num: 3, label: "Applicant" },
          ].map((s) => (
            <div key={s.num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s.num ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`ml-2 text-sm ${step >= s.num ? "text-gray-900" : "text-gray-500"}`}>
                {s.label}
              </span>
              {s.num < 3 && <div className={`w-16 lg:w-24 h-0.5 mx-4 ${step > s.num ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Step 1: Order Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position Title <span className="text-red-500">*</span>
              </label>
              <input
                value={formData.positionTitle}
                onChange={(e) => updateField("positionTitle", e.target.value)}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.positionTitle ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g. Software Engineer"
              />
              {errors.positionTitle && <p className="text-red-500 text-xs mt-1">{errors.positionTitle}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                value={formData.department}
                onChange={(e) => updateField("department", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Engineering"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number (optional)</label>
              <input
                value={formData.referenceNumber}
                onChange={(e) => updateField("referenceNumber", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your internal reference"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Screening Reason</label>
              <select
                value={formData.screeningReason}
                onChange={(e) => updateField("screeningReason", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {screeningReasons.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Package Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Package</h2>

            {packagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Package Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        updateField("selectedPackageId", pkg.id);
                        updateField("useCustom", false);
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.selectedPackageId === pkg.id && !formData.useCustom
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-gray-400" />
                          <div>
                            <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                            <p className="text-sm text-gray-500">{pkg.description || "No description"}</p>
                          </div>
                        </div>
                        {formData.selectedPackageId === pkg.id && !formData.useCustom && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">${Number(pkg.price).toFixed(2)}</span>
                        <span className="text-sm text-gray-500">{pkg.turnaroundTimeDays} days</span>
                      </div>
                    </div>
                  ))}
                </div>

                {errors.selectedPackageId && <p className="text-red-500 text-sm">{errors.selectedPackageId}</p>}

                {/* Custom/A la Carte Option */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.useCustom}
                      onChange={(e) => {
                        updateField("useCustom", e.target.checked);
                        if (e.target.checked) {
                          updateField("selectedPackageId", null);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Custom / À la Carte</span>
                  </label>

                  {formData.useCustom && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Select services:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {services.map((svc) => (
                          <label key={svc.id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData.customServices.includes(svc.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateField("customServices", [...formData.customServices, svc.id]);
                                } else {
                                  updateField("customServices", formData.customServices.filter(id => id !== svc.id));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm">{svc.name}</span>
                            <span className="ml-auto text-sm text-gray-500">${Number(svc.basePrice).toFixed(2)}</span>
                          </label>
                        ))}
                      </div>
                      {errors.customServices && <p className="text-red-500 text-sm mt-1">{errors.customServices}</p>}
                      
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total:</span>
                        <span className="text-xl font-bold text-gray-900">${customPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Applicant Entry Method */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicant Entry</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Enter Now */}
              <div
                onClick={() => updateField("applicantEntryMethod", "now")}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.applicantEntryMethod === "now"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Users className="w-8 h-8 text-gray-400 mb-3" />
                <h3 className="font-medium text-gray-900">Enter Information Now</h3>
                <p className="text-sm text-gray-500 mt-1">Fill in applicant details immediately</p>
              </div>

              {/* Option B: Send Invitation */}
              <div
                onClick={() => updateField("applicantEntryMethod", "invite")}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.applicantEntryMethod === "invite"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Mail className="w-8 h-8 text-gray-400 mb-3" />
                <h3 className="font-medium text-gray-900">Send Invitation Link</h3>
                <p className="text-sm text-gray-500 mt-1">Applicant fills their own details via secure link</p>
              </div>
            </div>

            {errors.applicantEntryMethod && <p className="text-red-500 text-sm">{errors.applicantEntryMethod}</p>}

            {/* Show email fields if inviting */}
            {formData.applicantEntryMethod === "invite" && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Applicant Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.applicantEmail}
                    onChange={(e) => updateField("applicantEmail", e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.applicantEmail ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="applicant@example.com"
                  />
                  {errors.applicantEmail && <p className="text-red-500 text-xs mt-1">{errors.applicantEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={formData.applicantPhone}
                    onChange={(e) => updateField("applicantPhone", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-4">
          {step < 3 && (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleSubmit}
              disabled={createOrder.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                <>Submit Order</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Order Summary */}
      {step === 3 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Order Summary</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Position:</span> {formData.positionTitle}</p>
            <p><span className="font-medium">Package:</span> {formData.useCustom ? "Custom Services" : selectedPackage?.name || "Not selected"}</p>
            <p><span className="font-medium">Total:</span> ${displayPrice.toFixed(2)}</p>
            <p><span className="font-medium">Applicant:</span> {
              formData.applicantEntryMethod === "now" ? "Enter now" : 
              formData.applicantEntryMethod === "invite" ? `Invite: ${formData.applicantEmail}` : 
              "Not specified"
            }</p>
          </div>
        </div>
      )}
    </div>
  );
}
