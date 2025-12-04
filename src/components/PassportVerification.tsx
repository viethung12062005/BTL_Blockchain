import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { useVote } from '../pages/VoteContext';
import { PrivadoService } from '../services/privadoService';
import { voteContractAddress } from '../constants/voteContract';

const PassportVerification: React.FC = () => {
  const navigate = useNavigate();
  const { setVerifiableCredential, setAuthMethod } = useVote();
  const [qrData, setQrData] = useState<string>('');
  const [manualProof, setManualProof] = useState('');

  useEffect(() => {
    // Tạo Request JSON cho Privado ID
    const request = PrivadoService.createVotingRequest(
        voteContractAddress, 
        11155111 // Sepolia Chain ID
    );
    setQrData(JSON.stringify(request));
  }, []);

  const handleProofSubmit = () => {
      if (!manualProof) {
          alert("Vui lòng dán Proof từ ví Privado ID!");
          return;
      }

      const parsedProof = PrivadoService.parseProof(manualProof);
      
      if (parsedProof) {
        setVerifiableCredential(parsedProof);
        setAuthMethod('passport');
        alert("✅ Đã nhận Bằng chứng! Chuyển đến trang bỏ phiếu.");
        navigate('/vote');
      } else {
        alert("❌ Bằng chứng không đúng định dạng JSON.");
      }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ flex: "1", backgroundColor: "#f8f9fa", padding: "40px 20px" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", backgroundColor: "white", borderRadius: "12px", padding: "30px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h1 style={{ color: "#7B3FE4", marginBottom: "10px", fontSize: "1.8rem" }}>
              Xác thực Privado ID
            </h1>
            <p style={{ color: "#666" }}>
              Hệ thống bỏ phiếu ẩn danh sử dụng Zero-Knowledge Proofs.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "30px" }}>
            
            {/* Bước 1: Quét QR */}
            <div style={{ textAlign: "center", width: "100%" }}>
                <h3 style={{ marginBottom: "15px", color: "#333" }}>1. Quét mã QR</h3>
                <div style={{ padding: "20px", border: "2px dashed #e0e0e0", borderRadius: "12px", display: "inline-block", backgroundColor: "#fff" }}>
                    {qrData ? (
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`}
                            alt="Privado QR Code"
                            style={{ width: "250px", height: "250px" }}
                        />
                    ) : (
                        <p>Đang tạo mã...</p>
                    )}
                </div>
                <p style={{ fontSize: "0.9rem", color: "#888", marginTop: "15px" }}>
                    Mở app <strong>Privado ID</strong> {'->'} Scan {'->'} Chấp nhận yêu cầu.
                </p>
            </div>

            {/* Bước 2: Nhập Proof */}
            <div style={{ width: "100%", borderTop: "1px solid #eee", paddingTop: "20px" }}>
                <h3 style={{ marginBottom: "15px", color: "#333" }}>2. Nhập Bằng chứng (Proof)</h3>
                <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "10px" }}>
                    Sau khi tạo Proof thành công trên ví, hãy copy JSON và dán vào đây:
                </p>
                
                <textarea 
                    value={manualProof}
                    onChange={(e) => setManualProof(e.target.value)}
                    placeholder='{"id": "...", "typ": "application/iden3-zkp-json", ...}'
                    style={{ 
                        width: "100%", 
                        height: "150px", 
                        padding: "12px", 
                        borderRadius: "8px", 
                        border: "1px solid #ccc", 
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        resize: "vertical"
                    }}
                />
                
                <button
                    onClick={handleProofSubmit}
                    style={{
                        marginTop: "20px",
                        width: "100%",
                        backgroundColor: "#7B3FE4",
                        color: "white",
                        padding: "14px",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                        cursor: "pointer",
                        transition: "background-color 0.2s"
                    }}
                >
                    Xác nhận & Bỏ phiếu ➔
                </button>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PassportVerification;