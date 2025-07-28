import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function UserHome() {
  const webcamRef = useRef(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const checkBlinkOnce = async () => {
    const frames = [];
    for (let i = 0; i < 5; i++) {
      frames.push(webcamRef.current.getScreenshot());
      await new Promise(r => setTimeout(r, 200));
    }
    const res = await fetch('http://127.0.0.1:8000/api/blink-detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(frames),
    });
    const data = await res.json();
    return data.blink_detected;
  };

  const checkBlinkWithRetries = async (retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      setResponse(`👀 Checking for blink... (Attempt ${attempt}/${retries})`);
      const blinked = await checkBlinkOnce();
      if (blinked) return true;
      await new Promise(r => setTimeout(r, 500));
    }
    return false;
  };

  const handleVerifyWithBlink = async () => {
    if (!webcamRef.current) return;
    setLoading(true);
    setResponse('🔄 Starting blink detection...');

    try {
      const blinked = await checkBlinkWithRetries(3);

      if (!blinked) {
        setResponse('❌ No blink detected. Please try again.');
        setLoading(false);
        return;
      }

      setResponse('✅ Blink detected! Capturing image...');

      const imageSrc = webcamRef.current.getScreenshot();
      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append('image', blob, 'capture.png');
      formData.append('timestamp', new Date().toISOString());

      const res = await fetch('http://127.0.0.1:8000/api/verify', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResponse(data.message || JSON.stringify(data));
    } catch (err) {
      setResponse('⚠️ Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Decorative blurred background */}
      <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-lg bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center"
      >
        <h2 className="text-3xl font-bold text-white mb-6">User Verification</h2>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/png"
          className="rounded-xl mb-4 w-full border-4 border-white/20 shadow-lg"
        />

        <button
          onClick={handleVerifyWithBlink}
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
              Processing...
            </div>
          ) : (
            'Verify with Blink'
          )}
        </button>

        {response && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-lg font-semibold text-gray-200"
          >
            {response}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
