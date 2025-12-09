import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ProcessInfo {
  name: string;
  pid: number;
  executablePath: string;
}

export function getPlatform(): 'windows' | 'linux' | 'mac' | 'unknown' {
  const platform = process.platform;
  if (platform === 'win32') return 'windows';
  if (platform === 'linux') return 'linux';
  if (platform === 'darwin') return 'mac';
  return 'unknown';
}

async function findProcessByNameWindows(processName: string): Promise<ProcessInfo[]> {
  try {
    const { stdout } = await execAsync(
      `tasklist /NH /FO CSV /FI "IMAGENAME eq ${processName}"`,
      { windowsHide: true }
    );

    const processes: ProcessInfo[] = [];
    const lines = stdout.trim().split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      const match = line.match(/"([^"]+)","([^"]+)"/);
      if (match) {
        const name = match[1];
        const pid = parseInt(match[2], 10);

        if (!isNaN(pid)) {
          processes.push({
            name,
            pid,
            executablePath: '',
          });
        }
      }
    }

    return processes;
  } catch (error) {
    if ((error as any).code === 1) {
      return [];
    }
    console.error(`Error finding process "${processName}" with tasklist:`, error);
    return [];
  }
}

async function findProcessByNameLinux(processName: string): Promise<ProcessInfo[]> {
  try {
    const { stdout } = await execAsync(`ps aux | grep "${processName}" | grep -v grep`);
    const processes: ProcessInfo[] = [];
    const lines = stdout.trim().split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.trim().split(/\s+/);
      if (parts.length >= 11) {
        const pid = parseInt(parts[1], 10);
        if (!isNaN(pid)) {
          processes.push({
            name: processName,
            pid,
            executablePath: parts[10] || '',
          });
        }
      }
    }

    return processes;
  } catch (error) {
    if ((error as any).code === 1) {
      return [];
    }
    console.error(`Error finding process "${processName}" with ps:`, error);
    return [];
  }
}

async function findProcessByNameMac(processName: string): Promise<ProcessInfo[]> {
  try {
    const { stdout } = await execAsync(`ps ax -o pid,comm | grep "${processName}" | grep -v grep`);
    const processes: ProcessInfo[] = [];
    const lines = stdout.trim().split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const pid = parseInt(parts[0], 10);
        if (!isNaN(pid)) {
          processes.push({
            name: processName,
            pid,
            executablePath: parts[1] || '',
          });
        }
      }
    }

    return processes;
  } catch (error) {
    if ((error as any).code === 1) {
      return [];
    }
    console.error(`Error finding process "${processName}" with ps:`, error);
    return [];
  }
}

export async function findProcessByName(processName: string): Promise<ProcessInfo[]> {
  const platform = getPlatform();

  switch (platform) {
    case 'windows':
      return findProcessByNameWindows(processName);
    case 'linux':
      return findProcessByNameLinux(processName);
    case 'mac':
      return findProcessByNameMac(processName);
    default:
      console.warn(`Process detection not supported on platform: ${platform}`);
      return [];
  }
}

/**
 * Find POE2 process if running (used for polling every 10s)
 * Uses fast native commands - no PowerShell, no WMIC
 */
export async function findPoeProcess(): Promise<ProcessInfo | null> {
  try {
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

function getLinuxPoeLogPaths(): string[] {
  const homeDir = os.homedir();

  return [
    path.join(homeDir, '.local/share/Steam/steamapps/common/Path of Exile 2/logs/Client.txt'),
    path.join(homeDir, '.steam/steam/steamapps/common/Path of Exile 2/logs/Client.txt'),
    path.join(homeDir, '.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/common/Path of Exile 2/logs/Client.txt'),
    path.join(homeDir, 'Games/path-of-exile-2/drive_c/Program Files/Grinding Gear Games/Path of Exile 2/logs/Client.txt'),
    path.join(homeDir, '.wine/drive_c/Program Files/Grinding Gear Games/Path of Exile 2/logs/Client.txt'),
  ];
}

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
 * WARNING: Uses WMIC (high CPU) - ONLY for one-time log detection
 * NEVER call during polling
 */
async function getProcessExecutablePath(processName: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      `wmic process where "name='${processName}'" get ExecutablePath /format:list`,
      { windowsHide: true }
    );

    const match = stdout.match(/ExecutablePath=(.+)/);
    if (match && match[1]) {
      return match[1].trim();
    }

    return null;
  } catch (error) {
    console.error(`Error getting executable path for ${processName}:`, error);
    return null;
  }
}

async function detectPoeLogFileWindows(): Promise<string | null> {
  try {
    const processNames = ['PathOfExile.exe', 'PathOfExileSteam.exe'];

    for (const processName of processNames) {
      const processes = await findProcessByName(processName);

      if (processes.length > 0) {
        console.log(`Found ${processName} process`);

        const executablePath = await getProcessExecutablePath(processName);

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

    console.log('Path of Exile 2 process not found');
    return null;
  } catch (error) {
    console.error('Error detecting POE log file on Windows:', error);
    return null;
  }
}

async function detectPoeLogFileLinux(): Promise<string | null> {
  try {
    const poeProcess = await findPoeProcess();
    if (poeProcess && poeProcess.executablePath) {
      const gameDirectory = path.dirname(poeProcess.executablePath);
      const logFilePath = path.join(gameDirectory, 'logs', 'Client.txt');

      if (fs.existsSync(logFilePath)) {
        console.log('Found POE2 log file from running process:', logFilePath);
        return logFilePath;
      }
    }

    console.log('Checking common Linux installation paths...');
    const commonPaths = getLinuxPoeLogPaths();

    for (const logPath of commonPaths) {
      if (fs.existsSync(logPath)) {
        console.log('Found POE2 log file at common path:', logPath);
        return logPath;
      }
    }

    console.log('Could not find POE2 log file');
    return null;
  } catch (error) {
    console.error('Error detecting POE log file on Linux:', error);
    return null;
  }
}

export async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
}