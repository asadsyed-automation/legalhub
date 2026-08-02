import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { getAllProfiles } from '../api/marketplaceApi';
import { getCases } from '../api/caseApi';
import { useAuth } from '../context/AuthContext';
import { Card, Badge } from '../components/ui';

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState('Lawyers'); // 'Lawyers' | 'Cases' | 'Documents'
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const [lawyers, setLawyers] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setQuery(queryParam);
    setLoading(true);

    const promises = [getAllProfiles().catch(() => [])];
    if (user) {
      promises.push(getCases().catch(() => []));
    } else {
      promises.push(Promise.resolve([]));
    }

    Promise.all(promises).then(([lawyerData, caseData]) => {
      setLawyers(lawyerData);
      setCases(caseData);
    }).finally(() => setLoading(false));
  }, [queryParam, user]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  }

  // Filtered results
  const qLower = queryParam.toLowerCase();
  const filteredLawyers = lawyers.filter(l => 
    !qLower || 
    l.specialization?.toLowerCase().includes(qLower) || 
    l.bio?.toLowerCase().includes(qLower)
  );

  const filteredCases = cases.filter(c => 
    !qLower || 
    c.case_number?.toLowerCase().includes(qLower) || 
    c.court_name?.toLowerCase().includes(qLower) ||
    c.case_type?.toLowerCase().includes(qLower)
  );

  return (
    <div style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      <div style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>
        {/* Search Bar Block */}
        <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-secondary)', margin: '0 0 16px', fontFamily: 'var(--font-heading)' }}>
            Global Search
          </h1>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by lawyer specialization, case number, or court name..."
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '12px 24px', borderRadius: 'var(--radius-sm)', border: 'none',
                backgroundColor: 'var(--color-primary)', color: '#FFF', fontWeight: 600,
                cursor: 'pointer', fontSize: '14px'
              }}
            >
              Search
            </button>
          </form>
        </div>

        {/* Results Header & Tabs */}
        <div>
          <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', marginBottom: '24px', gap: '8px' }}>
            {['Lawyers', 'Cases (own only)', 'Documents (own only)'].map((tabLabel) => {
              const tabKey = tabLabel.split(' ')[0];
              const isSelected = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  style={{
                    padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: '14px', fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    borderBottom: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                    marginBottom: '-2px', transition: 'all 0.15s ease'
                  }}
                >
                  {tabLabel}
                </button>
              );
            })}
          </div>

          {/* Results Content */}
          {loading ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Searching across LegalHub...</p>
          ) : (
            <div>
              {/* TAB 1: LAWYERS */}
              {activeTab === 'Lawyers' && (
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                    Found {filteredLawyers.length} verified advocate profile{filteredLawyers.length !== 1 ? 's' : ''}
                  </p>
                  {filteredLawyers.length === 0 ? (
                    <Card><p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No lawyers found matching "{queryParam}".</p></Card>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                      {filteredLawyers.map(l => (
                        <Card key={l.id} onClick={() => navigate('/marketplace')} style={{ cursor: 'pointer' }}>
                          <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: 'var(--color-secondary)' }}>{l.specialization}</h3>
                          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            {l.bio ? `${l.bio.slice(0, 90)}...` : 'No bio specified.'}
                          </p>
                          <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>🏆 {l.cases_won} cases won</div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CASES */}
              {activeTab === 'Cases' && (
                <div>
                  {!user ? (
                    <Card>
                      <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                        🔒 Please <span style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/login')}>Sign In</span> to search your assigned cases.
                      </p>
                    </Card>
                  ) : (
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                        Found {filteredCases.length} assigned case{filteredCases.length !== 1 ? 's' : ''}
                      </p>
                      {filteredCases.length === 0 ? (
                        <Card><p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No cases found matching "{queryParam}".</p></Card>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {filteredCases.map(c => (
                            <Card key={c.id} onClick={() => navigate(`/cases/${c.id}`)} style={{ cursor: 'pointer' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{c.case_number}</div>
                                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{c.court_name} · {c.case_type}</div>
                                </div>
                                <Badge status={c.status} />
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DOCUMENTS */}
              {activeTab === 'Documents' && (
                <div>
                  {!user ? (
                    <Card>
                      <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                        🔒 Please <span style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/login')}>Sign In</span> to search your document vault.
                      </p>
                    </Card>
                  ) : (
                    <Card>
                      <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                        📄 Document search is available directly inside case details view.
                      </p>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

export default SearchResults;
