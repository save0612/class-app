# Class App with MySQL

This project sets up a Node.js application (`class-app`) with a MySQL database using Docker Compose. The application is built using NestJS. The MySQL database is connected to the app, and both services are configured to work together.

## Prerequisites

Before starting, ensure you have the following installed:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (for local development, if you need to build locally before containerizing)

## Project Structure

The project consists of two main services:

1. **class-app**: The Node.js application that communicates with the MySQL database.
2. **mysql**: The MySQL database container that stores the application's data.

The application uses a Docker Compose configuration to orchestrate these services.

## Getting Started

### Step 1: Clone the Repository

Clone the repository from GitHub to your local machine:

```bash
git clone https://github.com/save0612/class-app
cd class-app
```

### Step 2: Setup the environment

Before building the containers, make sure to copy the `.env.example` file to `.env`. This will set up the necessary environment variables for connecting to the MySQL service.

```bash
cp .env.example .env
```

### Step 3: Build and Start the Containers

Run the following command to build the images and start the services:

```bash
docker-compose up -d
```

### Step 4: Running Tests (Optional)

Run end-to-end tests:

```bash
docker exec -it class-app npm run test:e2e
```
