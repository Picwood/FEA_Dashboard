-- FEA Simulation Dashboard Database Schema
-- SQLite database for Raspberry Pi deployment

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project TEXT NOT NULL,
    bench TEXT NOT NULL CHECK (bench IN ('symmetric-bending', 'brake-load', 'unknown')),
    type TEXT NOT NULL CHECK (type IN ('static', 'fatigue')),
    date_request TEXT NOT NULL,
    date_due TEXT,
    priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'done', 'failed')),
    components TEXT DEFAULT '[]', -- JSON array of component names
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
);

CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    label TEXT NOT NULL, -- mesh, inp_file, result_log, general
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_project ON jobs(project);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_files_job_id ON files(job_id);

-- Seed data for development
INSERT INTO users (username, password_hash) VALUES
    ('admin', '$2b$10$rBGXTqKZNjDZw1XqN0VhOOhGZU8I0K5oJeYvUwNJnGkZy4YwXj1iS'), -- password: admin
    ('engineer', '$2b$10$8K5Jv2XN9mQoLpYx5QrKqOQWLs7R4k6y3P2zL9mXqN1Y8vZ4r6T'); -- password: engineer123

INSERT INTO jobs (project, bench, type, date_request, date_due, priority, status, components) VALUES
    ('AION36', 'symmetric-bending', 'static', '2024-01-20', '2024-01-25', 5, 'running', '["crown", "stanchion_left", "stanchion_right"]'),
    ('NRX32-IL', 'brake-load', 'fatigue', '2024-01-22', '2024-01-28', 3, 'queued', '["lower_monolith"]'),
    ('Enduro-Pro-2024', 'unknown', 'static', '2024-01-18', '2024-02-02', 1, 'done', '["crown", "steerer"]'),
    ('Cross-Country-X1', 'symmetric-bending', 'fatigue', '2024-01-15', '2024-01-30', 4, 'failed', '["crown", "stanchion_left", "stanchion_right", "steerer"]'),
    ('Downhill-Beast-V2', 'brake-load', 'static', '2024-01-25', '2024-02-05', 2, 'queued', '["lower_monolith", "crown"]');
