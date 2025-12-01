import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompany } from "@/contexts/CompanyContext";
import { useNavigate } from "react-router-dom";

export const CompanySelector = () => {
  const { selectedCompany, companies, selectCompany } = useCompany();
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-5 w-5 text-muted-foreground" />
      {companies.length > 0 ? (
        <Select
          value={selectedCompany?.id || ""}
          onValueChange={selectCompany}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="text-sm text-muted-foreground">No companies</span>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate("/companies")}
      >
        <Plus className="h-4 w-4 mr-1" />
        Manage
      </Button>
    </div>
  );
};
