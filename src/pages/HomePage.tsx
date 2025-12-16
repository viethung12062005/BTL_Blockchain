import React from 'react';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const HomePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-900 to-purple-800 text-white py-20 px-4">
          <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Secure Blockchain Voting <br/> with <span className="text-indigo-300">Zero-Knowledge Identity</span>
              </h1>
              <p className="text-lg text-indigo-100 mb-8 max-w-lg mx-auto md:mx-0">
                Participate in elections securely using Polygon ID. Verify your eligibility without revealing your personal data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link 
                  to="/vote" 
                  className="bg-white text-indigo-900 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition shadow-lg text-center"
                >
                  Start Voting
                </Link>
                <Link 
                  to="/results" 
                  className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white/10 transition text-center"
                >
                  View Results
                </Link>
              </div>
            </div>
            
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-80 h-80 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
                 <div className="text-9xl">🗳️</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-12">Why use ZK Voting?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-bold mb-2">Privacy First</h3>
                <p className="text-gray-600">Your identity is verified using Zero-Knowledge Proofs. No one knows who you voted for.</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-4xl mb-4">🆔</div>
                <h3 className="text-xl font-bold mb-2">Multi-Credential</h3>
                <p className="text-gray-600">Supports various ID types (Student Card, National ID, Employee Badge) for different elections.</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-4xl mb-4">⛓️</div>
                <h3 className="text-xl font-bold mb-2">On-Chain Integrity</h3>
                <p className="text-gray-600">Votes are recorded on the blockchain, making them immutable and transparent.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;