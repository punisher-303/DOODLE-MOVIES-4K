import React, {useEffect, useLayoutEffect, useState} from 'react';
import {View, Text, TouchableOpacity, Modal, Pressable} from 'react-native';
import {ifExists} from '../lib/file/ifExists';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';
import {Stream} from '../lib/providers/types';
import {MotiView} from 'moti';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import useContentStore from '../lib/zustand/contentStore';
import {manifest} from '../lib/Manifest';
import * as IntentLauncher from 'expo-intent-launcher';
import useDownloadsStore from '../lib/zustand/downloadsStore';
import {downloadManager} from '../lib/downloader';
import {FFmpegKit} from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';
import {downloadFolder} from '../lib/constants';
import useThemeStore from '../lib/zustand/themeStore';
import DownloadBottomSheet from './DownloadBottomSheet';

const DownloadComponent = ({
  link,
  fileName,
  type,
  providerValue,
  title,
}: {
  link: string;
  fileName: string;
  type: string;
  providerValue: string;
  title: string;
}) => {
  const {primary} = useThemeStore(state => state);
  const {provider} = useContentStore(state => state);
  const [alreadyDownloaded, setAlreadyDownloaded] = useState<string | boolean>(
    false,
  );
  const [deleteModal, setDeleteModal] = useState(false);
  const [downloadModal, setDownloadModal] = useState(false);
  const [longPressModal, setLongPressModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [downloadId, setDownloadId] = useState<number | null>(null);
  const [servers, setServers] = useState<Stream[]>([]);
  const [serverLoading, setServerLoading] = useState(false);

  const downloadStore = useDownloadsStore(state => state);

  // check if file already exists
  useLayoutEffect(() => {
    const checkIfDownloaded = async () => {
      const exists = await ifExists(fileName);
      setAlreadyDownloaded(exists);
    };
    checkIfDownloaded();
  }, [fileName]);

  // handle download deletion
  const deleteDownload = async () => {
    try {
      const files = await RNFS.readDir(downloadFolder);
      // Find a file with the given name (without extension)
      const file = files.find(file => {
        const nameWithoutExtension = file.name
          .split('.')
          .slice(0, -1)
          .join('.');
        return nameWithoutExtension === fileName;
      });
      if (file) {
        await RNFS.unlink(file.path);
        setAlreadyDownloaded(false);
        setDeleteModal(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // choose server
  useEffect(() => {
    const controller = new AbortController();
    if (!downloadModal && !longPressModal) {
      return;
    }
    const getServer = async () => {
      setServerLoading(true);
      const servers = await manifest[providerValue || provider.value].GetStream(
        link,
        type,
        controller.signal,
      );
      const filteredServers = servers.filter(
        server =>
          !manifest[
            providerValue || provider.value
          ].nonDownloadableServer?.includes(server.server),
      );
      setServerLoading(false);
      setServers(filteredServers);
    };
    getServer();

    return () => {
      controller.abort();
    };
  }, [downloadModal, longPressModal]);

  // on holdPress external downloader
  const longPressDownload = async (link: string, type?: string) => {
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: link,
        type: type || 'video/*',
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <View className="flex-row items-center mt-1 justify-between rounded-full bg-white/30 p-1">
        {downloadStore.activeDownloads.find(
          item => item.fileName === fileName,
        ) ? (
          <MotiView
            style={{
              marginHorizontal: 4,
            }}
            // animate opacity to opacity while downloding
            from={{opacity: 1}}
            animate={{opacity: 0.5}}
            //@ts-ignore
            transition={{type: 'timing', duration: 500, loop: true}}>
            <TouchableOpacity
              onPress={() => {
                setCancelModal(prev => !prev);
                console.log('pressed');
              }}>
              <MaterialIcons name="downloading" size={27} color={primary} />
            </TouchableOpacity>
          </MotiView>
        ) : alreadyDownloaded ? (
          <TouchableOpacity
            onPress={() => setDeleteModal(true)}
            className="mx-1">
            <MaterialIcons name="delete-outline" size={27} color="#c1c4c9" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              setDownloadModal(true);
            }}
            onLongPress={() => {
              ReactNativeHapticFeedback.trigger('effectHeavyClick', {
                enableVibrateFallback: true,
                ignoreAndroidSystemSettings: false,
              });
              setLongPressModal(true);
            }}
            className="mx-2">
            <Octicons name="download" size={25} color="#c1c4c9" />
          </TouchableOpacity>
        )}
        {/* delete modal */}
        {
          <Modal animationType="fade" visible={deleteModal} transparent={true}>
            <View className="flex-1 bg-black/10 justify-center items-center p-4">
              <View className="bg-tertiary p-3 w-80 rounded-md justify-center items-center">
                <Text className="text-2xl font-semibold my-3 text-white">
                  Confirm to delete
                </Text>
                <View className="flex-row items-center justify-evenly w-full my-5">
                  <TouchableOpacity
                    onPress={deleteDownload}
                    className="p-2 rounded-md m-1 px-3"
                    style={{backgroundColor: primary}}>
                    <Text className="text-white font-semibold text-base rounded-md capitalize px-1">
                      Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDeleteModal(false)}
                    className="p-2 px-4 rounded-md m-1"
                    style={{backgroundColor: primary}}>
                    <Text className="text-white font-semibold text-base rounded-md capitalize px-1">
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        }
        {/* download modal */}
        <DownloadBottomSheet
          setModal={setDownloadModal}
          showModal={downloadModal}
          data={servers}
          loading={serverLoading}
          title="Select Server To Download"
          onPressVideo={(server: Stream) => {
            downloadManager({
              title: title,
              url: server.link,
              fileName: fileName,
              fileType: server.type,
              downloadStore: downloadStore,
              setAlreadyDownloaded: setAlreadyDownloaded,
              setDownloadId: setDownloadId,
              headers: server?.headers,
              deleteDownload: deleteDownload,
            });
          }}
          onPressSubs={(sub: {link: string; type: string; title: string}) => {
            downloadManager({
              title: title + ' ' + sub.title + ' Subtitle ',
              url: sub.link,
              fileName: fileName + '-' + sub.title,
              fileType: sub.type,
              downloadStore: downloadStore,
              setAlreadyDownloaded: () => {},
              setDownloadId: setDownloadId,
              deleteDownload: () => {},
            });
          }}
        />
        {/* long press modal */}
        <DownloadBottomSheet
          setModal={setLongPressModal}
          showModal={longPressModal}
          data={servers}
          loading={serverLoading}
          title="Select Server To Open"
          onPressVideo={(server: Stream) => {
            longPressDownload(server.link);
          }}
          onPressSubs={(sub: {link: string; type: string; title: string}) => {
            longPressDownload(sub.link, 'text/vtt');
          }}
        />
      </View>
      {cancelModal && downloadId && (
        <Pressable
          onPress={async () => {
            setCancelModal(false);
            try {
              RNFS.stopDownload(downloadId);
              FFmpegKit.cancel(downloadId);
              downloadStore.removeActiveDownload(fileName);
              const files = await RNFS.readDir(downloadFolder);
              // Find a file with the given name (without extension)
              const file = files.find(file => {
                const nameWithoutExtension = file.name
                  .split('.')
                  .slice(0, -1)
                  .join('.');
                return nameWithoutExtension === fileName;
              });
              if (file) {
                await RNFS.unlink(file.path);
              }
            } catch (error) {
              console.log('Error cancelling download', error);
            }
          }}
          className="absolute right-12 bg-quaternary/80 bottom-3 rounded-md px-2">
          <Text className="text-lg text-white">Cancel</Text>
        </Pressable>
      )}
    </>
  );
};

export default DownloadComponent;