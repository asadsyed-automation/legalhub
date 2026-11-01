const autocannon = require('autocannon');
const http = require('http');
const app = require('../src/app');

describe('Part S: Automated Load & Concurrency Smoke Tests', () => {
  let server;
  let testUrl;

  beforeAll((done) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      testUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('should handle concurrent traffic on /health with zero errors and low latency', async () => {
    const result = await new Promise((resolve, reject) => {
      autocannon(
        {
          url: `${testUrl}/api/v1/health`,
          connections: 20,
          duration: 3,
          pipelining: 1
        },
        (err, res) => {
          if (err) return reject(err);
          resolve(res);
        }
      );
    });

    expect(result).toBeDefined();
    expect(result.requests.total).toBeGreaterThan(50);
    expect(result.non2xx).toBe(0);
    expect(result.latency.p97_5).toBeLessThan(500);
  });

  it('should handle concurrent directory queries on /lawyers with zero 5xx server faults', async () => {
    const result = await new Promise((resolve, reject) => {
      autocannon(
        {
          url: `${testUrl}/api/v1/lawyers?limit=5`,
          connections: 5,
          duration: 3,
          pipelining: 1
        },
        (err, res) => {
          if (err) return reject(err);
          resolve(res);
        }
      );
    });

    expect(result).toBeDefined();
    expect(result.requests.total).toBeGreaterThanOrEqual(1);
    expect(result.errors).toBe(0);
    expect(result.non2xx).toBe(0);
  });
});
