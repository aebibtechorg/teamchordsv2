import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, FlatList, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { Eye, Trash2, Link2 } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { deleteSetList } from '../../utils/setlists';
import { SetListDto } from '../../types/api';
import ConfirmDialog from '../ConfirmDialog';
import { WEB_BASE_URL } from '../../config';
import { useIconColor } from '../../hooks/use-icon-color';

interface SetListTableProps {
  data: SetListDto[];
  onRefresh: () => void;
  onLoadMore: () => void;
  isFetchingNextPage: boolean;
}

export default function SetListTable({
  data,
  onRefresh,
  onLoadMore,
  isFetchingNextPage,
}: SetListTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const ic = useIconColor();

  const handleCopyLink = async (id: string) => {
    const url = `${WEB_BASE_URL}/setlists/share/${id}`;
    await Clipboard.setStringAsync(url);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Link copied to clipboard!',
    });
  };

  const handlePreview = (id: string) => {
    Linking.openURL(`${WEB_BASE_URL}/setlists/share/${id}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteSetList(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
    onRefresh();
  };

  const renderItem = ({ item: setlist, index }: { item: SetListDto; index: number }) => (
    <View
      className={`flex-row items-center justify-between px-4 py-4 ${
        index !== 0 ? 'border-t border-border' : ''
      }`}
    >
      <TouchableOpacity
        onPress={() => router.push(`/(app)/setlists/${setlist.id}` as any)}
        className="flex-1 pr-3"
      >
        <Text className="text-base font-semibold text-foreground truncate" numberOfLines={1}>
          {setlist.name || 'Untitled Set List'}
        </Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Created: {setlist.createdAt ? new Date(setlist.createdAt).toLocaleDateString() : ''}
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center gap-1">
        <TouchableOpacity
          onPress={() => setlist.id && handlePreview(setlist.id)}
          className="p-2 rounded-lg active:bg-muted"
          accessibilityLabel="Preview set list"
        >
          <Eye size={18} color={ic.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setlist.id && handleCopyLink(setlist.id)}
          className="p-2 rounded-lg active:bg-muted"
          accessibilityLabel="Copy set list link"
        >
          <Link2 size={18} color={ic.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setDeleteId(setlist.id || null);
            setDeleteName(setlist.name || 'this set list');
          }}
          className="p-2 rounded-lg active:bg-muted"
          accessibilityLabel="Delete set list"
        >
          <Trash2 size={18} color={ic.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 w-full">
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Set List"
        message={`Are you sure you want to delete ${deleteName}? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
      />

      <View className="flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm mb-8">
        <FlatList
          data={data}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderItem}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 items-center justify-center">
              <Text className="text-muted-foreground font-medium">No set lists found.</Text>
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
    </View>
  );
}
