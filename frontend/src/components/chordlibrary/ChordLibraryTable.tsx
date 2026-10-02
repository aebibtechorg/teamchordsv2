import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { ChordSheetDto } from '../../types/api';

interface ChordLibraryTableProps {
  data: ChordSheetDto[];
  onLoadMore: () => void;
  isFetchingNextPage: boolean;
  onDelete: (id: string) => void;
}

export default function ChordLibraryTable({
  data,
  onLoadMore,
  isFetchingNextPage,
  onDelete,
}: ChordLibraryTableProps) {
  const renderItem = ({ item: chord, index }: { item: ChordSheetDto; index: number }) => (
    <View
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
  );

  return (
    <View className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-8">
      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderItem}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-8 items-center justify-center">
            <Text className="text-gray-500 font-medium">No chords found.</Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="p-4 items-center justify-center">
              <ActivityIndicator color="#9CA3AF" />
            </View>
          ) : null
        }
        contentContainerStyle={data.length === 0 ? { flex: 1 } : {}}
      />
    </View>
  );
}
