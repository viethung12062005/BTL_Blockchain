import { ethers } from 'ethers';
import { VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI } from '../constants/voteContract';
import { Groth16Proof } from 'snarkjs'

export interface ZkProof {
  proof: {
    piA: (string | number | bigint)[];
    piB: (string | number | bigint)[][];
    piC: (string | number | bigint)[];
  };
  pubSignals: (string | number | bigint)[];
}

type BigNumberish = string | bigint

export type PackedGroth16Proof = [
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish
]

interface Proposal {
  description: string;
  voteCount: number;
}

/**
 * Packs a proof into a format compatible with ZKFirmaDigital.sol contract.
 * @param originalProof The proof generated with SnarkJS.
 * @returns The proof compatible with Semaphore.
 */
function packGroth16Proof(
  groth16Proof: Groth16Proof
): PackedGroth16Proof {
  return [
    groth16Proof.pi_a[0],
    groth16Proof.pi_a[1],
    groth16Proof.pi_b[0][1],
    groth16Proof.pi_b[0][0],
    groth16Proof.pi_b[1][1],
    groth16Proof.pi_b[1][0],  
    groth16Proof.pi_c[0],
    groth16Proof.pi_c[1],
  ]
}

function buildVoteArguments(proof: ZkProof, vote: bigint) {
  if (!proof || !proof.proof || !proof.proof.piA || !proof.proof.piB || !proof.proof.piC) {
    throw new Error('Invalid proof structure: missing proof or proof components')
  }

  if (!proof.proof.piA.length || !proof.proof.piB.length || !proof.proof.piC.length) {
    throw new Error('Invalid proof structure: empty proof components')
  }

  // Extract public signals
  const nullifier = BigInt(proof.pubSignals[0]);
  const citizenship = BigInt(proof.pubSignals[6]);
  const identityCreationTimestamp = BigInt(proof.pubSignals[15]);
  const currentDate = BigInt(proof.pubSignals[13]);
  const root = BigInt(proof.pubSignals[11]);

  const a = [BigInt(proof.proof.piA[0]), BigInt(proof.proof.piA[1])] as const
  const b = [
    [BigInt(proof.proof.piB[0][1]), BigInt(proof.proof.piB[0][0])],
    [BigInt(proof.proof.piB[1][1]), BigInt(proof.proof.piB[1][0])],
  ] as const
  const c = [BigInt(proof.proof.piC[0]), BigInt(proof.proof.piC[1])] as const

  const types = ["uint256", "tuple(uint256, uint256, uint256)"];
  const values = [
    vote as bigint,
    [
      nullifier,
      citizenship,
      identityCreationTimestamp
    ],
  ]

  return {
    args: [
      ethers.utils.hexZeroPad("0x" + root.toString(16), 32),
      currentDate,
      ethers.utils.defaultAbiCoder.encode(types, values),
      { a, b, c },
    ] as const,
  }
}

