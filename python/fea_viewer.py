#!/usr/bin/env python3
"""
FEA Viewer Service - Trame-based VTK visualization for FEA results
Integrates with the FEA Dashboard Express backend
"""

import io
import os
import sys
import json
import argparse
from pathlib import Path

# Configure VTK for headless operation on Windows
os.environ['VTK_SILENCE_GET_VOID_POINTER_WARNINGS'] = '1'
os.environ['VTK_USE_X'] = '0'  # Disable X11 on Unix-like systems
os.environ['DISPLAY'] = ''     # Ensure no display is used

import numpy as np
import pandas as pd
import vtkmodules.vtkRenderingOpenGL2  # noqa
from vtkmodules.numpy_interface.dataset_adapter import numpyTovtkDataArray as np2da
from vtkmodules.util import vtkConstants
from vtkmodules.vtkCommonCore import vtkIdList, vtkLookupTable, vtkPoints
from vtkmodules.vtkCommonDataModel import vtkCellArray, vtkUnstructuredGrid
from vtkmodules.vtkFiltersCore import vtkThreshold
from vtkmodules.vtkIOXML import vtkXMLUnstructuredGridWriter, vtkXMLUnstructuredGridReader
from vtkmodules.vtkIOLegacy import vtkUnstructuredGridReader

# VTK Rendering imports
from vtkmodules.vtkInteractionStyle import vtkInteractorStyleSwitch  # noqa
from vtkmodules.vtkRenderingCore import (
    vtkActor,
    vtkDataSetMapper,
    vtkRenderer,
    vtkRenderWindow,
    vtkRenderWindowInteractor,
)

from trame.app import get_server
from trame.ui.vuetify import SinglePageWithDrawerLayout
from trame.widgets import vtk as vtk_widgets
from trame.widgets import vuetify, html

