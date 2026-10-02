import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { RefreshCw, Printer } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import ChordSheetJS, { Key } from 'chordsheetjs';
import { HubConnectionBuilder } from '@microsoft/signalr';
import * as Linking from 'expo-linking';
import { getOutputs, getCapoText } from '../../utils/outputs';
import { getSetList } from '../../utils/setlists';
import { OutputDetailDto, SetListDetailDto } from '../../types/api';
import { getSignalRHubUrl } from '../../utils/signalr';
import { keys, frets } from '../../constants';
import Spinner from '../../components/Spinner';
import { WEB_BASE_URL } from '../../config';

// Standard Letter paper size in px at 96dpi (matches web SetListView)
const PAGE_SIZE = { widthPx: 816, heightPx: 1056 };



interface ScaledSheetProps {
  output: OutputDetailDto;
  keyOverride?: string;
  capoOverride?: number;
}

const renderChordProHtml = (output: OutputDetailDto, keyOverride?: string, capoOverride?: number, isMobile: boolean = false, scale: number = 1) => {
  let rawContent = output.chordsheets?.content;
  if (!rawContent) return '<p style="color:#9CA3AF; padding: 24px; text-align: center;">No chord content available.</p>';

  try {
    const parser = new ChordSheetJS.ChordProParser();
    const originalKey = output.chordsheets?.key || '';
    const targetKey = keyOverride || output.targetKey || originalKey;
    const capo = capoOverride !== undefined ? capoOverride : (Number(output.capo) || 0);

    const safeOriginalKey = originalKey || targetKey;
    const safeTargetKey = targetKey || originalKey;
    const distance = safeOriginalKey && safeTargetKey ? Key.distance(safeOriginalKey, safeTargetKey) : 0;

    rawContent = rawContent.replaceAll('{ci:', '{c:');
    const song = parser.parse(rawContent);
    const transposedSong = song.transpose(distance);
    const changedTitleSong = transposedSong.changeMetadata(
      'title',
      capo !== 0 ? `${transposedSong.title} (Capo on ${getCapoText(capo)})` : transposedSong.title
    );

    const formatter = new ChordSheetJS.HtmlTableFormatter();
    const formatted = formatter.format(changedTitleSong);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
          
          * {
            box-sizing: border-box;
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }

          html, body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            color: #111827;
          }

          .paragraph {
            margin-bottom: 24px;
          }

          .chord {
            font-weight: 600;
            color: #111827;
          }

          td.comment {
            font-weight: bolder;
            font-size: 1.2em;
          }

          td.chord, td.lyrics {
            padding-left: 3px;
          }

          .sheet h1 {
            margin-bottom: 1rem;
            font-size: 1.5rem;
            font-weight: 700;
            line-height: 1.2;
            text-align: center;
          }
          
          h1.title {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
          }

          table {
            border-collapse: collapse;
          }

          ${
            !isMobile
              ? `
            body {
              width: ${PAGE_SIZE.widthPx}px;
              height: ${PAGE_SIZE.heightPx}px;
              transform: scale(${scale});
              transform-origin: top left;
              column-count: 2;
              column-gap: 10px;
              column-fill: auto;
              white-space: pre-wrap;
              break-inside: avoid;
              padding: 24px;
              font-size: 12px;
              overflow: hidden;
            }
          `
              : `
            body {
              padding: 16px;
              font-size: 14px;
              white-space: pre-wrap;
              overflow-x: auto;
              overflow-y: hidden;
            }
          `
          }
        </style>
        <script>
          function notifyHeight() {
            var height = Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight,
              document.body.offsetHeight,
              document.documentElement.offsetHeight
            );
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SET_HEIGHT', height: height }));
            }
          }
          window.addEventListener('load', function() {
            notifyHeight();
            setTimeout(notifyHeight, 200);
            setTimeout(notifyHeight, 500);
          });
          window.addEventListener('resize', notifyHeight);
        </script>
      </head>
      <body>
        <div class="sheet">${formatted}</div>
      </body>
      </html>
    `;
  } catch (error) {
    console.error('Error rendering chord sheet:', error);
    return '<p style="color:#EF4444; padding: 24px; text-align: center;">Error formatting chord sheet.</p>';
  }
};

const ScaledSheet = ({ output, keyOverride, capoOverride }: ScaledSheetProps) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [mobileContentHeight, setMobileContentHeight] = useState<number>(400);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const isMobile = containerWidth > 0 && containerWidth < 768;
  const scale = containerWidth > 0 ? containerWidth / PAGE_SIZE.widthPx : 1;
  const targetHeight = isMobile ? mobileContentHeight : PAGE_SIZE.heightPx * scale;

  const html = renderChordProHtml(output, keyOverride, capoOverride, isMobile, scale);

  const handleIframeLoad = () => {
    if (isMobile && iframeRef.current) {
      try {
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (doc) {
          const docHeight = Math.max(
            doc.body.scrollHeight,
            doc.documentElement.scrollHeight,
            doc.body.offsetHeight
          );
          if (docHeight > 0) {
            setMobileContentHeight(docHeight + 20);
          }
        }
      } catch (err) {
        // Handle cross-origin or sandbox restrictions gracefully
      }
    }
  };

  return (
    <View
      className="w-full bg-white overflow-hidden"
      onLayout={(e) => {
        const width = e.nativeEvent.layout.width;
        if (width > 0 && Math.abs(width - containerWidth) > 1) {
          setContainerWidth(width);
        }
      }}
      style={{ height: containerWidth > 0 ? targetHeight : 400 }}
    >
      {containerWidth > 0 && (
        Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={html}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
            }}
            onLoad={handleIframeLoad}
          />
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{ html }}
            style={{ width: '100%', height: '100%', backgroundColor: '#ffffff' }}
            scrollEnabled={isMobile}
            nestedScrollEnabled={true}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data?.type === 'SET_HEIGHT' && typeof data.height === 'number' && data.height > 0) {
                  setMobileContentHeight(data.height + 20);
                }
              } catch {
                // Ignore non-json messages
              }
            }}
          />
        )
      )}
    </View>
  );
};

export default function SetListView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [setList, setSetList] = useState<SetListDetailDto | null>(null);
  const [outputs, setOutputs] = useState<OutputDetailDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Local overrides for transpose
  const [keyOverrides, setKeyOverrides] = useState<Record<string, string>>({});
  const [capoOverrides, setCapoOverrides] = useState<Record<string, number>>({});

  const handlePrint = async () => {
    const url = `${WEB_BASE_URL}/setlists/share/${id}`;
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Failed to open URL', err);
    }
  };

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [sl, outs] = await Promise.all([getSetList(id), getOutputs(id)]);
      setSetList(sl);
      setOutputs(outs || []);
    } catch (err) {
      console.error('Error fetching live view:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!id) return;

    const connection = new HubConnectionBuilder()
      .withUrl(getSignalRHubUrl('/hubs/setlists', { setListId: id }))
      .withAutomaticReconnect()
      .build();

    const handleUpdate = () => {
      fetchData();
    };

    connection.on('SetListUpdated', handleUpdate);
    connection.on('OutputCreated', handleUpdate);
    connection.on('OutputUpdated', handleUpdate);
    connection.on('OutputDeleted', handleUpdate);

    connection.start().catch((err) => {
      console.warn('SignalR setlist hub connection failed:', err);
    });

    return () => {
      connection.stop().catch(() => {});
    };
  }, [id]);

  if (loading) return <Spinner />;

  return (
    <>
      <ScrollView className="flex-1 bg-gray-100 p-4 md:p-8">
        <View className="max-w-4xl mx-auto w-full mb-16">
          {/* Header */}
          <View className="flex-row items-center justify-between bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-gray-900">{setList?.name || 'Live Set List'}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <Text className="text-xs font-semibold text-gray-600">Live Mode Connected</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={fetchData}
            className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 active:bg-gray-100"
          >
            <RefreshCw size={18} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Outputs List */}
        <View className="space-y-6">
          {outputs.map((output, index) => {
            const currentKey = keyOverrides[output.id || ''] || output.targetKey || output.chordsheets?.key || '—';
            const hasCapoOverride = capoOverrides[output.id || ''] !== undefined;
            const currentCapo = hasCapoOverride ? capoOverrides[output.id || ''] : (Number(output.capo) || 0);

            return (
              <View
                key={output.id || index}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6"
              >
                {/* Song Header */}
                <View className="flex-row items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-bold text-gray-900">
                      Song {index + 1}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View className="bg-blue-100 px-2.5 py-0.5 rounded-full">
                        <Text className="text-xs font-semibold text-blue-800">Key: {currentKey}</Text>
                      </View>
                      {currentCapo > 0 && (
                        <View className="bg-amber-100 px-2.5 py-0.5 rounded-full">
                          <Text className="text-xs font-semibold text-amber-800">{getCapoText(currentCapo)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Paid Plan Controls */}
                {setList?.canUsePaidControls && (
                  <View className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    {/* Key Selection */}
                    <View className="mb-3">
                      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Key</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
                        <TouchableOpacity
                          onPress={() => setKeyOverrides(prev => { const next = {...prev}; delete next[output.id || '']; return next; })}
                          className={`px-3 py-1.5 rounded-lg border ${!keyOverrides[output.id || ''] ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 active:bg-gray-50'}`}
                        >
                          <Text className={`text-xs font-bold ${!keyOverrides[output.id || ''] ? 'text-white' : 'text-gray-700'}`}>Shared Key</Text>
                        </TouchableOpacity>
                        {keys.map((k) => (
                          <TouchableOpacity
                            key={k}
                            onPress={() => setKeyOverrides(prev => ({ ...prev, [output.id || '']: k }))}
                            className={`px-3 py-1.5 rounded-lg border ${keyOverrides[output.id || ''] === k ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 active:bg-gray-50'}`}
                          >
                            <Text className={`text-xs font-bold ${keyOverrides[output.id || ''] === k ? 'text-white' : 'text-gray-700'}`}>{k}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Capo Selection */}
                    <View>
                      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Capo</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
                        <TouchableOpacity
                          onPress={() => setCapoOverrides(prev => { const next = {...prev}; delete next[output.id || '']; return next; })}
                          className={`px-3 py-1.5 rounded-lg border ${capoOverrides[output.id || ''] === undefined ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 active:bg-gray-50'}`}
                        >
                          <Text className={`text-xs font-bold ${capoOverrides[output.id || ''] === undefined ? 'text-white' : 'text-gray-700'}`}>Shared Capo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setCapoOverrides(prev => ({ ...prev, [output.id || '']: 0 }))}
                          className={`px-3 py-1.5 rounded-lg border ${capoOverrides[output.id || ''] === 0 ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 active:bg-gray-50'}`}
                        >
                          <Text className={`text-xs font-bold ${capoOverrides[output.id || ''] === 0 ? 'text-white' : 'text-gray-700'}`}>None</Text>
                        </TouchableOpacity>
                        {frets.map((f) => {
                          const num = Number(f);
                          return (
                            <TouchableOpacity
                              key={f}
                              onPress={() => setCapoOverrides(prev => ({ ...prev, [output.id || '']: num }))}
                              className={`px-3 py-1.5 rounded-lg border ${capoOverrides[output.id || ''] === num ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 active:bg-gray-50'}`}
                            >
                              <Text className={`text-xs font-bold ${capoOverrides[output.id || ''] === num ? 'text-white' : 'text-gray-700'}`}>{f}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                )}

                {/* Song Content with Scaled Paper Layout */}
                <ScaledSheet
                  output={output}
                  keyOverride={keyOverrides[output.id || '']}
                  capoOverride={capoOverrides[output.id || '']}
                />
              </View>
            );
          })}

          {outputs.length === 0 && (
            <View className="bg-white rounded-2xl p-12 border border-dashed border-gray-300 items-center justify-center">
              <Text className="text-gray-500 font-medium">No songs in this set list yet.</Text>
            </View>
          )}
        </View>
      </View>
      </ScrollView>

      {/* Floating Print Controls */}
      {setList?.canUsePaidControls && (
        <View className="absolute bottom-6 right-6 z-50">
          <TouchableOpacity
            onPress={handlePrint}
            className="bg-gray-800 w-14 h-14 rounded-full items-center justify-center shadow-2xl border border-gray-700 active:bg-gray-700"
          >
            <Printer size={22} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
