# IMF Africa Pay

A complete payment processing application for the International Ministers Forum.

## Project Structure

```
imf-africa-pay/
├── server.js              # Backend server (Node.js/Express)
├── package.json           # Root package.json for backend
├── src/                   # Frontend React application
│   ├── package.json       # Frontend package.json
│   ├── index.html         # Main HTML file
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # Main App component
│   ├── pages/             # Page components
│   ├── components/        # Reusable components
│   └── ...
└── uploads/               # Directory for uploaded payment receipts
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   cd src
   npm install
   cd ..
   ```

2. Start the development servers:
   ```bash
   # Option 1: Run both frontend and backend concurrently
   npm run dev
   
   # Option 2: Run frontend and backend separately
   # Terminal 1: Start backend
   npm run server
   
   # Terminal 2: Start frontend
   npm run client
   ```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health check: http://localhost:3000/api/health

## API Endpoints

- `POST /api/send-transfer-receipt` - Submit payment receipt
- `GET /api/payments` - Get all payment records
- `GET /api/payments/:id` - Get specific payment record
- `GET /api/health` - Health check endpoint

## Features

- Professional payment processing workflow
- Secure file upload for payment receipts
- Responsive design with light/dark mode
- Form validation and error handling
- RESTful API backend
- CORS enabled for frontend integration

## Environment Variables

Create a `.env` file in the root directory:
```
MONGODB_URI=your_mongodb_connection_string
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_email_password_or_app_password
EMAIL_FROM="IMF Africa Pay" <no-reply@your-domain.com>
IMF_EMAIL=admin@imfafrica.org
```

Create a `.env` file in the `src/` directory:
```
VITE_API_URL=http://localhost:3000
```

## File Uploads

Uploaded payment receipts are stored in the `uploads/` directory with unique filenames to prevent conflicts.

## Deployment

### Deploy to Render

1. Push your code to a GitHub repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Set the following environment variables in Render:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB connection string
   - `EMAIL_HOST`: Your email SMTP host
   - `EMAIL_PORT`: Your email SMTP port
   - `EMAIL_USER`: Your email username
   - `EMAIL_PASS`: Your email password or app password
   - `EMAIL_FROM`: Sender email address
   - `IMF_EMAIL`: Admin email address
   - `VITE_API_URL`: Your deployed backend URL (same as your Render app URL)

5. Render will automatically detect the `render.yaml` file and use it for deployment

### Deploy with Docker

1. Build the Docker image:
   ```bash
   docker build -t imf-africa-pay .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 \
     -e MONGODB_URI=your_mongodb_connection_string \
     -e EMAIL_HOST=your_email_host \
     -e EMAIL_PORT=your_email_port \
     -e EMAIL_USER=your_email_user \
     -e EMAIL_PASS=your_email_pass \
     -e EMAIL_FROM=your_email_from \
     -e IMF_EMAIL=your_imf_email \
     imf-africa-pay
   ```

The application will be available at http://localhost:3000