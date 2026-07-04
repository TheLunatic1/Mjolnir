import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const engineDir = path.join(rootDir, 'engine');
const destDir = path.join(rootDir, 'apps', 'desktop', 'resources', 'engine');

console.log('==========================================================');
console.log(' * MJOLNIR - Building High-Performance Rust Core Engine');
console.log('==========================================================');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (process.platform === 'win32') {
  console.log('[Windows Detected] Delegating to Visual Studio MSVC build script...');
  const psScript = path.join(__dirname, 'build-engine.ps1');
  execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, { stdio: 'inherit', cwd: rootDir });
} else {
  console.log(`[${process.platform} Detected] Compiling with cargo build --release...`);
  execSync('cargo build --release', { stdio: 'inherit', cwd: engineDir });
  
  const binaryName = 'mjolnir-engine';
  const sourceBinary = path.join(engineDir, 'target', 'release', binaryName);
  const destBinary = path.join(destDir, binaryName);
  
  if (fs.existsSync(sourceBinary)) {
    fs.copyFileSync(sourceBinary, destBinary);
    fs.chmodSync(destBinary, 0o755); // Ensure executable permissions on Unix systems
    console.log(`SUCCESS: Mjolnir Core Engine copied to ${destBinary}`);
  } else {
    console.error(`ERROR: Compiled binary not found at ${sourceBinary}`);
    process.exit(1);
  }
}
console.log('==========================================================');
console.log(' * Rust Engine Build Complete! Ready for Desktop launch.');
console.log('==========================================================');
