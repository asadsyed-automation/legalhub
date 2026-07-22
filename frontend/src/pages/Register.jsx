import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerRequest } from '../api/authApi';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'citizen' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await registerRequest(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '24px' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
        Create Account
      </h2>
      {success && <p style={{ color: 'var(--color-success)' }}>Registered! Redirecting to login...</p>}
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Full Name" onChange={handleChange} style={{ display: 'block', width: '100%', marginBottom: '12px', padding: '10px' }} required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} style={{ display: 'block', width: '100%', marginBottom: '12px', padding: '10px' }} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} style={{ display: 'block', width: '100%', marginBottom: '12px', padding: '10px' }} required />
        <select name="role" onChange={handleChange} style={{ display: 'block', width: '100%', marginBottom: '12px', padding: '10px' }}>
          <option value="citizen">Citizen</option>
          <option value="lawyer">Lawyer</option>
        </select>
        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;