# 🚀 FEA Dashboard - Raspberry Pi Deployment Guide

This guide will help you deploy your FEA Dashboard application on a Raspberry Pi with persistent SQLite database and proper authentication.

## 📋 Prerequisites

### Raspberry Pi Requirements
- Raspberry Pi 4 (recommended) or Raspberry Pi 3B+
- MicroSD card (32GB+ recommended)
- Raspberry Pi OS (64-bit recommended)
- Network connection (WiFi or Ethernet)
- SSH access enabled

### Local Machine Requirements
- SSH client
- SCP or SFTP capability

## 🔧 Step 1: Prepare Your Raspberry Pi

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js
```bash
# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.3 Install Additional Dependencies
```bash
# Install build tools for native modules
sudo apt install -y build-essential python3 sqlite3

# Install PM2 for process management (optional but recommended)
sudo npm install -g pm2
```

## 📁 Step 2: Transfer Application Files

From your local development machine:

```bash
# Method 1: Using SCP
scp -r FEA_Dashboard/ pi@YOUR_PI_IP:/tmp/

# Method 2: Using rsync (if available)
rsync -avz --exclude node_modules FEA_Dashboard/ pi@YOUR_PI_IP:/tmp/FEA_Dashboard/

# Method 3: Using Git (if you have a repository)
ssh pi@YOUR_PI_IP
git clone https://github.com/your-username/FEA_Dashboard.git /tmp/FEA_Dashboard
```

## ⚙️ Step 3: Run Deployment Scripts

SSH into your Raspberry Pi and run the deployment scripts:

```bash
# Move application to proper location
sudo mv /tmp/FEA_Dashboard /opt/fea-dashboard

