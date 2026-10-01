import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
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
  const [pageSize] = useState(50);
  const [cursorStack, setCursorStack] = useState<{ createdAt?: string; id?: string }[]>([]);
  const [currentCursor, setCurrentCursor] = useState<{ createdAt?: string; id?: string } | null>(null);
  const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const orgId = profile?.orgId;

  const fetchData = async () => {
    if (!orgId) {
      setSetLists([]);
      setNextCursor(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, nextCursor: next } = await getSetLists(orgId, {
      search: searchTerm,
      afterCreatedAt: currentCursor?.createdAt,
      afterId: currentCursor?.id,
      pageSize,
    });
    setSetLists(data);
    setNextCursor(next);
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [orgId, searchTerm, currentCursor]);

  const handleNext = () => {
    if (nextCursor) {
      setCursorStack((prev) => [...prev, currentCursor || {}]);
      setCurrentCursor(nextCursor);
    }
  };

  const handlePrev = () => {
    if (cursorStack.length > 0) {
      const prev = [...cursorStack];
      const last = prev.pop() || null;
      setCursorStack(prev);
      setCurrentCursor(last && Object.keys(last).length > 0 ? last : null);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4 md:p-8">
      <View className="max-w-6xl mx-auto w-full">
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
            onRefresh={fetchData}
            hasPrev={cursorStack.length > 0}
            hasNext={Boolean(nextCursor)}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
      </View>
    </ScrollView>
  );
}
