# Vision AI - Real-Time Object Detection Engine 🚀

Welcome to the Vision AI project! This is a modern, full-stack application that uses the YOLO11 model to detect objects in real-time. You can use it with static images, uploaded video files, or your live webcam directly in the browser.

## 🛠️ Prerequisites
Before you start, make sure you have installed these free tools:
1. **Python 3.10+**: [Download here](https://www.python.org/downloads/)
2. **Node.js 24+**: [Download here](https://nodejs.org/) (LTS version recommended)
3. **Git**: [Download here](https://git-scm.com/downloads)

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
Open your terminal or command prompt and run these commands to download the project:
```bash
git clone [https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git](https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git)
cd YOUR-REPO-NAME
```
*(Note: Replace `YOUR-USERNAME/YOUR-REPO-NAME` with your actual GitHub repository link.)*

### 2. Setup and Run the AI Backend (Terminal 1)
You need to set up the Python environment and start the AI server. Make sure you are in the main project folder.

**For Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**For Windows:**
```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
*(Leave this terminal window open and running!)*

### 3. Setup and Run the Website (Terminal 2)
Open a **new, second terminal window**, navigate to your project folder, and start the React frontend:

```bash
cd YOUR-REPO-NAME
cd frontend
npm install
npm run dev
```

---

## 🎉 You're Done!
Once both servers are running, open your web browser and go to:
**http://localhost:5173**

You can now test the AI by uploading images, `.mp4` video files, or turning on your live webcam.