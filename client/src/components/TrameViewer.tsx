import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Play, Square, ExternalLink, RefreshCw } from 'lucide-react';

interface TrameViewerProps {
  jobId: string;
  className?: string;
}

interface ViewerStatus {
  status: string;
  port?: number;
  url?: string;
}

export function TrameViewer({ jobId, className = '' }: TrameViewerProps) {
  const [viewerStatus, setViewerStatus] = useState<ViewerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkViewerStatus = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/viewer-status`);
      const data = await response.json();
      
      if (data.success) {
        setViewerStatus({
          status: data.status,
          port: data.port,
          url: data.url
        });
      } else {
        setViewerStatus({ status: 'not-running' });
      }
      setError(null);
    } catch (err) {
      console.error('Error checking viewer status:', err);
      setError('Failed to check viewer status');
    }
  };

  const startViewer = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/jobs/${jobId}/start-viewer`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setViewerStatus({
          status: 'running',
          port: data.port,
          url: data.url
        });
      } else {
        setError(data.message || 'Failed to start viewer');
      }
    } catch (err) {
      console.error('Error starting viewer:', err);
      setError('Failed to start viewer');
    } finally {
      setIsLoading(false);
    }
  };

  const stopViewer = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/jobs/${jobId}/stop-viewer`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setViewerStatus({ status: 'not-running' });
      } else {
        setError(data.message || 'Failed to stop viewer');
      }
    } catch (err) {
      console.error('Error stopping viewer:', err);
      setError('Failed to stop viewer');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkViewerStatus();
    
    // Dynamic polling: faster when viewer is running, slower when stopped
    const getPollingInterval = () => {
      if (!viewerStatus) return 3000; // Check every 3s when unknown
      switch (viewerStatus.status) {
        case 'running':
          return 2000; // Check every 2s when running (faster detection of closure)
        case 'starting':
          return 1000; // Check every 1s when starting
        case 'error':
        case 'stopped':
        case 'not-running':
          return 10000; // Check every 10s when stopped (slower polling)
        default:
          return 5000; // Default fallback
      }
    };

    const scheduleNextCheck = () => {
      const interval = getPollingInterval();
      return setTimeout(() => {
        checkViewerStatus().then(() => {
          // Schedule the next check after this one completes
          scheduleNextCheck();
        });
      }, interval);
    };

    const timeoutId = scheduleNextCheck();
    
    return () => clearTimeout(timeoutId);
  }, [jobId, viewerStatus?.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'starting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'stopped':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'starting':
        return 'Starting';
      case 'error':
        return 'Error';
      case 'stopped':
        return 'Stopped';
      case 'not-running':
        return 'Not Running';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>FEA 3D Viewer (Trame)</span>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(viewerStatus?.status || 'not-running')}>
                {getStatusText(viewerStatus?.status || 'not-running')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={checkViewerStatus}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {viewerStatus?.status === 'running' ? (
              <>
                <Button
                  variant="destructive"
                  onClick={stopViewer}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Square className="mr-2 h-4 w-4" />
                  )}
                  Stop Viewer
                </Button>
                {viewerStatus.url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(viewerStatus.url, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={startViewer}
                disabled={isLoading || viewerStatus?.status === 'starting'}
              >
                {isLoading || viewerStatus?.status === 'starting' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Start Viewer
              </Button>
            )}
          </div>

          {viewerStatus?.status === 'running' && viewerStatus.url && (
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={viewerStatus.url}
                className="w-full h-96 border-0"
                title={`FEA Viewer - Job ${jobId}`}
                allow="fullscreen"
                onError={() => {
                  console.log('Iframe failed to load, checking status...');
                  checkViewerStatus();
                }}
                onLoad={(e) => {
                  // Check if iframe loaded successfully
                  const iframe = e.target as HTMLIFrameElement;
                  try {
                    if (iframe.contentWindow) {
                      // iframe loaded successfully
                      console.log('Trame viewer loaded successfully');
                    }
                  } catch (error) {
                    // If we can't access iframe content, it might be a CORS issue (which is normal)
                    // But we can still assume it loaded if no error was thrown
                  }
                }}
              />
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Job ID:</strong> {jobId}
            </p>
            {viewerStatus?.port && (
              <p>
                <strong>Port:</strong> {viewerStatus.port}
              </p>
            )}
            <p className="mt-2">
              This viewer loads VTK files or FEA mesh files and provides advanced 3D visualization
              with component selection and custom color mapping.
            </p>
            <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800">
              <p className="font-medium">🎛️ Advanced Controls:</p>
              <ul className="text-xs mt-1 space-y-1">
                <li>• <strong>Data Array</strong>: Select displacement, stress, pressure, etc.</li>
                <li>• <strong>Component</strong>: Choose X, Y, Z components or Magnitude</li>
                <li>• <strong>Color Range</strong>: Adjust min/max for color mapping</li>
                <li>• <strong>Threshold</strong>: Filter data visibility range</li>
              </ul>
            </div>
            <div className="mt-2 p-2 bg-green-50 rounded text-green-800">
              <p className="font-medium">🎨 Color Mapping:</p>
              <ul className="text-xs mt-1 space-y-1">
                <li>• Values below color range → <span className="text-blue-900 font-bold">Dark Blue</span></li>
                <li>• Values within range → Normal color scale (blue to red)</li>
                <li>• Values above color range → <span className="text-red-900 font-bold">Dark Red</span></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 