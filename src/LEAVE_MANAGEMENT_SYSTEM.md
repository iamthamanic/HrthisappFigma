# 🏖️ Leave/Absence Management System - Complete Implementation

## ✅ Phase 1: COMPLETED - Database & Core Infrastructure

### Migration 036: Extended Leave Requests Table

**File:** `/supabase/migrations/036_extend_leave_requests.sql`

**New Fields:**
```sql
- is_half_day: BOOLEAN (default false) - Support for half-day leaves
- file_url: TEXT - URL to sick note document (Krankschreibung)
- withdrawn_at: TIMESTAMPTZ - When user withdrew PENDING request
- cancelled_by: UUID - Admin who cancelled APPROVED request
- cancelled_at: TIMESTAMPTZ - When cancellation occurred
- cancellation_confirmed: BOOLEAN - User confirmed cancellation
- federal_state: TEXT - German Bundesland for holiday calculation
- reminder_sent: BOOLEAN - Track if reminder notification was sent
- created_by: UUID - Who created the request (for admin-created requests)
```

**New Database Function:**
```sql
calculate_business_days(start_date, end_date) -> DECIMAL
- Calculates business days (Mon-Fri only)
- Excludes weekends automatically
```

**Indexes for Performance:**
```sql
- idx_leave_requests_withdrawn
- idx_leave_requests_cancelled
- idx_leave_requests_reminder
```

---

## ✅ Phase 2: COMPLETED - Business Logic Hooks

### 1. useBusinessDays Hook
**File:** `/hooks/useBusinessDays.ts`

**Purpose:** Calculate business days (weekdays) between two dates

**Features:**
- Excludes weekends (Sat/Sun) automatically
- Optionally excludes German public holidays
- Federal state-specific holiday calculation
- Helper functions: `isWeekend()`, `isHoliday()`

**Usage:**
```tsx
const { businessDays, calculateBusinessDays, isWeekend, isHoliday } = useBusinessDays(
  startDate,
  endDate,
  { includeHolidays: true, federalState: 'NW' }
);
```

---

### 2. useGermanHolidays Hook
**File:** `/hooks/useGermanHolidays.ts`

**Purpose:** Provide German public holidays based on federal state

**Features:**
- Supports all 16 German federal states
- Easter calculation (movable holiday)
- State-specific holidays (e.g., "Fronleichnam" only in Catholic states)
- Helper functions: `getHolidaysForYear()`, `isHoliday()`, `getHolidayName()`

**Federal States:**
```
BW: Baden-Württemberg
BY: Bayern
BE: Berlin
BB: Brandenburg
HB: Bremen
HH: Hamburg
HE: Hessen
MV: Mecklenburg-Vorpommern
NI: Niedersachsen
NW: Nordrhein-Westfalen
RP: Rheinland-Pfalz
SL: Saarland
SN: Sachsen
ST: Sachsen-Anhalt
SH: Schleswig-Holstein
TH: Thüringen
```

**Usage:**
```tsx
const { getHolidaysForYear, isHoliday, getHolidayName } = useGermanHolidays('BY');
const holidays = getHolidaysForYear(2025);
```

---

### 3. useVacationCarryover Hook
**File:** `/hooks/useVacationCarryover.ts`

**Purpose:** Manage vacation carryover logic

**Features:**
- Vacation days from previous year valid until March 31st (configurable)
- Track expiring days (warning within 30 days)
- Calculate total available days (current year + carryover)
- Configurable cutoff date

**Default Settings:**
```tsx
{
  enabled: true,
  cutoffMonth: 3,  // March
  cutoffDay: 31    // 31st
}
```

**Usage:**
```tsx
const {
  totalAvailableDays,     // Current year + carryover
  carryoverExpired,       // Boolean
  daysExpiringSoon,       // Days expiring within 30 days
  getExpiryDateFormatted, // "31. März 2025"
  getDaysUntilExpiry      // Days until cutoff
} = useVacationCarryover(30, 5); // 30 current, 5 carryover
```

---

### 4. useLeaveManagement Hook
**File:** `/hooks/useLeaveManagement.ts`

**Purpose:** Core logic for leave/absence management

**Features:**
- Create leave requests (vacation/sick)
- Validate: quota, overlaps, business days
- Withdraw pending requests (user)
- Approve/reject requests (admin/HR/TeamLead)
- Cancel approved requests (admin, requires user confirmation)
- Automatic notifications
- Quota tracking

**API:**
```tsx
const {
  leaveRequests,              // All user's requests
  quota,                      // Vacation quota info
  loading,                    // Loading state
  createLeaveRequest,         // Create new request
  withdrawRequest,            // User cancels PENDING
  approveRequest,             // Admin approves
  rejectRequest,              // Admin rejects with reason
  cancelApprovedRequest,      // Admin cancels APPROVED (needs confirmation)
  checkOverlap,               // Check date overlaps
  calculateBusinessDays,      // Calculate days
  isWeekend,                  // Check if weekend
  isHoliday,                  // Check if holiday
  reload                      // Refresh data
} = useLeaveManagement(userId, federalState);
```

