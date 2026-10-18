import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import { ROLES, ALLOWED_REGISTRATION_ROLES, ROLE_LABELS } from '../constants';

export const Register = () => {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');
  const initialRole = ALLOWED_REGISTRATION_ROLES.includes(requestedRole)
    ? requestedRole
    : ROLES.CLIENT;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: initialRole,
  });

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error upon typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      // Role-guided redirection
      if (formData.role === ROLES.LAWYER) {
        navigate('/lawyer/application');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setGeneralError(error.message || 'Registration failed. Please check your inputs.');

      // Map backend Zod validation details to form inputs
      if (Array.isArray(error.details)) {
        const errorsMap = {};
        error.details.forEach((err) => {
          if (err.field) {
            errorsMap[err.field] = err.message;
          }
        });
        setFieldErrors(errorsMap);
      }
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = ALLOWED_REGISTRATION_ROLES.map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
  }));

  return (
    <div className="auth-container">
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-2)' }}>⚖️</div>
          <h2>Create a LegalHub Account</h2>
          <p>Join Pakistan's premier verified legal network</p>
        </div>

        {generalError && (
          <div className="alert alert-danger" role="alert">
            <strong>Registration Notice:</strong>
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Full Name"
            id="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Advocate Tariq Hassan or Fatima Noor"
            required
            error={fieldErrors.name}
            disabled={loading}
          />

          <FormField
            label="Email Address"
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            required
            error={fieldErrors.email}
            disabled={loading}
          />

          <FormField
            label="Password"
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimum 8 characters"
            required
            helpText="Must be at least 8 characters long for cryptographic security."
            error={fieldErrors.password}
            disabled={loading}
          />

          <FormField
            label="Register As"
            id="role"
            type="select"
            value={formData.role}
            onChange={handleChange}
            options={roleOptions}
            required
            helpText="Lawyer accounts must verify Bar Council credentials before public listing."
            error={fieldErrors.role}
            disabled={loading}
          />

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: 'var(--spacing-4)', padding: 'var(--spacing-3)' }}
          >
            {loading ? (
              <>
                <span className="spinner" /> Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-6)', fontSize: 'var(--font-size-sm)' }}>
          <p>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
