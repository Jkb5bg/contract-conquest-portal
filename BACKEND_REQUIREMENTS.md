# Backend Requirements for Booking Features

This document outlines the backend API endpoints and changes needed to fully support the new booking features implemented in the frontend.

## 1. Booking Messages API

### Writer Endpoints

#### GET `/api/v1/writer-auth/bookings/{booking_id}/messages`
- **Description**: Get all messages for a specific booking
- **Authentication**: Writer JWT token required
- **Response**:
```json
{
  "messages": [
    {
      "message_id": "uuid",
      "booking_id": "uuid",
      "sender_id": "uuid",
      "sender_name": "John Doe",
      "sender_type": "writer" | "client",
      "message_text": "Message content",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### POST `/api/v1/writer-auth/bookings/{booking_id}/messages`
- **Description**: Send a message for a booking
- **Authentication**: Writer JWT token required
- **Request Body**:
```json
{
  "booking_id": "uuid",
  "message_text": "Message content"
}
```
- **Response**: Single message object (same format as GET)

### Client Endpoints

#### GET `/api/v1/marketplace/bookings/{booking_id}/messages`
- **Description**: Get all messages for a specific booking
- **Authentication**: Client JWT token required
- **Response**: Same format as writer endpoint

#### POST `/api/v1/marketplace/bookings/{booking_id}/messages`
- **Description**: Send a message for a booking
- **Authentication**: Client JWT token required
- **Request Body**: Same as writer endpoint
- **Response**: Same as writer endpoint

## 2. Email Notifications

### New Booking Notification
When a client creates a new booking, send an email to the writer containing:
- Client name and contact information
- Service type
- Project description
- Budget and deadline (if provided)
- Link to view the booking in their dashboard

**Trigger**: When POST `/api/v1/marketplace/bookings` is successful

**Email Template**:
```
Subject: New Booking Request from {client_name}

Hi {writer_name},

You have received a new booking request!

Client: {client_name}
Service: {service_type}
Budget: ${budget}
Deadline: {deadline}

Project Description:
{project_description}

View and respond to this booking in your dashboard:
{dashboard_url}/writer/dashboard/bookings

Best regards,
Contract Conquest Team
```

### New Message Notification
When a message is sent on a booking, send an email to the recipient:
- For writers: Notify when client sends a message
- For clients: Notify when writer sends a message

**Trigger**: When POST to messages endpoint is successful

## 3. Booking Statistics Fix

### Issue
The `total_bookings` field in the writer profile currently counts ALL bookings regardless of status. This shows incomplete bookings in the writer's stats.

### Required Changes

#### Update Writer Profile Stats Calculation
Modify the calculation for `total_bookings` in the writer profile to only count **completed** bookings:

**Current behavior** (assumed):
```sql
SELECT COUNT(*) as total_bookings
FROM bookings
WHERE writer_id = ?
```

**Required behavior**:
```sql
SELECT COUNT(*) as total_bookings
FROM bookings
WHERE writer_id = ? AND status = 'completed'
```

This ensures that only successful, completed projects are counted in the writer's statistics.

## 4. Booking Status Data Integrity

### Issue
Some bookings are being created without a proper `status` field, resulting in `undefined` or `null` values.

### Required Changes
- Ensure all bookings have a default status of `'requested'` when created
- Add database constraint to prevent NULL status values
- Add validation in the API to reject booking creation/updates without a valid status

**Valid statuses**:
- `requested` (default for new bookings)
- `accepted`
- `in_progress`
- `completed`
- `cancelled`

## 5. Profile Photo Storage

### Current Implementation
The frontend now accepts a `profile_photo_url` field for writers. The backend should:
- Accept and store this URL in the `profile_photo_url` field
- Return it in all writer profile responses
- (Optional) Add validation for URL format

### Future Enhancement (Optional)
Consider implementing direct file upload functionality:
- Add endpoint: POST `/api/v1/writer-auth/profile/photo`
- Accept multipart/form-data with image file
- Store in cloud storage (S3, Cloudinary, etc.)
- Return the generated URL
- Update profile with the new URL

## Implementation Priority

1. **High Priority** (Required for basic functionality):
   - Booking Messages API (both endpoints)
   - Booking status default value fix
   - Total bookings calculation fix

2. **Medium Priority** (Important for UX):
   - Email notifications for new bookings
   - Email notifications for new messages

3. **Low Priority** (Nice to have):
   - File upload for profile photos
   - Additional message features (attachments, read receipts)

## Testing Checklist

- [ ] Create a new booking and verify status is 'requested'
- [ ] Send messages from both client and writer sides
- [ ] Verify writer receives email when new booking is created
- [ ] Verify both parties receive email notifications for messages
- [ ] Verify `total_bookings` only counts completed bookings
- [ ] Update writer profile with `profile_photo_url` and verify it displays
- [ ] Test status transitions (requested → accepted → in_progress → completed)

## Notes

All messaging endpoints should include proper authorization checks to ensure:
- Writers can only access messages for their own bookings
- Clients can only access messages for their own bookings
- Messages are properly associated with the sender's identity