class FEAViewer:
    def __init__(self, job_id=None, port=8080):
        self.job_id = job_id
        self.port = port
        self.server = get_server(client_type="vue2")
        self.state, self.ctrl = self.server.state, self.server.controller
        
        # VTK Pipeline setup
        self.setup_vtk_pipeline()
        
        # UI setup
        self.setup_ui()
        
        # State initialization
        self.state.mesh_status = 0  # 0: empty / 1: mesh / 2: mesh+filter
        self.state.job_id = job_id
        self.state.available_arrays = []
        self.state.array_options = []
        self.state.selected_array = ""
        self.state.selected_array_index = 0
        self.state.data_location = "cells"  # "cells" or "points"
        
        # Component selection
        self.state.available_components = []
        self.state.component_options = []
        self.state.selected_component_index = 0
        self.state.current_component_name = ""
        
        # Color range controls (separate from threshold)
        self.state.color_range = [0, 1]
        self.state.data_range = [0, 1]  # Full range of current component
        self.state.threshold_range = [0, 1]  # Threshold range for visibility
        
        # UI controls
        self.state.drawer = False  # Sidebar visibility (starts closed)

    def setup_vtk_pipeline(self):
        """Initialize VTK pipeline components"""
        self.vtk_idlist = vtkIdList()
        self.vtk_grid = vtkUnstructuredGrid()
        self.vtk_filter = vtkThreshold()
        self.vtk_filter.SetInputData(self.vtk_grid)
        
        # Renderer setup
        self.renderer = vtkRenderer()
        self.renderer.SetBackground(0.1, 0.1, 0.1)  # Dark background
        
        # Render window setup for headless/server mode
        self.renderWindow = vtkRenderWindow()
        self.renderWindow.AddRenderer(self.renderer)
        # Configure for headless rendering
        self.renderWindow.SetOffScreenRendering(True)
        self.renderWindow.SetShowWindow(False)
        
        self.renderWindowInteractor = vtkRenderWindowInteractor()
        self.renderWindowInteractor.SetRenderWindow(self.renderWindow)
        self.renderWindowInteractor.GetInteractorStyle().SetCurrentStyleToTrackballCamera()
        
        # Filtered mesh actor
        self.filter_mapper = vtkDataSetMapper()
        self.filter_mapper.SetInputConnection(self.vtk_filter.GetOutputPort())
        self.filter_actor = vtkActor()
        self.filter_actor.SetMapper(self.filter_mapper)
        self.renderer.AddActor(self.filter_actor)
        
        # Color lookup table
        self.lut = vtkLookupTable()
        self.lut.SetHueRange(0.667, 0)
        self.lut.Build()
        self.filter_mapper.SetLookupTable(self.lut)
        
        # Wireframe mesh actor
        self.mesh_mapper = vtkDataSetMapper()
        self.mesh_mapper.SetInputData(self.vtk_grid)
        self.mesh_mapper.SetScalarVisibility(0)
        self.mesh_actor = vtkActor()
        self.mesh_actor.SetMapper(self.mesh_mapper)
        self.renderer.AddActor(self.mesh_actor)

    def load_job_files(self, job_id):
        """Load FEA files from job directory"""
        job_path = Path(f"./data/files/{job_id}")
        
        if not job_path.exists():
            raise FileNotFoundError(f"Job directory not found: {job_path}")
        
        # Look for nodes, elements, field files, and VTK files
        files = {
            'nodes': None,
            'elements': None,
            'field': None,
            'vtk': None
        }
        
        for file_path in job_path.glob("*"):
            filename = file_path.name.lower()
            if 'node' in filename and filename.endswith('.txt'):
                files['nodes'] = file_path
            elif 'elem' in filename and filename.endswith('.txt'):
                files['elements'] = file_path
            elif 'field' in filename and filename.endswith('.txt'):
                files['field'] = file_path
            elif filename.endswith('.vtk') or filename.endswith('.vtp'):
                files['vtk'] = file_path
        
        return files

    def process_fea_files(self, nodes_file=None, elements_file=None, field_file=None):
        """Process FEA files and update VTK grid"""
        if not nodes_file or not elements_file:
            return False
        
        try:
            # Read nodes
            df_nodes = pd.read_csv(
                nodes_file,
                delim_whitespace=True,
                header=None,
                skiprows=1,
                names=["id", "x", "y", "z"],
            )
            df_nodes["id"] = df_nodes["id"].astype(int)
            df_nodes = df_nodes.set_index("id", drop=True)
            df_nodes = df_nodes.reindex(
                np.arange(df_nodes.index.min(), df_nodes.index.max() + 1), fill_value=0
            )
            
            # Read elements
            df_elems = pd.read_csv(
                elements_file,
                skiprows=1,
                header=None,
                delim_whitespace=True,
                engine="python",
                index_col=None,
            ).sort_values(0)
            
            df_elems.iloc[:, 0] = df_elems.iloc[:, 0].astype(int)
            n_nodes = df_elems.iloc[:, 1].map(
                lambda x: int("".join(i for i in x if i.isdigit()))
            )
            df_elems.insert(2, "n_nodes", n_nodes)
            
            new_range = np.arange(df_elems.iloc[:, 0].min(), df_elems.iloc[:, 0].max() + 1)
            df_elems = df_elems.set_index(0, drop=False).reindex(new_range, fill_value=0)
            
            # Map element types to VTK
            vtk_shape_id_map = {
                "Tet4": vtkConstants.VTK_TETRA,
                "Tet10": vtkConstants.VTK_QUADRATIC_TETRA,
                "Hex8": vtkConstants.VTK_HEXAHEDRON,
                "Hex20": vtkConstants.VTK_QUADRATIC_HEXAHEDRON,
                "Tri6": vtkConstants.VTK_QUADRATIC_TRIANGLE,
                "Quad8": vtkConstants.VTK_QUADRATIC_QUAD,
                "Tri3": vtkConstants.VTK_TRIANGLE,
                "Quad4": vtkConstants.VTK_QUAD,
                "Wed15": vtkConstants.VTK_QUADRATIC_WEDGE,
            }
            
            df_elems["cell_types"] = np.nan
            df_elems.loc[df_elems.loc[:, 0] > 0, "cell_types"] = df_elems.loc[
                df_elems.loc[:, 0] > 0, 1
            ].map(
                lambda x: (
                    vtk_shape_id_map[x.strip()]
                    if x.strip() in vtk_shape_id_map.keys()
                    else np.nan
                )
            )
            df_elems = df_elems.dropna(subset=["cell_types"], axis=0)
            
            # Convert to VTK format
            points = df_nodes[["x", "y", "z"]].to_numpy()
            cell_types = df_elems["cell_types"].to_numpy()
            n_nodes = df_elems.loc[:, "n_nodes"].to_numpy()
            p = df_elems.iloc[:, 3:-1].to_numpy() - df_nodes.index.min()
            a = np.hstack((n_nodes.reshape((len(n_nodes), 1)), p))
            cells = a.ravel()
            cells = cells[np.logical_not(np.isnan(cells))]
            cells = cells.astype(int)
            
            # Update VTK grid
            vtk_pts = vtkPoints()
            vtk_pts.SetData(np2da(points))
            self.vtk_grid.SetPoints(vtk_pts)
            
            vtk_cells = vtkCellArray()
            vtk_cells.SetCells(
                cell_types.shape[0], np2da(cells, array_type=vtkConstants.VTK_ID_TYPE)
            )
            self.vtk_grid.SetCells(
                np2da(cell_types, array_type=vtkConstants.VTK_UNSIGNED_CHAR), vtk_cells
            )
            
            self.state.mesh_status = 1
            
            # Add field data if available
            if field_file and field_file.exists():
                df_elem_data = pd.read_csv(
                    field_file,
                    delim_whitespace=True,
                    header=None,
                    skiprows=1,
                    names=["id", "val"],
                )
                df_elem_data = df_elem_data.sort_values("id").set_index("id", drop=True)
                df_elem_data = df_elem_data.reindex(
                    np.arange(df_elems.index.min(), df_elems.index.max() + 1), fill_value=0.0
                )
                np_val = df_elem_data["val"].to_numpy()
                
                vtk_array = np2da(np_val, name="field_data")
                self.vtk_grid.GetCellData().SetScalars(vtk_array)
            
            # Analyze available data arrays
            self.analyze_data_arrays()
            
            # Set initial visualization
            if self.state.available_arrays:
                self.set_active_array(self.state.available_arrays[0])
            else:
                self.state.mesh_status = 1
            
            self.renderer.ResetCamera()
            return True
            
        except Exception as e:
            print(f"Error processing FEA files: {e}")
            return False

    def export_vtu(self, output_path):
        """Export current grid as VTU file"""
        writer = vtkXMLUnstructuredGridWriter()
        writer.SetFileName(str(output_path))
        writer.SetInputData(self.vtk_grid)
        writer.SetCompressorTypeToZLib()
        writer.SetCompressionLevel(6)
        writer.SetDataModeToAppended()
        writer.Write()

    def setup_ui(self):
        """Setup trame UI"""
        self.state.trame__title = f"FEA Viewer - Job {self.job_id}"
        
        with SinglePageWithDrawerLayout(self.server) as layout:
            layout.title.set_text(f"FEA Results - Job {self.job_id}")
            layout.drawer.width = 320
            
            # Drawer/Sidebar with slider controls
            with layout.drawer:
                
                with vuetify.VCard(style="height: 100%; background-color: #f8f9fa"):
                    with vuetify.VCardTitle(style="background-color: #2196f3; color: white; padding: 12px; position: relative"):
                        vuetify.VIcon("mdi-tune", style="margin-right: 8px")
                        html.Span("Visualization Controls")
                        
                        # Close button in header
                        with vuetify.VBtn(
                            icon=True,
                            small=True,
                            color="white",
                            text=True,
                            click="drawer = false",
                            style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%)"
                        ):
                            vuetify.VIcon("mdi-close", color="white")
                    
                    # Instructions
                    with vuetify.VAlert(
                        type="info",
                        dense=True,
                        text=True,
                        style="margin: 16px; margin-bottom: 0"
                    ):
                        html.Div("💡 Tip: Close this panel to interact with the 3D view. Click the ☰ menu button to reopen.", 
                                style="font-size: 13px")
                    
                    with vuetify.VCardText(style="padding: 20px"):
                        # Color Range Control
                        with vuetify.VCard(
                            v_if=("mesh_status > 1",),
                            flat=True,
                            style="margin-bottom: 24px; padding: 20px; background-color: #e3f2fd; border-radius: 8px; border: 1px solid #2196f3"
                        ):
                            vuetify.VCardSubtitle(
                                "🎨 Color Range", 
                                style="padding: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #1976d2; text-align: center"
                            )
                            vuetify.VRangeSlider(
                                thumb_size=18,
                                thumb_label=True,
                                v_model=("color_range", [0, 1]),
                                min=("data_range[0]", 0),
                                max=("data_range[1]", 1),
                                step=0.001,
                                dense=False,
                                hide_details=True,
                                style="margin: 8px 0; height: 50px",
                                color="blue"
                            )
                            html.Div(
                                "Controls the color mapping range. Values below minimum show as dark blue, above maximum as dark red.",
                                style="font-size: 12px; color: #666; margin-top: 8px; text-align: center"
                            )
                        
                        # Threshold Control
                        with vuetify.VCard(
                            v_if=("mesh_status > 1",),
                            flat=True,
                            style="margin-bottom: 24px; padding: 20px; background-color: #e8f5e8; border-radius: 8px; border: 1px solid #4caf50"
                        ):
                            vuetify.VCardSubtitle(
                                "👁️ Threshold (Visibility)", 
                                style="padding: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #388e3c; text-align: center"
                            )
                            vuetify.VRangeSlider(
                                thumb_size=18,
                                thumb_label=True,
                                v_model=("threshold_range", [0, 1]),
                                min=("data_range[0]", 0),
                                max=("data_range[1]", 1),
                                step=0.001,
                                dense=False,
                                hide_details=True,
                                style="margin: 8px 0; height: 50px",
                                color="green"
                            )
                            html.Div(
                                "Controls which parts of the model are visible based on data values.",
                                style="font-size: 12px; color: #666; margin-top: 8px; text-align: center"
                            )
                        
                        # Reset Camera Button in Sidebar
                        with vuetify.VCard(
                            v_if=("mesh_status",),
                            flat=True,
                            style="padding: 16px; background-color: #fff3e0; border-radius: 8px; border: 1px solid #ff9800"
                        ):
                            vuetify.VCardSubtitle(
                                "📹 Camera Controls", 
                                style="padding: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #f57c00; text-align: center"
                            )
                            with vuetify.VBtn(
                                block=True,
                                color="orange",
                                click=self.ctrl.view_reset_camera,
                                style="margin: 8px 0"
                            ):
                                vuetify.VIcon("mdi-crop-free", style="margin-right: 8px")
                                html.Span("Reset Camera View")
            
            # Toolbar (simplified - only data selection)
            with layout.toolbar:
                # Array and Component Selection
                with vuetify.VCard(
                    v_if=("mesh_status > 1",),
                    flat=True,
                    style="flex: 1; margin-right: 16px; padding: 12px 16px; background-color: #fafafa; border-radius: 8px; border: 1px solid #e0e0e0"
                ):
                    with vuetify.VRow(no_gutters=True, align="center"):
                        with vuetify.VCol(cols=6):
                            vuetify.VSelect(
                                label="📊 Data Array",
                                v_model=("selected_array_index", 0),
                                items=("array_options", []),
                                item_text="text",
                                item_value="value",
                                dense=True,
                                hide_details=True,
                                outlined=True,
                                style="margin-right: 16px"
                            )
                        
                        with vuetify.VCol(
                            cols=6,
                            v_if=("component_options.length > 1",)
                        ):
                            vuetify.VSelect(
                                label="🧩 Component",
                                v_model=("selected_component_index", 0),
                                items=("component_options", []),
                                item_text="text",
                                item_value="value",
                                dense=True,
                                hide_details=True,
                                outlined=True
                            )
                
                vuetify.VProgressLinear(
                    indeterminate=True, absolute=True, bottom=True, active=("trame__busy",)
                )
            
            # Content
            with layout.content:
                with vuetify.VContainer(
                    fluid=True,
                    classes="pa-0 fill-height",
                    style="position: relative",
                    click="$vuetify.breakpoint.smAndDown ? (drawer = false) : null"
                ):
                    # Close drawer when clicking on 3D view (mobile/tablet)
                    html_view = vtk_widgets.VtkRemoteView(
                        self.renderWindow, 
                        interactive_ratio=("1",), 
                        interactive_quality=(80,),
                        style="cursor: grab"
                    )
                    self.ctrl.view_update = html_view.update
                    self.ctrl.view_reset_camera = html_view.reset_camera
                    
                    # Add floating close button for drawer when open
                    with vuetify.VBtn(
                        v_if="drawer && $vuetify.breakpoint.smAndDown",
                        fab=True,
                        small=True,
                        color="primary",
                        click="drawer = false",
                        style="position: absolute; top: 16px; right: 16px; z-index: 1000"
                    ):
                        vuetify.VIcon("mdi-close")

        # State change handlers
        @self.state.change("threshold_range")
        def update_filter(threshold_range, **kwargs):
            if hasattr(self, 'filter_mapper'):
                self.vtk_filter.SetLowerThreshold(threshold_range[0])
                self.vtk_filter.SetUpperThreshold(threshold_range[1])
                self.ctrl.view_update()

        @self.state.change("color_range")
        def update_color_range(color_range, **kwargs):
            if hasattr(self, 'state') and self.state.mesh_status > 1:
                self.update_color_mapping()
                self.ctrl.view_update()

        @self.state.change("selected_array_index")
        def update_active_array(selected_array_index, **kwargs):
            if (hasattr(self, 'state') and 
                self.state.available_arrays and 
                0 <= selected_array_index < len(self.state.available_arrays)):
                
                array_info = self.state.available_arrays[selected_array_index]
                success = self.set_active_array(array_info)
                if success:
                    self.ctrl.view_update()

        @self.state.change("selected_component_index")
        def update_active_component(selected_component_index, **kwargs):
            if (hasattr(self, 'state') and 
                self.state.component_options and 
                0 <= selected_component_index < len(self.state.component_options)):
                
                success = self.set_active_component(selected_component_index)
                if success:
                    self.ctrl.view_update()

        @self.state.change("mesh_status")
        def update_mesh_representations(**kwargs):
            color = [1, 1, 1]
            representation = 2
            opacity = 1

            if self.state.mesh_status == 2:
                color = [0.3, 0.3, 0.3]
                representation = 1
                opacity = 0.2

            property = self.mesh_actor.GetProperty()
            property.SetRepresentation(representation)
            property.SetColor(color)
            property.SetOpacity(opacity)
            property.SetLineWidth(2)
            self.ctrl.view_update()

    def load_vtk_file(self, vtk_file_path):
        """Load VTK file (either .vtk or .vtp format)"""
        try:
            file_ext = vtk_file_path.suffix.lower()
            
            if file_ext == '.vtp':
                # XML format
                reader = vtkXMLUnstructuredGridReader()
            elif file_ext == '.vtk':
                # Legacy format
                reader = vtkUnstructuredGridReader()
            else:
                raise ValueError(f"Unsupported file format: {file_ext}")
            
            reader.SetFileName(str(vtk_file_path))
            reader.Update()
            
            vtu = reader.GetOutput()
            self.vtk_grid.ShallowCopy(vtu)
            
            # Analyze available data arrays
            self.analyze_data_arrays()
            
            # Set initial visualization
            if self.state.available_arrays:
                self.set_active_array(self.state.available_arrays[0])
            else:
                self.state.mesh_status = 1
            
            self.renderer.ResetCamera()
            return True
            
        except Exception as e:
            print(f"Error loading VTK file: {e}")
            return False

    def analyze_data_arrays(self):
        """Analyze all available data arrays in the loaded dataset"""
        arrays = []
        
        # Check cell data arrays
        cell_data = self.vtk_grid.GetCellData()
        for i in range(cell_data.GetNumberOfArrays()):
            array = cell_data.GetArray(i)
            array_name = array.GetName() if array.GetName() else f"CellArray_{i}"
            components = array.GetNumberOfComponents()
            
            # Get range for each component
            if components == 1:
                comp_ranges = [array.GetRange()]
            else:
                comp_ranges = []
                for c in range(components):
                    comp_ranges.append(array.GetRange(c))
            
            arrays.append({
                'name': array_name,
                'location': 'cells',
                'size': array.GetNumberOfTuples(),
                'range': array.GetRange(),  # Overall range
                'components': components,
                'component_ranges': comp_ranges
            })
        
        # Check point data arrays
        point_data = self.vtk_grid.GetPointData()
        for i in range(point_data.GetNumberOfArrays()):
            array = point_data.GetArray(i)
            array_name = array.GetName() if array.GetName() else f"PointArray_{i}"
            components = array.GetNumberOfComponents()
            
            # Get range for each component
            if components == 1:
                comp_ranges = [array.GetRange()]
            else:
                comp_ranges = []
                for c in range(components):
                    comp_ranges.append(array.GetRange(c))
            
            arrays.append({
                'name': array_name,
                'location': 'points',
                'size': array.GetNumberOfTuples(),
                'range': array.GetRange(),  # Overall range
                'components': components,
                'component_ranges': comp_ranges
            })
        
        # Update state
        self.state.available_arrays = arrays
        
        # Create options for the UI dropdown
        array_options = []
        for i, arr in enumerate(arrays):
            array_options.append({
                'text': f"{arr['name']} ({arr['location']}) - {arr['components']} comp.",
                'value': i
            })
        self.state.array_options = array_options
        self.state.selected_array_index = 0
        
        # Debug output
        print(f"Found {len(arrays)} data arrays:")
        for arr in arrays:
            print(f"  - {arr['name']} ({arr['location']}): {arr['components']} components")
            for c, range_val in enumerate(arr['component_ranges']):
                comp_name = self.get_component_name(c, arr['components'])
                print(f"    {comp_name}: {range_val[0]:.3f} to {range_val[1]:.3f}")

    def get_component_name(self, component_index, total_components):
        """Get human-readable component name"""
        if total_components == 1:
            return "Value"
        elif total_components == 3:
            names = ["X", "Y", "Z"]
            return names[component_index] if component_index < 3 else f"Comp_{component_index}"
        elif total_components == 6:
            names = ["XX", "YY", "ZZ", "XY", "YZ", "XZ"]
            return names[component_index] if component_index < 6 else f"Comp_{component_index}"
        elif total_components == 9:
            names = ["XX", "XY", "XZ", "YX", "YY", "YZ", "ZX", "ZY", "ZZ"]
            return names[component_index] if component_index < 9 else f"Comp_{component_index}"
        else:
            return f"Comp_{component_index + 1}"

    def update_component_options(self, array_info):
        """Update available component options for the selected array"""
        components = array_info['components']
        component_options = []
        
        # Always add magnitude for multi-component arrays
        if components > 1:
            component_options.append({
                'text': 'Magnitude',
                'value': -1  # Special value for magnitude
            })
        
        # Add individual components
        for i in range(components):
            comp_name = self.get_component_name(i, components)
            component_options.append({
                'text': comp_name,
                'value': i
            })
        
        self.state.component_options = component_options
        self.state.selected_component_index = 0
        self.state.available_components = component_options
        
        print(f"Updated component options for {array_info['name']}: {len(component_options)} components")

    def set_active_array(self, array_info):
        """Set the active array for visualization"""
        try:
            print(f"Setting active array: {array_info['name']} ({array_info['components']} components)")
            
            self.state.selected_array = array_info['name']
            self.state.data_location = array_info['location']
            
            # Update component options for this array
            self.update_component_options(array_info)
            
            # Set the first component as active (this will trigger visualization update)
            if self.state.component_options:
                success = self.set_active_component(0)
                if success:
                    self.state.mesh_status = 2
                    print(f"Successfully activated array {array_info['name']}")
                    return True
                else:
                    print(f"Failed to activate component for array {array_info['name']}")
                    return False
            else:
                print(f"No component options available for array {array_info['name']}")
                return False
                
        except Exception as e:
            print(f"Error setting active array: {e}")
            
        return False

    def set_active_component(self, component_index):
        """Set the active component for visualization"""
        try:
            if not self.state.available_arrays or self.state.selected_array_index >= len(self.state.available_arrays):
                return False
            
            array_info = self.state.available_arrays[self.state.selected_array_index]
            array_name = array_info['name']
            location = array_info['location']
            
            if location == 'cells':
                data_arrays = self.vtk_grid.GetCellData()
                self.filter_mapper.SetScalarModeToUseCellData()
            else:  # points
                data_arrays = self.vtk_grid.GetPointData()
                self.filter_mapper.SetScalarModeToUsePointData()
            
            # Get the source array
            source_array = data_arrays.GetArray(array_name)
            if not source_array:
                return False
            
            # Extract component or compute magnitude
            component_value = self.state.component_options[component_index]['value']
            
            if component_value == -1:  # Magnitude
                extracted_array = self.extract_magnitude(source_array)
                self.state.current_component_name = f"{array_name}_Magnitude"
            else:  # Specific component
                extracted_array = self.extract_component(source_array, component_value)
                comp_name = self.get_component_name(component_value, array_info['components'])
                self.state.current_component_name = f"{array_name}_{comp_name}"
            
            # Set the extracted array as active scalars
            data_arrays.SetScalars(extracted_array)
            
            # Update ranges
            data_range = extracted_array.GetRange()
            self.state.data_range = list(data_range)
            self.state.color_range = list(data_range)  # Initially use full range
            self.state.threshold_range = list(data_range)
            self.state.full_min = data_range[0]
            self.state.full_max = data_range[1]
            self.state.selected_component_index = component_index
            
            # Update color mapping
            self.update_color_mapping()
            
            print(f"Active component set to: {self.state.current_component_name}, range: {data_range[0]:.3f} to {data_range[1]:.3f}")
            return True
                
        except Exception as e:
            print(f"Error setting active component: {e}")
            return False

    def extract_component(self, source_array, component_index):
        """Extract a specific component from a multi-component array"""
        from vtkmodules.numpy_interface import dataset_adapter as dsa
        import numpy as np
        
        # Convert to numpy for easier manipulation
        np_array = dsa.vtkDataArrayToVTKArray(source_array)
        
        if source_array.GetNumberOfComponents() == 1:
            # Single component, just copy the data
            component_data = np_array.flatten() if np_array.ndim > 1 else np_array
            comp_name = f"{source_array.GetName()}_value"
        else:
            # Multi-component, extract specific component
            if np_array.ndim == 1:
                # Sometimes multi-component arrays are flattened
                n_points = source_array.GetNumberOfTuples()
                n_comps = source_array.GetNumberOfComponents()
                np_array = np_array.reshape(n_points, n_comps)
            
            component_data = np_array[:, component_index]
            comp_name = f"{source_array.GetName()}_comp_{component_index}"
        
        # Ensure data is contiguous and the right type
        component_data = np.ascontiguousarray(component_data, dtype=np.float64)
        
        # Create new VTK array
        extracted_array = np2da(component_data, name=comp_name)
        print(f"Extracted component {component_index} from {source_array.GetName()}: {len(component_data)} values")
        return extracted_array

    def extract_magnitude(self, source_array):
        """Extract magnitude from a multi-component array"""
        from vtkmodules.numpy_interface import dataset_adapter as dsa
        import numpy as np
        
        # Convert to numpy
        np_array = dsa.vtkDataArrayToVTKArray(source_array)
        
        if source_array.GetNumberOfComponents() == 1:
            # Single component, magnitude is the absolute value
            magnitude_data = np.abs(np_array.flatten() if np_array.ndim > 1 else np_array)
        else:
            # Multi-component, compute magnitude
            if np_array.ndim == 1:
                # Sometimes multi-component arrays are flattened
                n_points = source_array.GetNumberOfTuples()
                n_comps = source_array.GetNumberOfComponents()
                np_array = np_array.reshape(n_points, n_comps)
            
            magnitude_data = np.linalg.norm(np_array, axis=1)
        
        # Ensure data is contiguous and the right type
        magnitude_data = np.ascontiguousarray(magnitude_data, dtype=np.float64)
        
        # Create new VTK array
        magnitude_array = np2da(magnitude_data, name=f"{source_array.GetName()}_magnitude")
        print(f"Extracted magnitude from {source_array.GetName()}: {len(magnitude_data)} values")
        return magnitude_array

    def update_color_mapping(self):
        """Update color mapping with custom range and clamping"""
        try:
            # Create custom lookup table with clamping
            lut = vtkLookupTable()
            lut.SetNumberOfTableValues(256)
            lut.Build()
            
            # Get current ranges
            color_min, color_max = self.state.color_range
            data_min, data_max = self.state.data_range
            
            # Set the color range for the lookup table
            lut.SetTableRange(color_min, color_max)
            
            # Define colors
            dark_blue = [0.0, 0.0, 0.4, 1.0]    # Dark blue for values below range
            dark_red = [0.4, 0.0, 0.0, 1.0]     # Dark red for values above range
            
            # Build color table
            for i in range(256):
                # Normal color scale (blue to red)
                ratio = i / 255.0
                
                # Use VTK's default blue-to-red color scale
                if ratio < 0.5:
                    # Blue to cyan
                    r = 0.0
                    g = 2.0 * ratio
                    b = 1.0
                else:
                    # Cyan to red
                    r = 2.0 * (ratio - 0.5)
                    g = 1.0 - 2.0 * (ratio - 0.5)
                    b = 0.0
                
                lut.SetTableValue(i, r, g, b, 1.0)
            
            # Set clamping colors
            lut.SetBelowRangeColor(dark_blue)
            lut.SetAboveRangeColor(dark_red)
            lut.SetUseBelowRangeColor(True)
            lut.SetUseAboveRangeColor(True)
            
            # Apply to mappers
            self.filter_mapper.SetLookupTable(lut)
            self.filter_mapper.SetScalarRange(color_min, color_max)
            
            print(f"Color mapping updated: range [{color_min:.3f}, {color_max:.3f}], data range [{data_min:.3f}, {data_max:.3f}]")
            
        except Exception as e:
            print(f"Error updating color mapping: {e}")

    def start_server(self):
        """Start the trame server"""
        # Auto-load job files if job_id is provided
        if self.job_id:
            try:
                files = self.load_job_files(self.job_id)
                
                # Try to load VTK file first (preferred method)
                if files['vtk']:
                    success = self.load_vtk_file(files['vtk'])
                    if success:
                        print(f"Successfully loaded VTK file for job {self.job_id}")
                    else:
                        print(f"Failed to load VTK file for job {self.job_id}")
                # Fallback to text files
                elif files['nodes'] and files['elements']:
                    success = self.process_fea_files(
                        files['nodes'], 
                        files['elements'], 
                        files['field']
                    )
                    if success:
                        print(f"Successfully loaded FEA text data for job {self.job_id}")
                    else:
                        print(f"Failed to load FEA text data for job {self.job_id}")
                else:
                    print(f"No suitable FEA files found for job {self.job_id}")
                    
            except Exception as e:
                print(f"Error loading job files: {e}")
        
        # Start server
        self.server.start(port=self.port)

def main():
    import signal
    
    parser = argparse.ArgumentParser(description="FEA Viewer Service")
    parser.add_argument("--job-id", help="Job ID to load FEA files from")
    parser.add_argument("--port", type=int, default=8080, help="Port to run server on")
    parser.add_argument("--data", help="Direct VTU file path")
    
    args = parser.parse_args()
    
    viewer = FEAViewer(job_id=args.job_id, port=args.port)
    
    # Handle direct VTK file loading
    if args.data:
        from pathlib import Path
        data_path = Path(args.data)
        success = viewer.load_vtk_file(data_path)
        if not success:
            print(f"Failed to load file: {args.data}")
            sys.exit(1)
    
    # Handle graceful shutdown
    def signal_handler(signum, frame):
        print(f"Received signal {signum}, shutting down gracefully...")
        sys.exit(0)
    
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        print(f"Starting FEA Viewer on port {args.port}")
        print("Server started")  # This message is used by the Node.js service to detect startup
        viewer.start_server()
    except KeyboardInterrupt:
        print("Shutting down...")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 