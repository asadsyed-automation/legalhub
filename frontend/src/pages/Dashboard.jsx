import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: '24px' }}>
      <h2>Welcome, {user?.name}</h2>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Dashboard;