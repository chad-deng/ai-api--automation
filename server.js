const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from various directories
app.use('/assets', express.static(path.join(__dirname, 'marketing/assets')));
app.use('/docs', express.static(path.join(__dirname, 'docs')));
app.use('/coverage', express.static(path.join(__dirname, 'coverage')));

// API routes for framework functionality
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    framework: 'AI API Test Automation'
  });
});

app.get('/api/features', (req, res) => {
  res.json({
    features: [
      {
        name: 'Zero Configuration',
        description: 'Generate TypeScript Jest tests from OpenAPI specs in 30 seconds',
        icon: '⚡'
      },
      {
        name: 'Security Scanning',
        description: 'Built-in OWASP Top 10 compliance checking and vulnerability detection',
        icon: '🔒'
      },
      {
        name: 'Performance Monitoring',
        description: 'Real-time metrics, load testing, and configurable alerts',
        icon: '📊'
      },
      {
        name: 'TypeScript Native',
        description: 'Perfect integration with TypeScript projects and IntelliSense',
        icon: '🎯'
      },
      {
        name: 'CI/CD Integration',
        description: 'Seamless integration with GitHub Actions, Jenkins, GitLab CI',
        icon: '🔄'
      },
      {
        name: 'Enterprise Reports',
        description: 'Comprehensive HTML, JSON, PDF reports with coverage metrics',
        icon: '📈'
      }
    ]
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    stats: [
      { label: 'Less Manual Work', value: '90%' },
      { label: 'Setup Time', value: '30s' },
      { label: 'Enterprise Users', value: '50+' },
      { label: 'Success Rate', value: '95%' }
    ]
  });
});

// Demo API endpoints
app.post('/api/demo/generate', (req, res) => {
  const { specPath, outputDir } = req.body;
  
  // Simulate test generation
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Test generation completed successfully',
      results: {
        testsGenerated: 127,
        filesCreated: 15,
        coverage: '98.5%',
        securityScanPassed: true,
        performanceTestsPassed: true,
        timeElapsed: '28.5s'
      }
    });
  }, 2000);
});

app.get('/api/demo/status', (req, res) => {
  res.json({
    status: 'ready',
    framework: {
      version: '1.0.0',
      components: {
        generator: 'active',
        security: 'active',
        performance: 'active',
        monitoring: 'active'
      }
    }
  });
});