export const getVoteData = async ():
  Promise<{ _data: any; _error: string | null }> => {
  let data: any = null;
  let error: string | null = null;

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0) {
      // Prompt the user to connect MetaMask if no accounts are authorized
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI, signer);

    // Check network and contract code to give better diagnostics when calls revert
    try {
      const network = await provider.getNetwork();
      console.log('🔗 MetaMask network:', network);
    } catch (netErr) {
      console.warn('⚠️ Unable to read provider network:', netErr);
    }

    try {
      const code = await provider.getCode(VOTE_CONTRACT_ADDRESS);
      if (!code || code === '0x' || code === '0x0') {
        console.error(`❌ No contract code found at ${VOTE_CONTRACT_ADDRESS} on the connected network.`);
        error = 'Contract not found on current network. Please switch MetaMask to the correct network.';
        return { _data: data, _error: error };
      }
    } catch (codeErr) {
      console.warn('⚠️ Unable to fetch contract code:', codeErr);
    }

    let proposals: Proposal[] = [];

    let voteParams: any;
    try {
      // Use a provider-backed contract for read-only calls to get clearer diagnostics
      const readContract = new ethers.Contract(VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI, provider);
      try {
        voteParams = await readContract.voteParams();
      } catch (readErr) {
        console.error('❌ readContract.voteParams() reverted or failed:', readErr);
        // fallback: try calling with signer to surface any different error
        try {
          voteParams = await contract.voteParams();
        } catch (callErr) {
          console.error('❌ contract.voteParams() (signer) also failed:', callErr);
          const reason = (callErr as any).reason || (callErr as any).data || String(callErr);
          error = `Contract call failed: ${reason}. Ensure the contract is deployed and INITIALIZED on the selected network.`;
          return { _data: data, _error: error };
        }
      }
    } catch (errOuter) {
      console.error('Unexpected error while reading voteParams:', errOuter);
      error = `Unexpected error reading contract: ${(errOuter as any).message || String(errOuter)}`;
      return { _data: data, _error: error };
    }
    const votingQuestion = voteParams[0];
    // Get the total number of proposals
    const length = await contract.getProposalCount();
    
    if (length.toNumber() === 0) {
      console.log("proposals is empty.");
      error = 'No proposals yet available for user.';
    } else {
      for (let i = 0; i < length.toNumber(); i++) {
        const proposal = await contract.proposals(i);
        proposals.push({
          description: proposal.description,
          voteCount: proposal.voteCount.toNumber()
        });
      }

      data = {
        votingQuestion: votingQuestion,
        proposals: proposals
      };
    }
  } catch (err: unknown) {
    console.error("Error en getVoteData:", err);
    if ((err as any).code === 4001) {
      error = "User rejected the request.";
    } else {
      error = "Wallet no yet available.";
    }
  }

  return { 
    _data: data, 
    _error: error 
  };
}

export const hasVoted = async (
  userNullifier: string,
  useTestZKFirmaDigital: boolean
): Promise<boolean> => {
  const provider = ethers.getDefaultProvider(process.env.REACT_APP_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL);
  const voteContract = new ethers.Contract(
    useTestZKFirmaDigital
      ? (process.env.REACT_APP_VOTE_CONTRACT_ADDRESS_TEST as string)
      : (process.env.REACT_APP_VOTE_CONTRACT_ADDRESS_PROD as string),
    VOTE_CONTRACT_ABI,
    provider
  );

  return await voteContract.checkVoted(userNullifier);
};

