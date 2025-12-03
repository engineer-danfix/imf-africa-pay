# Local Email Service

This is a simple local backend service that can fetch payment data from your MongoDB database and send email notifications. It's designed to run on localhost where SMTP connections work properly.

## Setup Instructions

1. **Update Environment Variables**:
   Edit the `.env.local` file with your actual configuration:
   ```
   EMAIL_USER=your_gmail_address@gmail.com
   EMAIL_PASS=your_app_password
   IMF_EMAIL=your_admin_email@domain.com
   ```

2. **Ensure MongoDB is Running**:
   Make sure your MongoDB instance is running locally on port 27017, or update the MONGODB_URI in `.env.local` to point to your database.

3. **Run the Service**:
   ```bash
   npm run local-email
   ```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get specific payment
- `POST /api/send-notifications/:id` - Send email notifications for a specific payment
- `POST /api/send-all-notifications` - Send email notifications for all payments
- `POST /api/test-email` - Send a test email

## Usage Examples

### Send Notifications for a Specific Payment
```bash
curl -X POST http://localhost:3001/api/send-notifications/PAYMENT_ID
```

### Send Notifications for All Payments
```bash
curl -X POST http://localhost:3001/api/send-all-notifications
```

### Send a Test Email
```bash
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","text":"This is a test email"}'
```

## How It Works

1. Connects to your MongoDB database where payment data is stored
2. Fetches payment records when requested
3. Sends email notifications to both the user and IMF admin with receipt attachments
4. Uses your Gmail account via SMTP (which works on localhost)

This service is completely separate from your main application and can be run independently whenever you need to send email notifications.