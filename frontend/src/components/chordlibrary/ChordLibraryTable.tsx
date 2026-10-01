import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { ChordSheetDto } from '../../types/api';

interface ChordLibraryTableProps {
  data: ChordSheetDto[];
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onDelete: (id: string) => void;
}

export default function ChordLibraryTable({
  data,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onDelete,
}: ChordLibraryTableProps) {
  return (
    <View className="w-full">
      <View className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {data.map((chord, index) => (
          <View
            key={chord.id || index}
            className={`flex-row items-center justify-between px-4 py-4 ${
              index !== 0 ? 'border-t border-gray-200' : ''
            }`}
          >
            <TouchableOpacity
              onPress={() => router.push(`/(app)/library/${chord.id}` as any)}
              className="flex-1 pr-3"
            >
              <Text className="text-base font-semibold text-gray-900 truncate" numberOfLines={1}>
                {chord.title || 'Untitled'}
              </Text>
              <View className="flex-row items-center flex-wrap gap-2 mt-1">
                {chord.artist && (
                  <Text className="text-sm text-gray-500 truncate">{chord.artist}</Text>
                )}
                {chord.key && (
                  <View className="rounded-full bg-gray-100 px-2 py-0.5">
                    <Text className="text-xs font-medium text-gray-600">Key: {chord.key}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => chord.id && onDelete(chord.id)}
              className="p-2 rounded-lg active:bg-gray-100"
              accessibilityLabel="Delete Chord Sheet"
            >
              <Trash2 size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {data.length === 0 && (
        <View className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-8 items-center justify-center">
          <Text className="text-gray-500 font-medium">No chords found.</Text>
        </View>
      )}

      <View className="mt-6 flex-row items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <TouchableOpacity
          onPress={onPrev}
          disabled={!hasPrev}
          className={`rounded-lg border border-gray-300 px-4 py-2 bg-white ${
            !hasPrev ? 'opacity-40' : 'active:bg-gray-50'
          }`}
        >
          <Text className="text-sm font-medium text-gray-700">Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          disabled={!hasNext}
          className={`rounded-lg border border-gray-300 px-4 py-2 bg-white ${
            !hasNext ? 'opacity-40' : 'active:bg-gray-50'
          }`}
        >
          <Text className="text-sm font-medium text-gray-700">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
