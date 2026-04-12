# PRD: Rehablito PHYSIO & AUTISM CENTER

## 1. Project Overview

Rehablito is a multi-branch therapy organization specializing in Physio and Autism centers. The goal is to build a centralized ecosystem to manage patients, leads, staff attendance (via geofencing), and financial records across all locations.

## 2. User Roles & Access Control

| Role | Primary Responsibility | Key Access |
|---|---|---|
| Super Admin | Business Owner / Top Management | Global view of all branches, staff allocation, and financial auditing. |
| Branch Manager | Operational head of a specific branch | Lead management, patient onboarding, and branch-specific staff tracking. |
| Staff/Therapist | Frontline service providers | Attendance logging (Location-based) and daily duty tracking. |
| Public User | Potential clients/Patients | Viewing services, portfolios, and branch contact info. |

## 3. Functional Requirements

### A. Super Admin Panel (Centralized Control)

- **Branch Switcher:** A global dropdown to switch between different branches to view specific data.
- **Data Oversight:** Access to all leads, patient records, fee payments, and staff attendance logs across the organization.
- **Staff Allocation:** Ability to assign/transfer staff and managers to specific branches.
- **Financial Dashboard:** High-level summary of total revenue, dues, and branch-wise performance.

### B. Manager Panel (Branch Operations)

- **Patient Onboarding:**
  - Input form for new patient registration.
  - PDF Generation: On submission, a registration PDF is generated for the patient and the clinic records.
- **Lead Management:**
  - Entry of new leads.
  - Data Privacy: Managers can see lead/patient names but phone numbers must be masked (e.g., XXXXXX1234).
- **Staff Management:** View list of branch staff, their active status, and attendance history.
- **Billing & Invoicing:**
  - Track monthly payments and outstanding dues.
  - Generate and print payment invoices/receipts.

### C. Staff Web App (Attendance & Tracking)

- **Registration & Login:** Secure onboarding via Staff ID (assigned by Admin/Manager) followed by Mobile + OTP verification.
- **Geofenced Attendance:**
  - Staff must grant location access.
  - "Check-In" is only enabled when the user is within the designated office coordinates.
- **Work Timer:**
  - Once checked in, a "Duty Timer" starts.
  - Staff remains "On Duty" until they manually "Check-Out" or the shift ends.
- **Personal Dashboard:** A calendar view for staff to see their total hours worked per day and historical attendance data.

### D. Public Website

- **Portfolio:** Showcasing Rehablito's expertise in Physio and Autism therapy.
- **Branch Locator:** Details and contact info for all active branches.
- **Secure Access:** Links to the Admin, Manager, and Staff portals will be discreetly placed in the website footer.

## 4. Technical Logic & Security

### Geofencing Logic

The system will use the Haversine Formula to compare the staff's real-time coordinates with the branch's fixed coordinates.

### Data Masking

To prevent data theft, the database will store full numbers, but the UI for Managers will apply a mask:

- **Input:** 9876543210
- **Output:** ******3210

## 5. Non-Functional Requirements

- **Security:** JWT-based authentication for all panels.
- **Scalability:** The architecture must support the addition of unlimited new branches by the tech team.
- **Responsiveness:** The Staff App must be mobile-optimized for easy check-in.

## 6. User Flow: Attendance Process

1. Staff opens the Web App at the office.
2. System requests **GPS Permission**.
3. System calculates: Distance = CurrentLocation - OfficeLocation.
4. If Distance < 50 meters, the **"Start Duty"** button activates.
5. Timer runs in the background; data syncs to the Admin/Manager dashboard in real-time.
6. Staff clicks **"End Duty"** before leaving; daily hours are calculated and saved.
