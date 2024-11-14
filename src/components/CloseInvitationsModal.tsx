import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface CloseInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CloseInvitationsModal({ isOpen, onClose, onConfirm }: CloseInvitationsModalProps) {
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
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Close Invitations?
          </h2>
          <p className="text-gray-600">
            Are you sure you want to close invitations? No one will be able to join the squad or add products after this action.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-[#FF4D8D] text-white rounded-xl hover:bg-[#FF3D7D] transition-colors"
          >
            Close Invitations
          </button>
        </div>
      </div>
    </div>
  );
}