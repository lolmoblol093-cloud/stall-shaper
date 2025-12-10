# Directus Setup Guide

This document outlines all collections, fields, and role permissions needed for the Stall Management System.

---

## Roles

Create these roles in Directus:

| Role | Description |
|------|-------------|
| `admin` | Full access to all collections |
| `tenant` | Limited access to own tenant data and payments |
| `guest` | Public read access to stalls only |

---

## Collections & Fields

### 1. `stalls`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto-generated | Primary Key |
| `stall_code` | String | Yes | - | Unique identifier (e.g., "b1", "c5") |
| `floor` | String | Yes | - | "ground", "second", or "third" |
| `monthly_rent` | Decimal | Yes | - | Rent amount |
| `occupancy_status` | String | Yes | `vacant` | "vacant" or "occupied" |
| `floor_size` | String | No | - | Size in sqm |
| `electricity_reader` | String | No | - | Meter number |
| `image_url` | String | No | - | Stall photo URL |
| `created_at` | Timestamp | Yes | Now | Auto-set |
| `updated_at` | Timestamp | Yes | Now | Auto-update |

**Permissions by Role:**
| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| admin | ✅ | ✅ | ✅ | ✅ |
| tenant | ❌ | ✅ (own stall) | ❌ | ❌ |
| guest | ❌ | ✅ (all) | ❌ | ❌ |

---

### 2. `tenants`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto-generated | Primary Key |
| `business_name` | String | Yes | - | Business/store name |
| `contact_person` | String | Yes | - | Contact name |
| `email` | String | No | - | Email address |
| `phone` | String | No | - | Phone number |
| `stall_number` | String | No | - | Assigned stall code |
| `monthly_rent` | Decimal | No | - | Monthly rent amount |
| `lease_start_date` | Date | No | - | Lease start |
| `lease_end_date` | Date | No | - | Lease end |
| `status` | String | No | `active` | "active" or "inactive" |
| `created_at` | Timestamp | Yes | Now | Auto-set |
| `updated_at` | Timestamp | Yes | Now | Auto-update |

**Permissions by Role:**
| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| admin | ✅ | ✅ | ✅ | ✅ |
| tenant | ❌ | ✅ (own record) | ❌ | ❌ |
| guest | ❌ | ❌ | ❌ | ❌ |

---

### 3. `payments`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto-generated | Primary Key |
| `tenant_id` | UUID | Yes | - | FK to tenants |
| `amount` | Decimal | Yes | - | Payment amount |
| `payment_date` | Date | Yes | - | Date of payment |
| `payment_method` | String | No | - | "cash", "bank_transfer", etc. |
| `status` | String | No | `pending` | "pending", "completed", "failed" |
| `notes` | Text | No | - | Additional notes |
| `created_by` | UUID | No | - | Admin who recorded |
| `created_at` | Timestamp | Yes | Now | Auto-set |
| `updated_at` | Timestamp | Yes | Now | Auto-update |

**Permissions by Role:**
| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| admin | ✅ | ✅ | ✅ | ✅ |
| tenant | ❌ | ✅ (own payments) | ❌ | ❌ |
| guest | ❌ | ❌ | ❌ | ❌ |

---

### 4. `inquiries`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto-generated | Primary Key |
| `stall_id` | UUID | No | - | FK to stalls |
| `stall_code` | String | Yes | - | Stall code inquired |
| `name` | String | Yes | - | Inquirer name |
| `email` | String | Yes | - | Inquirer email |
| `phone` | String | No | - | Inquirer phone |
| `message` | Text | No | - | Inquiry message |
| `status` | String | Yes | `pending` | "pending", "contacted", "resolved" |
| `created_at` | Timestamp | Yes | Now | Auto-set |
| `updated_at` | Timestamp | Yes | Now | Auto-update |

**Permissions by Role:**
| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| admin | ✅ | ✅ | ✅ | ✅ |
| tenant | ❌ | ❌ | ❌ | ❌ |
| guest | ✅ | ❌ | ❌ | ❌ |

---

### 5. `notifications`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto-generated | Primary Key |
| `title` | String | Yes | - | Notification title |
| `message` | Text | Yes | - | Notification content |
| `type` | String | Yes | `info` | "info", "inquiry", "payment" |
| `is_read` | Boolean | Yes | `false` | Read status |
| `reference_id` | UUID | No | - | Related record ID |
| `reference_type` | String | No | - | "inquiry", "payment", etc. |
| `created_at` | Timestamp | Yes | Now | Auto-set |

**Permissions by Role:**
| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| admin | ✅ | ✅ | ✅ | ✅ |
| tenant | ❌ | ❌ | ❌ | ❌ |
| guest | ❌ | ❌ | ❌ | ❌ |

---

### 6. `app_settings`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto-generated | Primary Key |
| `key` | String | Yes | - | Setting key (unique) |
| `value` | JSON | No | - | Setting value |
| `description` | Text | No | - | Setting description |
| `updated_by` | UUID | No | - | Last updated by |
| `created_at` | Timestamp | Yes | Now | Auto-set |
| `updated_at` | Timestamp | Yes | Now | Auto-update |

**Permissions by Role:**
| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| admin | ✅ | ✅ | ✅ | ❌ |
| tenant | ❌ | ❌ | ❌ | ❌ |
| guest | ❌ | ❌ | ❌ | ❌ |

---

### 7. `profiles`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto-generated | Primary Key |
| `user_id` | UUID | Yes | - | FK to directus_users |
| `full_name` | String | No | - | Display name |
| `email` | String | No | - | Email address |
| `created_at` | Timestamp | Yes | Now | Auto-set |
| `updated_at` | Timestamp | Yes | Now | Auto-update |

**Permissions by Role:**
| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| admin | ✅ | ✅ | ✅ | ❌ |
| tenant | ✅ (own) | ✅ (own) | ✅ (own) | ❌ |
| guest | ❌ | ❌ | ❌ | ❌ |

---

### 8. `tenant_users`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto-generated | Primary Key |
| `user_id` | UUID | Yes | - | FK to directus_users |
| `tenant_id` | UUID | Yes | - | FK to tenants |
| `created_at` | Timestamp | Yes | Now | Auto-set |

**Permissions by Role:**
| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| admin | ✅ | ✅ | ✅ | ✅ |
| tenant | ❌ | ✅ (own) | ❌ | ❌ |
| guest | ❌ | ❌ | ❌ | ❌ |

---

### 9. `login_attempts`

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto-generated | Primary Key |
| `email` | String | Yes | - | Attempted email |
| `success` | Boolean | Yes | `false` | Login success |
| `failure_reason` | String | No | - | Why it failed |
| `ip_address` | String | No | - | Client IP |
| `user_agent` | String | No | - | Browser info |
| `created_at` | Timestamp | Yes | Now | Auto-set |

**Permissions by Role:**
| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| admin | ✅ | ✅ | ❌ | ✅ |
| tenant | ✅ | ❌ | ❌ | ❌ |
| guest | ✅ | ❌ | ❌ | ❌ |

---

## Environment Variable

Add this secret in Lovable:
- **Name:** `VITE_DIRECTUS_URL`
- **Value:** Your Directus server URL (e.g., `https://your-directus.com`)

---

## Quick Setup Checklist

1. ☐ Create roles: `admin`, `tenant`, `guest`
2. ☐ Create all 9 collections with fields above
3. ☐ Set up permissions per role
4. ☐ Create admin user account
5. ☐ Deploy Directus to public URL
6. ☐ Add `VITE_DIRECTUS_URL` secret in Lovable
