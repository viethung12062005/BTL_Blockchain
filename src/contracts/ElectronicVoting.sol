// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ElectronicVoting {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct Election {
        uint256 id;
        string name;
        string credentialSchema; // Ví dụ: "KYCAgeCredential"
        string credentialQuery;  // MỚI: Lưu điều kiện JSON (Ví dụ: '{"birthday": {"$lt": 20050101}}')
        uint256 startTime;
        uint256 endTime;
        bool isActive;
    }

    address public admin;
    uint256 public electionCount;

    mapping(uint256 => Election) public elections;
    mapping(uint256 => Candidate[]) public electionCandidates;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ElectionCreated(uint256 indexed electionId, string name, string credentialSchema);
    event Voted(uint256 indexed electionId, address indexed voter, uint256 candidateId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function createElection(
        string memory _name, 
        string[] memory _candidateNames, 
        string memory _credentialSchema,
        string memory _credentialQuery, // MỚI: Nhận tham số Query
        uint256 _durationInMinutes
    ) public onlyAdmin {
        electionCount++;
        uint256 newElectionId = electionCount;

        elections[newElectionId] = Election({
            id: newElectionId,
            name: _name,
            credentialSchema: _credentialSchema,
            credentialQuery: _credentialQuery, // Lưu vào struct
            startTime: block.timestamp,
            endTime: block.timestamp + (_durationInMinutes * 1 minutes),
            isActive: true
        });

        for (uint256 i = 0; i < _candidateNames.length; i++) {
            electionCandidates[newElectionId].push(Candidate({
                id: i,
                name: _candidateNames[i],
                voteCount: 0
            }));
        }

        emit ElectionCreated(newElectionId, _name, _credentialSchema);
    }

    function vote(uint256 _electionId, uint256 _candidateId) public {
        Election storage election = elections[_electionId];
        require(election.isActive, "Election is closed");
        require(block.timestamp <= election.endTime, "Election time ended");
        require(!hasVoted[_electionId][msg.sender], "Already voted in this election");

        hasVoted[_electionId][msg.sender] = true;
        electionCandidates[_electionId][_candidateId].voteCount++;

        emit Voted(_electionId, msg.sender, _candidateId);
    }

    function getElection(uint256 _electionId) public view returns (Election memory) {
        return elections[_electionId];
    }

    function getCandidates(uint256 _electionId) public view returns (Candidate[] memory) {
        return electionCandidates[_electionId];
    }
    
    function checkUserVoted(uint256 _electionId, address _user) public view returns (bool) {
        return hasVoted[_electionId][_user];
    }
}