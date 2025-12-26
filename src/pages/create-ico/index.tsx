import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { qipService, type CreateICOInput } from "@/utils/qip-service";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

const CreateICOPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState<CreateICOInput>({
    issuer: "",
    address1: "",
    address2: "",
    address3: "",
    address4: "",
    address5: "",
    address6: "",
    address7: "",
    address8: "",
    address9: "",
    address10: "",
    assetName: "",
    price1: 0,
    price2: 0,
    price3: 0,
    saleAmountForPhase1: 0,
    saleAmountForPhase2: 0,
    saleAmountForPhase3: 0,
    percent1: 0,
    percent2: 0,
    percent3: 0,
    percent4: 0,
    percent5: 0,
    percent6: 0,
    percent7: 0,
    percent8: 0,
    percent9: 0,
    percent10: 0,
    startEpoch: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const epoch = await qipService.getCurrentEpoch();
        setCurrentEpoch(epoch);
        setFormData((prev) => ({ ...prev, startEpoch: epoch + 3 }));
      } catch (error) {
        console.error("Failed to load epoch:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const totalPercent =
    formData.percent1 +
    formData.percent2 +
    formData.percent3 +
    formData.percent4 +
    formData.percent5 +
    formData.percent6 +
    formData.percent7 +
    formData.percent8 +
    formData.percent9 +
    formData.percent10;

  const isPercentValid = totalPercent === 95;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.startEpoch <= currentEpoch + 1) {
      setError("Start epoch must be at least 2 epochs in the future");
      return;
    }

    if (formData.price1 <= 0 || formData.price2 <= 0 || formData.price3 <= 0) {
      setError("All prices must be greater than zero");
      return;
    }

    if (formData.saleAmountForPhase1 <= 0 || formData.saleAmountForPhase2 <= 0 || formData.saleAmountForPhase3 <= 0) {
      setError("All sale amounts must be greater than zero");
      return;
    }

    if (!isPercentValid) {
      setError(`Percentages must sum to 95 (current: ${totalPercent})`);
      return;
    }

    setCreating(true);

    try {
      const result = await qipService.createICO(formData);

      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error("Create ICO error:", error);
      setError("Failed to create ICO. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--primary-40)] border-r-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-foreground mb-3 text-4xl font-bold text-balance">Create New ICO</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Launch a transparent token sale on the Qubic blockchain
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-opacity-10 rounded-lg border border-[color:var(--error-40)] bg-[color:var(--error-40)] p-4">
            <p className="text-sm text-[color:var(--error-40)]">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-opacity-10 rounded-lg border border-[color:var(--success-40)] bg-[color:var(--success-40)] p-4">
            <p className="text-sm text-[color:var(--success-40)]">{success}</p>
          </div>
        )}

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/")} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={creating || !isPercentValid}
            className={cn("flex-1", creating && "cursor-wait")}
          >
            {creating ? "Creating ICO..." : "Create ICO"}
          </Button>
        </div>
      </form>
    </>
  );
};

export default CreateICOPage;
