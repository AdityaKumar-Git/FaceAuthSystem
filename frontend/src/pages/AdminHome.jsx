import { useState, useRef } from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function AdminHome() {
  const [personId, setPersonId] = useState('');
  const [image, setImage] = useState(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personId || !image) {
      setResponse('Please provide both Person ID and an image.');
      return;
    }
    setLoading(true);
    setResponse('');
    try {
      const formData = new FormData();
      formData.append('personId', personId);
      formData.append('image', image);

      // Note for me: Replace the URL below with backend endpoint
      const res = await fetch('http://127.0.0.1:8000/api/add-face', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResponse(data.message || JSON.stringify(data));
      setPersonId('');
      setImage(null);
      fileInputRef.current.value = '';
    } catch (err) {
      setResponse('Failed to add face.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
      >
        Logout
      </button>
      <div className="bg-white p-8 rounded shadow w-full max-w-md flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6">Admin Home</h2>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            type="text"
            className="w-full px-3 py-2 border rounded"
            placeholder="Person ID"
            value={personId}
            onChange={e => setPersonId(e.target.value)}
            required
          />
          <input
            type="file"
            accept="image/*"
            className="w-full"
            onChange={handleImageChange}
            ref={fileInputRef}
            required
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Add Face'}
          </button>
        </form>
        {response && (
          <div className="mt-4 text-center text-lg font-semibold text-gray-700">{response}</div>
        )}
      </div>
    </div>
  );
} 