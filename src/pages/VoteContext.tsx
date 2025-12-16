import React, { createContext, useState, useContext, ReactNode } from 'react';

interface VoteContextType {
  // Mảng lưu các ID cuộc bầu cử đã xác thực. Ví dụ: [1, 5] nghĩa là đã xong cho Election 1 và 5.
  verifiedElectionIds: number[];
  
  // Hàm đánh dấu một cuộc bầu cử là đã xong xác thực
  markElectionAsVerified: (electionId: number) => void;
  
  // Hàm kiểm tra nhanh trạng thái xác thực của một cuộc bầu cử
  hasVerifiedForElection: (electionId: number) => boolean;

  // Phương thức xác thực (mặc định cho hệ thống mới)
  authMethod: string; 
}

const VoteContext = createContext<VoteContextType | undefined>(undefined);

export const VoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State lưu trữ danh sách ID
  const [verifiedElectionIds, setVerifiedElectionIds] = useState<number[]>([]);
  
  const authMethod = "polygon-id";

  // Hàm thêm ID vào danh sách đã xác thực
  const markElectionAsVerified = (electionId: number) => {
    if (!verifiedElectionIds.includes(electionId)) {
      console.log(`✅ [Context] User verified for Election #${electionId}`);
      setVerifiedElectionIds(prev => [...prev, electionId]);
    }
  };

  // Hàm kiểm tra
  const hasVerifiedForElection = (electionId: number) => {
    return verifiedElectionIds.includes(electionId);
  };

  return (
    <VoteContext.Provider value={{
      verifiedElectionIds,
      markElectionAsVerified,
      hasVerifiedForElection,
      authMethod
    }}>
      {children}
    </VoteContext.Provider>
  );
};

export const useVote = () => {
  const context = useContext(VoteContext);
  if (context === undefined) {
    throw new Error('useVote must be used within a VoteProvider');
  }
  return context;
};