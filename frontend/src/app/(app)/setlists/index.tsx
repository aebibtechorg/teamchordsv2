import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Plus, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { useProfileStore } from '../../../store/useProfileStore';
import { getSetLists } from '../../../utils/setlists';
import { SetListDto } from '../../../types/api';
import SetListTable from '../../../components/setlist/SetListTable';
import Spinner from '../../../components/Spinner';

export default function SetLists() {
  const { profile } = useProfileStore();
  const [setLists, setSetLists] = useState<SetListDto[]>([]);
  const [pageSize] = useState(20);
  const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: string } | null>(null);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const orgId = profile?.orgId;

  const fetchInitial = async () => {
    if (!orgId) {
      setSetLists([]);
      setNextCursor(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, nextCursor: next } = await getSetLists(orgId, {
      search: searchTerm,
      pageSize,
    });
    setSetLists(data);
    setNextCursor(next);
    setIsLoading(false);
  };

  const fetchMore = async () => {
    if (!orgId || !nextCursor || isFetchingNextPage || isLoading) return;
    setIsFetchingNextPage(true);
    const { data, nextCursor: next } = await getSetLists(orgId, {
      search: searchTerm,
      afterCreatedAt: nextCursor.createdAt,
      afterId: nextCursor.id,
      pageSize,
    });
    setSetLists((prev) => [...prev, ...data]);
    setNextCursor(next);
    setIsFetchingNextPage(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInitial();
    }, 300);
    return () => clearTimeout(timer);
  }, [orgId, searchTerm]);

  return (
    <View className="flex-1 bg-gray-100 p-4 md:p-8">
      <View className="max-w-6xl mx-auto w-full flex-1">
        {/* Header */}
        <View className="flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <View>
            <Text className="text-2xl md:text-3xl font-bold text-gray-900">Set Lists</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Organize chord sheets into performance set lists for gigs or services.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(app)/setlists/new' as any)}
            className="flex-row items-center bg-blue-600 px-4 py-2.5 rounded-xl shadow-sm active:bg-blue-700 self-start md:self-auto"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-sm font-semibold text-white ml-2">New Set List</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="mb-6 relative">
          <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-sm">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search set lists..."
              className="flex-1 ml-2 text-sm text-gray-900"
            />
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <Spinner />
        ) : (
          <SetListTable
            data={setLists}
            onRefresh={fetchInitial}
            onLoadMore={fetchMore}
            isFetchingNextPage={isFetchingNextPage}
          />
        )}
      </View>
    </View>
  );
}
