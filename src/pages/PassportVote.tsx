import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PrivadoIDService } from '../services/privadoService';
import { useVote } from './VoteContext';
import QRCode from 'react-qr-code';
import { useTranslation } from 'react-i18next';

const PassportVote: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { markElectionAsVerified } = useVote();
  
  // 1. Lấy thông tin từ URL (Được truyền từ trang Vote.tsx)
  const electionIdParam = searchParams.get('electionId');
  const schemaParam = searchParams.get('schema'); 
  const queryParamRaw = searchParams.get('query');

  const electionId = electionIdParam ? parseInt(electionIdParam) : 0;
  
  // Decode Query JSON từ URL
  let queryParam = {};
  try {
      queryParam = queryParamRaw ? JSON.parse(decodeURIComponent(queryParamRaw)) : {};
  } catch (e) {
      console.error("Failed to parse query from URL", e);
  }
  
  // State quản lý giao diện
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);
  
  // Ref để tránh gọi API 2 lần khi component mount (React 18 Strict Mode)
  const isRequesting = useRef(false);

  // 2. Kiểm tra tính hợp lệ đầu vào
  useEffect(() => {
    if (!electionId) {
      alert("Invalid Access: Missing Election ID");
      navigate('/vote'); // Đá về trang danh sách nếu truy cập sai
    }
  }, [electionId, navigate]);

  // 3. Tạo QR Code (Chạy 1 lần duy nhất)
  useEffect(() => {
    const initSession = async () => {
      if (!electionId || isRequesting.current) return;
      isRequesting.current = true;

      try {
        setStatus('Generating specialized QR Code...');
        setError(null);
        
        // Gọi Service với thông tin đầy đủ từ URL
        const response = await PrivadoIDService.requestVerificationLink({
          electionId: electionId,
          schemaType: schemaParam || "VotingCredential", // Fallback an toàn
          query: queryParam
        });

        setQrCodeData(response.link);
        setSessionId(response.sessionId);
        setStatus('Ready to Scan');
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Error generating QR code');
        setStatus('Error');
        isRequesting.current = false;
      }
    };

    initSession();
  }, [electionId, schemaParam]); // dependencies cơ bản

  // 4. Polling kiểm tra kết quả (Liên tục hỏi Server Backend)
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      const res = await PrivadoIDService.checkVerificationStatus(sessionId);
      
      if (res.status === 'verified') {
        clearInterval(interval);
        setStatus('✅ Identity Verified! Redirecting...');
        
        // QUAN TRỌNG: Lưu trạng thái vào Context toàn cục
        markElectionAsVerified(electionId);
        
        // Chuyển hướng người dùng quay lại trang bỏ phiếu sau 1.5 giây
        setTimeout(() => {
          navigate('/vote');
        }, 1500);
      }
    }, 2000); // Kiểm tra mỗi 2 giây

    return () => clearInterval(interval);
  }, [sessionId, electionId, markElectionAsVerified, navigate]);

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          
          {/* Header Card */}
          <div className="bg-indigo-600 p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-1">
              {t('passport.verification') || "Identity Verification"}
            </h2>
            <p className="text-indigo-100 text-sm">
              Securely prove your eligibility
            </p>
          </div>
          
          <div className="p-8 text-center">
            {/* Info Block */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left border-l-4 border-blue-500">
              <p className="text-sm text-blue-900 mb-1">
                <strong>Election ID:</strong> #{electionId}
              </p>
              <p className="text-sm text-blue-900">
                <strong>Required Credential:</strong> <span className="font-mono bg-blue-100 px-1 rounded">{schemaParam || "Standard Credential"}</span>
              </p>
            </div>
            
            {/* QR Code Area */}
            <div className="flex justify-center mb-6 p-4 bg-white border-2 border-gray-100 rounded-xl min-h-[280px] items-center shadow-inner relative">
              {error ? (
                <div className="text-red-500 flex flex-col items-center">
                  <span className="text-3xl mb-2">⚠️</span>
                  <p>{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    Retry
                  </button>
                </div>
              ) : qrCodeData ? (
                <div className="animate-fade-in">
                  <QRCode 
                    value={qrCodeData} 
                    size={256} 
                    style={{ maxWidth: "100%", height: "auto" }}
                    level="M" 
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                  <span>{status}</span>
                </div>
              )}
            </div>

            {/* Status Text */}
            <p className={`font-bold text-lg transition-colors duration-300 ${status.includes('Verified') ? 'text-green-600 scale-105' : 'text-gray-700'}`}>
              {status}
            </p>

            {/* Instructions */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-left">
              <h4 className="text-sm font-bold text-gray-700 mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Open <strong>Polygon ID Wallet</strong> on your mobile.</li>
                <li>Tap the <strong>Scan</strong> button.</li>
                <li>Scan the QR code above.</li>
                <li>Approve the proof request in your wallet.</li>
              </ol>
            </div>
            
            <button 
              onClick={() => navigate('/vote')}
              className="mt-6 text-gray-400 hover:text-gray-600 text-sm underline"
            >
              Cancel and return to voting
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PassportVote;