**Quota Object:**
```tsx
{
  totalDays: number;      // Total vacation days (from user.vacation_days)
  usedDays: number;       // Already taken (APPROVED)
  pendingDays: number;    // Waiting for approval (PENDING)
  availableDays: number;  // totalDays - usedDays - pendingDays
  carryoverDays: number;  // From previous year (TODO)
}
```

**Validation Rules:**
1. **Dates:** End date must be after start date
2. **Overlaps:** No overlapping requests allowed
3. **Quota:** Vacation requests can't exceed available days
4. **Sick Leave:** Unlimited (no quota check)
5. **Business Days:** Only Mon-Fri counted (excludes weekends/holidays)

**Automatic Notifications:**
- New request → All ADMIN/HR/TEAMLEAD
- Approved → Request owner
- Rejected → Request owner (with reason)

---

### 5. useLeaveReminders Hook
**File:** `/hooks/useLeaveReminders.ts`

**Purpose:** Send reminder notifications before leave starts

**Features:**
- Configurable days before (default: 3 days)
- Configurable recipient roles (default: HR, TEAMLEAD)
- Automatic daily check at midnight
- Manual trigger for testing
- Tracks sent reminders (no duplicates)

**Default Settings:**
```tsx
{
  enabled: true,
  daysBefore: 3,
  notifyRoles: ['HR', 'TEAMLEAD']
}
```

**Usage:**
```tsx
const { triggerReminderCheck } = useLeaveReminders({ 
  daysBefore: 3, 
  notifyRoles: ['HR', 'TEAMLEAD'] 
});

// Manual trigger (for testing)
await triggerReminderCheck();
```

**Reminder Logic:**
- Runs daily at midnight automatically
- Checks for approved leaves starting in X days
- Sends notification to configured roles
- Marks reminder as sent (field: `reminder_sent`)

---

## ✅ Phase 3: COMPLETED - UI Components

### RequestLeaveDialog Component
**File:** `/components/RequestLeaveDialog.tsx`

**Purpose:** Modal for creating leave/absence requests

**Features:**
1. **Employee Selection** (Admin/HR/TeamLead only)
   - Dropdown with all active employees
   - Create requests on behalf of employees

2. **Leave Type Selection**
   - 🏖️ Urlaub (Vacation)
   - ❤️ Krankmeldung (Sick Leave)

3. **Date Range**
   - Start date / End date pickers
   - Minimum date: today

4. **Half-Day Option**
   - Toggle switch (only shown if start == end date)

5. **Business Days Calculator**
   - Real-time calculation
   - Shows weekends/holidays exclusion message
   - Shows available quota

6. **Quota Validation**
   - Real-time check against available days
   - Error message if quota exceeded
   - Blocks submission if invalid

7. **Sick Note Upload** (Sick Leave only)
   - Optional file upload
   - Accepted formats: PDF, JPG, PNG
   - Stored in Supabase Storage bucket: `make-f659121d-documents`
   - Automatically creates document entry

8. **Comment Field**
   - Optional text area
   - For additional notes, reasons, etc.

9. **Federal State Detection**
   - Auto-detected from user's location
   - Used for holiday calculation

**Validation:**
- ✅ User selected (if admin)
- ✅ Start/end dates filled
- ✅ End date >= start date
- ✅ No quota exceeded (vacation only)
- ✅ No overlapping requests

**Integration:**
- Integrated in `CalendarScreen.tsx`
- Opens via "Urlaub/Abwesenheit" button
- Triggers refresh on success

---

## 🔄 Phase 4: TODO - Remaining Features

### 1. Calendar Visualization
**Status:** ⏳ TODO

**Requirements:**
- Personal view: Show own requests with color coding
  - 🟢 Green: APPROVED vacation
  - 🟡 Yellow: PENDING requests
  - 🔴 Red: SICK leaves
- Team view: Show approved leaves only
  - 🟢 Green: Approved vacation
  - 🟠 Orange: "Abwesenheit" (all other absences/sick)

**Implementation:**
- Extend `CalendarScreen.tsx`
- Load leave requests alongside time records
- Render colored blocks on calendar days
- Click for detail view

---

### 2. Admin Approval Interface
**Status:** ⏳ TODO

**Requirements:**
- New section in Admin panel
- List of pending requests
- Approve/Reject buttons
- Rejection reason text field
- Filter by status (PENDING/APPROVED/REJECTED)
- Sort by date

**Implementation:**
- New component: `LeaveRequestManagement.tsx`
- Use `useLeaveManagement` hook
- Real-time updates
- Notifications on action

---

### 3. Sick Leave > 6 Weeks Warning
**Status:** ⏳ TODO

