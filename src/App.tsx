import React from "react";
import "./i18n";
import './index.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { VoteProvider } from "./pages/VoteContext";
import { WalletProvider } from "./context/WalletContext";

// Pages
import HomePage from "./pages/HomePage";
import Vote from "./pages/Vote";
import AdminGUI from "./pages/AdminGUI";
import Results from "./pages/Results";
import PassportVote from "./pages/PassportVote";

const App: React.FC = () => {
    return (
        <WalletProvider>
            <VoteProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        {/* Khu vực Bỏ phiếu */}
                        <Route path="/vote" element={<Vote />} />
                        {/* Khu vực Xác thực QR Code */}
                        <Route path="/vote/passport" element={<PassportVote />} />
                        {/* Khu vực Admin */}
                        <Route path="/create-proposal" element={<AdminGUI />} />
                        {/* Khu vực Kết quả */}
                        <Route path="/results" element={<Results />} />
                    </Routes>
                </Router>
            </VoteProvider>
        </WalletProvider>
    );
};

export default App;