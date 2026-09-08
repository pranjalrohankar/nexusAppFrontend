import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Modal,
  useWindowDimensions,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Linking from 'expo-linking';
import { api, getApiBaseUrl, resolveDynamicFileUrl } from '@/services/api';
import { parseSyllabus } from '@/utils/syllabus-parser';
import { coursesData } from '@/screens/home/home-screen';

function normalizeModString(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[\:\–\—\-\|]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getModuleNumber(str: string): string | null {
  const match = str.match(/module\s*(\d+)/i);
  return match ? match[1] : null;
}

function findCanonicalModuleTitle(rawModName: string, adminModuleTitles: string[]): string {
  if (!rawModName) return adminModuleTitles[0] || 'Module 1';
  const normMat = normalizeModString(rawModName);
  const matNum = getModuleNumber(rawModName);

  for (const adminTitle of adminModuleTitles) {
    const normAdmin = normalizeModString(adminTitle);
    const adminNum = getModuleNumber(adminTitle);
    if (normMat === normAdmin) return adminTitle;
    if (matNum && adminNum && matNum === adminNum) return adminTitle;
  }
  return rawModName;
}

const IS_WEB = Platform.OS === 'web';

// Always resolve fresh so mobile/web gets correct host, not stale localhost
const getStreamUrl = (id: number | string) => api.getRecordingStreamUrl(id);

interface ClassRecordingsScreenProps {
  onBack: () => void;
}

interface RecordingItem {
  id: number | string;
  title: string;
  course: string;
  batch: string;
  classDate?: string;
  duration?: string;
  uploadedAt?: string;
}

const THEME_COLORS = ['#8B5CF6', '#6366F1', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'];

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

function formatTime(secs: number) {
  if (!isFinite(secs) || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Mobile custom video player
function MobileVideoPlayer({ uri, title, onClose }: { uri: string; title: string; onClose: () => void }) {
  const player = useVideoPlayer(uri, p => { p.play(); });
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [showMenu, setShowMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = player.duration ?? 0;

  // Poll player state every 500ms instead of useEvent
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(player.currentTime ?? 0);
      setIsPlaying(player.playing);
    }, 500);
    return () => clearInterval(interval);
  }, [player]);

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setControlsVisible(true);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3500);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const togglePlay = () => { isPlaying ? player.pause() : player.play(); resetHideTimer(); };
  const toggleMute = () => { player.muted = !muted; setMuted(!muted); resetHideTimer(); };
  const seek = (ratio: number) => { if (duration > 0) { player.currentTime = ratio * duration; resetHideTimer(); } };
  const setPlaybackSpeed = (s: number) => { player.playbackRate = s; setSpeed(s); setShowSpeedMenu(false); setShowMenu(false); };
  const handleDownload = () => { setShowMenu(false); Linking.openURL(uri); };
  const handlePiP = () => { setShowMenu(false); try { (player as any).enterPictureInPicture?.(); } catch {} };

  const barWidth = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => seek(Math.max(0, Math.min(1, e.nativeEvent.locationX / (barWidth.current || 1)))),
      onPanResponderMove: (e) => seek(Math.max(0, Math.min(1, e.nativeEvent.locationX / (barWidth.current || 1)))),
    })
  ).current;

  const progress = duration > 0 ? (currentTime ?? 0) / duration : 0;

  return (
    // Outer flex column: video on top, controls below — NO overlapping native views
    <View style={vm.root}>

      {/* VIDEO — fixed height, native view */}
      <Pressable onPress={() => { setShowMenu(false); setShowSpeedMenu(false); resetHideTimer(); }} style={vm.videoWrap}>
        <VideoView
          player={player}
          style={vm.video}
          contentFit="contain"
          allowsPictureInPicture
          nativeControls={false}
        />
        {/* Center play/pause sits OUTSIDE VideoView, in the Pressable */}
        {controlsVisible && (
          <View style={vm.centerWrap} pointerEvents="box-none">
            <TouchableOpacity style={vm.centerPlay} onPress={togglePlay} activeOpacity={0.8}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={44} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </Pressable>

      {/* TOP BAR — pure RN view, never overlaps VideoView */}
      <View style={vm.topBar}>
        <TouchableOpacity onPress={() => { player.pause(); onClose(); }} style={vm.iconBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={vm.titleText} numberOfLines={1}>{title}</Text>
      </View>

      {/* BOTTOM CONTROLS — pure RN view */}
      <View style={vm.bottomBar}>
        {/* Seek bar */}
        <View
          style={vm.seekBar}
          onLayout={e => { barWidth.current = e.nativeEvent.layout.width; }}
          {...panResponder.panHandlers}
        >
          <View style={vm.seekTrack}>
            <View style={[vm.seekFill, { width: `${progress * 100}%` as any }]} />
            <View style={[vm.seekThumb, { left: `${progress * 100}%` as any }]} />
          </View>
        </View>
        {/* Time + icons row */}
        <View style={vm.timeRow}>
          <Text style={vm.timeText}>{formatTime(currentTime ?? 0)} / {formatTime(duration)}</Text>
          <View style={vm.rightIcons}>
            <TouchableOpacity onPress={toggleMute} style={vm.iconBtn}>
              <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { try { (player as any).enterFullscreen?.(); } catch {} }} style={vm.iconBtn}>
              <Ionicons name="expand" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowMenu(v => !v); setShowSpeedMenu(false); }} style={vm.iconBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3-dot dropdown menu */}
      {showMenu && (
        <View style={vm.menu}>
          <TouchableOpacity style={vm.menuItem} onPress={handleDownload}>
            <Ionicons name="download-outline" size={20} color="#1F2937" />
            <Text style={vm.menuText}>Download</Text>
          </TouchableOpacity>
          <View style={vm.menuDivider} />
          <TouchableOpacity style={vm.menuItem} onPress={() => setShowSpeedMenu(v => !v)}>
            <Ionicons name="speedometer-outline" size={20} color="#1F2937" />
            <Text style={vm.menuText}>Playback speed ({speed}x)</Text>
            <Ionicons name={showSpeedMenu ? 'chevron-down' : 'chevron-forward'} size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          {showSpeedMenu && (
            <View style={vm.speedList}>
              {SPEEDS.map(s => (
                <TouchableOpacity key={s} style={vm.speedItem} onPress={() => setPlaybackSpeed(s)}>
                  <Text style={[vm.speedText, speed === s && vm.speedActive]}>{s}x</Text>
                  {speed === s && <Ionicons name="checkmark" size={16} color="#7B2CBF" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={vm.menuDivider} />
          <TouchableOpacity style={vm.menuItem} onPress={handlePiP}>
            <Ionicons name="tablet-portrait-outline" size={20} color="#1F2937" />
            <Text style={vm.menuText}>Picture in picture</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getEmbedInfo(rawUrl: string): { isEmbed: boolean; embedUrl: string } {
  if (!rawUrl) return { isEmbed: false, embedUrl: '' };
  const url = rawUrl.trim();
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return { isEmbed: true, embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0` };
  }

  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/i);
  if (driveMatch && driveMatch[1]) {
    return { isEmbed: true, embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return { isEmbed: true, embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1` };
  }

  return { isEmbed: false, embedUrl: url };
}

// Web custom video player (works on phone browser too)
function WebVideoPlayer({ uri, title, onClose }: { uri: string; title: string; onClose: () => void }) {
  const embed = getEmbedInfo(uri);
  const videoRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [showMenu, setShowMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<any>(null);

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setControlsVisible(true);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3500);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
    resetHideTimer();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    resetHideTimer();
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    setProgress(v.duration ? v.currentTime / v.duration : 0);
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  };

  const handleSeek = (e: any) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    resetHideTimer();
  };

  const setPlaybackSpeed = (s: number) => {
    const v = videoRef.current;
    if (v) v.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
    setShowMenu(false);
  };

  const handleDownload = () => {
    setShowMenu(false);
    const a = document.createElement('a');
    a.href = uri;
    a.download = title || 'recording';
    a.click();
  };

  const handlePiP = () => {
    setShowMenu(false);
    const v = videoRef.current;
    if (v && (document as any).pictureInPictureEnabled) {
      if ((document as any).pictureInPictureElement) {
        (document as any).exitPictureInPicture();
      } else {
        v.requestPictureInPicture?.();
      }
    }
  };

  const handleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  };

  const containerStyle: any = {
    flex: 1, backgroundColor: '#000', display: 'flex', flexDirection: 'column',
    userSelect: 'none', position: 'relative',
  };

  const topBarStyle: any = {
    display: 'flex', flexDirection: 'row', alignItems: 'center',
    padding: '10px 12px', backgroundColor: '#111', flexShrink: 0,
  };

  const videoAreaStyle: any = {
    flex: 1, position: 'relative', backgroundColor: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  };

  const bottomBarStyle: any = {
    backgroundColor: '#111', padding: '8px 14px 16px', flexShrink: 0,
  };

  const seekTrackStyle: any = {
    width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2, position: 'relative', cursor: 'pointer',
  };

  const menuStyle: any = {
    position: 'absolute', right: 12, bottom: 90,
    backgroundColor: '#fff', borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)', minWidth: 230,
    zIndex: 100, overflow: 'hidden',
  };

  const menuItemStyle: any = {
    display: 'flex', flexDirection: 'row', alignItems: 'center',
    padding: '14px 16px', gap: 12, cursor: 'pointer', background: 'none', border: 'none', width: '100%',
  };

  if (embed.isEmbed) {
    return (
      <div style={containerStyle}>
        <div style={topBarStyle}>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex' } as any}>
            <Ionicons name="close" size={24} color="#fff" />
          </button>
          <span style={{ flex: 1, color: '#fff', fontWeight: 700, fontSize: 15, margin: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>
            {title}
          </span>
          <button onClick={() => window.open(uri, '_blank')}
            style={{ background: '#7B2CBF', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 } as any}>
            Open Original
          </button>
        </div>
        <div style={{ flex: 1, backgroundColor: '#000', display: 'flex' }}>
          <iframe
            src={embed.embedUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} onClick={() => { setShowMenu(false); setShowSpeedMenu(false); resetHideTimer(); }}>
      {/* video element */}
      <div style={videoAreaStyle}>
        <video
          ref={videoRef}
          src={uri}
          autoPlay
          playsInline
          onError={(e: any) => {
            const fallbackSrc = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            if (e?.target?.src !== fallbackSrc) {
              e.target.src = fallbackSrc;
            }
          }}
          style={{ width: '100%', height: '100%', objectFit: 'contain', outline: 'none' } as any}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        />
        {/* Center play/pause */}
        {controlsVisible && (
          <div
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            style={{
              position: 'absolute', width: 72, height: 72, borderRadius: 36,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            } as any}
          >
            <Ionicons name={playing ? 'pause' : 'play'} size={44} color="#fff" />
          </div>
        )}
      </div>

      {/* TOP BAR */}
      <div style={topBarStyle}>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex' } as any}>
          <Ionicons name="close" size={24} color="#fff" />
        </button>
        <span style={{ flex: 1, color: '#fff', fontWeight: 700, fontSize: 15, margin: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>
          {title}
        </span>
      </div>

      {/* BOTTOM BAR */}
      <div style={bottomBarStyle}>
        {/* Seek bar */}
        <div style={{ padding: '8px 0', cursor: 'pointer' } as any} onClick={(e) => { e.stopPropagation(); handleSeek(e); }}>
          <div style={seekTrackStyle}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: 4, width: `${progress * 100}%`, backgroundColor: '#7B2CBF', borderRadius: 2 } as any} />
            <div style={{ position: 'absolute', top: -6, left: `${progress * 100}%`, marginLeft: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff' } as any} />
          </div>
        </div>
        {/* Time + icons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 } as any}>
          <span style={{ color: '#fff', fontSize: 13 } as any}>{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div style={{ display: 'flex', gap: 4 } as any}>
            <button onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex' } as any}>
              <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex' } as any}>
              <Ionicons name="expand" size={20} color="#fff" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); setShowSpeedMenu(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex' } as any}>
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* 3-dot menu */}
      {showMenu && (
        <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
          <button style={menuItemStyle} onClick={handleDownload}>
            <Ionicons name="download-outline" size={20} color="#1F2937" />
            <span style={{ fontSize: 14, color: '#1F2937', fontWeight: 500 } as any}>Download</span>
          </button>
          <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '0 8px' }} />
          <button style={menuItemStyle} onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(v => !v); }}>
            <Ionicons name="speedometer-outline" size={20} color="#1F2937" />
            <span style={{ fontSize: 14, color: '#1F2937', fontWeight: 500, flex: 1, textAlign: 'left' } as any}>Playback speed ({speed}x)</span>
            <Ionicons name={showSpeedMenu ? 'chevron-down' : 'chevron-forward'} size={16} color="#9CA3AF" />
          </button>
          {showSpeedMenu && (
            <div style={{ backgroundColor: '#F9FAFB', margin: '0 8px 4px', borderRadius: 8 }}>
              {SPEEDS.map(s => (
                <button key={s} style={{ ...menuItemStyle, justifyContent: 'space-between' }} onClick={() => setPlaybackSpeed(s)}>
                  <span style={{ fontSize: 14, color: speed === s ? '#7B2CBF' : '#4B5563', fontWeight: speed === s ? 700 : 400 } as any}>{s}x</span>
                  {speed === s && <Ionicons name="checkmark" size={16} color="#7B2CBF" />}
                </button>
              ))}
            </div>
          )}
          <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '0 8px' }} />
          <button style={menuItemStyle} onClick={handlePiP}>
            <Ionicons name="tablet-portrait-outline" size={20} color="#1F2937" />
            <span style={{ fontSize: 14, color: '#1F2937', fontWeight: 500 } as any}>Picture in picture</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Shared full-screen video modal
function VideoModal({
  visible,
  uri,
  title,
  onClose,
}: {
  visible: boolean;
  uri: string | null;
  title: string;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
      statusBarTranslucent
    >
      <SafeAreaView style={vm.safeRoot} edges={['top', 'bottom']}>
        {uri && IS_WEB ? (
          <WebVideoPlayer uri={uri} title={title} onClose={onClose} />
        ) : uri ? (
          <MobileVideoPlayer uri={uri} title={title} onClose={onClose} />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const vm = StyleSheet.create({
  safeRoot: { flex: 1, backgroundColor: '#000' },
  // Column layout: topBar → videoWrap → bottomBar (no overlapping)
  root: { flex: 1, backgroundColor: '#000', flexDirection: 'column', justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#111',
  },
  titleText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff', marginHorizontal: 8 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  videoWrap: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  video: { flex: 1 },
  centerWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  centerPlay: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center',
  },
  bottomBar: { backgroundColor: '#111', paddingHorizontal: 14, paddingBottom: 16, paddingTop: 8 },
  seekBar: { height: 32, justifyContent: 'center' },
  seekTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  seekFill: { height: 4, backgroundColor: '#7B2CBF', borderRadius: 2, position: 'absolute', left: 0, top: 0 },
  seekThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', position: 'absolute', top: -6, marginLeft: -8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  timeText: { fontSize: 13, color: '#fff' },
  rightIcons: { flexDirection: 'row' },
  menu: {
    position: 'absolute', right: 12, bottom: 100,
    backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 4, minWidth: 230,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 12,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 8 },
  speedList: { backgroundColor: '#F9FAFB', marginHorizontal: 8, borderRadius: 8, marginBottom: 4 },
  speedItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  speedText: { fontSize: 14, color: '#4B5563' },
  speedActive: { color: '#7B2CBF', fontWeight: '700' },
});

export default function ClassRecordingsScreen({ onBack }: ClassRecordingsScreenProps) {
  const { width: winWidth } = useWindowDimensions();
  const isDesktop = IS_WEB && winWidth >= 1024;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [coursesMap, setCoursesMap] = useState<Record<string, string[]>>({});
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadRecordings();
    loadCoursesSyllabus();
  }, []);

  const loadCoursesSyllabus = async () => {
    try {
      const res = await api.getAllCourses();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const map: Record<string, string[]> = {};
      list.forEach((c: any) => {
        const rawSyl = c.syllabusTopics || c.syllabus || c.whatYouWillLearn || '';
        if (c.title && rawSyl) {
          const parsed = parseSyllabus(rawSyl);
          if (parsed && parsed.length > 0) {
            map[c.title.trim().toLowerCase()] = parsed.map((m, idx) =>
              m.title.startsWith('Module') ? m.title : `Module ${idx + 1}: ${m.title}`
            );
          }
        }
      });
      Object.entries(coursesData).forEach(([title, cData]) => {
        const key = title.trim().toLowerCase();
        if (!map[key]) {
          const parsed = parseSyllabus(cData.syllabusTopics || cData.syllabus);
          if (parsed && parsed.length > 0) {
            map[key] = parsed.map((m, idx) =>
              m.title.startsWith('Module') ? m.title : `Module ${idx + 1}: ${m.title}`
            );
          }
        }
      });
      setCoursesMap(map);
    } catch {
      const map: Record<string, string[]> = {};
      Object.entries(coursesData).forEach(([title, cData]) => {
        const key = title.trim().toLowerCase();
        const parsed = parseSyllabus(cData.syllabusTopics || cData.syllabus);
        if (parsed && parsed.length > 0) {
          map[key] = parsed.map((m, idx) =>
            m.title.startsWith('Module') ? m.title : `Module ${idx + 1}: ${m.title}`
          );
        }
      });
      setCoursesMap(map);
    }
  };

  const loadRecordings = async () => {
    try {
      setLoading(true);
      let data = await api.getClassRecordings();
      if (!Array.isArray(data) || data.length === 0) {
        const studentData = await api.getStudentRecordings().catch(() => []);
        if (Array.isArray(studentData) && studentData.length > 0) {
          data = studentData;
        }
      }
      if (Array.isArray(data) && data.length > 0) {
        setRecordings(
          data.sort((a: any, b: any) =>
            new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
          )
        );
      } else {
        setRecordings([
          {
            id: 1,
            title: 'Orientation & Full Stack Roadmap 2026',
            course: 'Full Stack Web Development',
            batch: 'FSWD - Morning Batch A',
            classDate: '2026-06-02',
            duration: '1 hr 15 mins',
            uploadedAt: '2026-06-02T10:00:00Z',
          },
          {
            id: 2,
            title: 'Spring Boot 3 Core Architecture & Microservices',
            course: 'Java Full Stack Development',
            batch: 'Java Full Stack - Evening Batch',
            classDate: '2026-06-16',
            duration: '1 hr 30 mins',
            uploadedAt: '2026-06-16T10:00:00Z',
          }
        ]);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const filterCategories = ['All', ...Array.from(new Set(recordings.map(r => r.course).filter(Boolean)))];

  const availableBatches = useMemo(() => {
    const list = ['All'];
    recordings.forEach(r => {
      if (r.batch && !list.includes(r.batch)) list.push(r.batch);
    });
    return list;
  }, [recordings]);

  const filteredRecordings = useMemo(() => {
    return recordings.filter(rec => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        rec.title.toLowerCase().includes(q) ||
        rec.course.toLowerCase().includes(q) ||
        rec.batch.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || rec.course === selectedCategory;
      const matchesBatch = selectedBatch === 'All' || rec.batch === selectedBatch;
      return matchesSearch && matchesCategory && matchesBatch;
    });
  }, [recordings, searchQuery, selectedCategory, selectedBatch]);

  const groupedModules = useMemo(() => {
    const groups: { moduleTitle: string; recordings: RecordingItem[] }[] = [];
    const moduleMap = new Map<string, RecordingItem[]>();

    const targetCourses = selectedCategory === 'All'
      ? Array.from(new Set([...Object.keys(coursesMap), ...recordings.map(r => r.course.trim().toLowerCase()).filter(Boolean)]))
      : [selectedCategory.trim().toLowerCase()];

    const adminModuleTitles: string[] = [];
    targetCourses.forEach(c => {
      const titles = coursesMap[c] ?? [];
      titles.forEach(t => {
        if (!adminModuleTitles.includes(t)) adminModuleTitles.push(t);
      });
    });

    if (adminModuleTitles.length === 0) {
      adminModuleTitles.push('Module 1: General Sessions');
    }

    adminModuleTitles.forEach(t => moduleMap.set(t, []));

    filteredRecordings.forEach(rec => {
      const titleModMatch = rec.title.match(/\[(.*?)\]/);
      const rawMod = titleModMatch ? titleModMatch[1] : (rec.title || 'Module 1');
      const canonical = findCanonicalModuleTitle(rawMod, adminModuleTitles);
      const key = canonical || adminModuleTitles[0];

      if (!moduleMap.has(key)) moduleMap.set(key, []);
      moduleMap.get(key)!.push(rec);
    });

    moduleMap.forEach((recs, title) => {
      if (recs.length > 0 || selectedCategory !== 'All') {
        groups.push({ moduleTitle: title, recordings: recs });
      }
    });

    return groups;
  }, [filteredRecordings, coursesMap, selectedCategory, recordings]);

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.header}>
        <View style={s.headerTopRow}>
          <TouchableOpacity style={s.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={s.headerTitle}>Class Recordings</Text>
        <Text style={s.headerSubtitle}>Watch previous lectures anytime</Text>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.scrollContent, isDesktop && s.scrollDesktop]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search & Filters */}
        <View style={s.searchContainer}>
          <View style={s.searchWrapper}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Search recordings..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Course Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsContent}
            style={{ marginTop: 12 }}
          >
            {filterCategories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[s.chip, selectedCategory === cat && s.chipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[s.chipText, selectedCategory === cat && s.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Batch Filters */}
          {availableBatches.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsContent}
              style={{ marginTop: 8 }}
            >
              {availableBatches.map(b => (
                <TouchableOpacity
                  key={b}
                  style={[s.batchChip, selectedBatch === b && s.batchChipActive]}
                  onPress={() => setSelectedBatch(b)}
                >
                  <Text style={[s.batchChipText, selectedBatch === b && s.batchChipTextActive]}>
                    {b === 'All' ? 'All Batches' : b}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Module Accordion Cards */}
        <View style={s.modulesList}>
          {loading ? (
            <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 40 }} />
          ) : groupedModules.length === 0 ? (
            <View style={s.emptyContainer}>
              <Ionicons name="videocam-off-outline" size={48} color="#9CA3AF" />
              <Text style={s.emptyText}>No recordings found</Text>
              <Text style={s.emptySubtext}>Try adjusting your search or filters.</Text>
            </View>
          ) : (
            groupedModules.map((group) => {
              const isExpanded = expandedModules[group.moduleTitle] !== false;
              const cleanTitle = group.moduleTitle.replace(/^\[|\]$/g, '');

              return (
                <View key={group.moduleTitle} style={s.moduleAccordion}>
                  <TouchableOpacity
                    style={s.moduleAccordionHeader}
                    activeOpacity={0.8}
                    onPress={() => setExpandedModules(prev => ({ ...prev, [group.moduleTitle]: !isExpanded }))}
                  >
                    <View style={s.moduleHeaderLeft}>
                      <View style={s.moduleIconBadge}>
                        <Ionicons name="videocam-outline" size={18} color="#7B2CBF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.moduleHeaderTitle} numberOfLines={1}>{cleanTitle}</Text>
                        <Text style={s.moduleHeaderSub}>{group.recordings.length} {group.recordings.length === 1 ? 'session' : 'sessions'}</Text>
                      </View>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[s.listContainer, isDesktop && s.listDesktop, { marginTop: 12, paddingHorizontal: 12, paddingBottom: 12 }]}>
                      {group.recordings.length === 0 ? (
                        <Text style={s.noRecordingsText}>No recordings uploaded for this module yet.</Text>
                      ) : (
                        group.recordings.map((rec, idx) => {
                          const displayTitle = rec.title.replace(/\[.*?\]\s*/, '');
                          return (
                            <View key={rec.id} style={[s.card, isDesktop && s.cardDesktop]}>
                              <View style={s.cardHeader}>
                                <View style={s.thumbnail}>
                                  <View style={s.playCircle}>
                                    <Ionicons name="play" size={14} color="#1F2937" style={{ marginLeft: 2 }} />
                                  </View>
                                  <View style={[s.thumbnailBadge, { backgroundColor: THEME_COLORS[idx % THEME_COLORS.length] }]} />
                                </View>

                                <View style={s.cardInfo}>
                                  <Text style={s.cardTitle} numberOfLines={2}>{displayTitle || rec.title}</Text>
                                  <View style={s.catRow}>
                                    <Ionicons name="book-outline" size={12} color="#7B2CBF" />
                                    <Text style={s.catText}>{rec.course}</Text>
                                  </View>
                                  <View style={s.statsRow}>
                                    {(rec.classDate || rec.uploadedAt) && (
                                      <View style={s.statItem}>
                                        <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                                        <Text style={s.statText}>{formatDate(rec.classDate || rec.uploadedAt)}</Text>
                                      </View>
                                    )}
                                    <View style={s.statItem}>
                                      <Ionicons name="people-outline" size={12} color="#6B7280" />
                                      <Text style={s.statText}>{rec.batch}</Text>
                                    </View>
                                  </View>
                                </View>
                              </View>

                              <View style={s.cardFooter}>
                                <TouchableOpacity
                                  style={s.watchNowBtn}
                                  activeOpacity={0.8}
                                  onPress={() => {
                                    setPreviewTitle(displayTitle || rec.title);
                                    const targetUri = (rec as any).videoUrl ? resolveDynamicFileUrl((rec as any).videoUrl) : getStreamUrl(rec.id);
                                    setPreviewUri(targetUri);
                                  }}
                                >
                                  <Ionicons name="play" size={14} color="#FFF" />
                                  <Text style={s.watchNowText}>Watch Now</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <VideoModal
        visible={!!previewUri}
        uri={previewUri}
        title={previewTitle}
        onClose={() => setPreviewUri(null)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 16, paddingBottom: 36 },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: Platform.OS === 'android' ? 12 : 0,
  },
  backButton: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#E9D5FF', marginTop: 4 },

  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16 },
  scrollDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: 32 },

  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginTop: -24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  chipsContent: { gap: 8, alignItems: 'center', paddingRight: 4 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 18, backgroundColor: '#F3F4F6',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#7B2CBF', borderColor: '#7B2CBF' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  chipTextActive: { color: '#fff' },

  batchChip: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 14, backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  batchChipActive: { backgroundColor: '#F3E8FF', borderColor: '#7B2CBF' },
  batchChipText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  batchChipTextActive: { color: '#7B2CBF', fontWeight: '700' },

  modulesList: { gap: 16 },
  moduleAccordion: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  moduleAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FAF5FF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  moduleHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  moduleIconBadge: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center',
  },
  moduleHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  moduleHeaderSub: { fontSize: 12, color: '#7B2CBF', marginTop: 2, fontWeight: '500' },
  noRecordingsText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', paddingVertical: 12 },

  listContainer: { gap: 16 },
  listDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDesktop: { width: IS_WEB ? ('calc(50% - 10px)' as any) : '48%', minWidth: 320 },

  cardHeader: { flexDirection: 'row', gap: 16 },
  thumbnail: {
    width: 64, height: 64,
    borderRadius: 16,
    backgroundColor: '#8B939E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  },
  playCircle: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 6 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', lineHeight: 20 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  catText: { fontSize: 11, fontWeight: '600', color: '#7B2CBF' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: '#6B7280' },

  cardFooter: { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 14, paddingTop: 12 },
  watchNowBtn: {
    flexDirection: 'row',
    backgroundColor: '#7B2CBF',
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  watchNowText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginTop: 12, textAlign: 'center' },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
});
