import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { X, Upload, FileText } from 'lucide-react-native';
import ChordSheetJS from 'chordsheetjs';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { createChordsheet, createChordsheetsBulk } from '../../utils/chordsheets';
import { useProfileStore } from '../../store/useProfileStore';
import Modal from '../Modal';
import { useIconColor } from '../../hooks/use-icon-color';

interface ChordFilesUploadDialogProps {
  connection?: any;
  close: () => void;
  onUploadComplete?: () => void;
}

export default function ChordFilesUploadDialog({
  connection,
  close,
  onUploadComplete,
}: ChordFilesUploadDialogProps) {
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ processed: 0, total: 0, message: '' });
  const pendingBulkUploadsRef = useRef(0);
  const fileProcessingCompleteRef = useRef(false);
  const finishedNotifiedRef = useRef(false);
  const { profile } = useProfileStore();
  const ic = useIconColor();

  const handlePickFiles = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: '*/*',
      });
      if (!res.canceled && res.assets) {
        setFiles(res.assets);
      }
    } catch (err) {
      console.error('Error picking files:', err);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadProgress({ processed: 0, total: 0, message: 'Starting upload...' });
    pendingBulkUploadsRef.current = 0;
    fileProcessingCompleteRef.current = false;
    finishedNotifiedRef.current = false;

    const hasBulkJson = files.some((file) => file.name.endsWith('.json'));
    const canRunBulkUpload = !hasBulkJson || Boolean(connection?.connectionId);

    if (!canRunBulkUpload) {
      Toast.show({
        type: 'info',
        text1: 'Notice',
        text2: 'Please wait for the connection to finish before uploading JSON backups.',
      });
      setIsUploading(false);
      return;
    }

    const notifyFinishedIfComplete = () => {
      if (finishedNotifiedRef.current) return;
      if (!fileProcessingCompleteRef.current || pendingBulkUploadsRef.current > 0) return;

      finishedNotifiedRef.current = true;
      setIsUploading(false);
      onUploadComplete?.();
    };

    const handleProgress = (processed: number, total: number, message: string) => {
      setUploadProgress({ processed, total, message });
    };

    const handleFinished = () => {
      if (pendingBulkUploadsRef.current > 0) {
        pendingBulkUploadsRef.current -= 1;
      }
      setUploadProgress((current) => ({
        ...current,
        processed: current.total,
        message: pendingBulkUploadsRef.current > 0 ? 'Finishing remaining bulk imports...' : 'Upload finished.',
      }));
      notifyFinishedIfComplete();
    };

    let handleSummary: (summary: any) => void;
    if (connection && hasBulkJson) {
      connection.on('BulkUploadProgress', handleProgress);
      connection.on('BulkUploadFinished', handleFinished);
      handleSummary = (summary: any) => {
        const createdIds = summary?.createdIds ?? summary?.CreatedIds ?? [];
        const total = summary?.totalProcessed ?? summary?.TotalProcessed ?? 0;
        const successful = summary?.successful ?? summary?.Successful ?? (createdIds ? createdIds.length : 0);
        setUploadProgress({ processed: successful, total, message: `Imported ${successful} of ${total} songs` });
        if (pendingBulkUploadsRef.current > 0) pendingBulkUploadsRef.current -= 1;
        notifyFinishedIfComplete();
      };
      connection.on('BulkUploadSummary', handleSummary);
    }

    try {
      for (const file of files) {
        let text = '';
        if (file.file) {
          text = await file.file.text();
        } else {
          text = await FileSystem.readAsStringAsync(file.uri);
        }

        if (file.name.endsWith('.json')) {
          const sheets = JSON.parse(text);
          if (Array.isArray(sheets)) {
            pendingBulkUploadsRef.current += 1;
            const dtos = sheets.map((sheet) => ({ ...sheet, orgId: profile?.orgId }));
            await createChordsheetsBulk({ dtos, connectionId: connection?.connectionId || '' });
          }
        } else {
          const parser = new ChordSheetJS.ChordProParser();
          const chordsheet = parser.parse(text);
          const artistStr = Array.isArray(chordsheet.artist)
            ? chordsheet.artist.join(', ')
            : chordsheet.artist || 'Various';
          await createChordsheet({
            title: chordsheet.title || file.name.replace(/\.[^/.]+$/, '') || 'Untitled',
            artist: artistStr,
            key: chordsheet.key || 'C',
            content: text,
            orgId: profile?.orgId,
          });
        }
      }

      fileProcessingCompleteRef.current = true;
      if (!hasBulkJson) {
        setIsUploading(false);
        onUploadComplete?.();
      } else {
        notifyFinishedIfComplete();
      }
    } catch (err: any) {
      console.error('Error during upload:', err);
      Toast.show({
        type: 'error',
        text1: 'Upload Error',
        text2: err.message || 'An error occurred during upload.',
      });
      setIsUploading(false);
    }
  };

  return (
    <Modal visible onClose={close}>
      <View className="p-6 bg-card">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-foreground">Upload Chord Sheets</Text>
          <TouchableOpacity onPress={close} className="p-1 rounded-full active:bg-muted">
            <X size={20} color={ic.secondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handlePickFiles}
          disabled={isUploading}
          className="border-2 border-dashed border-border rounded-xl p-6 items-center justify-center bg-muted/60 active:bg-muted mb-4"
        >
          <Upload size={32} color={ic.secondary} />
          <Text className="text-sm font-semibold text-foreground mt-2">Tap to browse files</Text>
          <Text className="text-xs text-muted-foreground mt-1">Supports ChordPro (.pro, .cho, .txt) or JSON backups</Text>
        </TouchableOpacity>

        {files.length > 0 && (
          <ScrollView className="max-h-40 mb-4 border border-border rounded-lg p-2">
            {files.map((f, i) => (
              <View key={i} className="flex-row items-center py-1.5 px-2 border-b border-border/50">
                <FileText size={16} color={ic.primary} />
                <Text className="text-xs text-foreground ml-2 flex-1 truncate" numberOfLines={1}>
                  {f.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {isUploading && (
          <View className="my-3 items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="text-xs text-muted-foreground mt-2 font-medium">
              {uploadProgress.message || 'Uploading...'}
            </Text>
          </View>
        )}

        <View className="flex-row justify-end gap-3 mt-2">
          <TouchableOpacity
            onPress={close}
            disabled={isUploading}
            className="px-4 py-2.5 rounded-lg bg-muted active:opacity-80"
          >
            <Text className="text-foreground font-medium">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleUpload}
            disabled={isUploading || files.length === 0}
            className={`px-5 py-2.5 rounded-lg bg-primary active:opacity-90 ${
              isUploading || files.length === 0 ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-primary-foreground font-medium">Upload ({files.length})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
