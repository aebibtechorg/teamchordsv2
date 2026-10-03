import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, useWindowDimensions, Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import { useLocalSearchParams, router } from 'expo-router';
import { Save, Trash2, ArrowLeft, ChevronDown, Check, RefreshCw } from 'lucide-react-native';
import ChordSheetJS from 'chordsheetjs';
import { WebView } from 'react-native-webview';
import { getChordsheet, createChordsheet, updateChordsheet, deleteChordsheet } from '../../../utils/chordsheets';
import { useProfileStore } from '../../../store/useProfileStore';
import { defaultContent, defaultKey, keys, chordProGuideURL } from '../../../constants';
import Spinner from '../../../components/Spinner';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Modal from '../../../components/Modal';

import { useIconColor } from '../../../hooks/use-icon-color';
import { useColorScheme } from 'react-native';

export default function ChordProSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfileStore();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const ic = useIconColor();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState(defaultKey);
  const [content, setContent] = useState(defaultContent);
  const [isKeyDropdownOpen, setIsKeyDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('ultimate-guitar');
  const [preview, setPreview] = useState('');

  const parseChordsOverWords = (input: string) => {
    const parser = new ChordSheetJS.ChordsOverWordsParser();
    try {
      return parser.parse(input);
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const parseUltimateGuitar = (input: string) => {
    const parser = new ChordSheetJS.UltimateGuitarParser();
    try {
      return parser.parse(input);
    } catch (error) {
      console.error(error);
      return parseChordsOverWords(input);
    }
  };

  const convertFormat = (format: string, input: string) => {
    const formatter = new ChordSheetJS.ChordProFormatter();
    if (!input) return '';
    try {
      const parsed = format === 'chords-over-words'
        ? parseChordsOverWords(input)
        : parseUltimateGuitar(input);

      if (parsed) {
        return formatter.format(parsed);
      }
      return '';
    } catch (e) {
      console.error("Format conversion error", e);
      return '';
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPreview(convertFormat(selectedFormat, sourceText));
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [sourceText, selectedFormat]);

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
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: err.message || 'Failed to load chord sheet.',
          });
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
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a song title.',
      });
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
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Chord sheet created successfully.',
        });
        router.replace(`/(app)/library/${created.id}` as any);
      } else if (id) {
        await updateChordsheet(id, {
          title,
          artist,
          key,
          content,
          orgId: profile?.orgId,
        });
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Chord sheet updated successfully.',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to save chord sheet.',
      });
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
    const isDark = colorScheme === 'dark';
    const bgColor = isDark ? '#111827' : '#ffffff';
    const textColor = isDark ? '#F9FAFB' : '#111827';
    const chordColor = isDark ? '#3B82F6' : '#2563EB';

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
            body { font-family: ui-monospace, monospace; padding: 16px; background-color: ${bgColor}; color: ${textColor}; }
            .chord { font-weight: bold; color: ${chordColor}; font-size: 14px; }
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
      return `<html><body style="background:${bgColor};color:${textColor}"><p>Error rendering preview</p></body></html>`;
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <ScrollView className="flex-1 bg-background p-4 md:p-8" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="w-full flex-1 mb-12">
        {/* Navigation & Actions */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center bg-card border border-border px-3.5 py-2 rounded-xl shadow-sm active:bg-muted"
          >
            <ArrowLeft size={16} color={ic.primary} />
            <Text className="text-sm font-semibold text-foreground ml-1.5">Back</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => {
                setIsConverterOpen(true);
                setSourceText(content);
                setPreview('');
              }}
              className="flex-row items-center bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-sm active:bg-muted"
            >
              <RefreshCw size={width >= 768 ? 16 : 18} color={ic.secondary} />
              {width >= 768 && (
                <Text className="text-sm font-semibold text-foreground ml-2">Convert</Text>
              )}
            </TouchableOpacity>

            {id !== 'new' && (
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(true)}
                className="p-2.5 rounded-xl border border-red-500/30 bg-red-500/10 active:bg-red-500/20"
              >
                <Trash2 size={18} color={ic.danger} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="flex-row items-center bg-primary px-5 py-2.5 rounded-xl shadow-sm active:opacity-90"
            >
              <Save size={16} color="#fff" />
              <Text className="text-sm font-semibold text-primary-foreground ml-2">
                {isSaving ? 'Saving...' : 'Save Song'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metadata Inputs */}
        <View className="bg-card rounded-2xl p-5 shadow-sm border border-border mb-6">
          <View className="flex-col md:flex-row gap-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground mb-1">Song Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Amazing Grace"
                placeholderTextColor={ic.placeholder}
                className="border border-border rounded-xl px-3.5 py-2 text-sm bg-muted text-foreground"
              />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground mb-1">Artist / Author</Text>
              <TextInput
                value={artist}
                onChangeText={setArtist}
                placeholder="e.g. John Newton"
                placeholderTextColor={ic.placeholder}
                className="border border-border rounded-xl px-3.5 py-2 text-sm bg-muted text-foreground"
              />
            </View>

            <View className="w-full md:w-32">
              <Text className="text-xs font-semibold text-foreground mb-1">Key</Text>
              <TouchableOpacity
                onPress={() => setIsKeyDropdownOpen(true)}
                className="flex-row items-center justify-between border border-border rounded-xl px-3.5 py-2 bg-muted"
              >
                <Text className="text-sm text-foreground">{key || 'Select'}</Text>
                <ChevronDown size={16} color={ic.secondary} />
              </TouchableOpacity>

              <Modal visible={isKeyDropdownOpen} onClose={() => setIsKeyDropdownOpen(false)}>
                <View className="p-4 bg-card">
                  <Text className="text-lg font-bold text-foreground mb-3">Select Key</Text>
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
                            isSelected ? 'bg-muted' : 'active:bg-muted/60'
                          }`}
                        >
                          <Text className={`text-sm ${isSelected ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                            {k}
                          </Text>
                          {isSelected && <Check size={16} color={ic.primary} />}
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
        <View className="flex-1 flex-col lg:flex-row gap-6">
          {/* ChordPro Editor */}
          <View className="flex-1 bg-card rounded-2xl p-5 shadow-sm border border-border min-h-[400px]">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-bold text-foreground">ChordPro Source</Text>
              <TouchableOpacity onPress={() => Linking.openURL(chordProGuideURL)}>
                <Text className="text-xs font-semibold text-primary active:underline">
                  ChordPro Syntax Guide
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              placeholder="{title: Song Name}\n[C]Amazing [G]Grace..."
              placeholderTextColor={ic.placeholder}
              className="flex-1 font-mono text-sm border border-border rounded-xl p-3 bg-muted text-foreground min-h-[350px]"
            />
          </View>

          {/* Formatted Preview */}
          <View className="flex-1 bg-card rounded-2xl p-5 shadow-sm border border-border min-h-[400px]">
            <Text className="text-sm font-bold text-foreground mb-2">Preview</Text>
            <View className="flex-1 rounded-xl border border-border overflow-hidden bg-card min-h-[350px]">
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

      <Modal visible={isConverterOpen} onClose={() => setIsConverterOpen(false)}>
        <View className="p-4 md:p-6 w-full">
          <Text className="text-xl font-bold text-foreground mb-4">Convert to ChordPro</Text>

          <Text className="text-sm font-semibold text-foreground mb-2">Source Format</Text>
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => setSelectedFormat('ultimate-guitar')}
              className={`flex-1 p-3 rounded-xl border ${
                selectedFormat === 'ultimate-guitar'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted'
              }`}
            >
              <Text
                className={`text-center text-sm ${
                  selectedFormat === 'ultimate-guitar'
                    ? 'text-primary font-bold'
                    : 'text-foreground font-medium'
                }`}
              >
                Ultimate Guitar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedFormat('chords-over-words')}
              className={`flex-1 p-3 rounded-xl border ${
                selectedFormat === 'chords-over-words'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted'
              }`}
            >
              <Text
                className={`text-center text-sm ${
                  selectedFormat === 'chords-over-words'
                    ? 'text-primary font-bold'
                    : 'text-foreground font-medium'
                }`}
              >
                Chords over Words
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-sm font-semibold text-foreground mb-2">Source Text</Text>
          <TextInput
            value={sourceText}
            onChangeText={setSourceText}
            multiline
            textAlignVertical="top"
            placeholder="Paste your source text here..."
            placeholderTextColor={ic.placeholder}
            className="w-full h-40 p-3 border border-border rounded-xl mb-4 font-mono text-sm bg-muted text-foreground"
          />

          <Text className="text-sm font-semibold text-foreground mb-2">Preview (ChordPro)</Text>
          <View className="w-full h-40 border border-border rounded-xl mb-6 bg-muted p-3">
            <ScrollView nestedScrollEnabled>
              <Text className="font-mono text-sm text-foreground">{preview}</Text>
            </ScrollView>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setIsConverterOpen(false)}
              className="flex-1 p-3.5 rounded-xl border border-border items-center active:bg-muted"
            >
              <Text className="text-foreground font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const converted = convertFormat(selectedFormat, sourceText);
                setPreview(converted);
                setContent(converted);
                setIsConverterOpen(false);
                Toast.show({
                  type: 'success',
                  text1: 'Converted',
                  text2: 'Converted and applied to editor',
                });
              }}
              className="flex-1 p-3.5 rounded-xl bg-primary items-center active:opacity-90"
            >
              <Text className="text-primary-foreground font-semibold">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
