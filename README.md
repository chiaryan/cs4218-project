Milestone 1 CI link: https://github.com/cs4218/cs4218-2420-ecom-project-team30/actions/runs/13256993569/job/37005462984

# Project Setup

## Installation

1. **Install backend dependencies:**

```
npm install
npx playwright install
```

2. **Install frontend dependencies:**

```
cd client
npm install
```

## Configuration

Update the MongoDB connection string in the .env file. We have attached a new .env file together with the reports in the zip file of the Milestone 2 submission. Copy the new MONGO_URL in the attached .env file and paste it into the MONGO_URL in this
.env file

```
MONGO_URL=<mongodb-connection-string-from-attached-.env-file>
```

## Running the Application

To run the application in development mode

```
npm run dev
```

## Running Tests

- To run frontend tests

```
npm run test:frontend
```

- To run backend tests

```
npm run test:backend
```

- To run UI tests

```
npx playwright test
```
