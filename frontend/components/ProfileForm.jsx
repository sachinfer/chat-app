import React, { useState } from 'react';

function ProfileForm({ user, token, onUpdate }) {
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed for avatar.');
        return;
      }
      if (file.size > 1024 * 1024) {
        setError('Avatar file size must be less than 1MB.');
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username, email, password: password || undefined, avatar }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback('Profile updated!');
        setPassword('');
        setAvatar(data.user.avatar || '');
        setAvatarPreview(data.user.avatar || '');
        onUpdate && onUpdate(data.user);
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 16, background: '#f9f9f9', padding: 16, borderRadius: 8, maxWidth: 400 }}>
      <h3>Edit Profile</h3>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <label>Avatar:</label><br />
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
        </div>
        {avatarPreview && <img src={avatarPreview} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ccc' }} />}
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Username:</label><br />
        <input value={username} onChange={e => setUsername(e.target.value)} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Email:</label><br />
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>New Password:</label><br />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Leave blank to keep current" />
      </div>
      <button type="submit" disabled={loading}>Update</button>
      {feedback && <div style={{ color: 'green', marginTop: 8 }}>{feedback}</div>}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  );
}

export default ProfileForm; 