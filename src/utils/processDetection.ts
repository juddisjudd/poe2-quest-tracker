import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export interface ProcessInfo {
  name: string;
  pid: number;
  executablePath: string;
}

/**
 * Finds running processes by name
 */
export async function findProcessByName(processName: string): Promise<ProcessInfo[]> {
  try {
    // Use wmic on Windows to get process info including executable path
    const { stdout } = await execAsync(
      `wmic process where "name='${processName}'" get Name,ProcessId,ExecutablePath /format:csv`
    );
    
    const processes: ProcessInfo[] = [];
    const lines = stdout.trim().split('\n');
    
    // Skip header line and empty lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // CSV format: Node,ExecutablePath,Name,ProcessId
      const parts = line.split(',');
      if (parts.length >= 4) {
        const executablePath = parts[1]?.trim();
        const name = parts[2]?.trim();
        const pidStr = parts[3]?.trim();
        
        if (executablePath && name && pidStr) {
          const pid = parseInt(pidStr, 10);
          if (!isNaN(pid)) {
            processes.push({
              name,
              pid,
              executablePath
            });
          }
        }
      }
    }
    
    return processes;
  } catch (error) {
    console.error('Error finding processes:', error);
    return [];
  }
}

/**
 * Detects Path of Exile 2 log file location by finding the running process
 */
export async function detectPoeLogFile(): Promise<string | null> {
  try {
    // Look for both regular and Steam versions of Path of Exile 2
    const processNames = ['PathOfExile.exe', 'PathOfExileSteam.exe'];
    
    for (const processName of processNames) {
      const processes = await findProcessByName(processName);
      
      if (processes.length > 0) {
        console.log(`Found ${processName} process`);
        
        // Use the first found process
        const process = processes[0];
        const executablePath = process.executablePath;
        
        if (!executablePath || !fs.existsSync(executablePath)) {
          console.log('Executable path not found or invalid:', executablePath);
          continue;
        }
        
        // Derive the game directory from executable path
        // Expected: S:\Grinding Gear Games\Path of Exile 2\PathOfExile.exe
        // Or: Steam version path\PathOfExileSteam.exe
        // Logs dir: game_directory\logs\Client.txt
        const gameDirectory = path.dirname(executablePath);
        const logFilePath = path.join(gameDirectory, 'logs', 'Client.txt');
        
        // Verify the log file exists
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
    console.error('Error detecting POE log file:', error);
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