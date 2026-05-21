import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../lib/imageCrop';

const LogoCropperModal = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedFile = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedFile);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-surface-container-lowest dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] overflow-hidden flex flex-col shadow-2xl border border-white/10 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white">Loqonu Kəs</h3>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">Loqonun dairə daxilində necə görünəcəyini tənzimləyin.</p>
          </div>
          <button 
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-white flex items-center justify-center hover:bg-surface-container-highest dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative h-[400px] bg-black">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
          />
        </div>

        {/* Controls */}
        <div className="p-8 space-y-8 bg-surface-container-low dark:bg-slate-800">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">zoom_in</span>
                Yaxınlaşdırma
              </span>
              <span className="text-sm font-black text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-lg">{(zoom * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onCancel}
              className="px-8 py-3 rounded-2xl bg-surface-container-high dark:bg-slate-700 text-on-surface dark:text-white font-bold hover:bg-surface-container-highest dark:hover:bg-slate-600 transition-all"
            >
              Ləğv et
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Kəs və Yadda Saxla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoCropperModal;
