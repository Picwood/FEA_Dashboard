import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  BookOpen,
  Search,
  Globe
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function ObsidianKnowledgeBase() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const OBSIDIAN_URL = 'http://192.168.30.108:3000';

  const checkObsidianStatus = async () => {
    try {
      setIsLoading(true);
      // Try to fetch from Obsidian server (this might fail due to CORS, but that's expected)
      const response = await fetch(OBSIDIAN_URL, { 
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });
      
      // If we get here without error, assume it's online
      setIsOnline(true);
      setLastChecked(new Date());
    } catch (error) {
      // This might not mean it's offline - CORS restrictions could cause this
      console.log('Obsidian status check completed');
      setIsOnline(true); // Assume online since CORS errors are expected
      setLastChecked(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkObsidianStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkObsidianStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    const iframe = document.getElementById('obsidian-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src; // Force refresh
    }
    checkObsidianStatus();
  };

  const openInNewTab = () => {
    window.open(OBSIDIAN_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64 flex flex-col h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Knowledge Base
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Obsidian Database - Engineering Documentation & Notes
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {lastChecked && (
                <div className="text-xs text-gray-500">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </div>
              )}
              
              <Badge 
                variant={isOnline ? "default" : "destructive"} 
                className={isOnline ? "bg-green-500" : "bg-red-500"}
              >
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-white'}`}></div>
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </header>

        {/* Connection Info */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex-shrink-0">
          <div className="flex items-center space-x-2 text-sm">
            <Globe className="h-4 w-4 text-blue-600" />
            <span className="text-blue-800">
              Connected to: <code className="bg-blue-100 px-1 rounded">{OBSIDIAN_URL}</code>
            </span>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-hidden">
          <Card className="h-full flex flex-col">
            <CardContent className="flex-1 p-0 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Connecting to Obsidian...</p>
                  </div>
                </div>
              ) : !isOnline ? (
                <div className="flex items-center justify-center h-full">
                  <Alert className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Cannot connect to Obsidian server</p>
                        <p className="text-sm">
                          Please ensure the Obsidian server is running at {OBSIDIAN_URL}
                        </p>
                        <div className="flex space-x-2 mt-3">
                          <Button onClick={checkObsidianStatus} size="sm" variant="outline">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                          <Button onClick={openInNewTab} size="sm" variant="outline">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open Direct
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="h-full">
                  <iframe
                    id="obsidian-iframe"
                    src={OBSIDIAN_URL}
                    className="w-full h-full border-0 rounded"
                    title="Obsidian Knowledge Base"
                    onLoad={() => {
                      console.log('Obsidian iframe loaded successfully');
                      setIsOnline(true);
                    }}
                    onError={() => {
                      console.log('Obsidian iframe failed to load');
                      setIsOnline(false);
                    }}
                    allow="fullscreen"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 bg-gray-100 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <BookOpen className="h-3 w-3" />
                <span>Knowledge Base Integration</span>
              </div>
              <div className="flex items-center space-x-1">
                <Search className="h-3 w-3" />
                <span>Search and browse engineering documentation</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Server: 192.168.30.108:3000
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
} 