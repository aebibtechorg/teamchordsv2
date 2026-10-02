import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { Eye, Trash2, Link2 } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { deleteSetList } from '../../utils/setlists';
import { SetListDto } from '../../types/api';
import ConfirmDialog from '../ConfirmDialog';
import { getApiBaseUrl } from '../../utils/api';
import { WEB_BASE_URL } from '../../config';

interface SetListTableProps {
  data: SetListDto[];
  onRefresh: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export default function SetListTable({
  data,
  onRefresh,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: SetListTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyLink = async (id: string) => {
    const url = `${WEB_BASE_URL}/setlists/share/${id}`;
    await Clipboard.setStringAsync(url);
    Alert.alert('Success', 'Link copied to clipboard!');
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

  return (
    <View className="w-full">
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Set List"
        message={`Are you sure you want to delete ${deleteName}? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
      />

      <View className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {data.map((setlist, index) => (
          <View
            key={setlist.id || index}
            className={`flex-row items-center justify-between px-4 py-4 ${
              index !== 0 ? 'border-t border-gray-200' : ''
            }`}
          >
            <TouchableOpacity
              onPress={() => router.push(`/(app)/setlists/${setlist.id}` as any)}
              className="flex-1 pr-3"
            >
              <Text className="text-base font-semibold text-gray-900 truncate" numberOfLines={1}>
                {setlist.name || 'Untitled Set List'}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Created: {setlist.createdAt ? new Date(setlist.createdAt).toLocaleDateString() : ''}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center gap-1">
              <TouchableOpacity
                onPress={() => setlist.id && handlePreview(setlist.id)}
                className="p-2 rounded-lg active:bg-gray-100"
                accessibilityLabel="Preview set list"
              >
                <Eye size={18} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setlist.id && handleCopyLink(setlist.id)}
                className="p-2 rounded-lg active:bg-gray-100"
                accessibilityLabel="Copy set list link"
              >
                <Link2 size={18} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setDeleteId(setlist.id || null);
                  setDeleteName(setlist.name || 'this set list');
                }}
                className="p-2 rounded-lg active:bg-gray-100"
                accessibilityLabel="Delete set list"
              >
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {data.length === 0 && (
        <View className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-8 items-center justify-center">
          <Text className="text-gray-500 font-medium">No set lists found.</Text>
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
