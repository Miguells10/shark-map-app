# Shark Map - Predictive Shark Habitat Explorer

A web app built with Flask and Python to explore and predict where sharks are most likely to hang out based on ocean data. You can even simulate their paths on the map!


## About This Project

Shark Map lets you peek into the ocean world using satellite data. It looks at things like sea surface temperature and chlorophyll (basically how much food is around) to create a “probability map” of where sharks might be.
Pick a shark species, see its favorite spots, and click on the map to see the most likely path it would take to hunt. It’s interactive, visual, and kind of like giving yourself a mini ocean adventure from your browser.

**Built With:**
Backend:Python, Flask, NumPy, Matplotlib, Pillow
Frontend:HTML, CSS, JavaScript

## What You Can Do
Probability Maps: See where different sharks like to hang out based on environmental data.
Route Tracing: Click on the map and watch a shark’s most probable path unfold.

## Getting Started
Here’s how to get this running locally on your machine so you can play around with it.

### Prerequisites

Make sure you have:

Python 3.9+ – [Download here](https://www.python.org/downloads/)
Git – [Download here](https://git-scm.com/downloads)

### How to Run Locally

1. **Clone the Repo**

```bash
git clone https://github.com/brspinho/shark-map-app.git
```

2. **Go into the Project Folder**

```bash
cd shark-map-app
```

3. **Create a Virtual Environment**

```bash
python -m venv .venv
```

4. **Activate It**

* On Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
```

* On Windows (Command Prompt):

```cmd
.\.venv\Scripts\activate.bat
```

* On macOS/Linux:

```bash
source .venv/bin/activate
```

5. **Install Dependencies**

```bash
python -m pip install -r requirements.txt
```

6. **Start the App**

```bash
python app.py
```

It should show up at [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## How to Use It

1. The app will load a probability map for the default shark (Tiger Shark).
2. Use the dropdown to pick another species and click “Generate Map.”
3. Click anywhere on the map to simulate the shark’s likely path.
