# Use the official Playwright image which includes Python and browser dependencies
FROM mcr.microsoft.com/playwright/python:v1.41.0-jammy

WORKDIR /code

# Copy requirements first to leverage Docker cache
COPY ./requirements.txt /code/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Install only Chromium to keep image size reasonable (we default to chromium in scraper.py)
RUN playwright install chromium

# Copy the application code
COPY ./app /code/app

# Expose the port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
