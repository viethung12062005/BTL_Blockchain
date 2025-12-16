import React, { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useWallet } from "../context/WalletContext";
import { useVote } from "./VoteContext";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "../constants/voteContract";
import { VoteOptionsDisplay } from "../components/VoteOptionsDisplay";
import { useTranslation } from 'react-i18next';

// --- Định nghĩa kiểu dữ liệu ---
interface Election {
  id: number;
  name: string;
  credentialSchema: string;
  credentialQuery: string;
  endTime: number;
  isActive: boolean;
}

interface Candidate {
  id: number;
  name: string;
  voteCount: number;
}

const Vote: React.FC = () => {
  const { t } = useTranslation();
  const { isConnected, connect } = useWallet();
  const { hasVerifiedForElection } = useVote();
  const navigate = useNavigate();

  // State
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Tải danh sách bầu cử khi vào trang
  useEffect(() => {
    if (isConnected) fetchElections();
  }, [isConnected]);

  const fetchElections = async () => {
    try {
      setLoading(true);
      if (!window.ethereum) return;
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI, provider);

      // Lấy tổng số cuộc bầu cử
      const count = await contract.electionCount();
      const loadedElections: Election[] = [];

      // Lặp ngược từ mới nhất về cũ nhất
      for (let i = count.toNumber(); i >= 1; i--) {
        const e = await contract.getElection(i);
        loadedElections.push({
          id: i, // ID dùng để truy vấn contract
          name: e.name,
          credentialSchema: e.credentialSchema,
          credentialQuery: e.credentialQuery,
          endTime: e.endTime.toNumber(),
          isActive: e.isActive
        });
      }
      setElections(loadedElections);
    } catch (err) {
      console.error("Fetch elections failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Xử lý khi người dùng chọn một cuộc bầu cử
  const handleSelectElection = async (election: Election) => {
    if (!election.isActive) {
      alert("This election has ended.");
      return;
    }

    // Kiểm tra Context: Người dùng đã verify cho cuộc bầu cử này chưa?
    const isVerified = hasVerifiedForElection(election.id);

    if (!isVerified) {
      const encodedQuery = encodeURIComponent(election.credentialQuery);
      // TRƯỜNG HỢP 1: Chưa Verify -> Chuyển sang trang quét QR
      console.log(`Redirecting to verify with Query:`, election.credentialQuery);
      navigate(`/vote/passport?electionId=${election.id}&schema=${election.credentialSchema}&query=${encodedQuery}`);
    } else {
      // TRƯỜNG HỢP 2: Đã Verify -> Vào phòng bỏ phiếu
      setSelectedElection(election);
      await fetchCandidates(election.id);
    }
  };

  // Lấy danh sách ứng viên từ Contract
  const fetchCandidates = async (electionId: number) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI, provider);
      const data = await contract.getCandidates(electionId);
      
      const formatted = data.map((c: any) => ({
        id: c.id.toNumber(),
        name: c.name,
        voteCount: c.voteCount.toNumber()
      }));
      setCandidates(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  // Callback khi bỏ phiếu thành công
  const handleVoteSuccess = () => {
    alert("🎉 Vote cast successfully!");
    setSelectedElection(null); // Quay lại danh sách
    fetchElections(); // Cập nhật lại số liệu
  };

  // --- RENDER GIAO DIỆN ---

  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Secure Electronic Voting</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Decentralized voting platform protected by Polygon ID Zero-Knowledge Proofs.
          </p>
          <button onClick={connect} className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg transform hover:-translate-y-1">
            Connect Wallet to Start
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8 max-w-5xl">
        
        {/* VIEW 1: DANH SÁCH BẦU CỬ (Hiển thị khi chưa chọn cuộc nào) */}
        {!selectedElection ? (
          <div>
            <h1 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Ongoing Elections</h1>
            
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : elections.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-xl shadow border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No active elections found.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {elections.map((election) => (
                  <div key={election.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition duration-300 overflow-hidden border border-gray-100 flex flex-col">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                          #{election.id}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${election.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {election.isActive ? 'ACTIVE' : 'ENDED'}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{election.name}</h3>
                      
                      <div className="space-y-2 text-sm text-gray-600 mt-4">
                        <div className="flex items-center">
                          <span className="mr-2">🔐</span>
                          <span>Required: <strong>{election.credentialSchema}</strong></span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">⏳</span>
                          <span>Ends: {new Date(election.endTime * 1000).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <button 
                        onClick={() => handleSelectElection(election)}
                        disabled={!election.isActive}
                        className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                          !election.isActive 
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : hasVerifiedForElection(election.id)
                              ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                        }`}
                      >
                        {election.isActive 
                          ? (hasVerifiedForElection(election.id) ? "🗳️ Enter Voting Booth" : "🛡️ Verify Identity & Vote")
                          : "Results Only"
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          
          /* VIEW 2: GIAO DIỆN BỎ PHIẾU (Sử dụng Component VoteOptionsDisplay) */
          <div className="max-w-3xl mx-auto">
            <VoteOptionsDisplay 
              electionId={selectedElection.id}
              electionName={selectedElection.name}
              candidates={candidates}
              onSuccess={handleVoteSuccess}
              onBack={() => setSelectedElection(null)}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Vote;