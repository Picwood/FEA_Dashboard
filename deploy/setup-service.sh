#!/bin/bash

# Set up systemd service for FEA Dashboard

set -e

echo "🔧 Setting up FEA Dashboard systemd service..."

# Create systemd service file
sudo cat > /etc/systemd/system/fea-dashboard.service << EOF
[Unit]
Description=FEA Dashboard Application
Documentation=https://github.com/your-repo/fea-dashboard
After=network.target

[Service]
Type=simple
User=feadash
WorkingDirectory=/opt/fea-dashboard
Environment=NODE_ENV=production
Environment=PORT=5000
ExecStart=/usr/bin/node /opt/fea-dashboard/dist/index.js
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5
PrivateTmp=true
StandardOutput=journal
StandardError=journal
SyslogIdentifier=fea-dashboard
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Enabling FEA Dashboard service..."
sudo systemctl enable fea-dashboard

echo "✅ Systemd service configured!"
echo "Commands to manage the service:"
echo "  Start:   sudo systemctl start fea-dashboard"
echo "  Stop:    sudo systemctl stop fea-dashboard"
echo "  Status:  sudo systemctl status fea-dashboard"
echo "  Logs:    sudo journalctl -u fea-dashboard -f" 