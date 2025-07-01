# AyposWeb

AyposWeb is a web-based monitoring and management system for virtual machines and compute resources.

## Prerequisites

Before running this project, make sure you have the following installed:
- Node.js (version 16 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AyposWeb
```

2. Install dependencies:
```bash
npm install
```

## Development

To run the project in development mode:

```bash
npm run dev
```

This will start the development server at `http://localhost:5173` (or another available port if 5173 is in use).

## Building for Production

To create a production build:

```bash
npm run build
```

The build output will be in the `dist` directory.

## Running Production Build

To preview the production build:

```bash
npm run preview
```

## Features

- Virtual Machine Monitoring
- Stress Testing
- Migration Management
- Temperature Monitoring
- Resource Distribution Visualization
- System Maintenance

## API Configuration

The application connects to an API server at `http://10.150.1.167:8003`. Make sure this endpoint is accessible from your network.

## Environment Variables

No additional environment variables are required to run the application in development mode.

## Browser Support

The application is optimized for modern browsers that support ES6+ features.
