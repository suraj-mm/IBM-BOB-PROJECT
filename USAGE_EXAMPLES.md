# Usage Examples

This guide shows how to use the Backend Intelligence Engine in various scenarios.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Neo4j

```bash
# Using Docker
docker run \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your_password \
  neo4j:latest
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
REPO_PATH=/path/to/your/typescript/project
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

### 4. Start the Engine

```bash
npm run dev
```

The engine will:
1. Connect to Neo4j
2. Scan your TypeScript codebase
3. Build the initial dependency graph
4. Start the HTTP server on port 3000

## 📊 Example Scenarios

### Scenario 1: Analyze a Single File Change

**Use Case:** A developer modifies an API endpoint.

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "my-service",
    "changedFiles": ["src/api/users.ts"]
  }'
```

**Response:**
```json
{
  "success": true,
  "analysisId": "analysis-1234567890-abc123",
  "events": [
    {
      "eventType": "breaking-api-change",
      "severity": "high",
      "payload": {
        "affectedFiles": [
          "frontend/components/UserList.tsx",
          "frontend/pages/profile.tsx"
        ],
        "recommendations": [
          "Update API documentation",
          "Notify API consumers"
        ]
      }
    }
  ],
  "summary": {
    "totalChanges": 3,
    "breakingChanges": 1,
    "affectedFiles": 2,
    "highSeverityIssues": 1
  }
}
```

### Scenario 2: Analyze Multiple File Changes

**Use Case:** A developer refactors shared utilities.

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "my-service",
    "changedFiles": [
      "src/utils/validation.ts",
      "src/utils/formatting.ts"
    ]
  }'
```

### Scenario 3: Real-Time Event Monitoring

**Use Case:** Monitor changes in real-time via WebSocket.

```javascript
// client.js
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/ws/events');

ws.on('open', () => {
  console.log('Connected to Intelligence Engine');
});

