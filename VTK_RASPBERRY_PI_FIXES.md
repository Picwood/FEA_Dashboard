# VTK Raspberry Pi Fixes

## Issues Addressed

### 1. X Server Connection Warnings
**Problem**: VTK was trying to connect to X11 display server on headless Raspberry Pi
```
bad X server connection. DISPLAY=
```

**Solution**: Enhanced VTK headless configuration with additional environment variables:
- `MESA_GL_VERSION_OVERRIDE='3.3'` - Forces Mesa to use a compatible OpenGL version
- `MESA_GLSL_VERSION_OVERRIDE='330'` - Sets GLSL version for shader compatibility  
- `LIBGL_ALWAYS_SOFTWARE='1'` - Forces software rendering (more reliable on Pi)

### 2. VTK File Format Detection
**Problem**: XML reader couldn't find UnstructuredGrid element in .vtp files
```
Cannot find UnstructuredGrid element in file
```

**Solution**: Intelligent file format detection that tries multiple readers:

- **For .vtp files**: Tries both `vtkXMLPolyDataReader` and `vtkXMLUnstructuredGridReader`
- **For .vtk files**: Tries both `vtkUnstructuredGridReader` and `vtkPolyDataReader`
- **Fallback handling**: If one reader fails, automatically tries the next
- **Better error reporting**: Shows which reader succeeded and provides detailed diagnostics

## Code Changes

### Enhanced Environment Configuration
```python
# Additional VTK headless configuration for Raspberry Pi
os.environ['MESA_GL_VERSION_OVERRIDE'] = '3.3'
os.environ['MESA_GLSL_VERSION_OVERRIDE'] = '330'
os.environ['LIBGL_ALWAYS_SOFTWARE'] = '1'
```

### Improved VTK Pipeline Setup
```python
# Force software rendering for better Raspberry Pi compatibility
try:
    self.renderWindow.SetUseOffScreenBuffers(True)
except AttributeError:
    # Method might not be available in all VTK versions
    pass
```

### Smart File Format Detection
```python
# Try different readers based on file extension and content
readers_to_try = []

if file_ext == '.vtp':
    readers_to_try = [
        ('XMLPolyData', vtkXMLPolyDataReader()),
        ('XMLUnstructuredGrid', vtkXMLUnstructuredGridReader())
    ]
elif file_ext == '.vtk':
    readers_to_try = [
        ('LegacyUnstructuredGrid', vtkUnstructuredGridReader()),
        ('LegacyPolyData', vtkPolyDataReader())
    ]
```

## Testing

Run the test script to verify the fixes:
```bash
python python/test_vtk_loading.py
```

This will test all VTK files in the data directory and report:
- Which files load successfully
- What data arrays are available
- Any remaining issues

## Expected Results

After these fixes, the FEA viewer should:
1. ✅ Start without X server warnings
2. ✅ Successfully load .vtp files (PolyData format)
3. ✅ Successfully load .vtk files (Legacy format)
4. ✅ Provide detailed error messages for troubleshooting
5. ✅ Work reliably on headless Raspberry Pi systems

## Files Modified

- `python/fea_viewer.py` - Main viewer with enhanced VTK configuration and file loading
- `python/test_vtk_loading.py` - Test script for validation (new file)
- `VTK_RASPBERRY_PI_FIXES.md` - This documentation (new file)
