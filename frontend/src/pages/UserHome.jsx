import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Link } from 'react-router-dom';

export default function UserHome() {
  const webcamRef = useRef(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Capture frames for blink detection
  const checkBlinkOnce = async () => {
    const frames = [];
    for (let i = 0; i < 5; i++) {
      frames.push(webcamRef.current.getScreenshot());
      await new Promise(r => setTimeout(r, 200)); // capture every 200ms
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
      setResponse(`Checking for blink... (Attempt ${attempt}/${retries})`);
      const blinked = await checkBlinkOnce();
      if (blinked) return true;
      // wait a short time before retrying to allow user to blink
      await new Promise(r => setTimeout(r, 500));
    }
    return false;
  };

  const handleVerifyWithBlink = async () => {
    if (!webcamRef.current) return;
    setLoading(true);
    setResponse('Starting blink detection...');

    try {
      const blinked = await checkBlinkWithRetries(3);

      if (!blinked) {
        setResponse('No blink detected after multiple attempts ❌. Please try again.');
        setLoading(false);
        return;
      }

      setResponse('Blink detected ✅. Capturing image and verifying...');

      // Auto capture a frame for verification
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
      setResponse('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <Link
        to="/login"
        className="absolute top-4 right-4 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
      >
        Admin Login
      </Link>
      <div className="bg-white p-8 rounded shadow w-full max-w-md flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6">User Home</h2>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/png"
          className="rounded mb-4 w-full"
        />
        <button
          onClick={handleVerifyWithBlink}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Verify (with Blink)'}
        </button>

        {response && (
          <div className="mt-4 text-center text-lg font-semibold text-gray-700">{response}</div>
        )}
      </div>
    </div>
  );
}
