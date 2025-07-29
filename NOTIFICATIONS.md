# 🔔 Notification System

## Overview
The notification system provides real-time updates on simulation requests and their status changes. It's accessible via the bell icon in the dashboard header.

## Features

### ✨ Current Features
- **Recent Requests**: Shows the last 10 simulation requests sorted by date
- **Smart Notifications**: Displays unread count for requests from the last 24 hours  
- **Status Indicators**: Visual status badges (queued, running, done, failed)
- **Priority Display**: Shows request priority levels (P1-P5)
- **Quick Navigation**: Click notifications to go directly to project details
- **Rich Information**: Shows simulation name, project, bench type, and dates

### 📊 Notification Details
Each notification displays:
- **Simulation Name** - Primary identifier
- **Status Badge** - Current status with icon
- **Project Name** - Which project the simulation belongs to 
- **Bench & Type** - Technical details (e.g., "symmetric-bending • static")
- **Priority Level** - Request priority (P1 = highest, P5 = lowest)
- **Owner** - Who requested the simulation (currently "System User")
- **Date** - When the request was made (smart formatting: "Today", "2 days ago", etc.)
- **Due Date** - If specified, shows when results are needed

### 🔢 Unread Count
- Appears as a red badge on the bell icon
- Shows count of requests from the last 24 hours
- Updates automatically as new requests are created
- Shows "9+" for counts over 9

## Usage

### Accessing Notifications
1. Click the **🔔 bell icon** in the dashboard header
2. View the dropdown list of recent requests
3. Click any notification to go to that project
4. Click "📊 View All Requests" to see the full dashboard

### Understanding Status Colors
- **🟡 Queued** - Yellow badge, waiting to start
- **🔵 Running** - Blue badge, currently processing  
- **🟢 Done** - Green badge, completed successfully
- **🔴 Failed** - Red badge, encountered an error

### Date Formatting
- **Today** - Requests from today
- **Yesterday** - Requests from yesterday  
- **X days ago** - Recent requests (up to 7 days)
- **Month Day** - Older requests (e.g., "Dec 15")
- **Month Day, Year** - Previous years

## Technical Implementation

### Components
- **`NotificationDropdown.tsx`** - Main notification component
- Uses existing `useJobs()` and `useProjects()` hooks
- Integrates with Shadcn UI dropdown menu components

### Data Sources
- **Jobs Table** - Primary source of simulation requests
- **Projects Table** - For project names and context
- **Real-time Updates** - Through React Query caching

### Future Enhancements

#### 🚀 Planned Features
- **User Tracking** - Show actual requester names instead of "System User"
- **Mark as Read** - Ability to mark notifications as read/unread
- **Filtering** - Filter by status, priority, or project
- **Push Notifications** - Browser notifications for important updates
- **Email Notifications** - Email alerts for high-priority requests
- **Custom Alerts** - Set up alerts for specific conditions

#### 🔧 Technical Improvements
- Add `createdBy` field to jobs table to track actual requesters
- Implement notification persistence and read/unread state
- Add WebSocket support for real-time updates
- Create notification preferences system

## Integration Points

### Dashboard
- Replaces the static bell icon in the dashboard header
- Provides quick access to recent activity
- Links to detailed views for more information

### Project Pages  
- Notifications link directly to project detail pages
- Users can see full context and take action on requests
- Seamless navigation between notifications and project management

### Future Integration
- **Mobile App** - Push notifications for mobile users
- **Slack/Teams** - Integration with team communication tools
- **Calendar** - Due date integration with calendar systems
- **Reporting** - Notification analytics and reporting

## Development Notes

### Code Structure
```
client/src/components/NotificationDropdown.tsx
- Main component with dropdown UI
- Handles data fetching and formatting
- Manages unread count calculation
- Provides navigation functionality
```

### Styling
- Uses Tailwind CSS for consistent styling
- Matches existing dashboard design patterns
- Responsive design for different screen sizes
- Accessible with proper ARIA labels

### Performance
- Leverages React Query caching for efficiency
- Memoized calculations for recent requests
- Lightweight component with minimal re-renders
- Efficient date formatting and status calculations 