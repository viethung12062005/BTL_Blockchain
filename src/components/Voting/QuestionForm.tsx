import React, { useState } from 'react';
import { Button, Card, Heading, Box, Flex } from "rimble-ui";
import { useTranslation } from 'react-i18next';

interface QuestionFormProps {
  onCreateElection: (name: string, candidates: string[], schema: string, duration: number) => void;
  isSubmitting: boolean;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({ onCreateElection, isSubmitting }) => {
  const { t } = useTranslation();
  
  const [electionName, setElectionName] = useState("");
  const [candidatesStr, setCandidatesStr] = useState("");
  const [schema, setSchema] = useState("VotingCredential");
  const [duration, setDuration] = useState(60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate cơ bản
    const candidates = candidatesStr.split(',').map(c => c.trim()).filter(c => c !== "");
    
    if (!electionName) return alert(t('common.error') + ": Missing Election Name");
    if (candidates.length < 2) return alert(t('common.error') + ": At least 2 candidates required");

    onCreateElection(electionName, candidates, schema, duration);
  };

  return (
    <Card p={0} borderRadius={1} mb={4} className="shadow-md overflow-hidden bg-white">
      <Box p={4} borderBottom="1px solid #eee">
        <Heading.h3 color="#333" m={0}>
          Create New Election
        </Heading.h3>
      </Box>
      
      <Box p={4}>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Election Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Election Name / Question
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Who should be the next leader?"
              value={electionName}
              onChange={(e) => setElectionName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Credential Schema */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Required Credential (Schema)
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded bg-white focus:border-indigo-500 outline-none"
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="VotingCredential">Standard Voter (VotingCredential)</option>
              <option value="StudentCard">Student Card</option>
              <option value="EmployeeBadge">Employee Badge</option>
              <option value="CitizenshipCard">Citizenship Card</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Users must present this specific credential to vote.</p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Voting Duration (Minutes)
            </label>
            <input
              type="number"
              className="w-full p-3 border border-gray-300 rounded focus:border-indigo-500 outline-none"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min="1"
              disabled={isSubmitting}
            />
          </div>

          {/* Candidates */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Candidates (Comma separated)
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded h-32 focus:border-indigo-500 outline-none"
              placeholder="Alice, Bob, Charlie..."
              value={candidatesStr}
              onChange={(e) => setCandidatesStr(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Flex justifyContent="flex-end" pt={2}>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              mainColor="#5856D6"
              height="3rem"
              px={4}
            >
              {isSubmitting ? "Creating..." : "Launch Election"}
            </Button>
          </Flex>
        </form>
      </Box>
    </Card>
  );
};