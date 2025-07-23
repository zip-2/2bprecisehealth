# PharmGKB API Testing

This project contains API tests for the `clinicalAnnotation` endpoint of the PharmGKB API using Python, Pytest, and Playwright.

## Setup Instructions

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
playwright install
```

## Run the Tests

```bash
pytest -v -s
```
