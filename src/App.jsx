import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  Link,
  X,
  AlertOctagon,
} from 'lucide-react';

const VideoPlayer = ({
  initialSrc,
  width = 'w-full',
  height = 'h-full',
  autoPlay = false,
  customCodecs = [],
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [error, setError] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [videoSrc, setVideoSrc] = useState(initialSrc);
  const [audioCodecs, setAudioCodecs] = useState([]);
  const [isAc3Supported, setIsAc3Supported] = useState(false);
  const [isEac3Supported, setIsEac3Supported] = useState(false);
  const [showCodecInfo, setShowCodecInfo] = useState(false);
  const [showMediaInfo, setShowMediaInfo] = useState(false);
  const [showCodecUpload, setShowCodecUpload] = useState(false);
  const [mediaInfo, setMediaInfo] = useState({
    videoCodec: '',
    audioCodec: '',
    resolution: '',
    frameRate: '',
    bitrate: '',
    audioChannels: '',
  });

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const urlInputRef = useRef(null);

  useEffect(() => {
    const detectCodecSupport = async () => {
      try {
        if ('MediaSource' in window) {
          const supportedCodecs = [];

          const videoTypes = [
            'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
            'video/webm; codecs="vp8, vorbis"',
            'video/webm; codecs="vp9"',
            ...customCodecs,
          ];

          const audioTypes = [
            'audio/mp4; codecs="ac-3"',
            'audio/mp4; codecs="ec-3"',
            'audio/mp4; codecs="mp4a.a5"',
            'audio/mp4; codecs="mp4a.a6"',
            'audio/mp4; codecs="ac-3.61.1"',
            'audio/mp4; codecs="ec-3.61.2"',
          ];
          videoTypes.forEach((type) => {
            if (MediaSource.isTypeSupported(type)) {
              supportedCodecs.push(type);
            }
          });
          const ac3Support = audioTypes.slice(0, 2).some((type) =>
            MediaSource.isTypeSupported(type)
          );
          const eac3Support = audioTypes.slice(2).some((type) =>
            MediaSource.isTypeSupported(type)
          );

          setIsAc3Supported(ac3Support);
          setIsEac3Supported(eac3Support);
          setAudioCodecs(supportedCodecs);
          if (!ac3Support && !eac3Support) {
            await initializeSoftwareDecoder();
          }
        }
      } catch (err) {
        setError('Codec initialization failed: ' + err.message);
      }
    };

    const initializeSoftwareDecoder = async () => {
      try {
        if ('AudioContext' in window || 'webkitAudioContext' in window) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          const audioContext = new AudioContext();
          const scriptProcessor = audioContext.createScriptProcessor(4096, 2, 2);

          scriptProcessor.onaudioprocess = (e) => {
            const inputBuffer = e.inputBuffer;
            const outputBuffer = e.outputBuffer;
            for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
              const inputData = inputBuffer.getChannelData(channel);
              const outputData = outputBuffer.getChannelData(channel);
              outputData.set(inputData);
            }
          };
          playerRef.current.audioContext = audioContext;
          playerRef.current.scriptProcessor = scriptProcessor;
        }
      } catch (err) {
        console.warn('Software decoder initialization failed:', err);
      }
    };

    detectCodecSupport();
    return () => {
      if (playerRef.current?.audioContext) {
        playerRef.current.audioContext.close();
      }
    };
  }, [customCodecs]);

  const updateMediaInfo = () => {
    if (videoRef.current) {
      const video = videoRef.current;

      // Get video track information
      if (video.videoTracks && video.videoTracks.length > 0) {
        const videoTrack = video.videoTracks[0];
        setMediaInfo((prev) => ({
          ...prev,
          videoCodec: videoTrack.label || 'Unknown',
          resolution: `${video.videoWidth}x${video.videoHeight}`,
          frameRate: video.getVideoPlaybackQuality?.()?.totalVideoFrames || 'Unknown',
        }));
      }

      // Get audio track information
      if (video.audioTracks && video.audioTracks.length > 0) {
        const audioTrack = video.audioTracks[0];
        setMediaInfo((prev) => ({
          ...prev,
          audioCodec: audioTrack.label || 'Unknown',
          audioChannels: audioTrack.kind || 'Unknown',
        }));
      }

      // Estimate bitrate
      if (video.buffered.length > 0) {
        const loadedBytes =
          video.buffered.end(0) * (video.webkitVideoDecodedByteCount || 0);
        const bitrate = (loadedBytes * 8) / duration;
        setMediaInfo((prev) => ({
          ...prev,
          bitrate: `${Math.round(bitrate / 1000)} kbps`,
        }));
      }
    }
  };

  const handleCodecUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const codec = await file.text();
        const newCodecs = [...customCodecs, codec];
        // Re-run codec detection with new codec
        detectCodecSupport(newCodecs);
        setShowCodecUpload(false);
      } catch (err) {
        setError('Failed to load custom codec: ' + err.message);
      }
    }
  };

  useEffect(() => {
    if (showUrlInput && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [showUrlInput]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);

      if (videoRef.current.buffered.length > 0) {
        setBuffered(
          (videoRef.current.buffered.end(videoRef.current.buffered.length - 1) /
            videoRef.current.duration) *
            100
        );
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      updateMediaInfo();
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setVideoSrc(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput('');
      setError(null);
    }
  };

  const handleUrlInputClose = () => {
    setShowUrlInput(false);
    setUrlInput('');
  };

  const toggleCodecInfo = () => {
    setShowCodecInfo((prev) => !prev);
  };

  const toggleMediaInfo = () => {
    setShowMediaInfo((prev) => !prev);
  };

  return (
    <div
      ref={playerRef}
      className={`${width} ${height} bg-black flex flex-col items-center justify-center`}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={(e) => {
          setError('An error occurred while loading the video: ' + e.message);
        }}
        autoPlay={autoPlay}
        controls={false}
      />
      {error && (
        <div className="text-red-500 mt-4">
          <AlertOctagon />
          {error}
        </div>
      )}
      <div className="controls flex justify-between items-center mt-4 w-full px-4">
        <button onClick={togglePlay}>
          {isPlaying ? <Pause /> : <Play />}
        </button>
        <div className="flex items-center">
          <button onClick={() => skip(-10)} className="mr-2">
            <SkipBack />
          </button>
          <button onClick={() => skip(10)} className="mr-2">
            <SkipForward />
          </button>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="mx-2"
          />
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <div className="flex items-center">
          <button onClick={toggleMute} className="mr-2">
            {isMuted ? <VolumeX /> : <Volume2 />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="mx-2"
          />
          <button onClick={toggleFullscreen}>
            <Maximize />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => setShowUrlInput(true)}
          className="border p-2 bg-blue-500 text-white"
        >
          Change Video URL
        </button>
        {showUrlInput && (
          <form onSubmit={handleUrlSubmit} className="flex mt-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              ref={urlInputRef}
              className="border p-2"
              placeholder="Enter video URL"
            />
            <button type="button" onClick={handleUrlInputClose}>
              <X />
            </button>
            <button type="submit" className="ml-2 bg-green-500 text-white">
              Submit
            </button>
          </form>
        )}
      </div>

      <div className="mt-4">
        <button
          onClick={toggleCodecInfo}
          className="border p-2 bg-green-500 text-white"
        >
          Codec Info
        </button>
        {showCodecInfo && (
          <div className="mt-2">
            <h3>Supported Audio Codecs</h3>
            <ul>
              {audioCodecs.length > 0 ? (
                audioCodecs.map((codec, index) => (
                  <li key={index}>{codec}</li>
                ))
              ) : (
                <li>No codecs supported</li>
              )}
            </ul>
            {isAc3Supported && <p>AC-3 is supported.</p>}
            {isEac3Supported && <p>E-AC-3 is supported.</p>}
            <button onClick={() => setShowCodecUpload(true)}>
              Upload Custom Codec
            </button>
            {showCodecUpload && (
              <input
                type="file"
                accept=".txt"
                onChange={handleCodecUpload}
                className="mt-2"
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        <button
          onClick={toggleMediaInfo}
          className="border p-2 bg-blue-500 text-white"
        >
          Media Info
        </button>
        {showMediaInfo && (
          <div className="mt-2">
            <p>Video Codec: {mediaInfo.videoCodec || 'Unknown'}</p>
            <p>Audio Codec: {mediaInfo.audioCodec || 'Unknown'}</p>
            <p>Resolution: {mediaInfo.resolution || 'Unknown'}</p>
            <p>Frame Rate: {mediaInfo.frameRate || 'Unknown'}</p>
            <p>Bitrate: {mediaInfo.bitrate || 'Unknown'}</p>
            <p>Audio Channels: {mediaInfo.audioChannels || 'Unknown'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;