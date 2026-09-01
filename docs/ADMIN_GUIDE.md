# 🚗 Dream Car Bazaar — Owner & Business Admin Operating Manual

Welcome to **Dream Car Bazaar**! This operating guide is written in clear, simple terms for the business owner ("the friend") to run daily business operations without needing developer intervention.

---

## 🔑 1. Logging In & Accessing Admin Features

1. Open your browser and navigate to **[http://localhost:3000/login](http://localhost:3000/login)** (or your production website domain).
2. Enter your **Admin Email** and **Password**.
   - *Production Admin Account:* Set during deployment via environment variables (`PRODUCTION_ADMIN_EMAIL` and `PRODUCTION_ADMIN_PASSWORD`).
   - *Development Demo Account:* `admin@dreamcar.com` / `Admin@123456`.
3. Once logged in, click **Admin Portal** in the top navigation header.

---

## 🚘 2. Managing Showroom Vehicles (+ Add & Remove)

### Adding New Showroom Cars
1. Navigate to **Admin Console** → **Showroom Inventory** tab.
2. Click **+ Add Showroom Vehicle**.
3. Fill out the vehicle specifications (Brand, Model, Variant, Year, Price, KM, Fuel, Transmission, Body Type, Location).
4. Select **1 Cover Photo** for the vehicle.
5. Click **Add Showroom Vehicle**. Your car is published immediately with the official **Verified by Dream Car Bazaar** trust badge!

### Adding Multiple Gallery Photos
1. In the **Showroom Inventory** tab or directly on the car detail page (`/cars/[id]`), click **📷 Manage Photos** or **+ Add Photos**.
2. Select multiple interior, engine, or side view photos from your computer.
3. Click upload. All photos will instantly save to the vehicle's photo gallery for buyers to view.

### Marking Cars as Sold
1. Next to any active vehicle card in your inventory, click **Mark as Sold**.
2. The car status immediately changes to **SOLD** on the marketplace.

### Removing Vehicles
1. Next to any vehicle card in your inventory or directly on the Browse Cars page (`/cars`), click the red **`🗑 Remove`** button.
2. Confirm the prompt to permanently remove the car from the marketplace.

---

## 💬 3. Customer Chat & Inquiries

1. Navigate to **Admin Console** → **Customer Chat Threads** tab.
2. View active chat threads initiated by prospective buyers inquiring about specific cars.
3. Select a thread to view the complete message history.
4. Type your reply in the input box and click **Reply**. The buyer will receive your message in real-time.

---

## 🚗 4. Managing Test Drive Appointments

1. Navigate to **Admin Console** → **Test Drives** tab.
2. View incoming appointment requests with customer name, requested date/time, and contact phone number.
3. **Actions:**
   - **Approve:** Click **✓ Approve Appointment** to confirm.
   - **Reschedule:** Click **Reschedule**, select a new date/time slot, add an optional note for the customer, and save.
   - **Reject:** Click **Reject** if the vehicle slot is unavailable.

---

## 📋 5. Moderating Customer-Submitted Listings

1. Navigate to **Admin Console** → **Pending Moderation** tab.
2. Inspect vehicle details and photos submitted by individual customer sellers.
3. **Actions:**
   - **Approve:** Click **✓ Approve Listing** to make it public on the marketplace.
   - **Reject:** Click **Reject**, enter a clear rejection reason (e.g. *"Please upload clearer interior photos"*), and confirm.

---

## 📍 6. Updating Business Contact Details Centrally

1. Navigate to **Admin Console** → **Contact Settings** tab.
2. Update your **Business Name**, **Phone Number**, **WhatsApp Number**, **Email**, **Showroom Address**, **City**, **State**, **Business Hours**, and **Google Maps Link**.
3. Click **Save Contact Info**. All changes immediately apply across the entire site and the **Contact Us** page (`/contact`).

---

## 🔒 7. Account Security & Password Changes

- **Changing Password:** Go to **Customer Dashboard** (`/dashboard`) → **Account Settings** tab to update your display name and profile details.
- **Admin Security:** Regular users registering on the website can never create or gain Admin access. Admin privileges are strictly restricted by backend code.
