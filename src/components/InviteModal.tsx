import React, { useState } from 'react';
import { X, Copy, Check, Share2, Users } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyId: string;
  partyTitle: string;
}

export function InviteModal({ isOpen, onClose, partyId, partyTitle }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const inviteLink = `${window.location.origin}/join/${partyId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my Shopping Squad: ${partyTitle}`,
          text: `Join my shopping squad on ShopSquad!`,
          url: inviteLink,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      handleCopy();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-transparent bg-clip-text">
            Invite Squad Members
          </h2>
          <p className="text-gray-600 mt-2">Share the link with your friends</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-xl">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-transparent border-none text-gray-600 text-sm focus:ring-0"
              />
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                title="Copy link"
              >
                {copied ? 
                  <Check className="h-5 w-5 text-green-500" /> : 
                  <Copy className="h-5 w-5 text-gray-400" />
                }
              </button>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share Squad Link
          </button>

          <p className="text-sm text-gray-500 text-center">
            Anyone with this link can join your shopping squad
          </p>
        </div>
      </div>
    </div>
  );
}