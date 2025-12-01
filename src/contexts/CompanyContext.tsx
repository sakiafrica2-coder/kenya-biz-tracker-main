import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  registration_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
}

interface CompanyContextType {
  selectedCompany: Company | null;
  companies: Company[];
  loading: boolean;
  selectCompany: (companyId: string) => void;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading companies");
      setLoading(false);
      return;
    }

    setCompanies(data || []);

    // Load user preference for selected company
    const { data: preference } = await supabase
      .from("user_preferences")
      .select("selected_company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (preference?.selected_company_id) {
      const company = data?.find((c) => c.id === preference.selected_company_id);
      if (company) {
        setSelectedCompany(company);
      } else if (data && data.length > 0) {
        setSelectedCompany(data[0]);
      }
    } else if (data && data.length > 0) {
      setSelectedCompany(data[0]);
    }

    setLoading(false);
  };

  const selectCompany = async (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (!company) return;

    setSelectedCompany(company);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save preference
    await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, selected_company_id: companyId },
        { onConflict: "user_id" }
      );
  };

  const refreshCompanies = async () => {
    await fetchCompanies();
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        selectedCompany,
        companies,
        loading,
        selectCompany,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};
