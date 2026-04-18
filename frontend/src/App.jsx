import { useState, useRef, useEffect } from 'react';

export default function App() {
  const [mode, setMode] = useState('image'); // 'image', 'video', 'camera'
  const [status, setStatus] = useState('Ready for detection.');
  
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  // --- API CALL ---
  const detectObjects = async (fileBlob) => {
    const formData = new FormData();
    formData.append('file', fileBlob);
    try {
      const response = await fetch('http://127.0.0.1:8000/detect', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error("Network Error");
      const data = await response.json();
      return data.detections;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  // --- DRAWING LOGIC ---
  const drawBoxes = (ctx, detections, width) => {
    detections.forEach(det => {
      const { x1, y1, x2, y2 } = det.box_coordinates;
      
      ctx.strokeStyle = "#00ff00"; 
      ctx.lineWidth = Math.max(2, width / 300);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      ctx.fillStyle = "#00ff00";
      const text = `${det.class_name} ${Math.round(det.confidence * 100)}%`;
      const fontSize = Math.max(14, width / 50);
      ctx.font = `bold ${fontSize}px Arial`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(x1, y1 - fontSize - 4, textWidth + 10, fontSize + 4);

      ctx.fillStyle = "#000000";
      ctx.fillText(text, x1 + 4, y1 - 4);
    });
  };

  // --- UNIVERSAL CLEANUP ---
  const stopAllMedia = () => {
    if (intervalRef.current) cancelAnimationFrame(intervalRef.current);
    if (videoRef.current) {
      videoRef.current.pause();
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      videoRef.current.src = "";
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    stopAllMedia();
    setStatus('Ready for detection.');
  }, [mode]);

  // --- UNIVERSAL RENDER LOOP (For Camera & Video) ---
  const startRenderLoop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let isProcessing = false; 
    let lastDetections = [];  

    const renderLoop = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      if (videoRef.current.readyState >= 2) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        
        drawBoxes(ctx, lastDetections, canvas.width);

        if (!isProcessing) {
          isProcessing = true;
          canvas.toBlob(async (blob) => {
            if (blob) {
              const detections = await detectObjects(blob);
              lastDetections = detections; 
            }
            isProcessing = false;
          }, 'image/jpeg', 0.7); 
        }
      }
      intervalRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();
  };

  // --- IMAGE UPLOAD LOGIC ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('Processing Image...');
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const detections = await detectObjects(file);
      drawBoxes(ctx, detections, img.width);
      setStatus(`Detected ${detections.length} objects.`);
    };
  };

  // --- VIDEO UPLOAD LOGIC (NEW) ---
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    stopAllMedia(); // Reset everything
    setStatus('Playing and Processing Video...');

    const videoUrl = URL.createObjectURL(file);
    videoRef.current.src = videoUrl;
    videoRef.current.muted = true; // Auto-play requires the video to be muted
    videoRef.current.loop = true;  // Loop the video automatically for testing

    try {
      await videoRef.current.play();
      startRenderLoop();
    } catch (err) {
      console.error(err);
      setStatus('Error playing video file.');
    }
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    try {
      stopAllMedia();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setStatus('Live Video Feed Active...');

      await videoRef.current.play();
      startRenderLoop();
    } catch (err) {
      console.error(err);
      setStatus('Error accessing webcam.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-12 font-sans">
      
      {/* Header */}
      <h1 className="text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
        Vision AI
      </h1>
      <p className="text-gray-400 mb-8 text-lg">Real-Time Object Detection Engine</p>

      {/* Mode Selector */}
      <div className="flex bg-gray-800 p-1 rounded-lg mb-8 shadow-lg">
        <button 
          onClick={() => setMode('image')}
          className={`px-6 py-2 rounded-md font-semibold transition-all ${mode === 'image' ? 'bg-green-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
        >
          Image Upload
        </button>
        <button 
          onClick={() => setMode('video')}
          className={`px-6 py-2 rounded-md font-semibold transition-all ${mode === 'video' ? 'bg-green-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
        >
          Video Upload
        </button>
        <button 
          onClick={() => setMode('camera')}
          className={`px-6 py-2 rounded-md font-semibold transition-all ${mode === 'camera' ? 'bg-green-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
        >
          Live Camera
        </button>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col items-center gap-4 h-12">
        {mode === 'image' && (
          <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-green-400 hover:file:bg-gray-700 cursor-pointer transition-all" />
        )}
        
        {mode === 'video' && (
          <input type="file" accept="video/mp4,video/webm,video/ogg" onChange={handleVideoUpload} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-blue-400 hover:file:bg-gray-700 cursor-pointer transition-all" />
        )}

        {mode === 'camera' && (
          <div className="flex gap-4">
            <button onClick={startCamera} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-md font-bold transition-all shadow-lg">Start Camera</button>
            <button onClick={() => { stopAllMedia(); setStatus('Camera stopped.'); }} className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-md font-bold transition-all shadow-lg">Stop Camera</button>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="mb-4 text-sm font-mono text-green-400 bg-gray-800 px-4 py-1 rounded-full border border-gray-700">
        Status: {status}
      </div>

      {/* Display Area */}
      <div className="relative w-full max-w-4xl border-2 border-gray-800 rounded-xl overflow-hidden bg-black shadow-2xl flex justify-center items-center min-h-[400px]">
        <video ref={videoRef} playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="max-w-full max-h-[70vh] object-contain" />
        
        {!canvasRef.current?.width && (
          <span className="absolute text-gray-600 font-medium tracking-widest">NO SOURCE</span>
        )}
      </div>

    </div>
  );
}