# FEA Simulation Dashboard

A local web application for managing FEA (Finite Element Analysis) simulations on fork suspension components, designed to run on a Raspberry Pi 4.

## Features

- **Dashboard**: Monitor ongoing and queued simulations with sortable columns
- **New Request Wizard**: 5-step workflow for creating simulation jobs
- **3D Component Selection**: Interactive Three.js viewer for selecting fork components
- **File Management**: Upload and manage mesh files, input files, and results
- **Job Tracking**: Status timeline and progress monitoring
- **Authentication**: Simple login system with hard-coded users

## Tech Stack

- **Backend**: Node.js 20 LTS + Express + TypeScript
- **Database**: SQLite (file-based, no external server)
- **Frontend**: React 18 + Vite + TypeScript
- **3D Viewer**: Three.js with @react-three/fiber
- **Styling**: TailwindCSS + shadcn/ui components
- **Authentication**: Express sessions with bcrypt

## Quick Start

### Prerequisites

- Node.js 20 LTS
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fea-dashboard
