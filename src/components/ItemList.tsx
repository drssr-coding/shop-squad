import React from 'react';
import type { Item, Participant } from '../types';
import { DollarSign, User } from 'lucide-react';

interface ItemListProps {
  items: Item[];
  participants: Participant[];
  onAssignItem: (itemId: string, participantId: string | null) => void;
}

export function ItemList({ items, participants, onAssignItem }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
        <div className="w-16 h-16 bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <DollarSign className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No items yet</h3>
        <p className="text-gray-500">Start adding items to your shopping list!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Item</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Price</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Assigned To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <span className="ml-3 font-medium text-gray-900">{item.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  ${item.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={item.assignedTo || ''}
                    onChange={(e) => onAssignItem(item.id, e.target.value || null)}
                    className="rounded-xl border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {participants.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}