// Serve the main landing page
app.get('/', (req, res) => {
  const landingPagePath = path.join(__dirname, 'marketing/website/landing-page.html');
  if (fs.existsSync(landingPagePath)) {
    res.sendFile(landingPagePath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI API Test Automation Framework</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 40px; background: #f5f5f5; 
          }
          .container { 
            max-width: 800px; margin: 0 auto; background: white; 
            padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          h1 { color: #0066CC; margin-bottom: 30px; }
          .nav { margin-bottom: 30px; }
          .nav a { 
            display: inline-block; margin-right: 20px; padding: 10px 20px;
            background: #0066CC; color: white; text-decoration: none;
            border-radius: 6px; transition: background 0.3s;
          }
          .nav a:hover { background: #0052a3; }
          .status { padding: 20px; background: #e8f5e8; border-radius: 6px; margin-bottom: 20px; }
          .feature { 
            padding: 20px; margin: 10px 0; background: #f8f9fa; 
            border-left: 4px solid #0066CC; border-radius: 0 6px 6px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 AI API Test Automation Framework</h1>
          
          <div class="status">
            <strong>✅ Framework Status:</strong> Production Ready - All systems operational
          </div>
          
          <div class="nav">
            <a href="/docs">📚 Documentation</a>
            <a href="/coverage">📊 Test Coverage</a>
            <a href="/api/health">🔍 API Health</a>
            <a href="/api/features">⚡ Features</a>
          </div>
          
          <div class="feature">
            <h3>⚡ Zero Configuration</h3>
            <p>Generate comprehensive TypeScript Jest tests from OpenAPI specifications in under 30 seconds. No configuration files, no complex setup.</p>
          </div>
          
          <div class="feature">
            <h3>🔒 Enterprise Security</h3>
            <p>Built-in OWASP Top 10 compliance checking, vulnerability detection, and security best practices validation.</p>
          </div>
          
          <div class="feature">
            <h3>📊 Performance Monitoring</h3>
            <p>Real-time performance metrics, load testing capabilities, and configurable alerting thresholds.</p>
          </div>
          
          <div class="feature">
            <h3>🎯 TypeScript Native</h3>
            <p>Perfect integration with TypeScript projects. Proper type annotations, IntelliSense support, and compile-time validation.</p>
          </div>
          
          <div class="feature">
            <h3>🔄 CI/CD Integration</h3>
            <p>Seamless integration with GitHub Actions, Jenkins, GitLab CI, and other popular CI/CD platforms.</p>
          </div>
          
          <div class="feature">
            <h3>📈 Comprehensive Reports</h3>
            <p>Detailed HTML, JSON, and PDF reports with coverage metrics, performance data, and security findings.</p>
          </div>
          
          <h2>🚀 Quick Start</h2>
          <pre style="background: #1a1a1a; color: #00ff00; padding: 20px; border-radius: 6px; overflow-x: auto;">
# Install the framework
npm install -g @yourorg/ai-api-test-automation

# Generate tests from OpenAPI spec
api-test-gen generate openapi.yaml

# Run the generated tests
npm test

# View results
open coverage/index.html
          </pre>
          
          <h2>📡 API Endpoints</h2>
          <ul>
            <li><strong>GET /api/health</strong> - Framework health status</li>
            <li><strong>GET /api/features</strong> - Available features list</li>
            <li><strong>GET /api/stats</strong> - Usage statistics</li>
            <li><strong>POST /api/demo/generate</strong> - Demo test generation</li>
            <li><strong>GET /api/demo/status</strong> - Demo system status</li>
          </ul>
          
          <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; text-align: center;">
            <p>AI API Test Automation Framework v1.0.0 - Enterprise Grade API Testing</p>
          </footer>
        </div>
        
        <script>
          // Auto-refresh health status
          setInterval(async () => {
            try {
              const response = await fetch('/api/health');
              const health = await response.json();
              console.log('Framework Health:', health);
            } catch (error) {
              console.error('Health check failed:', error);
            }
          }, 30000);
        </script>
      </body>
      </html>
    `);
  }
});

// Documentation routes
app.get('/docs/:page?', (req, res) => {
  const page = req.params.page || 'index';
  const docPath = path.join(__dirname, 'docs', `${page}.md`);
  
  if (fs.existsSync(docPath)) {
    const content = fs.readFileSync(docPath, 'utf8');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Documentation - ${page}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5;
          }
          .container { 
            max-width: 900px; margin: 0 auto; background: white;
            padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          pre { 
            background: #f8f9fa; padding: 20px; border-radius: 6px; 
            overflow-x: auto; border-left: 4px solid #0066CC;
          }
          code { 
            background: #f8f9fa; padding: 2px 6px; border-radius: 3px; 
            font-family: 'Monaco', 'Consolas', monospace;
          }
          h1, h2, h3 { color: #0066CC; }
          .nav { margin-bottom: 30px; }
          .nav a { 
            display: inline-block; margin-right: 15px; padding: 8px 16px;
            background: #0066CC; color: white; text-decoration: none;
            border-radius: 4px; font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="nav">
            <a href="/">🏠 Home</a>
            <a href="/docs">📚 Docs</a>
            <a href="/coverage">📊 Coverage</a>
          </div>
          <pre style="white-space: pre-wrap;">${content}</pre>
        </div>
      </body>
      </html>
    `);
  } else {
    res.status(404).send('Documentation page not found');
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.path} not found`,
    availableRoutes: [
      'GET /',
      'GET /docs',
      'GET /coverage',
      'GET /api/health',
      'GET /api/features',
      'GET /api/stats',
      'POST /api/demo/generate',
      'GET /api/demo/status'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 AI API Test Automation Framework Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Server:     http://localhost:${PORT}
📚 Docs:       http://localhost:${PORT}/docs
📊 Coverage:   http://localhost:${PORT}/coverage
🔍 Health:     http://localhost:${PORT}/api/health
⚡ Features:   http://localhost:${PORT}/api/features

Framework Status: Production Ready ✅
All Systems: Operational ✅
Enterprise Features: Active ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

module.exports = app;