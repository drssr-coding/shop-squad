import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Users, ShoppingBag } from 'lucide-react';
import { formatDate, formatTime } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import type { Party } from '../types';

interface PartyHistoryProps {
  parties: Party[];
}

export function PartyHistory({ parties }: PartyHistoryProps) {
  const navigate = useNavigate();
  const completedParties = parties.filter(party => party.status === 'completed');

  if (completedParties.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Past Squads</h3>
        <p className="text-gray-500">Your completed shopping squads will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {completedParties.map((party) => (
        <div
          key={party.id}
          onClick={() => navigate(`/party/${party.id}`)}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{party.title}</h3>
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-2" />
                <span>{formatDate(party.date)} at {formatTime(party.date)}</span>
              </div>
            </div>
            
            <div className="flex -space-x-2">
              {party.participants.slice(0, 3).map((participant) => (
                <img
                  key={participant.id}
                  src={participant.avatar}
                  alt={participant.name}
                  className="h-8 w-8 rounded-full ring-2 ring-white"
                />
              ))}
              {party.participants.length > 3 && (
                <div className="h-8 w-8 rounded-full bg-[#FF4D8D] flex items-center justify-center text-white text-sm font-medium ring-2 ring-white">
                  +{party.participants.length - 3}
                </div>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2" />
              <span className="truncate">{party.location}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Users className="h-5 w-5 mr-2" />
              <span>{party.participants.length} participants</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <ShoppingBag className="h-5 w-5 mr-2" />
              <span>{formatCurrency(party.totalAmount || 0)} total spent</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}