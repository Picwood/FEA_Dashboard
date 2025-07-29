import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ChevronLeft, 
  Folder, 
  File, 
  Download, 
  HardDrive, 
  Search,
  Home,
  Calendar,
  FileText,
  Image,
  Video,
  Music,
  Archive
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useToast } from '@/hooks/use-toast';

interface FileItem {
  name: string;
  path: string;
  type: 'directory' | 'file';
  size: number | null;
  modified: string;
  permissions: string;
}

interface DirectoryData {
  success: boolean;
  type: 'directory';
  path: string;
  items: FileItem[];
}

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchDirectory = async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files/browse?path=${encodeURIComponent(path)}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success && data.type === 'directory') {
        setItems(data.items);
        setCurrentPath(data.path);
      } else {
        setError(data.message || 'Failed to load directory');
      }
    } catch (err) {
      console.error('Error fetching directory:', err);
      setError('Failed to connect to file system');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory('');
  }, []);

  const navigateToPath = (path: string) => {
    fetchDirectory(path);
    setSearchTerm('');
  };

  const navigateUp = () => {
    if (currentPath) {
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      navigateToPath(parentPath);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/download?path=${encodeURIComponent(filePath)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download Started",
          description: `Downloading ${fileName}`,
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      toast({
        title: "Download Failed",
        description: `Failed to download ${fileName}`,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (bytes === null) return '-';
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return <Folder className="h-4 w-4 text-blue-500" />;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return <Image className="h-4 w-4 text-green-500" />;
      case 'mp4':
      case 'avi':
      case 'mkv':
      case 'mov':
      case 'wmv':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return <Music className="h-4 w-4 text-pink-500" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <Archive className="h-4 w-4 text-orange-500" />;
      case 'txt':
      case 'md':
      case 'log':
      case 'csv':
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const breadcrumbs = currentPath ? currentPath.split('/').filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <HardDrive className="mr-2 h-5 w-5" />
                File Explorer
              </h2>
              <p className="text-sm text-gray-500 mt-1">Browse NVMe storage (/mnt/nvme)</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToPath('')}
                    disabled={loading}
                  >
                    <Home className="h-4 w-4 mr-1" />
                    Root
                  </Button>
                  
                  {currentPath && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={navigateUp}
                      disabled={loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Up
                    </Button>
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              {/* Breadcrumb */}
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <span>/mnt/nvme</span>
                {breadcrumbs.map((segment, index) => (
                  <React.Fragment key={index}>
                    <span>/</span>
                    <button
                      onClick={() => navigateToPath(breadcrumbs.slice(0, index + 1).join('/'))}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {segment}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </CardHeader>
            
            <CardContent>
              {error && (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">⚠️ Error</div>
                  <p className="text-gray-600">{error}</p>
                  <Button 
                    onClick={() => fetchDirectory(currentPath)} 
                    className="mt-4"
                    variant="outline"
                  >
                    Retry
                  </Button>
                </div>
              )}
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading directory...</p>
                </div>
              ) : filteredItems.length === 0 && !error ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📁</div>
                  <p className="text-gray-600">
                    {searchTerm ? 'No files match your search' : 'Directory is empty'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Modified</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.path} className="hover:bg-gray-50">
                        <TableCell>
                          {getFileIcon(item.name, item.type === 'directory')}
                        </TableCell>
                        <TableCell>
                          {item.type === 'directory' ? (
                            <button
                              onClick={() => navigateToPath(item.path)}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {item.name}
                            </button>
                          ) : (
                            <span className="font-medium">{item.name}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatFileSize(item.size)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(item.modified)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.permissions}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.type === 'file' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadFile(item.path, item.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
} 