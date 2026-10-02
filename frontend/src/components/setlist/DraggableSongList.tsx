import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  NestableDraggableFlatList,
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GripVertical, ChevronUp, ChevronDown, Edit, Trash2 } from 'lucide-react-native';
import { ChordSheetDto } from '../../types/api';
import { getCapoText } from '../../utils/outputs';

interface DraggableSongListProps {
  outputs: any[];
  chordsheetsMap: Record<string, ChordSheetDto>;
  onReorder: (newOutputs: any[]) => void;
  onMoveSong: (index: number, direction: 'up' | 'down') => void;
  onOpenEditModal: (item: any) => void;
  onRemoveSong: (index: number) => void;
  onOpenAddModal: () => void;
  ic: {
    primary: string;
    secondary: string;
    danger: string;
    active: string;
    placeholder: string;
  };
}

export function DraggableSongList({
  outputs,
  chordsheetsMap,
  onReorder,
  onMoveSong,
  onOpenEditModal,
  onRemoveSong,
  onOpenAddModal,
  ic,
}: DraggableSongListProps) {
  return (
    <NestableDraggableFlatList
      data={outputs}
      keyExtractor={(item) => item.index}
      onDragEnd={({ data }) => {
        onReorder(data.map((item, idx) => ({ ...item, order: idx })));
      }}
      renderItem={({ item, getIndex, drag, isActive }: RenderItemParams<any>) => {
        const index = getIndex() ?? 0;
        const sheet = chordsheetsMap[item.song];
        return (
          <ScaleDecorator>
            <View
              className={`flex-row items-center justify-between p-3.5 bg-muted rounded-xl border border-border mb-3 ${
                isActive ? 'opacity-90 shadow-md' : ''
              }`}
            >
              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={100}
                disabled={isActive}
                className="p-1 mr-2"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <GripVertical size={20} color={ic.secondary} />
              </TouchableOpacity>

              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-foreground truncate" numberOfLines={1}>
                  {index + 1}. {sheet?.title || 'Loading Song...'}
                </Text>
                <View className="flex-row items-center gap-2 mt-1">
                  <View className="bg-primary/15 px-2 py-0.5 rounded-full">
                    <Text className="text-xs font-semibold text-primary">Key: {item.targetKey || sheet?.key || 'C'}</Text>
                  </View>
                  {Number(item.capo) > 0 && (
                    <View className="bg-amber-500/15 px-2 py-0.5 rounded-full">
                      <Text className="text-xs font-semibold text-amber-600 dark:text-amber-400">{getCapoText(item.capo)}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View className="flex-row items-center gap-1">
                <TouchableOpacity
                  onPress={() => onMoveSong(index, 'up')}
                  disabled={index === 0}
                  className={`p-1.5 rounded-lg ${index === 0 ? 'opacity-30' : 'active:bg-muted'}`}
                >
                  <ChevronUp size={18} color={ic.secondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onMoveSong(index, 'down')}
                  disabled={index === outputs.length - 1}
                  className={`p-1.5 rounded-lg ${index === outputs.length - 1 ? 'opacity-30' : 'active:bg-muted'}`}
                >
                  <ChevronDown size={18} color={ic.secondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onOpenEditModal(item)}
                  className="p-1.5 rounded-lg active:bg-muted ml-1"
                >
                  <Edit size={16} color={ic.secondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onRemoveSong(index)}
                  className="p-1.5 rounded-lg active:bg-red-500/10 ml-1"
                >
                  <Trash2 size={16} color={ic.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </ScaleDecorator>
        );
      }}
      ListEmptyComponent={
        <View className="border border-dashed border-border rounded-xl p-8 items-center justify-center">
          <Text className="text-muted-foreground font-medium">No songs added yet.</Text>
          <TouchableOpacity onPress={onOpenAddModal} className="mt-3">
            <Text className="text-primary font-semibold text-sm">+ Add the first song</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}
