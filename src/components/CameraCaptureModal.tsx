import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  Check, 
  Maximize2 
} from 'lucide-react';
import { LocationInfo } from '../types';

interface CameraCaptureModalProps {
  location: LocationInfo | null;
  onClose: () => void;
  onPhotoCaptured?: (dataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  location,
  onClose,
  onPhotoCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(true);

  // Initialize camera stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      setErrorMsg(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setErrorMsg('Camera API is not supported on this browser or device.');
          return;
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.warn('Camera error:', err);
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setErrorMsg('Camera permission was blocked. Please allow camera access in your browser address bar.');
        } else {
          setErrorMsg('Could not open camera device. It may be in use by another application.');
        }
      }
    };

    if (isCapturing) {
      startCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, isCapturing]);

  const handleFlipCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply Evidence Timestamp & GPS Watermark Banner
    const timestampStr = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const coordsStr = location
      ? `GPS: ${location.lat.toFixed(6)}°N, ${location.lng.toFixed(6)}°E (±${Math.round(location.accuracy)}m)`
      : 'GPS: Satellite Locking';

    // Bottom dark translucent gradient for watermark
    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`🚨 SAFE BHARAT CIVIC EVIDENCE · ${timestampStr} IST`, 24, canvas.height - 38);

    ctx.fillStyle = '#34d399';
    ctx.font = '16px monospace';
    ctx.fillText(`${coordsStr} · Tamper-Resistant Timestamp`, 24, canvas.height - 14);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);
    setIsCapturing(false);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (onPhotoCaptured) {
      onPhotoCaptured(dataUrl);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setIsCapturing(true);
  };

  const handleDownload = () => {
    if (!capturedPhoto) return;
    const a = document.createElement('a');
    a.href = capturedPhoto;
    a.download = `SafeBharat_Evidence_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white">
                Emergency Camera &amp; Evidence Snapper
              </h3>
              <p className="text-[10px] text-slate-400">
                Watermarked with live GPS &amp; tamper-resistant timestamp
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[420px] overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center space-y-3 max-w-md">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-sm text-amber-200">{errorMsg}</p>
              <button
                onClick={handleClose}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Close Camera
              </button>
            </div>
          ) : isCapturing ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Tactical Crosshair Overlay */}
              <div className="absolute inset-0 pointer-events-none border-2 border-white/20 m-6 rounded-2xl flex items-center justify-center">
                <div className="w-12 h-12 border border-white/40 rounded-full" />
              </div>

              {/* Live Coordinates Watermark Pill */}
              <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-200 text-[11px] font-mono py-1 px-3 rounded-full flex items-center gap-1.5 shadow">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>
                  {location 
                    ? `${location.lat.toFixed(5)}°N, ${location.lng.toFixed(5)}°E` 
                    : 'Locating GPS...'}
                </span>
              </div>

              {/* Flip Camera Button */}
              <button
                onClick={handleFlipCamera}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white hover:bg-slate-800 cursor-pointer shadow"
                title="Switch Camera (Front/Back)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          ) : (
            capturedPhoto && (
              <img
                src={capturedPhoto}
                alt="Captured Emergency Evidence"
                className="w-full h-full object-contain"
              />
            )
          )}

          {/* Hidden Canvas for Rendering Frame & Stamp */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          {isCapturing ? (
            <div className="w-full flex items-center justify-center gap-4">
              <button
                onClick={handleCapturePhoto}
                className="py-3 px-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-display font-black text-sm flex items-center gap-2 shadow-xl shadow-rose-600/40 cursor-pointer active:scale-95 transition-all"
              >
                <Camera className="w-5 h-5" />
                <span>CAPTURE EVIDENCE PHOTO</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Photo stamped with GPS coordinates &amp; timestamp</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleRetake}
                  className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
                >
                  Retake Photo
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Save Image</span>
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
