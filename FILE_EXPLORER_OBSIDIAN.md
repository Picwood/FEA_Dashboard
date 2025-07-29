# 📁 File Explorer & 📚 Knowledge Base Integration

## Overview
This document covers the implementation of two new major features:
1. **File Explorer** - Browse and download files from the NVMe storage (`/mnt/nvme`)
2. **Obsidian Knowledge Base** - Integrated access to engineering documentation

## 🗂️ File Explorer

### Features
- **Secure File Browsing** - Browse `/mnt/nvme` directory on Raspberry Pi
- **Real-time Search** - Filter files and directories by name
- **File Downloads** - Direct download capabilities for any file
- **Smart Icons** - File type recognition with appropriate icons
- **Breadcrumb Navigation** - Easy navigation through directory structure
- **File Information** - File size, permissions, and modification dates
- **Security** - Path validation prevents access outside allowed directory

### Technical Implementation

#### Backend API Routes
- `GET /api/files/browse?path=<path>` - Browse directory contents
- `GET /api/files/download?path=<path>` - Download specific files

#### Security Features
- **Path Validation** - Ensures all paths stay within `/mnt/nvme`
- **Authentication Required** - All file operations require login
- **Permission Display** - Shows Unix file permissions
- **Safe Downloads** - Secure file serving with proper headers

#### File Type Recognition
- 📁 **Directories** - Blue folder icons, clickable navigation
- 🖼️ **Images** - Green icons for jpg, png, gif, svg, etc.
- 🎥 **Videos** - Purple icons for mp4, avi, mkv, etc.
- 🎵 **Audio** - Pink icons for mp3, wav, flac, etc.
- 📦 **Archives** - Orange icons for zip, rar, 7z, etc.
- 📄 **Text Files** - Gray icons for txt, md, log, csv, etc.
- 📋 **Generic Files** - Default gray file icon

### Usage
1. Click **"File Explorer"** in the sidebar (💾 icon)
2. Browse directories by clicking folder names
3. Use **breadcrumb navigation** to go back to parent directories
4. **Search** for specific files using the search box
5. **Download files** by clicking the download button
6. View **file details** (size, date, permissions) in the table

## 📚 Obsidian Knowledge Base

### Features
- **Embedded Interface** - Full Obsidian web interface within the dashboard
- **Connection Status** - Real-time monitoring of server availability
- **Refresh Controls** - Manual refresh of the embedded content
- **New Tab Option** - Open Obsidian in a separate tab for full-screen use
- **Connection Info** - Clear display of server URL and status

### Technical Implementation

#### Configuration
- **Server URL**: `http://192.168.30.108:3000`
- **Connection Monitoring** - Checks server status every 30 seconds
- **Error Handling** - Graceful fallback when server is unavailable
- **iframe Security** - Proper sandbox settings for embedded content

#### Status Monitoring
- **Online/Offline Badge** - Visual indicator of server connectivity
- **Last Checked Time** - Timestamp of last status check
- **Automatic Retry** - Automatic connection attempts
- **Manual Controls** - Refresh and retry buttons

### Usage
1. Click **"Knowledge Base"** in the sidebar (🗃️ icon)
2. The Obsidian interface loads automatically
3. Monitor **connection status** in the header badge
4. Use **"Refresh"** to reload the content
5. Use **"Open in New Tab"** for full-screen access
6. If connection fails, use **"Retry"** to attempt reconnection

## 🔧 Sidebar Updates

### Removed Features
- **3D Viewer Tab** - Removed as redundant (replaced by Trame viewer in project pages)

### New Features
- **File Explorer** 💾 - Direct access to NVMe storage browsing
- **Knowledge Base** 🗃️ - Quick access to Obsidian documentation

### Icons Used
- 💾 **HardDrive** - File Explorer (represents storage)
- 🗃️ **Database** - Knowledge Base (represents data/documentation)

## 🚀 Installation & Setup

### Prerequisites
1. **NVMe Storage** mounted at `/mnt/nvme` on Raspberry Pi
2. **Obsidian Server** running at `http://192.168.30.108:3000`
3. **File System Access** - Node.js process needs read access to `/mnt/nvme`

### Configuration
No additional configuration required - both features work out of the box once the prerequisites are met.

### Network Requirements
- **File Explorer** - Local file system access (no network required)
- **Knowledge Base** - Network access to `192.168.30.108:3000`

## 🔒 Security Considerations

### File Explorer Security
- **Path Traversal Protection** - Prevents `../` attacks
- **Directory Restriction** - Cannot access files outside `/mnt/nvme`
- **Authentication Required** - All file operations require valid session
- **Read-Only Access** - No file upload, modification, or deletion capabilities

### Obsidian Integration Security
- **iframe Sandboxing** - Restricted iframe permissions
- **CORS Handling** - Proper cross-origin request handling
- **Network Isolation** - Obsidian server on internal network only

## 🐛 Troubleshooting

### File Explorer Issues
- **"Path not found"** - Check if `/mnt/nvme` is properly mounted
- **"Access denied"** - Verify Node.js process has read permissions
- **Empty directory** - May be actually empty or permission issue
- **Download fails** - Check file permissions and disk space

### Obsidian Issues
- **"Cannot connect"** - Verify Obsidian server is running at `192.168.30.108:3000`
- **Blank iframe** - Check network connectivity and CORS settings
- **Constant "Offline"** - May be CORS restrictions (normal for iframe content)
- **Slow loading** - Network latency or server performance issue

### General Issues
- **Sidebar icons missing** - Ensure Lucide React icons are properly imported
- **Routes not working** - Verify routes are properly defined in `App.tsx`
- **Authentication errors** - Check user session and login status

## 🔄 Future Enhancements

### File Explorer
- **File Upload** - Upload files to specific directories
- **File Management** - Create, rename, delete files and folders
- **Preview** - In-browser preview for images, text files, PDFs
- **Bulk Operations** - Select multiple files for batch download
- **Favorites** - Bookmark frequently accessed directories

### Knowledge Base
- **Multiple Sources** - Support for multiple documentation servers
- **Search Integration** - Direct search functionality within the dashboard
- **Offline Mode** - Cached content for when server is unavailable
- **Custom Themes** - Match dashboard styling
- **Deep Linking** - Direct links to specific notes or sections

## 📊 Performance Notes

### File Explorer
- Directory listings are loaded on-demand
- Large directories may take time to load
- File downloads stream directly from server
- Search is client-side filtering (fast for moderate file counts)

### Knowledge Base
- iframe content loads independently
- Connection checks are lightweight
- Automatic refresh prevents stale connections
- Full-screen option for better performance

## 🧪 Testing

### File Explorer Testing
1. Navigate to different directories
2. Search for files with various terms
3. Download different file types
4. Test breadcrumb navigation
5. Verify security (try accessing paths outside `/mnt/nvme`)

### Knowledge Base Testing
1. Check initial connection and loading
2. Test refresh functionality
3. Verify new tab opening
4. Test behavior when server is offline
5. Monitor connection status updates

## 📝 API Documentation

### File Browser API

#### Browse Directory
```
GET /api/files/browse?path=<relative_path>
```
**Response:**
```json
{
  "success": true,
  "type": "directory",
  "path": "relative/path",
  "items": [
    {
      "name": "filename.txt",
      "path": "relative/path/filename.txt", 
      "type": "file",
      "size": 1024,
      "modified": "2024-01-15T10:30:00.000Z",
      "permissions": "644"
    }
  ]
}
```

#### Download File
```
GET /api/files/download?path=<file_path>
```
**Response:** Binary file content with appropriate headers

Both endpoints require authentication and validate paths for security. 