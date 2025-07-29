# 🔧 FEA Dashboard - Raspberry Pi Troubleshooting Guide

This guide helps resolve common issues when deploying the FEA Dashboard on Raspberry Pi, especially related to the Trame 3D viewer.

## 🚨 Common Issues

### 1. Trame Viewer Won't Start (500 Internal Server Error)

**Symptoms:**
- Clicking "Start Viewer" returns 500 error
- No 3D visualization appears
- Console shows "Failed to start Trame viewer"

**Diagnosis:**
```bash
# Check if Python is installed
python3 --version

# Check if Python packages are installed
python3 -c "import vtk; import trame; print('Python packages OK')"

# Check service logs
sudo journalctl -u fea-dashboard -f

# Check if Python executable is found
ls -la /opt/fea-dashboard/python
ls -la /opt/fea-dashboard/venv/bin/python
```

**Solutions:**

#### A. Python Not Installed
```bash
# Install Python3 and dependencies
sudo apt update
sudo apt install -y python3 python3-pip python3-venv

# Run Python setup script
cd /opt/fea-dashboard
sudo bash deploy/setup-python.sh
```

#### B. Python Packages Missing
```bash
# Activate virtual environment and install packages
cd /opt/fea-dashboard
source venv/bin/activate
pip install -r python/requirements.txt

# Or install manually
pip install trame>=3.2.0 trame-vuetify>=2.4.0 trame-vtk>=2.8.0 vtk>=9.3.0 numpy>=1.24.0 pandas>=2.0.0
```

#### C. VTK Dependencies Missing
```bash
# Install system dependencies for VTK
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
    libxcb-shape0-dev
```

#### D. Test Trame Viewer Manually
```bash
# Test the viewer directly
cd /opt/fea-dashboard
sudo -u feadash venv/bin/python python/fea_viewer.py --port 8080

# If successful, you should see:
# "Starting FEA Viewer on port 8080"
# "Server started"
```

### 2. Port Already in Use

**Symptoms:**
- "Address already in use" error
- Multiple Trame instances trying to use same port

**Solution:**
```bash
# Check what's using the port
sudo netstat -tulpn | grep 8080

# Kill existing processes
sudo pkill -f fea_viewer.py

# Restart the service
sudo systemctl restart fea-dashboard
```

### 3. Permission Issues

**Symptoms:**
- "Permission denied" errors
- Can't create virtual environment
- Can't write to application directory

**Solution:**
```bash
# Fix ownership
sudo chown -R feadash:feadash /opt/fea-dashboard

# Fix permissions
sudo chmod -R 755 /opt/fea-dashboard

# Ensure feadash user exists
sudo useradd -m -s /bin/bash feadash 2>/dev/null || true
```

### 4. Memory Issues (Raspberry Pi 3)

**Symptoms:**
- Python process crashes
- "Killed" messages in logs
- Out of memory errors

**Solution:**
```bash
# Increase swap space
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Monitor memory usage
htop
free -h
```

### 5. Network Access Issues

**Symptoms:**
- Can't access Trame viewer from other devices
- "Connection refused" errors

**Solution:**
```bash
# Check firewall status
sudo ufw status

# Allow Trame viewer ports (8080-8090)
sudo ufw allow 8080:8090/tcp

# Check if service is listening
sudo netstat -tulpn | grep 5000
sudo netstat -tulpn | grep 8080
```

## 🔍 Diagnostic Commands

### Check Service Status
```bash
# Service status
sudo systemctl status fea-dashboard

# Service logs
sudo journalctl -u fea-dashboard -f

# Application logs
tail -f /var/log/fea-dashboard/app.log
```

### Check Python Installation
```bash
# Python version
python3 --version

# Check virtual environment
ls -la /opt/fea-dashboard/venv/bin/

# Test Python packages
cd /opt/fea-dashboard
source venv/bin/activate
python -c "import vtk; print('VTK version:', vtk.vtkVersion.GetVTKVersion())"
python -c "import trame; print('Trame version:', trame.__version__)"
```

### Check File Permissions
```bash
# Check ownership
ls -la /opt/fea-dashboard/

# Check Python script permissions
ls -la /opt/fea-dashboard/python/fea_viewer.py

# Check data directory
ls -la /opt/fea-dashboard/data/files/
```

### Check Network Configuration
```bash
# Check IP address
hostname -I

# Check listening ports
sudo netstat -tulpn | grep -E "(5000|8080)"

# Test local access
curl http://localhost:5000
curl http://localhost:8080
```

## 🛠️ Manual Recovery Steps

### Complete Reset
```bash
# Stop service
sudo systemctl stop fea-dashboard

# Remove virtual environment
sudo rm -rf /opt/fea-dashboard/venv

# Reinstall Python dependencies
cd /opt/fea-dashboard
sudo bash deploy/setup-python.sh

# Restart service
sudo systemctl start fea-dashboard
```

### Rebuild Application
```bash
# Stop service
sudo systemctl stop fea-dashboard

# Rebuild Node.js application
cd /opt/fea-dashboard
sudo -u feadash npm install
sudo -u feadash npm run build

# Restart service
sudo systemctl start fea-dashboard
```

### Database Reset (⚠️ Data Loss)
```bash
# Backup current database
sudo cp /opt/fea-dashboard/data/database.sqlite /opt/fea-dashboard/data/database.sqlite.backup

# Remove database
sudo rm /opt/fea-dashboard/data/database.sqlite

# Restart service (will recreate database)
sudo systemctl restart fea-dashboard
```

## 📞 Getting Help

If you're still experiencing issues:

1. **Collect diagnostic information:**
   ```bash
   # Create diagnostic report
   sudo bash -c 'cat > /tmp/fea-diagnostic.txt << EOF
   === FEA Dashboard Diagnostic Report ===
   Date: $(date)
   
   === System Info ===
   $(uname -a)
   
   === Python Info ===
   $(python3 --version 2>&1)
   $(which python3)
   
   === Service Status ===
   $(sudo systemctl status fea-dashboard)
   
   === Recent Logs ===
   $(sudo journalctl -u fea-dashboard --no-pager -n 50)
   
   === File Permissions ===
   $(ls -la /opt/fea-dashboard/)
   
   === Network Status ===
   $(sudo netstat -tulpn | grep -E "(5000|8080)")
   EOF'
   ```

2. **Check the logs:**
   ```bash
   sudo journalctl -u fea-dashboard -f
   ```

3. **Test manually:**
   ```bash
   cd /opt/fea-dashboard
   sudo -u feadash venv/bin/python python/fea_viewer.py --port 8080
   ```

## 🎯 Quick Fix Checklist

- [ ] Python3 installed and working
- [ ] Virtual environment created and activated
- [ ] All Python packages installed (trame, vtk, numpy, pandas)
- [ ] VTK system dependencies installed
- [ ] File permissions correct (owned by feadash user)
- [ ] Service running and accessible
- [ ] Firewall allows necessary ports
- [ ] Sufficient memory/swap space available

## 📝 Notes

- The Trame viewer requires significant system resources
- Raspberry Pi 4 (4GB+) is recommended for optimal performance
- Python packages can take 10-30 minutes to install on first run
- VTK compilation may fail on older Raspberry Pi models due to memory constraints
- Always backup your database before making changes 