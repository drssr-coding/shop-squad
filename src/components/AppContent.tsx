import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, Share2, Sparkles, ShoppingCart, Zap, LogOut } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { PartyList } from './PartyList';
import { PartyDetails } from './PartyDetails';
import { JoinParty } from './JoinParty';
import { AdminDashboard } from './AdminDashboard';
import { UserDashboard } from './UserDashboard';
import { ResetPassword } from './ResetPassword';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../contexts/AuthContext';
import { useParties } from '../hooks/useParties';
import { CreatePartyModal } from './CreatePartyModal';
import type { Party } from '../types';

export function AppContent() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState<'signin' | 'signup' | null>(null);
  const [showCreatePartyModal, setShowCreatePartyModal] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const { parties, loading: partiesLoading, createParty } = useParties();

  const handleAuthModalClose = () => {
    setShowAuthModal(null);
  };

  const switchAuthMode = () => {
    setShowAuthModal(showAuthModal === 'signin' ? 'signup' : 'signin');
  };

  const handleCreateParty = async (partyData: { title: string; date: Date; location: string }) => {
    const newParty = await createParty(partyData);
    if (newParty) {
      setShowCreatePartyModal(false);
      navigate(`/party/${newParty.id}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const isHomePage = location.pathname === '/';
  const showHeader = !isHomePage || user;
  const isAdmin = user?.email === 'info@shopsquad.it';

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && (
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div 
                className="flex items-center space-x-3 cursor-pointer"
                onClick={handleLogoClick}
              >
                <div className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] p-2.5 rounded-xl">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="font-black text-2xl tracking-tight">
                  <span className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-transparent bg-clip-text">shop</span>
                  <span className="text-black">squad</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <NotificationBell />
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => setShowUserDashboard(true)}
                    >
                      <img
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`}
                        alt={user.displayName || 'User'}
                        className="h-8 w-8 rounded-full"
                      />
                      <span className="ml-2 text-gray-700 hidden sm:inline">{user.email}</span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => navigate('/admin')}
                        className="text-gray-600 hover:text-gray-900 flex items-center transition-colors"
                      >
                        Admin
                      </button>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="text-gray-600 hover:text-gray-900 transition-colors flex items-center"
                      title="Sign Out"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="hidden sm:inline ml-2">Sign Out</span>
                    </button>
                  </>
                ) : !isHomePage && (
                  <button
                    onClick={() => setShowAuthModal('signin')}
                    className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/squads"
            element={
              user ? (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <PartyList
                    parties={parties}
                    onSelectParty={(party) => {
                      setSelectedParty(party);
                      navigate(`/party/${party.id}`);
                    }}
                    onCreateParty={() => setShowCreatePartyModal(true)}
                    loading={partiesLoading}
                  />
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/party/:id"
            element={
              user ? (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <PartyDetails setSelectedParty={setSelectedParty} />
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/join/:partyId"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <JoinParty />
              </div>
            }
          />
          <Route
            path="/admin"
            element={
              user?.email === 'info@shopsquad.it' ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>

        {showCreatePartyModal && (
          <CreatePartyModal
            isOpen={showCreatePartyModal}
            onClose={() => setShowCreatePartyModal(false)}
            onSubmit={handleCreateParty}
          />
        )}

        {showAuthModal && !user && (
          <AuthModal
            isOpen={true}
            onClose={handleAuthModalClose}
            mode={showAuthModal}
            onSwitchMode={switchAuthMode}
          />
        )}

        {showUserDashboard && (
          <UserDashboard
            isOpen={showUserDashboard}
            onClose={() => setShowUserDashboard(false)}
          />
        )}
      </main>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState<'signin' | 'signup' | null>(null);
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/squads');
    } else {
      setShowAuthModal('signup');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-[#FF4D8D] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-[#FF8D6B] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <h1 className="text-4xl sm:text-6xl font-bold mb-8">
              <span className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-transparent bg-clip-text">
                Shop Together,
              </span>
              <br />
              <span className="text-gray-900">Meet In-Person</span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Create shopping squads, meet up with friends, and discover new styles together.
              The fun way to shop in real life!
            </p>

            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white px-8 py-4 rounded-full text-lg font-medium hover:shadow-lg transition-all"
            >
              Get Started
            </button>
          </div>

          {/* How it works section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Squads</h3>
                <p className="text-gray-600">Invite friends to join your shopping squad</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Add Products</h3>
                <p className="text-gray-600">Browse and add items to your shared list</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Share2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Meet & Shop</h3>
                <p className="text-gray-600">Meet up and shop together in real life</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={true}
          onClose={() => setShowAuthModal(null)}
          mode={showAuthModal}
          onSwitchMode={() => setShowAuthModal(showAuthModal === 'signin' ? 'signup' : 'signin')}
        />
      )}
    </div>
  );
}