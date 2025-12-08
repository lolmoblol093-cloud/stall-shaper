# Directus Collections Data Model

This document describes the collections and fields needed in your self-hosted Directus instance to match the application's data requirements.

---

## Collections Overview

| Collection | Description |
|------------|-------------|
| `stalls` | Property stall units with occupancy status |
| `tenants` | Tenant business information and lease details |
| `payments` | Payment records for tenants |
| `inquiries` | Guest inquiries for available stalls |
| `notifications` | Admin notification system |
| `app_settings` | Application configuration settings |

---

## Collection: `stalls`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto | Primary key |
| `stall_code` | String | Yes | - | Unique stall identifier (e.g., "b1", "c5", "d10") |
| `floor` | String | Yes | - | Floor location ("ground", "second", "third") |
| `monthly_rent` | Decimal | Yes | - | Monthly rental amount in Peso |
| `occupancy_status` | String | Yes | "vacant" | Status: "vacant" or "occupied" |
| `floor_size` | String | No | - | Size description (e.g., "3x4 sqm") |
| `electricity_reader` | String | No | - | Electric meter reference |
| `image_url` | String | No | - | Stall image URL |
| `created_at` | DateTime | Yes | NOW | Auto timestamp |
| `updated_at` | DateTime | Yes | NOW | Auto update timestamp |

---

## Collection: `tenants`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto | Primary key |
| `business_name` | String | Yes | - | Business/store name |
| `contact_person` | String | Yes | - | Primary contact name |
| `email` | String | No | - | Contact email |
| `phone` | String | No | - | Contact phone number |
| `stall_number` | String | No | - | Assigned stall code |
| `monthly_rent` | Decimal | No | - | Negotiated monthly rent |
| `lease_start_date` | Date | No | - | Lease start date |
| `lease_end_date` | Date | No | - | Lease end date |
| `status` | String | No | "active" | Status: "active" or "inactive" |
| `created_at` | DateTime | Yes | NOW | Auto timestamp |
| `updated_at` | DateTime | Yes | NOW | Auto update timestamp |

---

## Collection: `payments`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto | Primary key |
| `tenant_id` | UUID | Yes | - | Foreign key → tenants.id |
| `amount` | Decimal | Yes | - | Payment amount in Peso |
| `payment_date` | Date | Yes | - | Date of payment |
| `payment_method` | String | No | - | Method: "cash", "bank_transfer", "gcash", etc. |
| `status` | String | No | "pending" | Status: "pending", "completed", "cancelled" |
| `notes` | Text | No | - | Additional notes |
| `created_by` | UUID | No | - | Admin user who recorded payment |
| `created_at` | DateTime | Yes | NOW | Auto timestamp |
| `updated_at` | DateTime | Yes | NOW | Auto update timestamp |

### Relationships
- `tenant_id` → Many-to-One → `tenants`

---

## Collection: `inquiries`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto | Primary key |
| `stall_id` | UUID | No | - | Foreign key → stalls.id |
| `stall_code` | String | Yes | - | Stall code reference |
| `name` | String | Yes | - | Inquirer's name |
| `email` | String | Yes | - | Inquirer's email |
| `phone` | String | No | - | Inquirer's phone |
| `message` | Text | No | - | Inquiry message |
| `status` | String | Yes | "pending" | Status: "pending", "contacted", "resolved", "rejected" |
| `created_at` | DateTime | Yes | NOW | Auto timestamp |
| `updated_at` | DateTime | Yes | NOW | Auto update timestamp |

### Relationships
- `stall_id` → Many-to-One → `stalls`

---

## Collection: `notifications`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto | Primary key |
| `title` | String | Yes | - | Notification title |
| `message` | Text | Yes | - | Notification content |
| `type` | String | Yes | "info" | Type: "info", "inquiry", "payment", "alert" |
| `is_read` | Boolean | Yes | false | Read status |
| `reference_id` | UUID | No | - | Related record ID |
| `reference_type` | String | No | - | Related collection name |
| `created_at` | DateTime | Yes | NOW | Auto timestamp |

---

## Collection: `app_settings`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto | Primary key |
| `key` | String | Yes | - | Unique setting key |
| `value` | JSON | No | - | Setting value (JSON format) |
| `description` | Text | No | - | Setting description |
| `updated_by` | UUID | No | - | Last updated by user |
| `created_at` | DateTime | Yes | NOW | Auto timestamp |
| `updated_at` | DateTime | Yes | NOW | Auto update timestamp |

---

## Directus Setup Steps

### 1. Create Collections
In Directus Admin → Settings → Data Model, create each collection with the fields above.

### 2. Set Up Relationships
- In `payments`, create a Many-to-One field `tenant_id` pointing to `tenants`
- In `inquiries`, create a Many-to-One field `stall_id` pointing to `stalls`

### 3. Configure Permissions
Set up Directus roles and permissions:

**Admin Role:**
- Full CRUD access to all collections

**Public Role (for guest inquiries):**
- `stalls`: READ only
- `inquiries`: CREATE only

### 4. Generate Static Token
Go to Settings → Access Tokens and create a static token for the frontend application.

### 5. Update Environment Variables
Update your `.env` file:
```env
VITE_DIRECTUS_URL=https://your-directus-instance.com
VITE_DIRECTUS_TOKEN=your_static_token_here
```

---

## Sample Data

### Stalls
```json
{
  "stall_code": "b1",
  "floor": "ground",
  "monthly_rent": 5000,
  "occupancy_status": "occupied",
  "floor_size": "3x4 sqm"
}
```

### Tenants
```json
{
  "business_name": "Sample Store",
  "contact_person": "Juan Dela Cruz",
  "email": "juan@example.com",
  "phone": "09171234567",
  "stall_number": "b1",
  "monthly_rent": 5000,
  "status": "active"
}
```

### Inquiries
```json
{
  "stall_code": "b5",
  "name": "Maria Santos",
  "email": "maria@example.com",
  "phone": "09181234567",
  "message": "Interested in renting this stall for a clothing business.",
  "status": "pending"
}
```
