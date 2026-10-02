import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { Plus, Upload, Search, Download } from 'lucide-react-native';
import { router } from 'expo-router';
import { useProfileStore } from '../../../store/useProfileStore';
import { getChordsheetsCursor, deleteChordsheet, backupChordsheets } from '../../../utils/chordsheets';
import { ChordSheetDto } from '../../../types/api';
import ChordLibraryTable from '../../../components/chordlibrary/ChordLibraryTable';
import ChordFilesUploadDialog from '../../../components/chordlibrary/ChordFilesUploadDialog';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Spinner from '../../../components/Spinner';

export default function ChordLibrary() {
  const { profile } = useProfileStore();
  const [chordSheets, setChordSheets] = useState<ChordSheetDto[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pageSize] = useState(15);
  const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: string } | null>(null);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const orgId = profile?.orgId;

  const fetchInitial = async () => {
    if (!orgId) {
      setChordSheets([]);
      setNextCursor(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, nextCursor: next } = await getChordsheetsCursor(orgId, {
      search: searchTerm,
      pageSize,
    });
    setChordSheets(data);
    setNextCursor(next);
    setIsLoading(false);
  };

  const fetchMore = async () => {
    if (!orgId || !nextCursor || isFetchingNextPage || isLoading) return;
    setIsFetchingNextPage(true);
    const { data, nextCursor: next } = await getChordsheetsCursor(orgId, {
      search: searchTerm,
      afterCreatedAt: nextCursor.createdAt,
      afterId: nextCursor.id,
      pageSize,
    });
    setChordSheets((prev) => [...prev, ...data]);
    setNextCursor(next);
    setIsFetchingNextPage(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInitial();
    }, 300);
    return () => clearTimeout(timer);
  }, [orgId, searchTerm]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const success = await deleteChordsheet(deleteId);
    if (success) {
      fetchInitial();
    } else {
      Alert.alert('Error', 'Failed to delete chord sheet.');
    }
    setDeleteId(null);
  };

  return (
    <View className="flex-1 bg-gray-100 p-4 md:p-8">
      <View className="max-w-6xl mx-auto w-full flex-1">
        {/* Header */}
        <View className="flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <View>
            <Text className="text-2xl md:text-3xl font-bold text-gray-900">Chord Library</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Manage and organize your chord charts and ChordPro sheets.
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setIsUploadOpen(true)}
              className="flex-row items-center bg-white border border-gray-300 px-4 py-2.5 rounded-xl shadow-sm active:bg-gray-50"
            >
              <Upload size={16} color="#374151" />
              <Text className="text-sm font-semibold text-gray-700 ml-2">Import</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(app)/library/new' as any)}
              className="flex-row items-center bg-blue-600 px-4 py-2.5 rounded-xl shadow-sm active:bg-blue-700"
            >
              <Plus size={16} color="#fff" />
              <Text className="text-sm font-semibold text-white ml-2">New Song</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View className="mb-6 relative">
          <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-sm">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search by song title or artist..."
              className="flex-1 ml-2 text-sm text-gray-900"
            />
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <Spinner />
        ) : (
          <ChordLibraryTable
            data={chordSheets}
            onLoadMore={fetchMore}
            isFetchingNextPage={isFetchingNextPage}
            onDelete={(id) => setDeleteId(id)}
          />
        )}
      </View>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Chord Sheet"
        message="Are you sure you want to delete this chord sheet? This cannot be undone."
        confirmLabel="Delete"
      />

      {isUploadOpen && (
        <ChordFilesUploadDialog
          close={() => setIsUploadOpen(false)}
          onUploadComplete={() => {
            setIsUploadOpen(false);
            fetchInitial();
          }}
        />
      )}
    </View>
  );
}
