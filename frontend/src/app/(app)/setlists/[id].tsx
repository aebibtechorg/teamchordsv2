import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import { useLocalSearchParams, router } from 'expo-router';
import { Save, Plus, ArrowLeft, Eye, Link2, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { getSetList, createSetList, updateSetList } from '../../../utils/setlists';
import { searchChordsheets, getChordsheet } from '../../../utils/chordsheets';
import { syncOutputs, getCapoText } from '../../../utils/outputs';
import { useProfileStore } from '../../../store/useProfileStore';
import { keys, frets, defaultKeyValue } from '../../../constants';
import { ChordSheetDto } from '../../../types/api';
import Spinner from '../../../components/Spinner';
import Modal from '../../../components/Modal';
import { SetListScrollContainer } from '../../../components/setlist/SetListScrollContainer';
import { DraggableSongList } from '../../../components/setlist/DraggableSongList';
import { WEB_BASE_URL } from '../../../config';
import { useIconColor } from '../../../hooks/use-icon-color';

export default function SetListForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfileStore();
  const [name, setName] = useState('');
  const [outputs, setOutputs] = useState<any[]>([]);
  const [chordsheetsMap, setChordsheetsMap] = useState<Record<string, ChordSheetDto>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const ic = useIconColor();

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
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: err.message || 'Failed to load set list.',
          });
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
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Please select a song and key.',
      });
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
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a set list name.',
      });
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

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Set list saved successfully.',
      });
      if (id === 'new') {
        router.replace(`/(app)/setlists/${savedSetListId}` as any);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to save set list.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!id || id === 'new') return;
    const url = `${WEB_BASE_URL}/setlists/share/${id}`;
    await Clipboard.setStringAsync(url);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Share link copied to clipboard!',
    });
  };

  if (isLoading) return <Spinner />;

  return (
    <SetListScrollContainer className="flex-1 bg-background p-4 md:p-8">
      <View className="w-full mb-12">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center bg-card border border-border px-3.5 py-2 rounded-xl shadow-sm active:bg-muted"
          >
            <ArrowLeft size={16} color={ic.primary} />
            <Text className="text-sm font-semibold text-foreground ml-1.5">Back</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            {id !== 'new' && (
              <>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`${WEB_BASE_URL}/setlists/share/${id}`)}
                  className="p-2.5 rounded-xl border border-border bg-card active:bg-muted shadow-sm"
                  accessibilityLabel="Preview Live View"
                >
                  <Eye size={18} color={ic.secondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCopyShareLink}
                  className="p-2.5 rounded-xl border border-border bg-card active:bg-muted shadow-sm"
                  accessibilityLabel="Copy Share Link"
                >
                  <Link2 size={18} color={ic.secondary} />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="flex-row items-center bg-primary px-5 py-2.5 rounded-xl shadow-sm active:opacity-90"
            >
              <Save size={16} color="#fff" />
              <Text className="text-sm font-semibold text-primary-foreground ml-2">
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Set List Name */}
        <View className="bg-card rounded-2xl p-5 shadow-sm border border-border mb-6">
          <Text className="text-xs font-semibold text-foreground mb-1.5">Set List Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Sunday Morning Worship"
            placeholderTextColor={ic.placeholder}
            className="border border-border rounded-xl px-3.5 py-2.5 text-base bg-muted text-foreground font-medium"
          />
        </View>

        {/* Songs in Setlist */}
        <View className="bg-card rounded-2xl p-5 shadow-sm border border-border mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-bold text-foreground">Songs ({outputs.length})</Text>
              <Text className="text-xs text-muted-foreground">Order and customize keys for this performance.</Text>
            </View>
            <TouchableOpacity
              onPress={openAddModal}
              className="flex-row items-center bg-primary/10 border-0 px-3.5 py-2 rounded-xl active:bg-primary/20"
            >
              <Plus size={16} color={ic.active} />
              <Text className="text-sm font-semibold text-primary ml-1.5">Add Song</Text>
            </TouchableOpacity>
          </View>

          <DraggableSongList
            outputs={outputs}
            chordsheetsMap={chordsheetsMap}
            onReorder={setOutputs}
            onMoveSong={moveSong}
            onOpenEditModal={openEditModal}
            onRemoveSong={removeSong}
            onOpenAddModal={openAddModal}
            ic={ic}
          />
        </View>
      </View>

      {/* Song Selection / Edit Modal */}
      {isSongModalOpen && (
        <Modal visible onClose={() => setIsSongModalOpen(false)}>
          <View className="p-6 bg-card">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-foreground">
                {editingIndex ? 'Edit Song Settings' : 'Add Song to Set List'}
              </Text>
              <TouchableOpacity onPress={() => setIsSongModalOpen(false)}>
                <X size={20} color={ic.secondary} />
              </TouchableOpacity>
            </View>

            {!editingIndex && (
              <View className="mb-4">
                <Text className="text-xs font-semibold text-foreground mb-1">Select Song</Text>
                <TextInput
                  value={searchQuery}
                  onChangeText={handleSearchSongs}
                  placeholder="Search library songs..."
                  placeholderTextColor={ic.placeholder}
                  className="border border-border rounded-xl px-3 py-2 text-sm bg-muted text-foreground mb-2"
                />
                <ScrollView className="max-h-36 border border-border rounded-xl p-1">
                  {searchedSongs.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => {
                        setSelectedSongId(s.id!);
                        setSelectedKey(s.key || 'C');
                        setChordsheetsMap((prev) => ({ ...prev, [s.id!]: s }));
                      }}
                      className={`p-2.5 rounded-lg ${
                        selectedSongId === s.id ? 'bg-primary/10 border border-primary/30' : 'active:bg-muted'
                      }`}
                    >
                      <Text className="text-sm font-semibold text-foreground">{s.title}</Text>
                      <Text className="text-xs text-muted-foreground">{s.artist} • Key: {s.key}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Target Key Selection */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-foreground mb-1.5">Target Key</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 py-1">
                {keys.map((k) => (
                  <TouchableOpacity
                    key={k}
                    onPress={() => setSelectedKey(k)}
                    className={`px-3 py-1.5 rounded-lg border ${
                      selectedKey === k
                        ? 'bg-primary border-primary'
                        : 'border-border bg-card active:bg-muted'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${selectedKey === k ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {k}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Capo Selection */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-foreground mb-1.5">Capo Position</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 py-1">
                <TouchableOpacity
                  onPress={() => setSelectedCapo(0)}
                  className={`px-3 py-1.5 rounded-lg border ${
                    selectedCapo === 0
                      ? 'bg-primary border-primary'
                      : 'border-border bg-card active:bg-muted'
                  }`}
                >
                  <Text className={`text-xs font-bold ${selectedCapo === 0 ? 'text-primary-foreground' : 'text-foreground'}`}>
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
                          ? 'bg-primary border-primary'
                          : 'border-border bg-card active:bg-muted'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${selectedCapo === num ? 'text-primary-foreground' : 'text-foreground'}`}>
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
                className="px-4 py-2.5 rounded-lg bg-muted active:opacity-80"
              >
                <Text className="text-foreground font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveSongToSetlist}
                className="px-5 py-2.5 rounded-lg bg-primary active:opacity-90"
              >
                <Text className="text-primary-foreground font-medium">{editingIndex ? 'Update' : 'Add to Set'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SetListScrollContainer>
  );
}
