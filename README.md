# 🩺 Chest X-Ray Disease Detection System

An AI-powered web application that uses Deep Learning to analyze chest X-ray images and classify them into four categories. The system provides prediction results, confidence scores, dashboard analytics, secure user authentication, and persistent scan history.

## 1. Project Overview

The **Chest X-Ray Disease Detection System** is an educational AI-based application developed using Python, TensorFlow/Keras, FastAPI, HTML, CSS, JavaScript, and SQLite.

Users can create an account, upload chest X-ray images, analyze them using a trained deep learning model, view prediction results, and manage their previous scan records.

## 2. Disease Categories

The model classifies chest X-ray images into four categories:

- COVID
- Lung Opacity
- Normal
- Viral Pneumonia

## 3. Key Features

- User registration and login
- JWT-based authentication
- AI-powered chest X-ray classification
- Image upload and analysis
- Prediction confidence percentage
- Score comparison across all four categories
- Interactive dashboard and scan statistics
- Persistent scan history using SQLite
- Search and filter scan records
- View detailed scan results
- Delete individual scan records
- PDF prediction report generation
- User profile management
- Neon Purple 3D interface
- Responsive frontend design

## 4. Technologies Used

| Component | Technology |
|---|---|
| Programming Language | Python |
| Deep Learning | TensorFlow / Keras |
| Backend Framework | FastAPI |
| Frontend | HTML, CSS, JavaScript |
| Database | SQLite |
| ORM | SQLAlchemy |
| Authentication | JWT |
| Image Processing | Pillow |
| PDF Reports | ReportLab |
| API Server | Uvicorn |

## 5. Project Structure

```text
Chest_Xray_Project/
│
├── backend/
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   └── models.py
│
├── frontend/
│   ├── css/
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   ├── history.css
│   │   ├── home.css
│   │   ├── profile.css
│   │   └── scanner.css
│   │
│   ├── js/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── history.js
│   │   ├── home.js
│   │   ├── profile.js
│   │   └── scanner.js
│   │
│   ├── dashboard.html
│   ├── history.html
│   ├── home.html
│   ├── login.html
│   ├── profile.html
│   ├── scanner.html
│   └── signup.html
│
├── models/
│   ├── class_names.json
│   ├── config.json
│   ├── metadata.json
│   └── xray_disease_detector.keras
│
├── data/
│
├── final_project.ipynb
├── requirements.txt
├── .gitignore
└── README.md
```

**Note:** The trained `.keras` model and original dataset are excluded from this GitHub repository because of their large file sizes. The trained model must be obtained and placed in the `models/` directory separately.

## 6. Installation Requirements

Make sure Python is installed on your computer.

Clone the repository:

```powershell
git clone https://github.com/simranjeetkaur6894-debug/Chest-X-Ray-Disease-Detection-System.git
```

Navigate to the project directory:

```powershell
cd Chest-X-Ray-Disease-Detection-System
```

Install the required dependencies:

```powershell
python -m pip install -r requirements.txt
```

Place the trained model file in the `models/` directory before starting the application.

## 7. Running the Backend

Open PowerShell in the project root directory and execute:

```powershell
python -m uvicorn backend.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API Documentation:

```text
http://127.0.0.1:8000/docs
```

Health Check:

```text
http://127.0.0.1:8000/health
```

## 8. Running the Frontend

Open a second PowerShell terminal:

```powershell
cd frontend
python -m http.server 5500
```

Open the application in your browser:

```text
http://localhost:5500
```

Keep both backend and frontend servers running while using the application.

## 9. Application Modules

| Module | Description |
|---|---|
| Home | Application introduction and navigation |
| Signup | New user registration |
| Login | Secure user login |
| Dashboard | Scan statistics and overview |
| Scanner | Upload and analyze X-ray images |
| History | View and manage previous scans |
| Profile | User profile information |

## 10. Database Management

The application uses SQLite for persistent data storage.

User records include account information, while scan history stores information such as:

- Scan ID
- User ID
- Uploaded filename
- Predicted disease category
- Confidence percentage
- Prediction scores
- Scan date and time

## 11. Application Workflow

1. Open the web application.
2. Create an account or log in.
3. Navigate to the Dashboard.
4. Open the Scanner section.
5. Upload a chest X-ray image.
6. Click the Analyze button.
7. View the predicted category and confidence score.
8. Download the prediction report as a PDF.
9. Visit History to review previous scans.
10. Manage scan records and profile information.

## 12. Future Enhancements

- Improved model evaluation and validation
- More advanced prediction visualizations
- Additional chest disease categories
- Cloud-based deployment
- Enhanced analytics and reporting

## 13. Medical Disclaimer

This project is developed for educational and academic purposes only. Its predictions are generated by an artificial intelligence model and may be inaccurate. The application is not intended to diagnose, treat, or prevent any medical condition. Always consult a qualified healthcare professional for medical advice.

## 14. Project Information

**Project Name:** Chest X-Ray Disease Detection System

**Project Type:** Artificial Intelligence / Deep Learning Web Application

**Interface Theme:** Neon Purple 3D

**Repository:** [GitHub Project Repository](https://github.com/simranjeetkaur6894-debug/Chest-X-Ray-Disease-Detection-System)

---

*Developed as an educational project demonstrating the integration of Deep Learning with a web-based application.*