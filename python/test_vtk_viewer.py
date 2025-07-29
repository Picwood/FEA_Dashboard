#!/usr/bin/env python3
"""
Test script for VTK viewer to debug issues
"""

import os
import sys
from pathlib import Path

# Test VTK imports
try:
    import vtkmodules.vtkRenderingOpenGL2  # noqa
    from vtkmodules.vtkIOLegacy import vtkUnstructuredGridReader
    from vtkmodules.vtkIOXML import vtkXMLUnstructuredGridReader
    from vtkmodules.vtkRenderingCore import vtkRenderer, vtkRenderWindow
    print("✅ VTK imports successful")
except ImportError as e:
    print(f"❌ VTK import failed: {e}")
    sys.exit(1)

# Test Trame imports
try:
    from trame.app import get_server
    print("✅ Trame imports successful")
except ImportError as e:
    print(f"❌ Trame import failed: {e}")
    sys.exit(1)

def test_vtk_file_loading(file_path):
    """Test loading a VTK file"""
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    try:
        file_ext = Path(file_path).suffix.lower()
        print(f"📁 Testing file: {file_path} (format: {file_ext})")
        
        if file_ext == '.vtp':
            reader = vtkXMLUnstructuredGridReader()
            print("Using XML VTK reader (.vtp)")
        elif file_ext == '.vtk':
            reader = vtkUnstructuredGridReader()
            print("Using Legacy VTK reader (.vtk)")
        else:
            print(f"❌ Unsupported file format: {file_ext}")
            return False
        
        reader.SetFileName(file_path)
        reader.Update()
        
        data = reader.GetOutput()
        print(f"✅ File loaded successfully")
        print(f"   - Number of cells: {data.GetNumberOfCells()}")
        print(f"   - Number of points: {data.GetNumberOfPoints()}")
        
        # Check cell data arrays
        cell_data = data.GetCellData()
        print(f"\n📊 Cell Data Arrays ({cell_data.GetNumberOfArrays()}):")
        for i in range(cell_data.GetNumberOfArrays()):
            array = cell_data.GetArray(i)
            array_name = array.GetName() if array.GetName() else f"Array_{i}"
            print(f"   - {array_name}: {array.GetNumberOfTuples()} values, range: {array.GetRange()}")
        
        # Check point data arrays  
        point_data = data.GetPointData()
        print(f"\n📊 Point Data Arrays ({point_data.GetNumberOfArrays()}):")
        for i in range(point_data.GetNumberOfArrays()):
            array = point_data.GetArray(i)
            array_name = array.GetName() if array.GetName() else f"Array_{i}"
            print(f"   - {array_name}: {array.GetNumberOfTuples()} values, range: {array.GetRange()}")
        
        # Check default scalars
        cell_scalars = cell_data.GetScalars()
        point_scalars = point_data.GetScalars()
        
        if cell_scalars:
            print(f"\n✅ Default cell scalars: {cell_scalars.GetName()}")
        elif point_scalars:
            print(f"\n✅ Default point scalars: {point_scalars.GetName()}")
        else:
            print(f"\n⚠️  No default scalars set, but {cell_data.GetNumberOfArrays() + point_data.GetNumberOfArrays()} arrays available")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading file: {e}")
        return False

def test_headless_rendering():
    """Test headless VTK rendering"""
    try:
        print("🖥️  Testing headless rendering...")
        
        renderer = vtkRenderer()
        render_window = vtkRenderWindow()
        render_window.AddRenderer(renderer)
        
        # Configure for headless rendering
        render_window.SetOffScreenRendering(True)
        render_window.SetShowWindow(False)
        
        # Test render
        render_window.Render()
        
        print("✅ Headless rendering successful")
        return True
        
    except Exception as e:
        print(f"❌ Headless rendering failed: {e}")
        return False

def test_trame_server():
    """Test Trame server creation"""
    try:
        print("🌐 Testing Trame server...")
        
        server = get_server(client_type="vue2")
        print("✅ Trame server created successfully")
        return True
        
    except Exception as e:
        print(f"❌ Trame server creation failed: {e}")
        return False

def main():
    print("🔬 VTK Viewer Test Script")
    print("=" * 40)
    
    # Test headless rendering first
    if not test_headless_rendering():
        return
    
    # Test Trame server
    if not test_trame_server():
        return
    
    # Test file loading if file path provided
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        test_vtk_file_loading(file_path)
    else:
        print("💡 Usage: python test_vtk_viewer.py <path_to_vtk_file>")
        print("   Example: python test_vtk_viewer.py 'C:/path/to/your/file.vtk'")
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    main() 