**Requirements:**
- Track continuous sick days
- Show warning if >= 42 days (6 weeks)
- Message: "Krankenkasse zahlt ab jetzt" (Health insurance pays from now on)
- Display in Logs tab
- Notification to HR

**Implementation:**
- Calculate consecutive sick days
- Add warning badge in logs
- Create notification for HR role

---

### 4. Backup/Substitute Notifications
**Status:** ⏳ TODO

**Requirements:**
- When leave is approved, notify backup users
- Get backup from organigram (primary_user_id, backup_user_id, backup_backup_user_id)
- Send notification with leave dates

**Implementation:**
- Query organigram for user's department
- Get backup users
- Create notifications on approval

---

### 5. Export Functionality
**Status:** ⏳ TODO

**Requirements:**
- CSV export of leave history
- PDF export with formatting
- Year overview report
- Filter by type, status, date range

**Implementation:**
- Extend `exportUtils.ts`
- Add export buttons to calendar/logs
- Generate formatted documents

---

### 6. TeamLead Permissions
**Status:** ⏳ TODO

**Requirements:**
- TeamLead can only see/approve team members
- Get team members from organigram (team_lead_id)
- Filter requests by team

**Implementation:**
- Add team filter in `useLeaveManagement`
- Query organigram for team members
- Apply filters in approval interface

---

## 📊 Database Schema

### leave_requests Table (Extended)

```sql
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('VACATION', 'SICK')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  comment TEXT,
  total_days DECIMAL,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  
  -- ✨ NEW FIELDS (Migration 036)
  is_half_day BOOLEAN DEFAULT false,
  file_url TEXT,
  withdrawn_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  cancellation_confirmed BOOLEAN DEFAULT false,
  federal_state TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 Permissions

### User Roles:
- **EMPLOYEE:** Can create own requests, withdraw PENDING, view own requests
- **TEAMLEAD:** + Can approve/reject team members' requests
- **HR:** + Can approve/reject all requests
- **ADMIN/SUPERADMIN:** + Can create for others, cancel APPROVED requests

### RLS Policies:
```sql
-- Users can view own requests
CREATE POLICY "Users can view own leave requests"
  ON leave_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create own requests
CREATE POLICY "Users can create own leave requests"
  ON leave_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins/HR/TeamLead can manage all
CREATE POLICY "Admins can manage all leave requests"
  ON leave_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN', 'HR', 'TEAMLEAD')
    )
  );
```

---

## 📝 Workflow

### User Creates Request:
1. User clicks "Urlaub/Abwesenheit" button
2. Opens `RequestLeaveDialog`
3. Selects type (Vacation/Sick), dates, optional half-day
4. System calculates business days
5. System validates quota (vacation only)
6. System checks for overlaps
7. User submits → Status: PENDING
8. Notification sent to all ADMIN/HR/TEAMLEAD

### Admin Approves:
1. Admin views pending requests
2. Clicks approve → Status: APPROVED
3. Notification sent to user
4. Vacation days quota updated
5. Backup users notified (organigram)
6. Reminder scheduled (X days before start)

### Admin Rejects:
1. Admin views pending request
2. Enters rejection reason
3. Clicks reject → Status: REJECTED
4. Notification sent to user with reason

### User Withdraws (PENDING only):
1. User views own requests
2. Clicks withdraw on PENDING request
3. Sets `withdrawn_at` timestamp
4. Request hidden from lists

### Admin Cancels (APPROVED only):
1. Admin clicks cancel on APPROVED request
2. System asks for user confirmation
3. User confirms cancellation
4. Status: REJECTED, fields: `cancelled_by`, `cancelled_at`, `cancellation_confirmed`
5. Vacation days quota restored
6. Notification sent to user

---

## 🚀 Next Steps

1. **Calendar Visualization** - Show leave blocks in calendar
2. **Admin Approval UI** - Complete approval interface
3. **Sick Leave Tracking** - 6-week warning system
4. **Backup Notifications** - Notify substitute users
5. **Export Features** - CSV/PDF export
6. **TeamLead Filters** - Team-specific views

---

## 📚 Documentation

All hooks documented in `/hooks/README.md`

**Key Files:**
- `/hooks/useBusinessDays.ts`
- `/hooks/useGermanHolidays.ts`
- `/hooks/useVacationCarryover.ts`
- `/hooks/useLeaveManagement.ts`
- `/hooks/useLeaveReminders.ts`
- `/components/RequestLeaveDialog.tsx`
- `/supabase/migrations/036_extend_leave_requests.sql`
- `/types/database.ts` (LeaveRequest interface extended)

**Integration Points:**
- `CalendarScreen.tsx` - Request dialog integrated
- `TimeAndLeaveScreen.tsx` - Tab structure (Übersicht/Kalender)
- `PersonalSettings.tsx` - Logs display (existing)
- `TeamMemberDetailsScreen.tsx` - Logs display (existing)

---

**Status:** ✅ Core infrastructure complete, ready for calendar visualization and admin UI
**Next:** Implement calendar blocks and approval interface