# Make scripts executable
sudo chmod +x /opt/fea-dashboard/deploy/*.sh

# Run setup script
cd /opt/fea-dashboard
sudo bash deploy/raspberry-pi-setup.sh

# Set up systemd service
sudo bash deploy/setup-service.sh

# Configure firewall (optional but recommended)
sudo bash deploy/setup-firewall.sh
```

## 🗃️ Step 4: Database Setup

The application will automatically:
- Create SQLite database at `/opt/fea-dashboard/data/database.sqlite`
- Initialize tables with proper schema
- Create default users with hashed passwords:
  - **Username:** `admin` **Password:** `admin`
  - **Username:** `engineer` **Password:** `engineer123`

### Database Location
- **Database file:** `/opt/fea-dashboard/data/database.sqlite`
- **Uploaded files:** `/opt/fea-dashboard/data/files/`
- **Logs:** `/var/log/fea-dashboard/`

## 🔐 Step 5: Security Configuration

### 5.1 Change Default Passwords
**Important:** Change the default passwords immediately after deployment!

1. Access the application at `http://YOUR_PI_IP:5000`
2. Log in with default credentials
3. Navigate to user management (if available) or update directly in database:

```bash
# Connect to SQLite database
sqlite3 /opt/fea-dashboard/data/database.sqlite

# Update admin password (replace 'NEW_HASHED_PASSWORD' with bcrypt hash)
UPDATE users SET password_hash = 'NEW_HASHED_PASSWORD' WHERE username = 'admin';

# To generate bcrypt hash in Node.js:
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('your_new_password', 10));"
```

### 5.2 Firewall Configuration
The setup script configures UFW firewall with:
- SSH access (port 22)
- FEA Dashboard access (port 5000)
- Local network restrictions

## 🚀 Step 6: Start the Application

```bash
# Start the service
sudo systemctl start fea-dashboard

# Check status
sudo systemctl status fea-dashboard

# View logs
sudo journalctl -u fea-dashboard -f

# Enable auto-start on boot
sudo systemctl enable fea-dashboard
```

## 🌐 Step 7: Access Your Dashboard

Your FEA Dashboard will be available at:
- **URL:** `http://YOUR_PI_IP:5000`
- **Default Admin:** `admin` / `admin`
- **Default Engineer:** `engineer` / `engineer123`

### Find Your Pi's IP Address
```bash
# On the Pi
hostname -I

# Or check your router's admin panel
# Or use network scanner from another device
```

## 📊 Management Commands

### Service Management
```bash
# Start service
sudo systemctl start fea-dashboard

# Stop service
sudo systemctl stop fea-dashboard

# Restart service
sudo systemctl restart fea-dashboard

# Check status
sudo systemctl status fea-dashboard

# View logs
sudo journalctl -u fea-dashboard -f

# View application logs
tail -f /var/log/fea-dashboard/app.log
```

### Database Management
```bash
# Backup database
cp /opt/fea-dashboard/data/database.sqlite /opt/fea-dashboard/data/database.sqlite.backup

# Connect to database
sqlite3 /opt/fea-dashboard/data/database.sqlite

# View tables
.tables

# View users
SELECT * FROM users;

# View projects
SELECT * FROM projects;
```

### Application Updates
```bash
# Stop service
sudo systemctl stop fea-dashboard

# Backup data
sudo cp -r /opt/fea-dashboard/data /opt/fea-dashboard/data.backup

# Update application files
# (transfer new files, then rebuild)
cd /opt/fea-dashboard
sudo -u feadash npm install
sudo -u feadash npm run build

# Start service
sudo systemctl start fea-dashboard
```

## 🔧 Troubleshooting

### Service Won't Start
```bash
# Check service status
sudo systemctl status fea-dashboard

# Check logs
sudo journalctl -u fea-dashboard

# Check if port is in use
sudo netstat -tulpn | grep 5000

# Check file permissions
sudo ls -la /opt/fea-dashboard/
```

### Database Issues
```bash
# Check database file permissions
sudo ls -la /opt/fea-dashboard/data/

# Test database connection
sqlite3 /opt/fea-dashboard/data/database.sqlite ".tables"

# Check if database is locked
sudo lsof /opt/fea-dashboard/data/database.sqlite
```

### Network Access Issues
```bash
# Check firewall status
sudo ufw status

# Check if service is listening
sudo netstat -tulpn | grep 5000

# Test from Pi itself
curl http://localhost:5000

# Check network connectivity
ping YOUR_PI_IP
```

## 🔄 Backup Strategy

### Automated Backup Script
Create `/opt/fea-dashboard/scripts/backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/fea-dashboard/backups"

mkdir -p $BACKUP_DIR

# Backup database
cp /opt/fea-dashboard/data/database.sqlite $BACKUP_DIR/database_$DATE.sqlite

# Backup uploaded files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /opt/fea-dashboard/data/files/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sqlite" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### Schedule Daily Backups
```bash
# Add to crontab
sudo crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /opt/fea-dashboard/scripts/backup.sh >> /var/log/fea-dashboard/backup.log 2>&1
```

## 📈 Performance Optimization

### For Raspberry Pi 4
- Application should run smoothly with default settings
- Consider increasing Node.js memory if handling large files:
  ```bash
  # Edit systemd service
  sudo systemctl edit fea-dashboard
  
  # Add memory limit
  [Service]
  Environment=NODE_OPTIONS="--max-old-space-size=2048"
  ```

### For Raspberry Pi 3
- Reduce concurrent operations
- Consider using a lightweight database like SQLite (already configured)
- Monitor memory usage: `htop`

## 🆘 Support

If you encounter issues:

1. **Check the logs:** `sudo journalctl -u fea-dashboard -f`
2. **Verify file permissions:** All files should be owned by `feadash` user
3. **Check network connectivity:** Ensure port 5000 is accessible
4. **Database integrity:** Use SQLite commands to verify database

## 📝 Notes

- Default credentials should be changed immediately
- Database is automatically backed up before application updates
- The application runs as a dedicated `feadash` user for security
- Logs are rotated automatically by systemd
- UFW firewall is configured for basic security

---

**Your FEA Dashboard is now deployed and ready for use on your Raspberry Pi!** 🎉 