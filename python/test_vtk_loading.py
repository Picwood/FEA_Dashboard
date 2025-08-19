#!/usr/bin/env python3
"""
Test script for VTK file loading improvements
Tests the enhanced FEA viewer's file loading capabilities
"""

import os
import sys
from pathlib import Path

# Configure VTK for headless operation (same as in fea_viewer.py)
os.environ['VTK_SILENCE_GET_VOID_POINTER_WARNINGS'] = '1'
os.environ['VTK_USE_X'] = '0'
os.environ['DISPLAY'] = ''
os.environ['MESA_GL_VERSION_OVERRIDE'] = '3.3'
os.environ['MESA_GLSL_VERSION_OVERRIDE'] = '330'
os.environ['LIBGL_ALWAYS_SOFTWARE'] = '1'

# Add the project root to Python path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from python.fea_viewer import FEAViewer

def test_vtk_loading():
    """Test VTK file loading capabilities"""
    
    print("=== VTK File Loading Test ===")
    print("Testing enhanced file format detection and reading...")
    
    # Test files directory
    test_dir = Path("./data/files/1")
    
    if not test_dir.exists():
        print(f"❌ Test directory not found: {test_dir}")
        return False
    
    # Find VTK files
    vtk_files = list(test_dir.glob("*.vtk")) + list(test_dir.glob("*.vtp"))
    
    if not vtk_files:
        print(f"❌ No VTK files found in {test_dir}")
        return False
    
    print(f"Found {len(vtk_files)} VTK files:")
    for f in vtk_files:
        print(f"  - {f.name}")
    
    # Create a test viewer instance
    viewer = FEAViewer(job_id=None, port=8080)
    
    # Test each VTK file
    success_count = 0
    
    for vtk_file in vtk_files:
        print(f"\n--- Testing file: {vtk_file.name} ---")
        try:
            success = viewer.load_vtk_file(vtk_file)
            if success:
                print(f"✅ Successfully loaded {vtk_file.name}")
                print(f"   Mesh status: {viewer.state.mesh_status}")
                print(f"   Available arrays: {len(viewer.state.available_arrays)}")
                if viewer.state.available_arrays:
                    for i, arr in enumerate(viewer.state.available_arrays):
                        print(f"     {i+1}. {arr['name']} ({arr['location']}) - {arr['components']} components")
                success_count += 1
            else:
                print(f"❌ Failed to load {vtk_file.name}")
        except Exception as e:
            print(f"❌ Exception while loading {vtk_file.name}: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n=== Test Results ===")
    print(f"Tested {len(vtk_files)} files")
    print(f"Successfully loaded: {success_count}")
    print(f"Failed: {len(vtk_files) - success_count}")
    
    return success_count > 0

if __name__ == "__main__":
    print("Testing VTK loading improvements for Raspberry Pi...")
    success = test_vtk_loading()
    sys.exit(0 if success else 1)
