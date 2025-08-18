import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

interface TrameInstance {
  process: ChildProcess;
  port: number;
  jobId: string;
  status: 'starting' | 'running' | 'error' | 'stopped';
}

class PythonTrameService {
  private instances: Map<string, TrameInstance> = new Map();
  private portCounter = 8080;

  async startViewer(jobId: string): Promise<{ port: number; url: string } | null> {
    // Check if instance already exists
    if (this.instances.has(jobId)) {
      const instance = this.instances.get(jobId)!;
      if (instance.status === 'running') {
        return {
          port: instance.port,
          url: `http://localhost:${instance.port}`
        };
      }
    }

    const port = this.getNextPort();
    const pythonPath = path.join(process.cwd(), 'python', 'fea_viewer.py');
    
    // Check if Python script exists
    if (!fs.existsSync(pythonPath)) {
      console.error(`Python script not found: ${pythonPath}`);
      return null;
    }

    // Check if job directory exists
    const jobPath = path.join(process.cwd(), 'data', 'files', jobId);
    if (!fs.existsSync(jobPath)) {
      console.error(`Job directory not found: ${jobPath}`);
      return null;
    }

    // Try to find Python executable
    let pythonExecutable = 'python';
    const possiblePythonPaths = [
      'python',
      'python3',
      path.join(process.cwd(), 'python'), // Virtual environment symlink
      path.join(process.cwd(), 'venv', 'bin', 'python'), // Virtual environment (Unix)
      path.join(process.cwd(), 'venv', 'Scripts', 'python.exe'), // Virtual environment (Windows)
      '/usr/bin/python3',
      '/usr/local/bin/python3',
      'C:\\Python39\\python.exe', // Common Windows Python installation paths
      'C:\\Python38\\python.exe',
      'C:\\Python37\\python.exe'
    ];

    let foundPython = false;
    
    // First try to find Python in specific paths
    for (const possiblePath of possiblePythonPaths) {
      try {
        // Skip paths that don't exist
        if (possiblePath.startsWith('/') || possiblePath.startsWith('C:\\')) {
          // These are absolute paths, check if they exist
          if (!fs.existsSync(possiblePath)) {
            continue;
          }
        }
        
        const { execSync } = require('child_process');
        execSync(`${possiblePath} --version`, { stdio: 'ignore' });
        pythonExecutable = possiblePath;
        console.log(`Using Python executable: ${pythonExecutable}`);
        foundPython = true;
        break;
      } catch (error) {
        // Continue to next option
      }
    }

    // If we didn't find Python in the specific paths, try the system Python
    if (!foundPython) {
      try {
        const { execSync } = require('child_process');
        execSync('python --version', { stdio: 'ignore' });
        pythonExecutable = 'python';
        console.log(`Using system Python executable: ${pythonExecutable}`);
        foundPython = true;
      } catch (error) {
        try {
          // Try python3 as well
          const { execSync } = require('child_process');
          execSync('python3 --version', { stdio: 'ignore' });
          pythonExecutable = 'python3';
          console.log(`Using system Python executable: ${pythonExecutable}`);
          foundPython = true;
        } catch (error) {
          console.error('No Python executable found. Please install Python and required dependencies.');
          return null;
        }
      }
    }

    if (!foundPython) {
      console.error('No Python executable found. Please install Python and required dependencies.');
      return null;
    }

    try {
      const childProcess = spawn(pythonExecutable, [pythonPath, '--job-id', jobId, '--port', port.toString()], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const instance: TrameInstance = {
        process: childProcess,
        port,
        jobId,
        status: 'starting'
      };

      this.instances.set(jobId, instance);

      // Handle process events
      childProcess.stdout?.on('data', (data: Buffer) => {
        console.log(`Trame[${jobId}]: ${data}`);
        if (data.toString().includes('Server started')) {
          instance.status = 'running';
        }
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        console.error(`Trame[${jobId}] Error: ${data}`);
        instance.status = 'error';
      });

      childProcess.on('close', (code: number | null) => {
        console.log(`Trame[${jobId}] exited with code ${code}`);
        instance.status = 'stopped';
        this.instances.delete(jobId);
      });

      childProcess.on('error', (err: Error) => {
        console.error(`Failed to start Trame viewer for job ${jobId}:`, err);
        instance.status = 'error';
        this.instances.delete(jobId);
      });

      // Wait a moment for the server to start
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (instance.status === 'running' || instance.status === 'starting') {
        return {
          port,
          url: `http://localhost:${port}`
        };
      }

      return null;

    } catch (error) {
      console.error(`Error starting Trame viewer for job ${jobId}:`, error);
      return null;
    }
  }

  async stopViewer(jobId: string): Promise<boolean> {
    const instance = this.instances.get(jobId);
    if (!instance) {
      return false;
    }

    try {
      instance.process.kill('SIGTERM');
      this.instances.delete(jobId);
      return true;
    } catch (error) {
      console.error(`Error stopping Trame viewer for job ${jobId}:`, error);
      return false;
    }
  }

  async getViewerStatus(jobId: string): Promise<{ status: string; port?: number; url?: string } | null> {
    const instance = this.instances.get(jobId);
    if (!instance) {
      return null;
    }

    // If status shows running, do a health check to verify the server is actually alive
    if (instance.status === 'running') {
      const isAlive = await this.healthCheck(instance.port);
      if (!isAlive) {
        console.log(`Trame[${jobId}] health check failed, marking as stopped`);
        instance.status = 'stopped';
        this.instances.delete(jobId);
        return { status: 'stopped' };
      }
    }

    return {
      status: instance.status,
      port: instance.port,
      url: instance.status === 'running' ? `http://localhost:${instance.port}` : undefined
    };
  }

  private async healthCheck(port: number): Promise<boolean> {
    try {
      // Try to fetch from the Trame server with timeout
      const response = await fetch(`http://localhost:${port}`, {
        signal: AbortSignal.timeout(2000)
      });
      return response.ok;
    } catch (error) {
      // If fetch fails, server is not responding
      return false;
    }
  }

  listActiveViewers(): Array<{ jobId: string; port: number; status: string }> {
    return Array.from(this.instances.values()).map(instance => ({
      jobId: instance.jobId,
      port: instance.port,
      status: instance.status
    }));
  }

  private getNextPort(): number {
    return this.portCounter++;
  }

  async cleanup(): Promise<void> {
    const promises = Array.from(this.instances.keys()).map(jobId => this.stopViewer(jobId));
    await Promise.all(promises);
  }
}

export const pythonTrameService = new PythonTrameService();

// Cleanup on process exit
process.on('SIGINT', async () => {
  console.log('Cleaning up Python Trame instances...');
  await pythonTrameService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Cleaning up Python Trame instances...');
  await pythonTrameService.cleanup();
  process.exit(0);
});
