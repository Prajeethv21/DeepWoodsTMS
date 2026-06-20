# Deepwoods Task Manager (DTM-V1) Backend Setup & Deployment Guide

This directory contains the serverless backend code for **DTM-V1**, written in **Google Apps Script (GAS)**. 

Because this application is designed for **Hostinger Shared Hosting** (without a dedicated Node.js VPS runtime), the backend runs entirely serverless and free on Google Cloud services, connecting directly to a Google Sheets database.

---

## 📋 Architecture Overview

* **Database**: A Google Sheets file storing tasks, projects list, rankings, and team member configs.
* **API Engine**: Google Apps Script bound script, deployed as a Web App.
* **Security**: CORS-preflight-free POST requests with an authorization secret token.
* **Frontend Integration**: Built static bundles served by Hostinger, requesting the Apps Script macro endpoint.

---

## 🛠️ Step 1: Provision Google Sheets Database

1. Create a new Google Sheet named **Deepwoods Task Manager Database**.
2. Initialize **four tabs** inside the sheet with the following exact column headers:

### Tab 1: `tasks`
`row_counter` | `task_id` | `project_ref` | `plan_level` | `date` | `member_name` | `member_email` | `task_title` | `task_description` | `priority` | `status` | `remarks` | `carried_forward` | `original_date` | `completed_at` | `generated_by`

### Tab 2: `projects`
`project_ref` | `project_name` | `start_date` | `end_date` | `status` | `is_internal` | `owner`

### Tab 3: `team_config`
`member_email` | `member_name` | `role` | `is_admin`

### Tab 4: `daily_rankings`
`date` | `member_email` | `efficiency_score` | `tasks_completed` | `tasks_assigned`

---

## 💻 Step 2: Set Up Google Apps Script Backend

1. In your newly created Google Sheet, navigate to the top menu and select **Extensions > Apps Script**.
2. Delete any default code in the editor.
3. Create the following files in the Apps Script project matching the local files in this folder:
   - Create `Utils.gs` and copy the code from `backend/Utils.gs`.
   - Create `Auth.gs` and copy the code from `backend/Auth.gs`.
   - Create `SheetsService.gs` and copy the code from `backend/SheetsService.gs`.
   - Create `DashboardService.gs` and copy the code from `backend/DashboardService.gs`.
   - Create `TriggerService.gs` and copy the code from `backend/TriggerService.gs`.
   - Create `Code.gs` and copy the code from `backend/Code.gs`.
4. Click the **Save** (disk) icon in the editor.

---

## 🚀 Step 3: Deploy the Backend Web App

1. In the Apps Script editor, click the **Deploy** button in the top right and select **New Deployment**.
2. Click the gear icon next to "Select type" and choose **Web App**.
3. Fill in the deployment details:
   - **Description**: `DTM-V1 API Production`
   - **Execute as**: `Me (your-google-account@gmail.com)`
   - **Who has access**: `Anyone` *(Note: Requests are authenticated using the secure token inside code)*
4. Click **Deploy**.
5. Copy the generated **Web App URL** (it looks like `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 📅 Step 4: Configure Nightly Carry-Forward Scheduler

Google Apps Script handles daily tasks roll-over automatically using time-driven triggers. To set it up:

1. In the Apps Script sidebar, click the **Triggers** icon (the clock icon).
2. Click the **+ Add Trigger** button in the bottom right corner.
3. Configure the trigger settings:
   - **Choose which function to run**: `nightlyCarryForwardTrigger`
   - **Choose which deployment to run**: `Head`
   - **Select event source**: `Time-driven`
   - **Select type of time-based trigger**: `Day timer`
   - **Select hour interval**: `Midnight to 1 AM` (or `11 PM to Midnight`)
4. Click **Save**.

This trigger automatically runs every night, moving any uncompleted tasks (`Yet to Start` or `In Progress`) from the current day to the next morning, marking them as `Carried Forward`.

---

## 🔗 Step 5: Connect Frontend to Backend

1. Navigate to the local `/frontend` folder of this project.
2. Open or create the file `frontend/.env`.
3. Set the variables:
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbYOUR_ACTUAL_DEPLOYED_URL_HERE/exec
   ```
4. Save the file.
5. In your local development terminal, navigate to `/frontend` and run:
   ```bash
   cd frontend
   npm run dev
   ```
   The site will now fetch and update task lists directly from your Google Sheets database in real-time!

---

## 🌍 Step 6: Deploy to Hostinger Shared Hosting (No VPS Needed)

Hostinger Shared Hosting only requires static file assets (HTML, JavaScript, and CSS). 

1. Inside `/frontend`, generate the production build:
   ```bash
   cd frontend
   npm run build
   ```
   This compiles your React app into `/frontend/dist/`.
2. Access your Hostinger Control Panel (hPanel) and open the **File Manager** for your domain.
3. Navigate to the `public_html` directory.
4. Upload all files and folders inside your local `/frontend/dist/` directory directly into `public_html/`.
5. Ensure that the **`.htaccess`** file (located in `frontend/public/.htaccess` and copied into `dist/`) is successfully uploaded. This file enables clean routing redirection for Single Page Applications (SPA), preventing `404 Not Found` errors when users navigate to `/admin`, `/projects`, or `/ranking` directly.

**Congratulations! Your premium DTM-V1 dashboard is now fully active, serverless, and hosted on Hostinger Shared Hosting.**
