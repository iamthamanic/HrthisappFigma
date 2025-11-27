# 🔔 Trigger Implementation Plan

## Status: IN PROGRESS

Diese Datei dokumentiert, welche Trigger in welchen Edge Functions implementiert werden müssen.

---

## ✅ IMPLEMENTED

### 1. EMPLOYEE_CREATED
- **Function:** `server/index.tsx`
- **Route:** `POST /make-server-f659121d/users/create`
- **Location:** After line 690 (after user profile updated)
- **Status:** ✅ DONE

---

## 🔧 TO IMPLEMENT

### 2. EMPLOYEE_UPDATED
- **Function:** `BrowoKoordinator-Personalakte`
- **Route:** `PUT /BrowoKoordinator-Personalakte/employees/:id`
- **Trigger Point:** After successful profile update (line 463)
- **Context:** userId, employeeId, employeeName, changedFields, organizationId

### 3. DOCUMENT_UPLOADED  
- **Function:** `server/index.tsx` (documents endpoint)
- **Route:** `POST /make-server-f659121d/documents/upload`
- **Trigger Point:** After successful document upload
- **Context:** documentId, documentName, documentType, uploadedBy, uploadedByName, organizationId

### 4. BENEFIT_ASSIGNED (Approve)
- **Function:** `BrowoKoordinator-Benefits`
- **Route:** `POST /BrowoKoordinator-Benefits/approve/:id`
- **Trigger Point:** After successful approval (line 595)
- **Context:** benefitId, benefitName, userId, userName, assignmentDate, organizationId

### 5. BENEFIT_REMOVED (Reject)
- **Function:** `BrowoKoordinator-Benefits`
- **Route:** `POST /BrowoKoordinator-Benefits/reject/:id`
- **Trigger Point:** After successful rejection (line 693)
- **Context:** benefitId, benefitName, userId, removalDate, organizationId

### 6. TASK_CREATED
- **Function:** `BrowoKoordinator-Tasks`
- **Route:** `POST /BrowoKoordinator-Tasks/create` (needs to be added)
- **Trigger Point:** After task creation
- **Context:** taskId, taskTitle, assignedTo, assignedToName, createdBy, organizationId

### 7. TASK_COMPLETED
- **Function:** `BrowoKoordinator-Tasks`
- **Route:** `PATCH /BrowoKoordinator-Tasks/:id/complete` (needs to be added)
- **Trigger Point:** After task completion
- **Context:** taskId, taskTitle, completedBy, completedByName, completionDate, organizationId

### 8. TRAINING_ASSIGNED
- **Function:** `BrowoKoordinator-Lernen`
- **Route:** Assignment route (check existing)
- **Trigger Point:** After training assignment
- **Context:** trainingId, trainingName, userId, userName, assignmentDate, organizationId

### 9. TRAINING_COMPLETED  
- **Function:** `BrowoKoordinator-Lernen`
- **Route:** Completion route (check existing)
- **Trigger Point:** After training completion
- **Context:** trainingId, trainingName, userId, userName, completionDate, organizationId

---

## 📝 Implementation Pattern

```typescript
// After successful operation, trigger workflows
try {
  const authHeader = c.req.header('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
  
  await triggerWorkflows(
    TRIGGER_TYPES.TRIGGER_NAME,
    {
      // Context fields as defined above
    },
    authHeader
  );
  
  console.log(`✅ Workflows triggered successfully`);
} catch (triggerError) {
  // Don't fail the main operation if workflow triggering fails
  console.error('⚠️ Failed to trigger workflows (non-fatal):', triggerError);
}
```

---

## 🎯 Priority Implementation Order

1. ✅ EMPLOYEE_CREATED - **DONE**
2. 🔜 EMPLOYEE_UPDATED - High priority (common operation)
3. 🔜 BENEFIT_ASSIGNED - High priority (approval flow)
4. 🔜 DOCUMENT_UPLOADED - Medium priority
5. 🔜 TASK_CREATED - Medium priority
6. 🔜 TASK_COMPLETED - Medium priority
7. 🔜 TRAINING_ASSIGNED - Low priority
8. 🔜 TRAINING_COMPLETED - Low priority
9. 🔜 BENEFIT_REMOVED - Low priority

---

## 📊 Progress

- Total Triggers: 26
- Implemented: 2 (EMPLOYEE_CREATED, MANUAL)
- In Progress: 7
- Remaining: 17

---

Last Updated: 2024-11-24
