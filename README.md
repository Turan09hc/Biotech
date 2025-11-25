# Biotech
NanoDSF Analysis Platform
A full-stack application for uploading, processing, analyzing, and visualizing NanoDSF experiment data.
This project includes both the React frontend and the backend API, forming a complete analysis workflow for thermal stability and protein unfolding experiments.
🚀 Features
Frontend (React + Vite + Tailwind)
Upload NanoDSF .csv or experiment data files
Beautiful, responsive UI
Interactive charts for unfolding curves
Loading states, error states, and clean component structure
API integration with the backend
Modern tooling (Vite, Axios, React Hooks)
Backend
API endpoints for receiving uploaded DSF data
Data processing & analysis logic
Temperature–fluorescence parsing
Optional smoothing, normalization, and melting-temperature (Tm) extraction
Returns JSON-formatted results to the frontend
📦 Tech Stack
Frontend
React
Vite
Tailwind CSS
Axios
JavaScript / JSX
Backend
(fill depending on your backend — Flask? FastAPI? Node.js?)
Example for Flask (if that's your backend):
Python
Flask
NumPy / SciPy
Pandas
If your backend is something else, I can adjust this section.
🗂️ Project Structure
Example structure (adjust based on your folders):
/frontend
  /src
    /components
    /api
    App.jsx
    main.jsx
/backend
  app.py
  analysis/
    parser.py
    processor.py
  requirements.txt

README.md
🔧 Installation & Setup
Frontend
cd frontend
npm install
npm run dev
Backend
cd backend
pip install -r requirements.txt
python app.py
🔗 API Workflow
Frontend uploads file → backend receives it
Backend parses DSF data
Analysis performed (curves, Tm, etc.)
JSON response returned
Frontend visualizes results interactively
📑 License
This project is for academic and research purposes.
Choose a license if needed (MIT recommended).
👤 Author
Turan Hasanzade
Asistants:
Farid Mammadov;
Suad;
Full-stack developer & creator of NanoDSF Analysis platform.
If you want, Turan, I can also:
✅ Customize README to match your exact backend (Flask / FastAPI / Node)
✅ Add diagrams, badges, screenshots
✅ Write CONTRIBUTING.md or API docs
