import React from 'react';
import { Plus, Calendar, MapPin, Users } from 'lucide-react';
import { formatDate, formatTime } from '../utils/dateUtils';
import type { Party } from '../types';

interface PartyListProps {
  parties: Party[];
  onSelectParty: (party: Party) => void;
  onCreateParty: () => void;
  loading: boolean;
}

export function PartyList({ parties, onSelectParty, onCreateParty, loading }: PartyListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D8D]"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-transparent bg-clip-text mb-2">
            Your Shopping Squads
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Plan, shop, and meet in-person with your squad!</p>
        </div>
        <button
          onClick={onCreateParty}
          className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white px-4 sm:px-6 py-2 sm:py-3 text-sm rounded-full flex items-center hover:shadow-lg transition-all whitespace-nowrap"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
          New Squad
        </button>
      </div>

      {parties.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No squads yet</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">Create your first shopping squad to get started!</p>
          <button
            onClick={onCreateParty}
            className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white px-4 sm:px-6 py-2 sm:py-3 text-sm rounded-full inline-flex items-center hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
            Create Squad
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {parties.map((party) => (
            <div
              key={party.id}
              onClick={() => onSelectParty(party)}
              className="bg-white rounded-2xl p-4 sm:p-6 cursor-pointer hover:shadow-lg transition-all border border-gray-100 group"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 group-hover:text-[#FF4D8D] transition-colors line-clamp-1">
                {party.title}
              </h3>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#FF4D8D] flex-shrink-0" />
                  <span className="text-sm">{formatDate(party.date)} at {formatTime(party.date)}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#FF4D8D] flex-shrink-0" />
                  <span className="text-sm line-clamp-1">{party.location}</span>
                </div>

                <div className="mt-4 sm:mt-6">
                  <div className="flex -space-x-2 overflow-hidden">
                    {party.participants.slice(0, 3).map((participant) => (
                      <img
                        key={participant.id}
                        src={participant.avatar}
                        alt={participant.name}
                        className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-white"
                      />
                    ))}
                    {party.participants.length > 3 && (
                      <div className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-white bg-[#FF4D8D] text-white text-xs sm:text-sm font-medium">
                        +{party.participants.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}