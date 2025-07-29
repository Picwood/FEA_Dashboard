#!/usr/bin/env python3
"""
Demo script showing enhanced FEA viewer features
"""

import sys
from pathlib import Path
from fea_viewer import FEAViewer

def demo_enhanced_features(file_path):
    """Demonstrate the enhanced viewer features"""
    print("🚀 Enhanced FEA Viewer Demo")
    print("=" * 50)
    
    try:
        # Create viewer
        viewer = FEAViewer(job_id=None, port=8081)
        
        # Load VTK file
        print(f"📁 Loading: {file_path}")
        success = viewer.load_vtk_file(Path(file_path))
        
        if not success:
            print("❌ Failed to load file")
            return
        
        print(f"✅ File loaded successfully!\n")
        
        # Show arrays and components
        print("📊 AVAILABLE DATA ARRAYS:")
        print("-" * 30)
        for i, arr in enumerate(viewer.state.available_arrays):
            print(f"{i+1}. {arr['name']} ({arr['location']})")
            print(f"   Components: {arr['components']}")
            
            # Show component details
            if 'component_ranges' in arr and len(arr['component_ranges']) > 1:
                print("   Available components:")
                for c, comp_range in enumerate(arr['component_ranges']):
                    comp_name = viewer.get_component_name(c, arr['components'])
                    print(f"     • {comp_name}: {comp_range[0]:.3f} to {comp_range[1]:.3f}")
                print(f"     • Magnitude: Combined magnitude of all components")
            print()
        
        # Show current selection
        print("🎯 CURRENT SELECTION:")
        print("-" * 20)
        print(f"Array: {viewer.state.selected_array}")
        print(f"Location: {viewer.state.data_location}")
        print(f"Active Component: {viewer.state.current_component_name}")
        print(f"Data Range: {viewer.state.data_range[0]:.3f} to {viewer.state.data_range[1]:.3f}")
        print(f"Color Range: {viewer.state.color_range[0]:.3f} to {viewer.state.color_range[1]:.3f}")
        print()
        
        # Show component options
        print("🧩 COMPONENT OPTIONS:")
        print("-" * 20)
        for i, comp in enumerate(viewer.state.component_options):
            marker = "→" if i == viewer.state.selected_component_index else " "
            print(f"{marker} {comp['text']} (value: {comp['value']})")
        print()
        
        # Show controls explanation
        print("🎛️ AVAILABLE CONTROLS:")
        print("-" * 20)
        print("1. Data Array Dropdown - Switch between displacement, stress, etc.")
        print("2. Component Dropdown - Select X, Y, Z, or Magnitude")
        print("3. Color Range Slider - Adjust color mapping min/max")
        print("4. Threshold Slider - Control data visibility")
        print()
        
        # Color mapping info
        print("🎨 COLOR MAPPING:")
        print("-" * 15)
        print("• Values below color range → Dark Blue")
        print("• Values within color range → Blue to Red scale")
        print("• Values above color range → Dark Red")
        print()
        
        print("🌐 To start the full viewer, run:")
        print(f"   python python/fea_viewer.py --data \"{file_path}\" --port 8081")
        print("\nThen open: http://localhost:8081")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Enhanced FEA Viewer Demo")
        print("Usage: python demo_enhanced_viewer.py <path_to_vtk_file>")
        print("Example: python demo_enhanced_viewer.py 'C:/path/to/file.vtk'")
        return
    
    file_path = sys.argv[1]
    demo_enhanced_features(file_path)

if __name__ == "__main__":
    main() 