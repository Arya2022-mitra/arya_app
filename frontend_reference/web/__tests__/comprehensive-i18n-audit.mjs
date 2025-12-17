#!/usr/bin/env node
/**
 * Comprehensive i18n Audit Script
 * 
 * This script analyzes ALL components, hooks, and files for i18n implementation.
 * It checks for:
 * 1. Hardcoded English strings
 * 2. Missing useTranslation() imports
 * 3. CSS files with hardcoded content
 * 4. API calls without locale parameter
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n=== Comprehensive i18n Audit ===\n');

const issues = {
  hardcodedStrings: [],
  missingTranslation: [],
  cssHardcoded: [],
  apiWithoutLocale: [],
  suggestions: []
};

// Patterns to detect hardcoded English strings
const hardcodedPatterns = [
  { pattern: />\s*[A-Z][a-z]{2,}[^<]*</g, name: 'Text in JSX', severity: 'high' },
  { pattern: /placeholder=["'][A-Z][^"']*["']/g, name: 'Placeholder text', severity: 'high' },
  { pattern: /title=["'][A-Z][^"']*["']/g, name: 'Title attribute', severity: 'medium' },
  { pattern: /aria-label=["'][A-Z][^"']*["']/g, name: 'ARIA label', severity: 'medium' },
  { pattern: /alt=["'][A-Z][^"']*["']/g, name: 'Alt text', severity: 'medium' },
  { pattern: /const\s+\w+\s*=\s*["'][A-Z][a-z]{4,}[^"']*["']/g, name: 'String constant', severity: 'low' }
];

// API patterns without locale
const apiPatterns = [
  { pattern: /fetch\([^)]*api[^)]*\)/gi, checkLocale: true },
  { pattern: /axios\.(get|post|put|delete)\([^)]*\)/gi, checkLocale: true }
];

function analyzeFile(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath);
  
  const fileIssues = {
    path: relativePath,
    hardcoded: [],
    missingTranslation: false,
    apiIssues: [],
    cssContent: []
  };

  if (ext === '.tsx' || ext === '.ts') {
    // Check if file uses translation
    const usesTranslation = 
      content.includes('useTranslation') || 
      content.includes('{ t }') ||
      content.includes('import { t }') ||
      content.includes('i18n.t(');

    // Check for hardcoded patterns
    hardcodedPatterns.forEach(({ pattern, name, severity }) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        // Filter out common false positives
        const filtered = matches.filter(m => {
          // Skip if it's in a comment
          if (m.includes('//') || m.includes('/*')) return false;
          // Skip if it's a variable name or function name
          if (m.match(/^[a-z]/)) return false;
          // Skip common single words that are likely not user-facing text
          if (m.match(/^(Loading|Error|Success|Warning|Info|Debug|True|False|None|Null)$/i)) return false;
          return true;
        });
        
        if (filtered.length > 0 && !usesTranslation) {
          fileIssues.hardcoded.push({
            type: name,
            severity,
            count: filtered.length,
            samples: filtered.slice(0, 3)
          });
        }
      }
    });

    // Check for API calls without locale
    if (content.includes('fetch(') || content.includes('axios')) {
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('fetch(') || line.includes('axios.')) {
          // Check if locale or i18n.language is mentioned nearby (within 5 lines)
          const context = lines.slice(Math.max(0, idx - 2), idx + 3).join('\n');
          if (!context.includes('locale') && !context.includes('i18n.language')) {
            fileIssues.apiIssues.push({
              line: idx + 1,
              code: line.trim().slice(0, 80)
            });
          }
        }
      });
    }

    if (!usesTranslation && fileIssues.hardcoded.length > 0) {
      fileIssues.missingTranslation = true;
    }
  } else if (ext === '.css') {
    // Check CSS for content properties
    const contentMatches = content.match(/content:\s*["'][^"']*["']/g);
    if (contentMatches) {
      contentMatches.forEach(match => {
        // Check if it's actual text (not empty, not symbols only)
        if (match.match(/content:\s*["'][A-Za-z]{2,}[^"']*["']/)) {
          fileIssues.cssContent.push(match);
        }
      });
    }
  }

  return fileIssues;
}

function scanDirectory(dir, baseDir = dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    // Skip node_modules, .next, and other build directories
    if (entry.name === 'node_modules' || 
        entry.name === '.next' || 
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      results.push(...scanDirectory(fullPath, baseDir));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (['.tsx', '.ts', '.css'].includes(ext)) {
        const analysis = analyzeFile(fullPath, relativePath);
        if (analysis.hardcoded.length > 0 || 
            analysis.apiIssues.length > 0 || 
            analysis.cssContent.length > 0 ||
            analysis.missingTranslation) {
          results.push(analysis);
        }
      }
    }
  }

  return results;
}

// Scan directories
const webDir = path.join(__dirname, '..');
const dirsToScan = [
  'pages',
  'components',
  'hooks',
  'lib',
  'styles',
  'shared'
];

console.log('📁 Scanning directories...\n');

const allResults = [];
for (const dir of dirsToScan) {
  const fullPath = path.join(webDir, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Scanning ${dir}/...`);
    const results = scanDirectory(fullPath, webDir);
    allResults.push(...results);
  }
}

console.log('\n=== Analysis Results ===\n');

// Group results
const filesWithHardcodedStrings = allResults.filter(r => r.hardcoded.length > 0);
const filesWithoutTranslation = allResults.filter(r => r.missingTranslation);
const filesWithApiIssues = allResults.filter(r => r.apiIssues.length > 0);
const filesWithCssContent = allResults.filter(r => r.cssContent.length > 0);

console.log(`📊 Summary:`);
console.log(`  Total files analyzed: ${allResults.length}`);
console.log(`  Files with hardcoded strings: ${filesWithHardcodedStrings.length}`);
console.log(`  Files missing translation: ${filesWithoutTranslation.length}`);
console.log(`  Files with API issues: ${filesWithApiIssues.length}`);
console.log(`  CSS files with content: ${filesWithCssContent.length}`);
console.log('');

// Detailed reports
if (filesWithHardcodedStrings.length > 0) {
  console.log('🔴 Files with Hardcoded Strings:\n');
  filesWithHardcodedStrings.forEach(file => {
    console.log(`  ${file.path}`);
    file.hardcoded.forEach(issue => {
      console.log(`    - ${issue.type} (${issue.severity}): ${issue.count} occurrences`);
      if (issue.samples.length > 0) {
        console.log(`      Samples: ${issue.samples.slice(0, 2).join(', ')}`);
      }
    });
  });
  console.log('');
}

if (filesWithoutTranslation.length > 0) {
  console.log('⚠️  Files Missing Translation Hook:\n');
  filesWithoutTranslation.slice(0, 20).forEach(file => {
    console.log(`  ${file.path}`);
  });
  if (filesWithoutTranslation.length > 20) {
    console.log(`  ... and ${filesWithoutTranslation.length - 20} more`);
  }
  console.log('');
}

if (filesWithApiIssues.length > 0) {
  console.log('🔶 API Calls Potentially Missing Locale Parameter:\n');
  filesWithApiIssues.slice(0, 10).forEach(file => {
    console.log(`  ${file.path}`);
    file.apiIssues.slice(0, 3).forEach(issue => {
      console.log(`    Line ${issue.line}: ${issue.code}...`);
    });
  });
  if (filesWithApiIssues.length > 10) {
    console.log(`  ... and ${filesWithApiIssues.length - 10} more files`);
  }
  console.log('');
}

if (filesWithCssContent.length > 0) {
  console.log('🎨 CSS Files with Content Properties:\n');
  filesWithCssContent.forEach(file => {
    console.log(`  ${file.path}`);
    file.cssContent.forEach(content => {
      console.log(`    - ${content}`);
    });
  });
  console.log('');
}

// Recommendations
console.log('💡 Recommendations:\n');

if (filesWithHardcodedStrings.length > 0) {
  console.log(`1. HIGH PRIORITY: Fix ${filesWithHardcodedStrings.length} files with hardcoded strings`);
  console.log('   - Add useTranslation() hook');
  console.log('   - Replace hardcoded strings with t() calls');
  console.log('   - Add corresponding keys to translation JSON files');
}

if (filesWithApiIssues.length > 0) {
  console.log(`2. MEDIUM PRIORITY: Review ${filesWithApiIssues.length} API calls for locale parameter`);
  console.log('   - Add i18n.language to API query parameters');
  console.log('   - Ensure backend endpoints accept locale parameter');
}

if (filesWithCssContent.length > 0) {
  console.log(`3. LOW PRIORITY: Review ${filesWithCssContent.length} CSS files with content properties`);
  console.log('   - Consider if these need translation');
  console.log('   - Use data attributes for translatable content');
}

console.log('\n=== End of Audit ===\n');

// Exit with code 1 if there are high-priority issues
if (filesWithHardcodedStrings.length > 10 || filesWithoutTranslation.length > 10) {
  process.exit(1);
}
