import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Save, Trash2, ArrowLeft, ChevronDown, Check } from 'lucide-react-native';
import ChordSheetJS from 'chordsheetjs';
import { WebView } from 'react-native-webview';
import { getChordsheet, createChordsheet, updateChordsheet, deleteChordsheet } from '../../../utils/chordsheets';
import { useProfileStore } from '../../../store/useProfileStore';
import { defaultContent, defaultKey, keys } from '../../../constants';
import Spinner from '../../../components/Spinner';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Modal from '../../../components/Modal';

export default function ChordProSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfileStore();
  const { width } = useWindowDimensions();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState(defaultKey);
  const [content, setContent] = useState(defaultContent);
  const [isKeyDropdownOpen, setIsKeyDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      const fetchSheet = async () => {
        try {
          const data = await getChordsheet(id);
          if (data.orgId && profile?.orgId && data.orgId !== profile.orgId) {
            router.replace('/(app)/library' as any);
            return;
          }
          setTitle(data.title || '');
          setArtist(data.artist || '');
          setKey(data.key || defaultKey);
          setContent(data.content || defaultContent);
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to load chord sheet.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchSheet();
    } else {
      setIsLoading(false);
    }
  }, [id, profile?.orgId]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a song title.');
      return;
    }
    setIsSaving(true);
    try {
      if (id === 'new') {
        const created = await createChordsheet({
          title,
          artist,
          key,
          content,
          orgId: profile?.orgId,
        });
        Alert.alert('Success', 'Chord sheet created successfully.');
        router.replace(`/(app)/library/${created.id}` as any);
      } else if (id) {
        await updateChordsheet(id, {
          title,
          artist,
          key,
          content,
          orgId: profile?.orgId,
        });
        Alert.alert('Success', 'Chord sheet updated successfully.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save chord sheet.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (id && id !== 'new') {
      await deleteChordsheet(id);
      router.replace('/(app)/library' as any);
    }
  };

  // Render HTML preview of chordpro
  const renderPreviewHtml = () => {
    try {
      const parser = new ChordSheetJS.ChordProParser();
      const song = parser.parse(content || '');
      const formatter = new ChordSheetJS.HtmlTableFormatter();
      const formatted = formatter.format(song);
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: ui-monospace, monospace; padding: 16px; background-color: #ffffff; color: #111827; }
            .chord { font-weight: bold; color: #2563EB; font-size: 14px; }
            .lyrics { font-size: 14px; line-height: 1.6; }
            .row { margin-bottom: 8px; }
            table { border-collapse: collapse; }
            td { vertical-align: top; padding-right: 4px; }
          </style>
        </head>
        <body>
          ${formatted}
        </body>
        </html>
      `;
    } catch {
      return '<html><body><p>Error rendering preview</p></body></html>';
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4 md:p-8" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="w-full flex-1 mb-12">
        {/* Navigation & Actions */}
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
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(true)}
                className="p-2.5 rounded-xl border border-red-200 bg-red-50 active:bg-red-100"
              >
                <Trash2 size={18} color="#DC2626" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="flex-row items-center bg-blue-600 px-5 py-2.5 rounded-xl shadow-sm active:bg-blue-700"
            >
              <Save size={16} color="#fff" />
              <Text className="text-sm font-semibold text-white ml-2">
                {isSaving ? 'Saving...' : 'Save Song'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metadata Inputs */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6">
          <View className="flex-col md:flex-row gap-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-700 mb-1">Song Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Amazing Grace"
                className="border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-gray-50"
              />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-700 mb-1">Artist / Author</Text>
              <TextInput
                value={artist}
                onChangeText={setArtist}
                placeholder="e.g. John Newton"
                className="border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-gray-50"
              />
            </View>

            <View className="w-full md:w-32">
              <Text className="text-xs font-semibold text-gray-700 mb-1">Key</Text>
              <TouchableOpacity
                onPress={() => setIsKeyDropdownOpen(true)}
                className="flex-row items-center justify-between border border-gray-300 rounded-xl px-3.5 py-2 bg-gray-50"
              >
                <Text className="text-sm text-gray-900">{key || 'Select'}</Text>
                <ChevronDown size={16} color="#6B7280" />
              </TouchableOpacity>

              <Modal visible={isKeyDropdownOpen} onClose={() => setIsKeyDropdownOpen(false)}>
                <View className="p-4 bg-white">
                  <Text className="text-lg font-bold text-gray-900 mb-3">Select Key</Text>
                  <ScrollView className="max-h-80">
                    {keys.map((k) => {
                      const isSelected = k === key;
                      return (
                        <TouchableOpacity
                          key={k}
                          onPress={() => {
                            setKey(k);
                            setIsKeyDropdownOpen(false);
                          }}
                          className={`flex-row items-center justify-between p-3 rounded-lg mb-1.5 ${
                            isSelected ? 'bg-gray-100' : 'active:bg-gray-50'
                          }`}
                        >
                          <Text className={`text-sm ${isSelected ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                            {k}
                          </Text>
                          {isSelected && <Check size={16} color="#374151" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </Modal>
            </View>
          </View>
        </View>

        {/* Editor and Live Preview */}
        <View className="flex-1 flex-col md:flex-row gap-6">
          {/* ChordPro Editor */}
          <View className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-200 min-h-[400px]">
            <Text className="text-sm font-bold text-gray-900 mb-2">ChordPro Source</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              placeholder="{title: Song Name}\n[C]Amazing [G]Grace..."
              className="flex-1 font-mono text-sm border border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-900 min-h-[350px]"
            />
          </View>

          {/* Formatted Preview */}
          <View className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-200 min-h-[400px]">
            <Text className="text-sm font-bold text-gray-900 mb-2">Preview</Text>
            <View className="flex-1 rounded-xl border border-gray-200 overflow-hidden bg-white min-h-[350px]">
              {Platform.OS === 'web' ? (
                <iframe
                  srcDoc={renderPreviewHtml()}
                  style={{ width: '100%', height: '100%', minHeight: 350, border: 'none' }}
                />
              ) : (
                <WebView
                  originWhitelist={['*']}
                  source={{ html: renderPreviewHtml() }}
                  style={{ flex: 1, minHeight: 350 }}
                />
              )}
            </View>
          </View>
        </View>
      </View>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Chord Sheet"
        message="Are you sure you want to delete this song? This action cannot be undone."
        confirmLabel="Delete"
      />
    </ScrollView>
  );
}
