#!/bin/bash

# FEA Dashboard Python Dependencies Setup Script
# Run this script on your Raspberry Pi to install Python dependencies for Trame viewer

set -e

echo "🐍 Setting up Python dependencies for FEA Dashboard..."

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Installing Python3..."
    sudo apt update
    sudo apt install -y python3 python3-pip python3-venv
fi

# Check if pip3 is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Installing pip3..."
    sudo apt install -y python3-pip
fi

echo "✅ Python3 and pip3 are available"
echo "Python3 version: $(python3 --version)"
echo "pip3 version: $(pip3 --version)"

# Install system dependencies for VTK (Raspberry Pi optimized)
echo "📦 Installing system dependencies for VTK..."
sudo apt update
sudo apt install -y \
    build-essential \
    cmake \
    libgl1-mesa-dev \
    libglu1-mesa-dev \
    libxt-dev \
    libxrender-dev \
    libxrandr-dev \
    libxinerama-dev \
    libxi-dev \
    libxext-dev \
    libxfixes-dev \
    libxcursor-dev \
    libxcomposite-dev \
    libxdamage-dev \
    libxss-dev \
    libxrandr-dev \
    libasound2-dev \
    libpulse-dev \
    libdbus-1-dev \
    libudev-dev \
    libevdev-dev \
    libmtdev-dev \
    libts-dev \
    libxcb-xinerama0-dev \
    libxcb-icccm-dev \
    libxcb-image0-dev \
    libxcb-keysyms1-dev \
    libxcb-randr0-dev \
    libxcb-render-util0-dev \
    libxcb-xfixes0-dev \
    libxcb-shape0-dev \
    libosmesa6-dev \
    libgles2-mesa-dev \
    libegl1-mesa-dev

# Create virtual environment for the application
APP_DIR="/opt/fea-dashboard"
VENV_DIR="$APP_DIR/venv"

echo "🔧 Creating Python virtual environment..."
if [ -d "$VENV_DIR" ]; then
    echo "Virtual environment already exists, removing old one..."
    sudo rm -rf "$VENV_DIR"
fi

sudo -u feadash python3 -m venv "$VENV_DIR"
echo "✅ Virtual environment created at $VENV_DIR"

# Activate virtual environment and install Python packages
echo "📦 Installing Python packages..."
sudo -u feadash bash -c "source $VENV_DIR/bin/activate && pip install --upgrade pip"

# Install packages from requirements.txt
if [ -f "$APP_DIR/python/requirements.txt" ]; then
    echo "Installing packages from requirements.txt..."
    sudo -u feadash bash -c "source $VENV_DIR/bin/activate && pip install -r $APP_DIR/python/requirements.txt"
else
    echo "⚠️  requirements.txt not found, installing packages manually..."
    sudo -u feadash bash -c "source $VENV_DIR/bin/activate && pip install trame>=3.2.0 trame-vuetify>=2.4.0 trame-vtk>=2.8.0 vtk>=9.3.0 numpy>=1.24.0 pandas>=2.0.0"
fi

# Test Python installation
echo "🧪 Testing Python installation..."
sudo -u feadash bash -c "source $VENV_DIR/bin/activate && python -c \"import vtk; import trame; import numpy; import pandas; print('✅ All Python packages installed successfully!')\""

# Configure VTK for Raspberry Pi
echo "🔧 Configuring VTK for Raspberry Pi..."
sudo -u feadash bash -c "source $VENV_DIR/bin/activate && python -c \"
import vtk
import os

# Set VTK environment variables for Raspberry Pi
os.environ['VTK_RENDERER'] = 'OpenGL2'
os.environ['VTK_OPENGL_HAS_OSMESA'] = '1'
os.environ['VTK_USE_OSMESA'] = '1'
os.environ['VTK_SILENCE_GET_VOID_POINTER_WARNINGS'] = '1'
os.environ['VTK_SILENCE_DEPRECATION_WARNINGS'] = '1'

# Test VTK rendering
renderer = vtk.vtkRenderer()
render_window = vtk.vtkRenderWindow()
render_window.AddRenderer(renderer)
render_window.SetOffScreenRendering(True)
render_window.SetSize(100, 100)

# Create a simple test
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
print('✅ VTK rendering test successful on Raspberry Pi!')
\""

# Create a symlink for easier access
echo "🔗 Creating symlink for Python executable..."
sudo ln -sf "$VENV_DIR/bin/python" "$APP_DIR/python"
sudo chown feadash:feadash "$APP_DIR/python"

# Update the python-service.ts to use the virtual environment
echo "🔧 Updating Python service configuration..."
if [ -f "$APP_DIR/server/python-service.ts" ]; then
    # Backup original file
    sudo cp "$APP_DIR/server/python-service.ts" "$APP_DIR/server/python-service.ts.backup"
    
    # Update the Python path in the service
    sudo sed -i "s|spawn('python'|spawn('$VENV_DIR/bin/python'|g" "$APP_DIR/server/python-service.ts"
    
    echo "✅ Updated Python service to use virtual environment"
fi

echo "🎉 Python setup completed successfully!"
echo ""
echo "📋 Summary:"
echo "- Python virtual environment: $VENV_DIR"
echo "- Python executable: $APP_DIR/python"
echo "- All required packages installed and tested"
echo ""
echo "🚀 You can now start the FEA Dashboard service:"
echo "   sudo systemctl start fea-dashboard"
echo ""
echo "🔍 To test the Trame viewer manually:"
echo "   cd $APP_DIR"
echo "   sudo -u feadash $VENV_DIR/bin/python python/fea_viewer.py --port 8080" 