import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { ChordSheetDto } from '../../types/api';
import { useIconColor } from '../../hooks/use-icon-color';

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
  const ic = useIconColor();

  const renderItem = ({ item: chord, index }: { item: ChordSheetDto; index: number }) => (
    <View
      className={`flex-row items-center justify-between px-4 py-4 ${
        index !== 0 ? 'border-t border-border' : ''
      }`}
    >
      <TouchableOpacity
        onPress={() => router.push(`/(app)/library/${chord.id}` as any)}
        className="flex-1 pr-3"
      >
        <Text className="text-base font-semibold text-foreground truncate" numberOfLines={1}>
          {chord.title || 'Untitled'}
        </Text>
        <View className="flex-row items-center flex-wrap gap-2 mt-1">
          {chord.artist && (
            <Text className="text-sm text-muted-foreground truncate">{chord.artist}</Text>
          )}
          {chord.key && (
            <View className="rounded-full bg-muted px-2 py-0.5">
              <Text className="text-xs font-medium text-muted-foreground">Key: {chord.key}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => chord.id && onDelete(chord.id)}
        className="p-2 rounded-lg active:bg-muted"
        accessibilityLabel="Delete Chord Sheet"
      >
        <Trash2 size={18} color={ic.inactive} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-8">
      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderItem}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 items-center justify-center">
            <Text className="text-muted-foreground font-medium">No chords found.</Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="p-4 items-center justify-center">
              <ActivityIndicator color={ic.secondary} />
            </View>
          ) : null
        }
        contentContainerStyle={data.length === 0 ? { flex: 1 } : {}}
      />
    </View>
  );
}
