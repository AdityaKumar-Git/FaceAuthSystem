import { useState, useRef } from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
      setResponse('⚠️ Please provide all details and an image.');
      return;
    }
    setLoading(true);
    setResponse('');
    try {
      const formData = new FormData();
      formData.append('personId', personId);
      formData.append('image', image);

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
      setResponse('❌ Failed to add face.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-lg bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center"
      >
        <h2 className="text-3xl font-bold text-white mb-6">Admin Panel</h2>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg bg-gray-900/60 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Person ID"
            value={personId}
            onChange={e => setPersonId(e.target.value)}
            required
          />

          <input
            type="file"
            accept="image/*"
            className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700"
            onChange={handleImageChange}
            ref={fileInputRef}
            required
          />

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                Uploading...
              </div>
            ) : (
              'Add Face'
            )}
          </button>
        </form>

        {response && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-lg font-semibold text-gray-200"
          >
            {response}
          </motion.div>
        )}

        <button
          onClick={handleLogout}
          className="mt-6 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 active:scale-95 transition-all"
        >
          Logout
        </button>
      </motion.div>
    </div>
  );
}