ws.on('message', (data) => {
  const event = JSON.parse(data);
  
  console.log(`Event: ${event.eventType}`);
  console.log(`Severity: ${event.severity}`);
  console.log(`Affected Files: ${event.payload.affectedFiles.length}`);
  
  if (event.severity === 'critical' || event.severity === 'high') {
    // Send alert to Slack, email, etc.
    sendAlert(event);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### Scenario 4: Check Dependency Statistics

**Use Case:** Get an overview of your codebase structure.

```bash
curl http://localhost:3000/api/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalFiles": 150,
    "totalDependencies": 320,
    "totalFunctions": 450,
    "totalApiRoutes": 45
  }
}
```

### Scenario 5: Find Circular Dependencies

**Use Case:** Identify problematic circular imports.

```bash
curl http://localhost:3000/api/circular-dependencies
```

**Response:**
```json
{
  "success": true,
  "cycles": [
    [
      "src/services/auth.ts",
      "src/services/user.ts",
      "src/services/auth.ts"
    ],
    [
      "src/utils/helpers.ts",
      "src/utils/validators.ts",
      "src/utils/helpers.ts"
    ]
  ],
  "count": 2
}
```

## 🔧 Integration Examples

### Integration with CI/CD Pipeline

**GitHub Actions Example:**

```yaml
# .github/workflows/code-intelligence.yml
name: Code Intelligence Check

on:
  pull_request:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    
    services:
      neo4j:
        image: neo4j:latest
        env:
          NEO4J_AUTH: neo4j/test
        ports:
          - 7687:7687
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Intelligence Engine
        run: |
          git clone https://github.com/your-org/backend-intelligence-engine.git
          cd backend-intelligence-engine
          npm install
      
      - name: Start Engine
        run: |
          cd backend-intelligence-engine
          npm run build
          npm start &
          sleep 10
        env:
          REPO_PATH: ${{ github.workspace }}
          NEO4J_URI: bolt://localhost:7687
          NEO4J_USER: neo4j
          NEO4J_PASSWORD: test
      
      - name: Get Changed Files
        id: changed-files
        uses: tj-actions/changed-files@v35
      
      - name: Analyze Changes
        run: |
          curl -X POST http://localhost:3000/api/analyze \
            -H "Content-Type: application/json" \
            -d "{
              \"repo\": \"${{ github.repository }}\",
              \"branch\": \"${{ github.base_ref }}\",
              \"changedFiles\": $(echo '${{ steps.changed-files.outputs.all_changed_files }}' | jq -R 'split(" ")')
            }" > analysis.json
      
      - name: Check for Breaking Changes
        run: |
          BREAKING_CHANGES=$(jq '.summary.breakingChanges' analysis.json)
          if [ "$BREAKING_CHANGES" -gt 0 ]; then
            echo "::warning::Found $BREAKING_CHANGES breaking change(s)"
            jq '.events[] | select(.severity == "high" or .severity == "critical")' analysis.json
          fi
      
      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const analysis = JSON.parse(fs.readFileSync('analysis.json', 'utf8'));
            
            const comment = `
            ## 🔍 Code Intelligence Analysis
            
            **Summary:**
            - Total Changes: ${analysis.summary.totalChanges}
            - Breaking Changes: ${analysis.summary.breakingChanges}
            - Affected Files: ${analysis.summary.affectedFiles}
            - High Severity Issues: ${analysis.summary.highSeverityIssues}
            
            ${analysis.summary.breakingChanges > 0 ? '⚠️ **Warning:** Breaking changes detected!' : '✅ No breaking changes detected'}
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### Integration with Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$')

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Convert to JSON array
FILES_JSON=$(echo "$STAGED_FILES" | jq -R -s -c 'split("\n")[:-1]')

# Analyze changes
RESPONSE=$(curl -s -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{
    \"repo\": \"local\",
    \"changedFiles\": $FILES_JSON
  }")

# Check for critical issues
CRITICAL_ISSUES=$(echo "$RESPONSE" | jq '.summary.highSeverityIssues')

if [ "$CRITICAL_ISSUES" -gt 0 ]; then
  echo "❌ Critical issues detected in your changes:"
  echo "$RESPONSE" | jq '.events[] | select(.severity == "critical" or .severity == "high")'
  echo ""
  echo "Do you want to continue? (y/n)"
  read -r CONTINUE
  
  if [ "$CONTINUE" != "y" ]; then
    exit 1
  fi
fi

exit 0
```

## 🎯 Advanced Usage

### Custom Event Listeners

```typescript
// custom-listener.ts
import { IntelligenceEngine } from './src/engine/intelligence-engine';
import { IntelligenceEvent } from './src/types';

const engine = new IntelligenceEngine(config);
await engine.initialize();

// Listen for breaking API changes
engine.onEvent('breaking-api-change', async (event: IntelligenceEvent) => {
  console.log('Breaking API change detected!');
  
  // Send Slack notification
  await sendSlackMessage({
    channel: '#engineering-alerts',
    text: `🚨 Breaking API Change Detected`,
    attachments: [{
      color: 'danger',
      fields: [
        {
          title: 'Affected Files',
          value: event.payload.affectedFiles.join('\n'),
        },
        {
          title: 'Severity',
          value: event.severity,
        }
      ]
    }]
  });
  
  // Create Jira ticket
  await createJiraTicket({
    project: 'ENG',
    summary: `Breaking API Change: ${event.source.changedFiles[0]}`,
    description: event.payload.recommendations.join('\n'),
    priority: event.severity === 'critical' ? 'Highest' : 'High',
  });
});

// Listen for dependency risks
engine.onEvent('dependency-risk', async (event: IntelligenceEvent) => {
  if (event.payload.metadata.affectedFilesCount > 20) {
    console.log('High-impact change detected!');
    // Notify team leads
  }
});
```

### Programmatic Usage

```typescript
// analyze-changes.ts
import { IntelligenceEngine } from './src/engine/intelligence-engine';

async function analyzeMyChanges() {
  const engine = new IntelligenceEngine({
    repoPath: '/path/to/repo',
    neo4jUri: 'bolt://localhost:7687',
    neo4jUser: 'neo4j',
    neo4jPassword: 'password',
    postgresConfig: { /* ... */ },
  });

  await engine.initialize();

  const result = await engine.analyze({
    repo: 'my-service',
    changedFiles: [
      'src/api/users.ts',
      'src/models/user.ts',
    ],
  });

  console.log('Analysis Results:');
  console.log(`- Total Changes: ${result.summary.totalChanges}`);
  console.log(`- Breaking Changes: ${result.summary.breakingChanges}`);
  console.log(`- Affected Files: ${result.summary.affectedFiles}`);

  // Process events
  for (const event of result.events) {
    if (event.severity === 'critical') {
      console.error(`CRITICAL: ${event.eventType}`);
      console.error(event.payload.recommendations);
    }
  }

  await engine.shutdown();
}

analyzeMyChanges();
```

## 📝 Best Practices

1. **Run on Every PR**: Integrate with CI/CD to catch issues early
2. **Monitor WebSocket Events**: Set up real-time monitoring for critical changes
3. **Rebuild Graph Periodically**: Run `/api/rebuild-graph` weekly to keep graph fresh
4. **Set Up Alerts**: Configure notifications for high-severity events
5. **Review Circular Dependencies**: Check `/api/circular-dependencies` regularly
6. **Use in Pre-commit Hooks**: Catch issues before they're committed

## 🐛 Troubleshooting

### Engine Won't Start

```bash
# Check Neo4j connection
curl http://localhost:7474

# Check logs
npm run dev
```

### No Dependencies Found

```bash
# Verify REPO_PATH is correct
echo $REPO_PATH

# Rebuild graph
curl -X POST http://localhost:3000/api/rebuild-graph
```

### High Memory Usage

```bash
# Limit file scanning
# Edit src/utils/file-utils.ts to exclude large directories
```

## 🔗 Related Resources

- [Architecture Documentation](./README.md)
- [API Reference](./README.md#-api-endpoints)
- [Contributing Guidelines](./README.md#-contributing)