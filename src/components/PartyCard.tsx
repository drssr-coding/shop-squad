import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Party } from '../types';

interface PartyCardProps {
  party: Party;
  onClick: () => void;
}

export function PartyCard({ party, onClick }: PartyCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
    >
      <h3 className="text-2xl font-bold text-gray-800 mb-4">{party.title}</h3>
      
      <div className="space-y-3">
        <div className="flex items-center text-gray-600">
          <Calendar className="w-5 h-5 mr-2" />
          <span>{format(party.date, 'PPP')}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <MapPin className="w-5 h-5 mr-2" />
          <span>{party.location}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Users className="w-5 h-5 mr-2" />
          <span>{party.participants.length} participants</span>
        </div>
      </div>

      <div className="mt-4 flex -space-x-2">
        {party.participants.slice(0, 5).map((participant) => (
          <img
            key={participant.id}
            src={participant.avatar}
            alt={participant.name}
            className="w-8 h-8 rounded-full border-2 border-white"
          />
        ))}
        {party.participants.length > 5 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 border-2 border-white">
            +{party.participants.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}