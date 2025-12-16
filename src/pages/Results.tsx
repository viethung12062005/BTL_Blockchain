import React, { useEffect, useState } from 'react';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useWallet } from "../context/WalletContext";
import { ethers } from "ethers";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "../constants/voteContract";
import { useTranslation } from 'react-i18next';

// --- Types ---
interface ElectionSummary {
  id: number;
  name: string;
  isActive: boolean;
}

interface CandidateResult {
  id: number;
  name: string;
  voteCount: number;
}

interface ElectionResult {
  electionName: string;
  isActive: boolean;
  totalVotes: number;
  candidates: CandidateResult[];
}

const Results: React.FC = () => {
  const { t } = useTranslation();
  const { isConnected, connect } = useWallet();
  
  const [elections, setElections] = useState<ElectionSummary[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const [resultData, setResultData] = useState<ElectionResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Fetch List of Elections
  useEffect(() => {
    if (isConnected) {
      fetchElectionList();
    }
  }, [isConnected]);

  // 2. Fetch Details when selection changes
  useEffect(() => {
    if (selectedElectionId !== null) {
      fetchDetails(selectedElectionId);
    }
  }, [selectedElectionId]);

  const fetchElectionList = async () => {
    try {
      if (!window.ethereum) return;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI, provider);
      const count = await contract.electionCount();
      
      const list: ElectionSummary[] = [];
      for (let i = count.toNumber(); i >= 1; i--) {
        const e = await contract.getElection(i);
        list.push({
          id: i, // Lưu ý: id chính là index vòng lặp
          name: e.name,
          isActive: e.isActive
        });
      }
      setElections(list);
    } catch (e) {
      console.error("Error loading list:", e);
    }
  };

  // Logic này thay thế cho hook getVoteResults cũ
  const fetchDetails = async (id: number) => {
    setLoading(true);
    try {
      if (!window.ethereum) return;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI, provider);

      // 1. Lấy thông tin cuộc bầu cử
      const electionInfo = await contract.getElection(id);
      
      // 2. Lấy danh sách ứng viên và số phiếu
      const candidatesData = await contract.getCandidates(id);

      let total = 0;
      const formattedCandidates: CandidateResult[] = candidatesData.map((c: any) => {
        const count = c.voteCount.toNumber();
        total += count;
        return {
          id: c.id.toNumber(),
          name: c.name,
          voteCount: count
        };
      });

      setResultData({
        electionName: electionInfo.name,
        isActive: electionInfo.isActive,
        totalVotes: total,
        candidates: formattedCandidates
      });

    } catch (e) {
      console.error("Error fetching details:", e);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderProgressBar = (votes: number, total: number) => {
    const percent = total > 0 ? (votes / total) * 100 : 0;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto p-4 md:p-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">
          {t('common.voteResults') || "Election Results"}
        </h1>

        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Connect wallet to view public blockchain results.</p>
            <button onClick={connect} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition">
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Election List */}
            <div className="md:col-span-1 bg-white rounded-xl shadow p-4 h-fit">
              <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Select Election</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {elections.map(e => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedElectionId(e.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors border ${
                      selectedElectionId === e.id 
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                        : "hover:bg-gray-50 border-transparent text-gray-600"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>#{e.id} {e.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${e.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {e.isActive ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </button>
                ))}
                {elections.length === 0 && <p className="text-gray-400 text-sm text-center">No elections found.</p>}
              </div>
            </div>

            {/* RIGHT COLUMN: Detailed Results */}
            <div className="md:col-span-2">
              {loading ? (
                <div className="flex justify-center p-12 bg-white rounded-xl shadow">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : resultData ? (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-indigo-600 p-6 text-white">
                    <h2 className="text-2xl font-bold">{resultData.electionName}</h2>
                    <div className="flex gap-4 mt-2 text-indigo-100 text-sm">
                      <span>Total Votes: <strong>{resultData.totalVotes}</strong></span>
                      <span>Status: <strong>{resultData.isActive ? "Ongoing" : "Ended"}</strong></span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Sorting for Display: Most votes first */}
                    {[...resultData.candidates]
                      .sort((a, b) => b.voteCount - a.voteCount)
                      .map((c, index) => (
                      <div key={c.id} className="mb-6 last:mb-0">
                        <div className="flex justify-between items-end mb-1">
                          <div className="flex items-center">
                            {index === 0 && resultData.totalVotes > 0 && (
                              <span className="text-xl mr-2">👑</span>
                            )}
                            <span className="font-bold text-gray-800 text-lg">{c.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="block font-bold text-indigo-600">{c.voteCount} votes</span>
                            <span className="text-xs text-gray-500">
                              {resultData.totalVotes > 0 
                                ? ((c.voteCount / resultData.totalVotes) * 100).toFixed(1) 
                                : 0}%
                            </span>
                          </div>
                        </div>
                        {renderProgressBar(c.voteCount, resultData.totalVotes)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
                  Select an election from the list to view results.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Results;