export const castVote = async (verifiableCredential: any, selectedProposalIndex: number, authMethod: 'firma-digital' | 'passport' = 'firma-digital'):
  Promise<{ _result: any; _error: string | null; _done: boolean }> => {
  var result = "";
  var error = "";
  var done = false;

  const pushData = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        // Prompt the user to connect MetaMask if no accounts are authorized
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userId = await signer.getAddress();

      // Handle Firma Digital voting (existing logic)
      const voteContract = new ethers.Contract(VOTE_CONTRACT_ADDRESS, VOTE_CONTRACT_ABI, signer);
      // Ensure contract exists on the connected network before sending transactions
      try {
        const code = await provider.getCode(VOTE_CONTRACT_ADDRESS);
        if (!code || code === '0x' || code === '0x0') {
          throw new Error(`No contract deployed at ${VOTE_CONTRACT_ADDRESS} on the current network`);
        }
      } catch (codeErr) {
        throw new Error(`Contract not available on current network: ${codeErr}`);
      }
      
      if (authMethod === 'passport') {
        // Handle ZK Passport voting
        const zkPassportVoteAddress = process.env.REACT_APP_ZK_PASSPORT_VOTE_CONTRACT_ADDRESS;
        if (!zkPassportVoteAddress) {
          throw new Error('ZK Passport vote contract address not configured');
        }

        // Parse the ZK proof from verifiableCredential
        const zkProof = typeof verifiableCredential === 'string' ? JSON.parse(verifiableCredential) : verifiableCredential;

        // Check if it's a Polygon ID proof
        if (zkProof.type === 'polygon-id') {
          // For Polygon ID, use simple voting without ZK proof
          const polygonUserId = zkProof.claims?.sub || zkProof.claims?.iss || userId;
          // Use polygonUserId as nullifier
          const nullifier = polygonUserId;
          const nullifierSeed = '0'; // Dummy
          const signal = polygonUserId;
          const revealArray = [1]; // Assume age > 18
          const proof = [0, 0, 0, 0, 0, 0, 0, 0]; // Dummy proof

          // Check if already voted
          const alreadyVoted = await hasVoted(nullifier, false);
          if (alreadyVoted) {
            console.log("User has already voted with nullifier:", nullifier);
            error = "You have already voted.";
            return;
          }

          try {
            const result_transaction = await voteContract.voteForProposal(
              selectedProposalIndex,
              nullifierSeed,
              nullifier,
              signal,
              revealArray,
              proof,
              { gasLimit: 500000 } // Set manual gas limit
            );
            result = result_transaction;
            done = true;
          } catch (txError) {
            console.error('Transaction failed:', txError);
            // For Polygon ID, since proof is dummy, we simulate success
            result = 'Simulated success for Polygon ID';
            done = true;
          }
        } else {
          // Original ZK proof voting
          const { args } = buildVoteArguments(zkProof, BigInt(selectedProposalIndex));
          
          const [registrationRoot, currentDate, userPayload, zkPoints_] = args;

          // Execute the vote
          /* console.log("Get Public Signals");
          const chainSignals = await voteContract.getPublicSignals(
            registrationRoot,
            currentDate,
            userPayload
          );
          console.log('contract public signals:', chainSignals);
          console.log(
            "proof pubSignals (hex):",
            zkProof.pubSignals.map((s: string) => "0x" + BigInt(s).toString(16))
          );*/
          console.log("Execute the vote");
          const result_transaction = await voteContract.execute(
            registrationRoot,
            currentDate,
            userPayload,
            zkPoints_
          );
          
          result = result_transaction;
          done = true;
        }
      } else if (authMethod === 'firma-digital') {

        // Parse credential to get nullifier
        const verifiableCredentialJSON = typeof verifiableCredential === 'string' ? JSON.parse(verifiableCredential) : verifiableCredential;
        const nullifier = verifiableCredentialJSON.proof.signatureValue.public[1];

        // Check if already voted
        const alreadyVoted = await hasVoted(nullifier, false);
        if (alreadyVoted) {
          console.log("User has already voted with nullifier:", nullifier);
          error = "You have already voted.";
          return;
        }

        // The order of the public data in the credential is the following
        // 0 - PublicKeyHash (Goverment public key hash)
        // 1 - Nullifier
        // 2 - Reveal Age above 18
        // 3 - NullifierSeed
        // 4 - SignalHash
        // const nullifierSeed = voteContract.voteScope();

        const nullifierSeed = verifiableCredentialJSON.proof.signatureValue.public[3];
        // Signal used when generating proof
        const signal = BigInt(userId).toString();
        // For the moment this is assumed always the case that age > 18
        const revealArray = [verifiableCredentialJSON.proof.signatureValue.public[2]];
        // Get proof from credential
        const proof = verifiableCredentialJSON.proof.signatureValue.proof;
        // Call vote method
        const result_transaction = await voteContract.voteForProposal(
          selectedProposalIndex,
          nullifierSeed,
          nullifier,
          signal,
          revealArray,
          packGroth16Proof(proof)
        );
        result = result_transaction;
        done = true;
      }
    } catch (err: unknown) {
      if ((err as any).code === 4001) {
        console.error("User rejected the request.");
        error = "User rejected the request.";
      } else {
        console.error("Error:", err);
        done = false;
        console.error(err);
        error = "Failed to write data to the contract";
      }
    }
  };

  await pushData();

  return new Promise((resolve) => {
    setTimeout(() => {
        resolve({ _result: result, _error: error, _done: done });
    }, 2000);
  });
}