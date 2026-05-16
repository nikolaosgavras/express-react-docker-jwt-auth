import { useState, useEffect } from 'react';
import api from '../api';

// Define the shape of our User object returned by the backend
export type User = {
  id: number;
  user_name: string;
  user_email: string;
}

export function UsersManager() {
  // State for the user list and UI feedback
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the form inputs
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    password: ''
  });
  
  // Tracks which user is being edited. If null, the form adds a new user.
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  // --- API Calls ---

  // READ: Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run fetchUsers once when the component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Form Handling ---

  // Update formData state when inputs change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // CREATE / UPDATE: Submit the form
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError(null);

    const isEditing = editingUserId !== null;

    // Prepare payload. If editing and password is empty, don't send it.
    const payload: any = { ...formData };
    if (isEditing && !payload.password) {
      delete payload.password;
    }

    try {
      if (isEditing) {
        await api.put(`/users/${editingUserId}`, payload);
      } else {
        await api.post('/users', payload);
      }

      // On success: clear form, reset edit mode, and refresh user list
      setFormData({ user_name: '', user_email: '', password: '' });
      setEditingUserId(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Prepare form for editing an existing user
  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      user_name: user.user_name,
      user_email: user.user_email,
      password: '' // Keep empty so user only types it if they want to change it
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setFormData({ user_name: '', user_email: '', password: '' });
  };

  // DELETE: Remove a user
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/users/${id}`);
      
      // Update UI immediately without a full refresh to feel faster
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // --- Render ---

  if (loading && users.length === 0) return <p>Loading users...</p>;

  return (
    <div>
      <h2>User Management</h2>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {error}</p>}
      
      {/* Form Section */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h3>{editingUserId ? 'Edit User' : 'Add New User'}</h3>
        
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.2rem' }}>Name:</label>
          <input 
            type="text" 
            name="user_name" 
            value={formData.user_name} 
            onChange={handleInputChange} 
            required 
            style={{ width: '100%', padding: '0.4rem' }}
          />
        </div>
        
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.2rem' }}>Email:</label>
          <input 
            type="email" 
            name="user_email" 
            value={formData.user_email} 
            onChange={handleInputChange} 
            required 
            style={{ width: '100%', padding: '0.4rem' }}
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.2rem' }}>
            Password: {editingUserId && <span style={{ fontSize: '0.8em', color: 'gray' }}>(Leave blank to keep unchanged)</span>}
          </label>
          <input 
            type="password" 
            name="password" 
            value={formData.password} 
            onChange={handleInputChange} 
            required={!editingUserId} 
            style={{ width: '100%', padding: '0.4rem' }}
          />
        </div>
        
        <button type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          {editingUserId ? 'Update User' : 'Add User'}
        </button>
        
        {editingUserId && (
          <button type="button" onClick={cancelEdit} style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Cancel
          </button>
        )}
      </form>

      {/* Table Section */}
      <h3>User List</h3>
      <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead style={{ backgroundColor: '#f0f0f0' }}>
          <tr>
            <th style={{ textAlign: 'left' }}>ID</th>
            <th style={{ textAlign: 'left' }}>Name</th>
            <th style={{ textAlign: 'left' }}>Email</th>
            <th style={{ textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.user_name}</td>
              <td>{user.user_email}</td>
              <td>
                <button onClick={() => handleEdit(user)} style={{ cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(user.id)} style={{ marginLeft: '0.5rem', cursor: 'pointer', color: 'red' }}>Delete</button>
              </td>
            </tr>
          ))}
          {users.length === 0 && !loading && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '1rem' }}>No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}