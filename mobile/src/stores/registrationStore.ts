import { create } from 'zustand';
import { UserRole } from './authStore';

export interface DocumentUpload {
  type: 'aadhaar' | 'pan' | 'land_record' | 'bank_statement';
  uri: string;
  fileName: string;
  uploadedAt?: string;
}

export interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface FarmerDetails {
  farmName?: string;
  farmSize: string;
  farmLocation: string;
  farmType: string;
  cropsGrown: string[];
  irrigationType: string;
  yearsOfExperience: number;
}

export interface InvestorDetails {
  investmentRange: string;
  investmentGoals: string[];
  preferredFarmTypes: string[];
  expectedROI: number;
}

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

interface RegistrationState {
  currentStep: number;
  totalSteps: number;
  
  userRole: UserRole;
  formData: RegistrationFormData;
  
  documents: DocumentUpload[];
  
  farmerDetails: FarmerDetails | null;
  investorDetails: InvestorDetails | null;
  
  bankDetails: BankDetails;
  
  isSubmitting: boolean;
  errors: Record<string, string>;

  setUserRole: (role: UserRole) => void;
  setFormData: (data: Partial<RegistrationFormData>) => void;
  updateFormData: (field: string, value: string) => void;
  
  addDocument: (doc: DocumentUpload) => void;
  removeDocument: (type: DocumentUpload['type']) => void;
  
  setFarmerDetails: (details: FarmerDetails) => void;
  setInvestorDetails: (details: InvestorDetails) => void;
  setBankDetails: (details: Partial<BankDetails>) => void;
  
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  
  setIsSubmitting: (isSubmitting: boolean) => void;
  
  reset: () => void;
}

const initialFormData: RegistrationFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

const initialBankDetails: BankDetails = {
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  bankName: '',
};

export const useRegistrationStore = create<RegistrationState>((set, get) => ({
  currentStep: 1,
  totalSteps: 4,
  
  userRole: null,
  formData: initialFormData,
  
  documents: [],
  
  farmerDetails: null,
  investorDetails: null,
  
  bankDetails: initialBankDetails,
  
  isSubmitting: false,
  errors: {},

  setUserRole: (userRole) => set({ userRole }),

  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data },
  })),

  updateFormData: (field, value) => set((state) => ({
    formData: { ...state.formData, [field]: value },
    errors: { ...state.errors, [field]: '' },
  })),

  addDocument: (doc) => set((state) => {
    const existingIndex = state.documents.findIndex((d) => d.type === doc.type);
    if (existingIndex >= 0) {
      const newDocs = [...state.documents];
      newDocs[existingIndex] = doc;
      return { documents: newDocs };
    }
    return { documents: [...state.documents, doc] };
  }),

  removeDocument: (type) => set((state) => ({
    documents: state.documents.filter((d) => d.type !== type),
  })),

  setFarmerDetails: (farmerDetails) => set({ farmerDetails }),

  setInvestorDetails: (investorDetails) => set({ investorDetails }),

  setBankDetails: (details) => set((state) => ({
    bankDetails: { ...state.bankDetails, ...details },
  })),

  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, state.totalSteps),
  })),

  prevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 1),
  })),

  setError: (field, error) => set((state) => ({
    errors: { ...state.errors, [field]: error },
  })),

  clearError: (field) => set((state) => {
    const { [field]: _, ...rest } = state.errors;
    return { errors: rest };
  }),

  clearAllErrors: () => set({ errors: {} }),

  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  reset: () => set({
    currentStep: 1,
    userRole: null,
    formData: initialFormData,
    documents: [],
    farmerDetails: null,
    investorDetails: null,
    bankDetails: initialBankDetails,
    isSubmitting: false,
    errors: {},
  }),
}));
