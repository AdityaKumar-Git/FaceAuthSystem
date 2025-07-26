import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Link } from 'react-router-dom';

export default function UserHome() {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  };

  const handleVerify = async () => {
    if (!imgSrc) return;
    setLoading(true);
    setResponse('');
    try {
      const blob = await (await fetch(imgSrc)).blob();
      const formData = new FormData();
      formData.append('image', blob, 'capture.png');
      formData.append('timestamp', new Date().toISOString());
      
      // Note for me: Replace the URL below with backend endpoint
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
          onClick={capture}
          className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Capture
        </button>
        {imgSrc && (
          <img src={imgSrc} alt="Captured" className="mb-4 rounded w-full" />
        )}
        <button
          onClick={handleVerify}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          disabled={!imgSrc || loading}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        {response && (
          <div className="mt-4 text-center text-lg font-semibold text-gray-700">{response}</div>
        )}
      </div>
    </div>
  );
} 