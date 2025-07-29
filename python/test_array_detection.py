#!/usr/bin/env python3
"""
Simple test to check array detection in VTK files
"""

import sys
from pathlib import Path
from fea_viewer import FEAViewer

def test_array_detection(file_path):
    """Test array detection without starting the full Trame server"""
    print(f"🔍 Testing array detection for: {file_path}")
    
    try:
        # Create viewer but don't start server
        viewer = FEAViewer(job_id=None, port=8080)
        
        # Load the VTK file
        success = viewer.load_vtk_file(Path(file_path))
        
        if success:
            print(f"✅ File loaded successfully")
            print(f"📊 Available arrays: {len(viewer.state.available_arrays)}")
            
            for i, arr in enumerate(viewer.state.available_arrays):
                print(f"   {i+1}. {arr['name']} ({arr['location']}) - {arr['components']} components")
                if 'component_ranges' in arr:
                    for c, comp_range in enumerate(arr['component_ranges']):
                        comp_name = viewer.get_component_name(c, arr['components'])
                        print(f"      {comp_name}: {comp_range[0]:.3f} to {comp_range[1]:.3f}")
                else:
                    print(f"      Overall range: {arr['range'][0]:.3f} to {arr['range'][1]:.3f}")
            
            if viewer.state.available_arrays:
                print(f"\n🎯 Active array: {viewer.state.selected_array}")
                print(f"📍 Data location: {viewer.state.data_location}")
                print(f"🧩 Available components: {len(viewer.state.component_options)}")
                for comp in viewer.state.component_options:
                    print(f"   - {comp['text']} (value: {comp['value']})")
                print(f"🎨 Active component: {viewer.state.current_component_name}")
                print(f"📏 Data range: {viewer.state.data_range}")
                print(f"🌈 Color range: {viewer.state.color_range}")
            
            return True
        else:
            print("❌ Failed to load file")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_array_detection.py <path_to_vtk_file>")
        print("Example: python test_array_detection.py 'C:/path/to/file.vtk'")
        return
    
    file_path = sys.argv[1]
    test_array_detection(file_path)

if __name__ == "__main__":
    main() 