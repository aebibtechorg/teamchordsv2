import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Save, Plus, ArrowLeft, Trash2, Edit, ChevronUp, ChevronDown, Eye, Link2, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { getSetList, createSetList, updateSetList } from '../../../utils/setlists';
import { searchChordsheets, getChordsheet } from '../../../utils/chordsheets';
import { syncOutputs, getCapoText } from '../../../utils/outputs';
import { useProfileStore } from '../../../store/useProfileStore';
import { useSongSelectionStore } from '../../../store/useSongSelectionStore';
import { keys, frets, defaultKeyValue, defaultFretValue, defaultOutputValue } from '../../../constants';
import { ChordSheetDto } from '../../../types/api';
import Spinner from '../../../components/Spinner';
import Modal from '../../../components/Modal';
import { getApiBaseUrl } from '../../../utils/api';
import { WEB_BASE_URL } from '../../../config';

export default function SetListForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfileStore();
  const [name, setName] = useState('');
  const [outputs, setOutputs] = useState<any[]>([]);
  const [chordsheetsMap, setChordsheetsMap] = useState<Record<string, ChordSheetDto>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);

  // Song search in modal
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedSongs, setSearchedSongs] = useState<ChordSheetDto[]>([]);
  const [selectedSongId, setSelectedSongId] = useState('');
  const [selectedKey, setSelectedKey] = useState(defaultKeyValue.value);
  const [selectedCapo, setSelectedCapo] = useState(0);
  const [editingIndex, setEditingIndex] = useState<string | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (id && id !== 'new') {
      const fetchSetList = async () => {
        try {
          const data = await getSetList(id);
          setName(data.name || '');
          const mappedOutputs = (data.outputs || []).map((o, idx) => ({
            id: o.id || null,
            song: o.chordSheetId,
            targetKey: o.targetKey || '',
            capo: o.capo || 0,
            order: o.order ?? idx,
            index: `output-${idx}-${Date.now()}`,
          }));
          setOutputs(mappedOutputs);

          // Fetch song info
          const songIds: string[] = Array.from(new Set(mappedOutputs.map((o) => o.song).filter((s): s is string => Boolean(s))));
          const map: Record<string, ChordSheetDto> = {};
          await Promise.all(
            songIds.map(async (sId) => {
              try {
                const sheet = await getChordsheet(sId);
                map[sId] = sheet;
              } catch {}
            })
          );
          setChordsheetsMap(map);
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to load set list.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchSetList();
    } else {
      setIsLoading(false);
    }
  }, [id]);

  const handleSearchSongs = async (query: string) => {
    setSearchQuery(query);
    if (!orgId) return;
    const results = await searchChordsheets(orgId, query);
    setSearchedSongs(results);
  };

  const openAddModal = () => {
    setEditingIndex(null);
    setSelectedSongId('');
    setSelectedKey('');
    setSelectedCapo(0);
    setSearchQuery('');
    handleSearchSongs('');
    setIsSongModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingIndex(item.index);
    setSelectedSongId(item.song);
    setSelectedKey(item.targetKey);
    setSelectedCapo(item.capo);
    setIsSongModalOpen(true);
  };

  const saveSongToSetlist = () => {
    if (!selectedSongId || !selectedKey) {
      Alert.alert('Validation', 'Please select a song and key.');
      return;
    }

    if (editingIndex) {
      setOutputs((prev) =>
        prev.map((item) =>
          item.index === editingIndex
            ? { ...item, song: selectedSongId, targetKey: selectedKey, capo: selectedCapo }
            : item
        )
      );
    } else {
      const newOutput = {
        id: null,
        song: selectedSongId,
        targetKey: selectedKey,
        capo: selectedCapo,
        order: outputs.length,
        index: `output-${Date.now()}`,
      };
      setOutputs((prev) => [...prev, newOutput]);
    }
    setIsSongModalOpen(false);
  };

  const moveSong = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= outputs.length) return;
    const updated = [...outputs];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setOutputs(updated.map((item, idx) => ({ ...item, order: idx })));
  };

  const removeSong = (index: number) => {
    setOutputs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a set list name.');
      return;
    }

    setIsSaving(true);
    try {
      let savedSetListId = id;
      if (id === 'new') {
        const created = await createSetList({ name, orgId });
        savedSetListId = created.id!;
      } else if (id) {
        await updateSetList(id, { name, orgId });
      }

      if (savedSetListId && savedSetListId !== 'new') {
        await syncOutputs(savedSetListId, outputs);
      }

      Alert.alert('Success', 'Set list saved successfully.');
      if (id === 'new') {
        router.replace(`/(app)/setlists/${savedSetListId}` as any);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save set list.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!id || id === 'new') return;
    const url = `${WEB_BASE_URL}/setlists/share/${id}`;
    await Clipboard.setStringAsync(url);
    Alert.alert('Success', 'Share link copied to clipboard!');
  };

  if (isLoading) return <Spinner />;

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4 md:p-8">
      <View className="w-full mb-12">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-sm active:bg-gray-50"
          >
            <ArrowLeft size={16} color="#374151" />
            <Text className="text-sm font-semibold text-gray-700 ml-1.5">Back</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            {id !== 'new' && (
              <>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`${WEB_BASE_URL}/setlists/share/${id}`)}
                  className="p-2.5 rounded-xl border border-gray-200 bg-white active:bg-gray-50 shadow-sm"
                  accessibilityLabel="Preview Live View"
                >
                  <Eye size={18} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCopyShareLink}
                  className="p-2.5 rounded-xl border border-gray-200 bg-white active:bg-gray-50 shadow-sm"
                  accessibilityLabel="Copy Share Link"
                >
                  <Link2 size={18} color="#4B5563" />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="flex-row items-center bg-blue-600 px-5 py-2.5 rounded-xl shadow-sm active:bg-blue-700"
            >
              <Save size={16} color="#fff" />
              <Text className="text-sm font-semibold text-white ml-2">
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Set List Name */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6">
          <Text className="text-xs font-semibold text-gray-700 mb-1.5">Set List Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Sunday Morning Worship"
            className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-base bg-gray-50 font-medium"
          />
        </View>

        {/* Songs in Setlist */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-bold text-gray-900">Songs ({outputs.length})</Text>
              <Text className="text-xs text-gray-500">Order and customize keys for this performance.</Text>
            </View>
            <TouchableOpacity
              onPress={openAddModal}
              className="flex-row items-center bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-xl active:bg-blue-100"
            >
              <Plus size={16} color="#2563EB" />
              <Text className="text-sm font-semibold text-blue-600 ml-1.5">Add Song</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-3">
            {outputs.map((item, index) => {
              const sheet = chordsheetsMap[item.song];
              return (
                <View
                  key={item.index || index}
                  className="flex-row items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-semibold text-gray-900 truncate" numberOfLines={1}>
                      {index + 1}. {sheet?.title || 'Loading Song...'}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                        <Text className="text-xs font-semibold text-blue-800">Key: {item.targetKey || sheet?.key || 'C'}</Text>
                      </View>
                      {Number(item.capo) > 0 && (
                        <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                          <Text className="text-xs font-semibold text-amber-800">{getCapoText(item.capo)}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1">
                    <TouchableOpacity
                      onPress={() => moveSong(index, 'up')}
                      disabled={index === 0}
                      className={`p-1.5 rounded-lg ${index === 0 ? 'opacity-30' : 'active:bg-gray-200'}`}
                    >
                      <ChevronUp size={18} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveSong(index, 'down')}
                      disabled={index === outputs.length - 1}
                      className={`p-1.5 rounded-lg ${index === outputs.length - 1 ? 'opacity-30' : 'active:bg-gray-200'}`}
                    >
                      <ChevronDown size={18} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      className="p-1.5 rounded-lg active:bg-gray-200 ml-1"
                    >
                      <Edit size={16} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeSong(index)}
                      className="p-1.5 rounded-lg active:bg-red-50 ml-1"
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {outputs.length === 0 && (
              <View className="border border-dashed border-gray-300 rounded-xl p-8 items-center justify-center">
                <Text className="text-gray-500 font-medium">No songs added yet.</Text>
                <TouchableOpacity onPress={openAddModal} className="mt-3">
                  <Text className="text-blue-600 font-semibold text-sm">+ Add the first song</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Song Selection / Edit Modal */}
      {isSongModalOpen && (
        <Modal visible onClose={() => setIsSongModalOpen(false)}>
          <View className="p-6 bg-white">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">
                {editingIndex ? 'Edit Song Settings' : 'Add Song to Set List'}
              </Text>
              <TouchableOpacity onPress={() => setIsSongModalOpen(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {!editingIndex && (
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-700 mb-1">Select Song</Text>
                <TextInput
                  value={searchQuery}
                  onChangeText={handleSearchSongs}
                  placeholder="Search library songs..."
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-gray-50 mb-2"
                />
                <ScrollView className="max-h-36 border border-gray-200 rounded-xl p-1">
                  {searchedSongs.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => {
                        setSelectedSongId(s.id!);
                        setSelectedKey(s.key || 'C');
                        setChordsheetsMap((prev) => ({ ...prev, [s.id!]: s }));
                      }}
                      className={`p-2.5 rounded-lg ${
                        selectedSongId === s.id ? 'bg-blue-50 border border-blue-200' : 'active:bg-gray-50'
                      }`}
                    >
                      <Text className="text-sm font-semibold text-gray-900">{s.title}</Text>
                      <Text className="text-xs text-gray-500">{s.artist} • Key: {s.key}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Target Key Selection */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-700 mb-1.5">Target Key</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 py-1">
                {keys.map((k) => (
                  <TouchableOpacity
                    key={k}
                    onPress={() => setSelectedKey(k)}
                    className={`px-3 py-1.5 rounded-lg border ${
                      selectedKey === k
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 bg-white active:bg-gray-50'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${selectedKey === k ? 'text-white' : 'text-gray-700'}`}>
                      {k}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Capo Selection */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-gray-700 mb-1.5">Capo Position</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 py-1">
                <TouchableOpacity
                  onPress={() => setSelectedCapo(0)}
                  className={`px-3 py-1.5 rounded-lg border ${
                    selectedCapo === 0
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 bg-white active:bg-gray-50'
                  }`}
                >
                  <Text className={`text-xs font-bold ${selectedCapo === 0 ? 'text-white' : 'text-gray-700'}`}>
                    None
                  </Text>
                </TouchableOpacity>
                {frets.map((f) => {
                  const num = Number(f);
                  return (
                    <TouchableOpacity
                      key={f}
                      onPress={() => setSelectedCapo(num)}
                      className={`px-3 py-1.5 rounded-lg border ${
                        selectedCapo === num
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 bg-white active:bg-gray-50'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${selectedCapo === num ? 'text-white' : 'text-gray-700'}`}>
                        {f}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => setIsSongModalOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-gray-200 active:bg-gray-300"
              >
                <Text className="text-gray-800 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveSongToSetlist}
                className="px-5 py-2.5 rounded-lg bg-blue-600 active:bg-blue-700"
              >
                <Text className="text-white font-medium">{editingIndex ? 'Update' : 'Add to Set'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}
