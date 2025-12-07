import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import find from 'find-process';

export interface ProcessInfo {
  name: string;
  pid: number;
  executablePath: string;
}

/**
 * Returns the current platform
 */
export function getPlatform(): 'windows' | 'linux' | 'mac' | 'unknown' {
  const platform = process.platform;
  if (platform === 'win32') return 'windows';
  if (platform === 'linux') return 'linux';
  if (platform === 'darwin') return 'mac';
  return 'unknown';
}

/**
 * Finds running processes by name using native Node.js (cross-platform)
 * Uses find-process library which doesn't rely on WMI/WMIC on Windows
 */
async function findProcessByNameNative(processName: string): Promise<ProcessInfo[]> {
  try {
    // find-process uses native bindings, not WMIC on Windows
    // This eliminates WMI Provider Host CPU usage
    const processList = await find('name', processName, true); // strict match

    const processes: ProcessInfo[] = processList.map(p => ({
      name: p.name || processName,
      pid: p.pid,
      executablePath: p.bin || '', // Binary path
    }));

    return processes;
  } catch (error) {
    console.error(`Error finding process "${processName}" with native method:`, error);
    return [];
  }
}

/**
 * Finds running processes by name (cross-platform)
 * Now uses native Node.js process checking instead of WMIC/pgrep
 */
export async function findProcessByName(processName: string): Promise<ProcessInfo[]> {
  return findProcessByNameNative(processName);
}

/**
 * Find POE2 process if it's running (cross-platform)
 * Now uses native process checking for all platforms
 */
export async function findPoeProcess(): Promise<ProcessInfo | null> {
  try {
    // Check for both standalone and Steam versions
    const processNames = ['PathOfExile.exe', 'PathOfExileSteam.exe', 'PathOfExile'];

    for (const processName of processNames) {
      const processes = await findProcessByName(processName);
      if (processes.length > 0) {
        return processes[0];
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding POE process:', error);
    return null;
  }
}

/**
 * Get common POE2 installation paths for Linux
 */
function getLinuxPoeLogPaths(): string[] {
  const homeDir = os.homedir();
  
  return [
    // Steam (Proton) - most common
    path.join(homeDir, '.local/share/Steam/steamapps/common/Path of Exile 2/logs/Client.txt'),
    // Steam with different compatdata locations
    path.join(homeDir, '.steam/steam/steamapps/common/Path of Exile 2/logs/Client.txt'),
    // Flatpak Steam
    path.join(homeDir, '.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/common/Path of Exile 2/logs/Client.txt'),
    // Lutris default wine prefix
    path.join(homeDir, 'Games/path-of-exile-2/drive_c/Program Files/Grinding Gear Games/Path of Exile 2/logs/Client.txt'),
    // Alternative Lutris location
    path.join(homeDir, '.wine/drive_c/Program Files/Grinding Gear Games/Path of Exile 2/logs/Client.txt'),
  ];
}

/**
 * Detects Path of Exile 2 log file location (cross-platform)
 */
export async function detectPoeLogFile(): Promise<string | null> {
  const platform = getPlatform();
  
  try {
    if (platform === 'windows') {
      return detectPoeLogFileWindows();
    } else if (platform === 'linux') {
      return detectPoeLogFileLinux();
    }
    
    console.log(`Log file detection not supported on platform: ${platform}`);
    return null;
  } catch (error) {
    console.error('Error detecting POE log file:', error);
    return null;
  }
}

/**
 * Detects POE2 log file on Windows by finding the running process
 * Now uses native process checking instead of WMIC
 */
async function detectPoeLogFileWindows(): Promise<string | null> {
  try {
    const processNames = ['PathOfExile.exe', 'PathOfExileSteam.exe'];

    for (const processName of processNames) {
      const processes = await findProcessByName(processName);

      if (processes.length > 0) {
        console.log(`Found ${processName} process`);

        const process = processes[0];
        const executablePath = process.executablePath;

        if (!executablePath || !fs.existsSync(executablePath)) {
          console.log('Executable path not found or invalid:', executablePath);
          continue;
        }

        const gameDirectory = path.dirname(executablePath);
        const logFilePath = path.join(gameDirectory, 'logs', 'Client.txt');

        if (fs.existsSync(logFilePath)) {
          console.log(`Found POE2 log file for ${processName}:`, logFilePath);
          return logFilePath;
        } else {
          console.log('Log file not found at expected location:', logFilePath);
        }
      }
    }

    console.log('Path of Exile 2 process not found (checked both regular and Steam versions)');
    return null;
  } catch (error) {
    console.error('Error detecting POE log file on Windows:', error);
    return null;
  }
}

/**
 * Detects POE2 log file on Linux
 * First tries to find running process, then checks common installation paths
 */
async function detectPoeLogFileLinux(): Promise<string | null> {
  try {
    // First, try to find from running process
    const poeProcess = await findPoeProcess();
    if (poeProcess && poeProcess.executablePath) {
      const gameDirectory = path.dirname(poeProcess.executablePath);
      const logFilePath = path.join(gameDirectory, 'logs', 'Client.txt');
      
      if (fs.existsSync(logFilePath)) {
        console.log('Found POE2 log file from running process:', logFilePath);
        return logFilePath;
      }
    }
    
    // If process not running, check common installation paths
    console.log('POE2 process not running, checking common Linux installation paths...');
    const commonPaths = getLinuxPoeLogPaths();
    
    for (const logPath of commonPaths) {
      if (fs.existsSync(logPath)) {
        console.log('Found POE2 log file at common path:', logPath);
        return logPath;
      }
    }
    
    console.log('Could not find POE2 log file in common Linux locations');
    return null;
  } catch (error) {
    console.error('Error detecting POE log file on Linux:', error);
    return null;
  }
}

/**
 * Checks if a file exists at the given path
 */
export async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
}