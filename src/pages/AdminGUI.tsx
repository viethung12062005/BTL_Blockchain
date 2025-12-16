import React, { useState, useEffect } from 'react';
import { useWallet } from "../context/WalletContext";
import { Header } from "../components/Header";
import { ethers } from "ethers";
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from "../constants/voteContract";
import { AVAILABLE_SCHEMAS, PolygonSchema } from "../data/polygonIdSchemas";

const AdminGUI: React.FC = () => {
  const { account, connect, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);

  // Form Basic Info
  const [electionName, setElectionName] = useState("");
  const [candidates, setCandidates] = useState(""); 
  const [duration, setDuration] = useState(60); 

  // Schema Logic
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [selectedSchemaType, setSelectedSchemaType] = useState(AVAILABLE_SCHEMAS[0].type);
  
  // Dynamic Values: Lưu giá trị người dùng nhập vào các ô input động
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
  
  // Final Output: Chuỗi JSON cuối cùng sẽ gửi lên Contract
  const [finalQueryJson, setFinalQueryJson] = useState("");
  const [customSchemaType, setCustomSchemaType] = useState("VotingCredential");

  // Hàm helper chuyển đổi ngày YYYY-MM-DD sang số nguyên YYYYMMDD (Chuẩn Polygon ID)
  const dateToInteger = (dateString: string) => {
    return parseInt(dateString.replaceAll("-", ""));
  };

  // Effect: Tự động tạo JSON Query mỗi khi input thay đổi
  useEffect(() => {
    if (isCustomMode) return; // Nếu đang chế độ Custom thì không tự tạo

    const schemaDef = AVAILABLE_SCHEMAS.find(s => s.type === selectedSchemaType);
    if (!schemaDef) return;

    const query: Record<string, any> = {};

    schemaDef.fields.forEach(field => {
      const userValue = dynamicValues[field.key];
      
      if (userValue !== undefined && userValue !== "") {
        let finalVal = userValue;
        
        // Xử lý đặc biệt cho ngày tháng
        if (field.type === 'date') {
          finalVal = dateToInteger(userValue);
        }
        // Xử lý cho số
        if (field.type === 'number') {
          finalVal = Number(userValue);
        }
        // Xử lý cho Select (nếu operator là $in thì cần mảng)
        if (field.operator === '$in' && !Array.isArray(finalVal)) {
            finalVal = [Number(finalVal)];
        }

        query[field.key] = { [field.operator]: finalVal };
      }
    });

    setFinalQueryJson(JSON.stringify(query, null, 2));
  }, [selectedSchemaType, dynamicValues, isCustomMode]);

  const handleDynamicChange = (key: string, value: any) => {
    setDynamicValues(prev => ({ ...prev, [key]: value }));
  };

  const createElection = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");
    
    // Validate JSON
    try {
        JSON.parse(finalQueryJson);
    } catch (e) {
        return alert("Invalid JSON format!");
    }

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI, signer);

      const candidateList = candidates.split(',').map(name => name.trim()).filter(name => name !== "");
      if (candidateList.length < 2) return alert("At least 2 candidates required.");

      // Xác định tên Schema cuối cùng
      const schemaNameToSend = isCustomMode ? customSchemaType : selectedSchemaType;

      console.log("Creating Election:", { 
        name: electionName, 
        schema: schemaNameToSend, 
        query: finalQueryJson 
      });

      const tx = await contract.createElection(
        electionName,
        candidateList,
        schemaNameToSend, 
        finalQueryJson,
        duration
      );

      await tx.wait(); 
      alert("✅ Election Created Successfully!");
      
      // Reset
      setElectionName("");
      setCandidates("");
    } catch (error: any) {
      console.error(error);
      alert("Error: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Render Dynamic Inputs
  const renderDynamicInputs = () => {
    const schema = AVAILABLE_SCHEMAS.find(s => s.type === selectedSchemaType);
    if (!schema) return null;

    if (schema.fields.length === 0) {
        return <p className="text-sm text-gray-500 italic">No specific conditions required for this credential.</p>;
    }

    return schema.fields.map((field) => (
      <div key={field.key} className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label} <span className="text-xs text-gray-400">({field.operator})</span>
        </label>
        
        {field.type === 'date' && (
          <input 
            type="date" 
            className="w-full p-2 border rounded"
            onChange={(e) => handleDynamicChange(field.key, e.target.value)}
          />
        )}

        {field.type === 'number' && (
          <input 
            type="number" 
            className="w-full p-2 border rounded"
            placeholder="Enter number..."
            onChange={(e) => handleDynamicChange(field.key, e.target.value)}
          />
        )}

        {field.type === 'select' && field.options && (
          <select 
            className="w-full p-2 border rounded bg-white"
            onChange={(e) => handleDynamicChange(field.key, e.target.value)}
          >
            <option value="">-- Select --</option>
            {field.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
        
        {field.description && <p className="text-xs text-gray-500 mt-1">{field.description}</p>}
      </div>
    ));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto p-8 max-w-3xl">
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <h1 className="text-3xl font-bold mb-6 text-indigo-700 border-b pb-4">Create Election</h1>

          {!isConnected ? (
            <div className="text-center py-8">
              <button onClick={connect} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Connect Wallet</button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Election Name</label>
                    <input type="text" value={electionName} onChange={(e) => setElectionName(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="ex: Board Voting" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Duration (Minutes)</label>
                    <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full p-3 border rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Candidates</label>
                <input type="text" value={candidates} onChange={(e) => setCandidates(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Alice, Bob, Charlie..." />
              </div>

              <hr className="my-6 border-gray-200" />

              {/* Schema Selection Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                    <label className="block text-lg font-bold text-gray-800">Verification Requirement</label>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Advanced Mode</span>
                        <input 
                            type="checkbox" 
                            checked={isCustomMode} 
                            onChange={(e) => setIsCustomMode(e.target.checked)} 
                            className="h-5 w-5 text-indigo-600"
                        />
                    </div>
                </div>

                {!isCustomMode ? (
                    // --- STANDARD MODE ---
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Credential Type</label>
                            <select 
                                value={selectedSchemaType} 
                                onChange={(e) => {
                                    setSelectedSchemaType(e.target.value);
                                    setDynamicValues({}); // Reset values when schema changes
                                }} 
                                className="w-full p-3 border rounded-lg bg-white"
                            >
                                {AVAILABLE_SCHEMAS.map(s => (
                                    <option key={s.type} value={s.type}>{s.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                {AVAILABLE_SCHEMAS.find(s => s.type === selectedSchemaType)?.description}
                            </p>
                        </div>

                        <div className="mb-4 border-t pt-4">
                            <h4 className="font-semibold text-gray-700 mb-3">Define Conditions:</h4>
                            {renderDynamicInputs()}
                        </div>
                    </div>
                ) : (
                    // --- CUSTOM / IMPORT MODE ---
                    <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-200">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Schema Type (String)</label>
                            <input 
                                type="text" 
                                value={customSchemaType} 
                                onChange={(e) => setCustomSchemaType(e.target.value)} 
                                className="w-full p-3 border rounded-lg bg-white"
                                placeholder="e.g. VotingCredential"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Query JSON</label>
                            <textarea 
                                value={finalQueryJson}
                                onChange={(e) => setFinalQueryJson(e.target.value)}
                                className="w-full p-3 border rounded-lg h-32 font-mono text-sm"
                                placeholder='{"birthday": {"$lt": 20000101}}'
                            />
                        </div>
                    </div>
                )}

                {/* Preview JSON */}
                {!isCustomMode && (
                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Generated Query Preview</label>
                        <pre className="bg-gray-800 text-green-400 p-3 rounded-md text-xs overflow-x-auto">
                            {finalQueryJson || "{}"}
                        </pre>
                    </div>
                )}
              </div>

              <button 
                onClick={createElection} 
                disabled={loading} 
                className="w-full py-4 rounded-xl text-white font-bold text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg mt-6"
              >
                {loading ? "Processing..." : "🚀 Launch Election"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminGUI;