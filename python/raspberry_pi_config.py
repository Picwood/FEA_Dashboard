#!/usr/bin/env python3
"""
Raspberry Pi specific configuration for FEA Viewer
Sets up environment variables and configurations optimized for Raspberry Pi
"""

import os
import platform

def configure_for_raspberry_pi():
    """Configure environment for Raspberry Pi operation"""
    
    # Check if running on Raspberry Pi
    is_raspberry_pi = False
    try:
        with open('/proc/cpuinfo', 'r') as f:
            if 'Raspberry Pi' in f.read():
                is_raspberry_pi = True
    except:
        pass
    
    # Set VTK environment variables for headless operation
    os.environ['VTK_SILENCE_GET_VOID_POINTER_WARNINGS'] = '1'
    os.environ['VTK_SILENCE_DEPRECATION_WARNINGS'] = '1'
    os.environ['VTK_USE_X'] = '0'  # Disable X11
    os.environ['DISPLAY'] = ''     # Ensure no display
    
    if is_raspberry_pi:
        print("🐍 Detected Raspberry Pi - applying Pi-specific optimizations")
        
        # Raspberry Pi specific VTK configurations
        os.environ['VTK_RENDERER'] = 'OpenGL2'
        os.environ['VTK_OPENGL_HAS_OSMESA'] = '1'
        os.environ['VTK_USE_OSMESA'] = '1'
        
        # Performance optimizations for Pi
        os.environ['VTK_DEFAULT_EGL_DEVICE'] = '0'
        os.environ['VTK_OPENGL_HAS_EGL'] = '1'
        
        # Memory optimizations
        os.environ['VTK_MAX_THREADS'] = '4'  # Limit threads for Pi
        
        # Disable features that might cause issues on Pi
        os.environ['VTK_USE_OPENGL2'] = '1'
        os.environ['VTK_OPENGL_HAS_OPENGL2'] = '1'
        
    else:
        print("💻 Running on non-Raspberry Pi system")
        # Standard headless configuration for other systems
        os.environ['VTK_RENDERER'] = 'OpenGL2'

def get_raspberry_pi_performance_settings():
    """Get performance settings optimized for Raspberry Pi"""
    
    # Check if running on Raspberry Pi
    is_raspberry_pi = False
    try:
        with open('/proc/cpuinfo', 'r') as f:
            if 'Raspberry Pi' in f.read():
                is_raspberry_pi = True
    except:
        pass
    
    if is_raspberry_pi:
        return {
            'render_window_size': (1024, 768),
            'interactive_ratio': 0.5,
            'interactive_quality': 60,
            'multisamples': 0,
            'antialiasing': 0,
            'max_threads': 4,
            'memory_limit_mb': 512
        }
    else:
        return {
            'render_window_size': (1280, 960),
            'interactive_ratio': 1.0,
            'interactive_quality': 80,
            'multisamples': 4,
            'antialiasing': 1,
            'max_threads': 8,
            'memory_limit_mb': 1024
        }

def configure_trame_server(server, port):
    """Configure Trame server for Raspberry Pi"""
    
    # Check if running on Raspberry Pi
    is_raspberry_pi = False
    try:
        with open('/proc/cpuinfo', 'r') as f:
            if 'Raspberry Pi' in f.read():
                is_raspberry_pi = True
    except:
        pass
    
    # Basic configuration
    server.config.port = port
    server.config.host = "0.0.0.0"  # Allow external connections
    
    if is_raspberry_pi:
        print("🔧 Configuring Trame server for Raspberry Pi")
        # Raspberry Pi optimizations
        server.config.threading = True
        server.config.threading_mode = "threading"
        server.config.max_connections = 10  # Limit connections for Pi
        server.config.timeout = 30  # Shorter timeout
    else:
        print("🔧 Configuring Trame server for standard system")
        # Standard configuration
        server.config.threading = True
        server.config.threading_mode = "threading"
        server.config.max_connections = 50
        server.config.timeout = 60

def test_vtk_installation():
    """Test VTK installation and configuration"""
    try:
        import vtk
        
        # Test basic VTK functionality
        renderer = vtk.vtkRenderer()
        render_window = vtk.vtkRenderWindow()
        render_window.AddRenderer(renderer)
        render_window.SetOffScreenRendering(True)
        render_window.SetSize(100, 100)
        
        # Create a simple test object
        points = vtk.vtkPoints()
        points.InsertNextPoint(0, 0, 0)
        points.InsertNextPoint(1, 0, 0)
        points.InsertNextPoint(0, 1, 0)
        
        lines = vtk.vtkCellArray()
        line = vtk.vtkLine()
        line.GetPointIds().SetId(0, 0)
        line.GetPointIds().SetId(1, 1)
        lines.InsertNextCell(line)
        
        polydata = vtk.vtkPolyData()
        polydata.SetPoints(points)
        polydata.SetLines(lines)
        
        mapper = vtk.vtkPolyDataMapper()
        mapper.SetInputData(polydata)
        
        actor = vtk.vtkActor()
        actor.SetMapper(mapper)
        renderer.AddActor(actor)
        
        # Test rendering
        render_window.Render()
        
        print("✅ VTK installation test successful!")
        return True
        
    except Exception as e:
        print(f"❌ VTK installation test failed: {e}")
        return False

if __name__ == "__main__":
    # Test configuration
    configure_for_raspberry_pi()
    settings = get_raspberry_pi_performance_settings()
    print(f"Performance settings: {settings}")
    test_vtk_installation() 