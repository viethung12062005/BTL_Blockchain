import React, { useState } from 'react';
import { Button } from "rimble-ui"; // Giữ lại UI cũ của bạn
import { ethers } from "ethers";
import { useTranslation } from 'react-i18next';
import { useWallet } from "../context/WalletContext";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "../constants/voteContract";

// Định nghĩa lại Props cho phù hợp với hệ thống mới
interface Candidate {
  id: number;
  name: string;
  voteCount: number;
}

interface VoteOptionsDisplayProps {
  electionId: number;       // ID cuộc bầu cử (Bắt buộc)
  electionName: string;     // Tên cuộc bầu cử
  candidates: Candidate[];  // Danh sách ứng viên
  onSuccess: () => void;    // Hàm callback khi vote thành công
  onBack: () => void;       // Hàm quay lại danh sách
}

export const VoteOptionsDisplay: React.FC<VoteOptionsDisplayProps> = ({ 
  electionId, 
  electionName, 
  candidates, 
  onSuccess,
  onBack
}) => {
  const { t } = useTranslation();
  const { isConnected } = useWallet();
  
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Xử lý logic Bỏ phiếu trực tiếp tại đây
  const handleVote = async () => {
    if (selectedCandidateId === null) {
      alert(t('common.selectProposalError') || "Please select a candidate first");
      return;
    }

    if (!isConnected || !window.ethereum) {
      alert("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI, signer);

      console.log(`Voting for Candidate #${selectedCandidateId} in Election #${electionId}`);

      // Gọi Smart Contract mới
      const tx = await contract.vote(electionId, selectedCandidateId);
      setTxHash(tx.hash);
      
      console.log("Tx sent:", tx.hash);
      await tx.wait(); // Chờ confirm

      // Gọi callback để báo cho component cha (Vote.tsx) biết
      onSuccess();
      
    } catch (err: any) {
      console.error(err);
      // Xử lý lỗi thường gặp
      let msg = err.reason || err.message || "Unknown error";
      if (msg.includes("Already voted")) msg = "You have already voted in this election!";
      if (msg.includes("Election is closed")) msg = "This election has ended.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-indigo-600">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{electionName}</h2>
        <button 
          onClick={onBack}
          className="text-gray-500 hover:text-gray-800 text-sm underline"
        >
          ← {t('common.back') || "Back"}
        </button>
      </div>

      <p className="text-green-600 font-medium mb-6 flex items-center bg-green-50 p-3 rounded-lg">
        <span className="mr-2">✅</span> 
        {t('validation.identityVerified') || "Identity Verified via Polygon ID"}
      </p>

      {/* Danh sách ứng viên */}
      <div className="space-y-4 mb-8">
        {candidates.map((candidate) => (
          <div 
            key={candidate.id} 
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
              selectedCandidateId === candidate.id 
                ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600" 
                : "border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => setSelectedCandidateId(candidate.id)}
          >
            <input
              type="radio"
              name="candidate"
              checked={selectedCandidateId === candidate.id}
              onChange={() => setSelectedCandidateId(candidate.id)}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label className="ml-3 block text-lg font-medium text-gray-900 flex-1 cursor-pointer">
              {candidate.name}
            </label>
            {/* <span className="text-sm text-gray-500">ID: {candidate.id}</span> */}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Transaction Hash */}
      {txHash && !error && (
        <div className="mb-6 p-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm break-all">
          🚀 Tx submitted: {txHash}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center">
        <Button
          onClick={handleVote}
          disabled={selectedCandidateId === null || isSubmitting}
          width="100%"
          mainColor="#5856D6"
          style={{ height: '50px', fontSize: '1.1rem' }}
        >
          {isSubmitting ? "⏳ Processing on Blockchain..." : (t('common.sendVote') || "Cast Vote")}
        </Button>
      </div>
    </div>
  );
};