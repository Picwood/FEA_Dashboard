# FEA Trame 3D Viewer Integration

This integration adds Python-based 3D visualization capabilities to your FEA Dashboard using Trame/VTK.

## Features

- **Interactive 3D FEA visualization** using Python VTK/Trame
- **Advanced component selection** - X, Y, Z components or magnitude for vector fields
- **Custom color mapping** with range control and clamping
- **Multiple data array support** - Switch between displacement, stress, and other fields
- **Real-time thresholding** for data visibility filtering
- **Smart array detection** - Automatically finds all available data arrays and components
- **Enhanced color control** - Dark blue/red clamping for out-of-range values
- **Dialog-based viewer** accessible from project pages
- **File format support** for VTK files (.vtk, .vtp) and FEA text files

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd python
pip install -r requirements.txt
```

### 2. Verify Python Installation

Make sure Python is available in your system PATH and can run the trame script:

```bash
python python/fea_viewer.py --help
```

### 3. Test VTK File Loading

Use the test scripts to verify your VTK files can be loaded:

**Full test (all components):**
```bash
python python/test_vtk_viewer.py "C:\Users\fvazeille\Desktop\502044_FEMCARGO\TEST_STATIC_COMPLETE_CARGO2.4.vtk"
```

**Array detection test (faster):**
```bash
python python/test_array_detection.py "C:\Users\fvazeille\Desktop\502044_FEMCARGO\TEST_STATIC_COMPLETE_CARGO2.4.vtk"
```

**Enhanced features demo:**
```bash
python python/demo_enhanced_viewer.py "C:\Users\fvazeille\Desktop\502044_FEMCARGO\TEST_STATIC_COMPLETE_CARGO2.4.vtk"
```

**Single component array test:**
```bash
python python/test_single_component.py "C:\Users\fvazeille\Desktop\502044_FEMCARGO\TEST_STATIC_COMPLETE_CARGO2.4.vtk"
```

### 4. Test the Integration

1. **Create a new job** in the FEA Dashboard
2. **Upload VTK files** or FEA text files:
   - **Option A: VTK Files** (Recommended)
     - `VTK File (.vtk/.vtp)` - Complete simulation results
   - **Option B: FEA Text Files**
     - `FEA Nodes (.txt)` - Node coordinates file
     - `FEA Elements (.txt)` - Element connectivity file  
     - `FEA Field Data (.txt)` - Field values for visualization (optional)

3. **Open the project page** and click **"3D View"** for the job
4. **Click "Start Viewer"** to launch the Python Trame service
5. **View the 3D visualization** in the dialog

## File Format Requirements

### Nodes File (.txt)
```
4 nodes
1  0.0  0.0  0.0
2  1.0  0.0  0.0  
3  1.0  1.0  0.0
4  0.0  1.0  0.0
```

### Elements File (.txt)
```
2 elements
1  Quad4  1  2  3  4
2  Tri3   1  2  4
```

### Field Data File (.txt) - Optional
```
2 field values
1  125.5
2  98.3
```

## Supported Element Types

- **Tet4** - 4-node tetrahedron
- **Tet10** - 10-node quadratic tetrahedron
- **Hex8** - 8-node hexahedron
- **Hex20** - 20-node quadratic hexahedron
- **Tri3** - 3-node triangle
- **Tri6** - 6-node quadratic triangle
- **Quad4** - 4-node quadrilateral
- **Quad8** - 8-node quadratic quadrilateral
- **Wed15** - 15-node quadratic wedge

## Usage

1. **Start Viewer**: Launches a Python Trame instance for the job
2. **Data Array Selection**: Use dropdown in the toolbar to switch between displacement, stress, etc.
3. **Component Selection**: Choose X, Y, Z components or magnitude for multi-component arrays (toolbar)
4. **Open Controls**: Click the **☰ menu button** in the top-left to open the sidebar
5. **Adjust Settings**: 
   - Use the blue slider for color mapping range
   - Use the green slider for visibility threshold
   - Use the orange button to reset camera view
6. **Close Controls**: Click the **✕** button in the sidebar header to close it
7. **3D Interaction**: With sidebar closed, rotate, zoom, and pan the mesh in the main view
8. **Stop Viewer**: Terminates the Python process

**💡 Important**: Close the sidebar to enable full 3D interaction with the mesh!

### Advanced Visualization Controls

#### Data Array & Component Selection
- **Data Array dropdown**: Switch between different fields (displacement, stress, pressure, etc.)
- **Component dropdown**: For multi-component arrays, select:
  - **Magnitude**: Combined magnitude of all components
  - **X, Y, Z**: Individual vector components
  - **XX, YY, ZZ, XY, etc.**: Tensor components
- **Location info**: Shows whether data is on cells or points
- **Auto-detection**: Automatically finds all available arrays and components

#### Color Mapping Controls (Blue Card in Sidebar)
- **Access**: Click the ☰ menu button to open the sidebar controls
- **Color Range Slider**: Set min/max values for color scale (blue slider in sidebar)
- **Custom Clamping**: 
  - Values below range → **Dark Blue**
  - Values within range → Normal color scale (blue to red)
  - Values above range → **Dark Red**
- **Independent of threshold**: Color and visibility are controlled separately

#### Threshold Controls (Green Card in Sidebar)
- **Access**: Located in the sidebar below the color controls
- **Visibility Filter**: Hide data outside threshold range (green slider in sidebar)
- **Separate from color**: Controls what's visible, not color mapping
- **Real-time adjustment**: Immediate visual feedback

## API Endpoints

- `POST /api/jobs/:id/start-viewer` - Start Trame viewer for job
- `DELETE /api/jobs/:id/stop-viewer` - Stop Trame viewer
- `GET /api/jobs/:id/viewer-status` - Check viewer status
- `GET /api/trame/active-viewers` - List all active viewers

## Troubleshooting

### Win32OpenGL Window Opening
If you see a separate VTK window opening (that's not responding), this indicates VTK is trying to create a native window. The updated script now includes headless configuration to prevent this.

### Python Not Found
Ensure Python is installed and in your system PATH:
```bash
python --version
which python  # On Unix/Mac
where python  # On Windows
```

### Missing Dependencies
Install the required Python packages:
```bash
pip install trame trame-vuetify trame-vtk vtk numpy pandas
```

### VTK File Issues
Use the test script to debug VTK file loading:
```bash
python python/test_vtk_viewer.py "path/to/your/file.vtk"
```

### Viewer Not Showing Content
1. Check that VTK files are properly uploaded with "vtk" label
2. Verify file format is .vtk (legacy) or .vtp (XML)
3. Check browser console for errors
4. Try refreshing the viewer status

### Port Conflicts
The system automatically assigns available ports starting from 8080. Check the viewer status to see assigned ports.

### File Format Support
- **Preferred**: `.vtk` files (legacy VTK format)
- **Also supported**: `.vtp` files (VTK XML PolyData)
- **Fallback**: Text files (nodes, elements, field data)

### UI Issues Fixed ✨
- **Sidebar Controls**: Sliders moved to a clean, collapsible sidebar (click the ☰ menu button)
- **No More Double Buttons**: Fixed duplicate hamburger menu buttons - only one functional button now
- **Proper Focus Management**: Sidebar can be closed to restore full 3D interaction
- **Improved Status Detection**: Dashboard now quickly detects when Trame viewer closes
- **Dynamic Polling**: Faster status checks when running (2s), slower when stopped (10s)
- **Health Checks**: Direct server pinging to verify the Trame process is actually alive
- **Cleaner Toolbar**: Only essential array/component selection in the main toolbar  
- **Wider sliders**: Sliders are now larger and more practical to use in the sidebar
- **Better organization**: Separate sections for Color Range, Threshold, and Camera controls
- **Single component arrays**: Fixed issue where arrays with 1 component wasn't updating properly

### Component Selection Issues
- If component dropdown doesn't appear, the array has only 1 component
- Magnitude option only appears for multi-component arrays (displacement, etc.)
- Check demo script output to see available components
- Use single component test script to debug array switching issues

### Color Range Problems
- **Can't find sliders**: Click the ☰ menu button in the top-left to open the sidebar
- **Can't interact with 3D view**: Close the sidebar using the ✕ button in the sidebar header
- **Two menu buttons**: Only use the functional ☰ menu button (the built-in Trame one)
- If colors look wrong, check that color range matches your expected data range
- Reset color range to data range if visualization appears blank
- Dark blue/red clamping indicates values outside your set range
- Sliders are now much wider and easier to adjust precisely in the sidebar

### Troubleshooting Array Switching
- Run single component test to verify all arrays can be activated
- Check console output for debug messages about array activation
- Ensure VTK file has properly named data arrays

### Status Detection Issues
- **Dashboard not detecting closure**: Fixed with health checks and faster polling
- **Status stuck on "running"**: New health checks ping the server directly
- **Slow updates**: Dynamic polling now checks every 2 seconds when running
- **Process lingering**: Improved signal handling for graceful shutdown

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  React Frontend │────│  Express Server  │────│  Python Trame   │
│  (TrameViewer)  │    │  (API Routes)    │    │  (FEA Viewer)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        │ HTTP API calls         │ Process spawning      │ VTK rendering
        │                       │                       │
        └─── Embedded iframe ───┴───── Port 8080+ ──────┘
```

## Next Steps

- Test with your existing FEA data files
- Customize visualization colors and settings
- Add export capabilities (VTU format)
- Extend with additional analysis tools 