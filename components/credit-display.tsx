"use client"
import { useState, useEffect, useCallback } from "react"
import { Wallet } from "lucide-react"
import { firebaseCreditsService } from "@/lib/firebase-credits"

interface CreditDisplayProps {
  userId?: string;
  refreshTrigger?: number; // Used to trigger refresh
}

export default function CreditDisplay({ userId = 'demo_user', refreshTrigger = 0 }: CreditDisplayProps) {
  const [credits, setCredits] = useState<number>(1250);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);

  const fetchCredits = useCallback(async (isAuto: boolean = false) => {
    if (isAuto) {
      setIsAutoUpdating(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const result = await firebaseCreditsService.getUserCredits(userId);
      
      if (result.success) {
        setCredits(result.credits);
        setLastUpdate(new Date().toLocaleString('th-TH'));
      } else {
        console.error("Failed to fetch credits:", result.error);
        // Keep existing credits on error
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
      // Keep existing credits on error
    } finally {
      setIsLoading(false);
      setIsAutoUpdating(false);
    }
  }, [userId]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchCredits(false); // Initial fetch
    
    const interval = setInterval(() => {
      fetchCredits(true); // Auto refresh
    }, 10000); // Auto-refresh every 10 seconds

    return () => clearInterval(interval);
  }, [fetchCredits]);

  // Trigger refresh when refreshTrigger changes (for immediate updates)
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchCredits(false); // Immediate refresh
    }
  }, [refreshTrigger, fetchCredits]);

  const formatCredits = (amount: number) => {
    return amount.toLocaleString('th-TH');
  };

  return (
    <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-500/20 rounded-xl">
          <Wallet className="h-5 w-5 text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-gray-400 text-sm">ยอดเงินคงเหลือปัจจุบัน</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              ฿{formatCredits(credits)}
            </span>
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
            )}
            {isAutoUpdating && (
              <div className="flex items-center gap-1">
                <div className="animate-pulse h-2 w-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-green-400">อัปเดต</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        อัปเดตล่าสุด: {lastUpdate || "กำลังโหลด..."}
      </div>
    </div>
  );
} 