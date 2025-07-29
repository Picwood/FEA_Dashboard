#!/usr/bin/env python3
"""
Test single component array handling
"""

import sys
from pathlib import Path
from fea_viewer import FEAViewer

def test_single_component_arrays(file_path):
    """Test single component array visualization"""
    print("🧪 Testing Single Component Array Handling")
    print("=" * 50)
    
    try:
        # Create viewer
        viewer = FEAViewer(job_id=None, port=8082)
        
        # Load VTK file
        print(f"📁 Loading: {file_path}")
        success = viewer.load_vtk_file(Path(file_path))
        
        if not success:
            print("❌ Failed to load file")
            return
        
        print(f"✅ File loaded successfully!\n")
        
        # Show all arrays
        print("📊 TESTING ARRAY SWITCHING:")
        print("-" * 35)
        
        for i, array_info in enumerate(viewer.state.available_arrays):
            print(f"\n🔄 Testing Array {i+1}: {array_info['name']}")
            print(f"   Components: {array_info['components']}")
            print(f"   Location: {array_info['location']}")
            
            # Try to activate this array
            success = viewer.set_active_array(array_info)
            
            if success:
                print(f"   ✅ Successfully activated")
                print(f"   🎯 Active component: {viewer.state.current_component_name}")
                print(f"   📏 Data range: {viewer.state.data_range}")
                print(f"   🌈 Color range: {viewer.state.color_range}")
                print(f"   🧩 Component options: {len(viewer.state.component_options)}")
                
                for j, comp in enumerate(viewer.state.component_options):
                    marker = "→" if j == viewer.state.selected_component_index else " "
                    print(f"     {marker} {comp['text']}")
                
                # Test component switching for multi-component arrays
                if len(viewer.state.component_options) > 1:
                    print(f"   🔄 Testing component switching...")
                    for comp_idx in range(len(viewer.state.component_options)):
                        comp_success = viewer.set_active_component(comp_idx)
                        comp_name = viewer.state.component_options[comp_idx]['text']
                        if comp_success:
                            print(f"     ✅ Component {comp_name}: OK")
                        else:
                            print(f"     ❌ Component {comp_name}: FAILED")
            else:
                print(f"   ❌ Failed to activate")
        
        print(f"\n🎉 Array switching test completed!")
        print(f"📈 Total arrays tested: {len(viewer.state.available_arrays)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    if len(sys.argv) != 2:
        print("Single Component Array Test")
        print("Usage: python test_single_component.py <path_to_vtk_file>")
        print("Example: python test_single_component.py 'C:/path/to/file.vtk'")
        return
    
    file_path = sys.argv[1]
    test_single_component_arrays(file_path)

if __name__ == "__main__":
    main() 