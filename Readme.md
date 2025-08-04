# Log Anomaly Detection Platform


## About The Project

A real-time, distributed log analysis platform built from scratch. This system ingests logs from multiple sources, processes them through a data pipeline, uses statistical methods to detect anomalies, and visualizes the results on a live web dashboard.

The project demonstrates a multi-language microservice architecture orchestrated with Docker.

---

## Tech Stack

* **Backend:** Python, FastAPI, Pandas
* **Frontend:** Next.js, React, TypeScript, Recharts, Tailwind CSS, shadcn/ui
* **Log Agent:** Go (Golang)
* **Database:** MongoDB
* **Message Queue:** Redis
* **Deployment:** Docker & Docker Compose

---

## Architecture

![Architecture Diagram](https://storage.googleapis.com/gemini-prod/images/c25576a0-53be-4943-8e7c-d3c299e52701.png)

---

## Features

* **Real-time Log Ingestion:** A lightweight Go agent produces logs.
* **Data Pipeline:** Redis acts as a high-speed message broker between services.
* **Anomaly Detection Engine:** The Python backend provides two types of detection:
    * **Error Burst Detection:** Identifies a rapid succession of error logs.
    * **Statistical Anomaly Detection:** Uses a moving average and standard deviation to find unusual spikes in error rates over time.
* **Live Dashboard:** A Next.js frontend with Recharts provides visualizations of log distributions and a live-updating table of recent logs and detected anomalies.
* **Real-time Alerting:** Sends instant notifications to a Discord channel via webhooks when anomalies are detected.

---

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

* Docker and Docker Compose must be installed.
* [Link to Docker Installation Guide](https://docs.docker.com/get-docker/)

### Installation & Running

1.  Clone the repo
    ```sh
    git clone [https://github.com/your_username/log-anomaly-detector.git](https://github.com/your_username/log-anomaly-detector.git)
    cd log-anomaly-detector
    ```
2.  (Optional) Create a `.env` file in the root directory and add your Discord Webhook URL:
    ```
    DISCORD_WEBHOOK_URL="your_webhook_url_here"
    ```
3.  Run the application using Docker Compose:
    ```sh
    docker-compose up --build -d
    ```
4.  Access the services:
    * Web Dashboard: `http://localhost:3000`
    * Backend API Docs: `http://localhost:8000/docs`
