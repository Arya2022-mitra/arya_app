
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const nodeModulesPath = path.join(projectRoot, 'node_modules');

const resetProject = () => {
  try {
    if (fs.existsSync(nodeModulesPath)) {
      console.log('Removing node_modules...');
      execSync('rm -rf node_modules', { cwd: projectRoot, stdio: 'inherit' });
    }

    console.log('Installing dependencies...');
    execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });

    console.log('Project reset successfully!');
  } catch (error) {
    console.error('Failed to reset project:', error);
    process.exit(1);
  }
};

resetProject();
