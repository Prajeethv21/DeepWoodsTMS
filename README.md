# Deepwoods Task Manager (DTM-V1)

Deepwoods Task Manager (DTM-V1) is an enterprise-grade, high-fidelity daily task checklist and project tracking dashboard. It features a modern dark UI customized to the Deepwoods brand identity (Green, Yellow, Black, White) with animated circular progress indicators, leaderboards, and real-time updates.

---

## 🛠️ Technology Stack

*   **Frontend**: React 18, Vite, React Router, Axios, Vanilla CSS Variables
*   **Backend**: Google Apps Script Web App API
*   **Database**: Google Sheets (tables: `tasks`, `projects`, `team_config`)
*   **Hostinger Deployment**: Includes Apache `.htaccess` url-rewrite rules for stable React SPA routing.

---

## 🚀 Local Development & Preview

DTM-V1 features a built-in **in-memory database sandbox simulator**. If the Google Apps Script backend URL is not configured, the client automatically defaults to mock mode.

1.  **Clone / Copy** the workspace folder.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the local development server:
    ```bash
    npm run dev
    ```
4.  Open the localhost URL in your browser.
5.  Click on any of the **Sandbox Dev Logins** on the login page to enter the dashboard instantly without any OAuth keys!

---

## 🔗 Production Deployment Manual

### 1. Google Sheets & Apps Script Setup (Backend)

The Apps Script files are located in the [backend/](file:///c:/Users/praje/Documents/DeepwoodsTaskManager/backend/) folder. Follow these steps to configure your Google Sheets database and Gmail integrations:

1.  Create a new, empty **Google Sheet** inside your Google Drive.
2.  Click on **Extensions** -> **Apps Script** in the top menu bar.
3.  In the Apps Script editor, create files matching the scripts inside `backend/`:
    *   [Code.gs](file:///c:/Users/praje/Documents/DeepwoodsTaskManager/backend/Code.gs)
    *   [Auth.gs](file:///c:/Users/praje/Documents/DeepwoodsTaskManager/backend/Auth.gs)
    *   [SheetsService.gs](file:///c:/Users/praje/Documents/DeepwoodsTaskManager/backend/SheetsService.gs)
    *   [DashboardService.gs](file:///c:/Users/praje/Documents/DeepwoodsTaskManager/backend/DashboardService.gs)
    *   [TriggerService.gs](file:///c:/Users/praje/Documents/DeepwoodsTaskManager/backend/TriggerService.gs)
    *   [Utils.gs](file:///c:/Users/praje/Documents/DeepwoodsTaskManager/backend/Utils.gs)
    *   [EmailService.gs](file:///c:/Users/praje/Documents/DeepwoodsTaskManager/backend/EmailService.gs)
4.  In the editor, click on `TriggerService.gs` and execute the `setupNightlyTrigger` function once to automatically schedule the nightly task carry-forward script (which runs at 11:59 PM).
5.  **Authorize Gmail Permissions (Critical for Mail Center):**
    *   In the function dropdown at the top of the editor, select the **`triggerGmailAuthorization`** function.
    *   Click **Run**.
    *   When the authorization prompt appears, click **Review Permissions**, select your Google account, click **Advanced > Go to Untitled project (unsafe)**, and click **Allow**.
6.  Click **Deploy** -> **New Deployment**.
    *   Choose type: **Web App**
    *   Execute as: **Me (your-email)**
    *   Who has access: **Anyone** (this is critical to allow React client requests).
7.  Copy the generated **Web App URL** (e.g. `https://script.google.com/macros/s/.../exec`).

> [!NOTE]
> On the first deployment, Google Sheets structures (`tasks`, `projects`, `team_config`) and sample seed rows will automatically bootstrap inside the active spreadsheet.

---

### 2. Client Build & Hostinger Deployment

1.  Create a `.env` file in the project root folder.
2.  Add your Google Apps Script URL and Google OAuth Client ID:
    ```env
    VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYED_URL_HERE/exec
    VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com
    ```
3.  Compile the production-ready build:
    ```bash
    npm run build
    ```
4.  Navigate to your **Hostinger HPanel** -> **File Manager** -> **public_html** folder.
5.  Upload the entire contents of the local [dist/](file:///c:/Users/praje/Documents/DeepwoodsTaskManager/dist/) folder (including `index.html`, the `assets` folder, and the `.htaccess` file) directly to `public_html`.

> [!IMPORTANT]
> The [.htaccess](file:///c:/Users/praje/Documents/DeepwoodsTaskManager/public/.htaccess) file tells Hostinger's Apache server to route all subfolder requests back to `index.html`. This ensures React Router links do not result in a `404 Not Found` error when reloaded.
