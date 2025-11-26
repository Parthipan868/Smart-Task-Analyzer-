# Smart Task Analyzer

A task management system that helps users prioritize tasks based on multiple factors including due date, importance, effort, and dependencies.

## Features

- Task prioritization algorithm
- RESTful API for task management
- Web interface for task input and visualization
- Multiple sorting strategies

## Setup

1. Create and activate a virtual environment:
   ```
   python -m venv venv
   .\venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```
   python manage.py migrate
   ```

4. Start the development server:
   ```
   python manage.py runserver
   ```

5. Open `frontend/index.html` in your browser

## API Endpoints

- `POST /api/tasks/analyze/` - Analyze and score tasks
- `GET /api/tasks/suggest/` - Get task suggestions

## Project Structure

- `backend/` - Django project and app
- `frontend/` - Static HTML/CSS/JS files
