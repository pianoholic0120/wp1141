# NTU Course Registration Service - UI/UX Implementation Plan

## 🎯 Service Overview

A single-page application simulating the National Taiwan University course registration experience with three distinct stages that mirror real decision-making processes in course selection.

---

## 📊 Stage Breakdown & Design Rationale

### **Stage 1: Browse & Explore**

*Mental Model: "Shopping for courses"*

**Purpose:** Help users discover and evaluate courses without commitment pressure.

**Key Features:**

* **Course Catalog Grid/List View** with filters
  * Department, course level, credits, time slots
  * Instructor, language of instruction
  * Toggle between grid cards and detailed list
* **Rich Course Information Cards**
  * Course code, name (Chinese & English)
  * Instructor, credits, capacity
  * Time slots with visual indicators
  * Prerequisites, description
  * Syllabus preview (mock)
* **Smart Filtering & Search**
  * Multi-select filters that show result counts
  * Search by course name, code, or instructor
  * "Available time slots" filter to avoid conflicts
  * Save filter combinations

**Visual Design:**

* Light, airy layout encouraging exploration
* Soft colors, plenty of whitespace
* Hover effects showing "Add to Planning" action
* Non-intrusive visual hierarchy

---

### **Stage 2: Planning Container (Staging)**

*Mental Model: "Try before you commit" - Like Git staging or shopping cart*

**Purpose:** A safe sandbox for users to experiment with different schedule combinations without fear of commitment.

**Key Features:**

#### **A. Interactive Weekly Calendar View**

* **Visual Schedule Builder**
  * 7-day × time slots grid (8:00-22:00)
  * Drag-and-drop course blocks
  * Color-coded by department or course type
  * Overlapping courses shown with warning overlays
  * Hover to see full course details
* **Conflict Detection (Real-time)**
  * Red highlight for time conflicts
  * Warning badges on conflicting courses
  * Suggestions for alternative sections

#### **B. Course List Panel (Side by Side with Calendar)**

* **"Planning List" showing all staged courses**
  * Sortable by time, department, credits
  * Total credits counter (updates live)
  * Quick remove button (trash icon)
  * Reorder priority for waitlist scenarios
* **Quick Actions**
  * "Clear all" with confirmation
  * "Save as template" (stored in browser memory)
  * "Export schedule" as image or text

#### **C. Multiple Scenario Planning**

* **Tabs for Different Schedule Versions**
  * "Plan A", "Plan B", "Plan C" tabs
  * Duplicate and compare schedules
  * Visual diff showing differences between plans
  * Mark one as "primary"

**Interaction Patterns:**

* **Effortless Addition:**
  * One-click "Add to Planning" from browse view
  * Instantly appears in calendar with animation
  * Toast notification: "Added to planning schedule"
* **Effortless Removal:**
  * Click course block → delete option appears
  * Or drag to "Remove" zone at bottom
  * Undo button (5 seconds) after removal
* **Experimentation Encouragement:**
  * "This is just planning - feel free to experiment!"
  * No save/commit pressure
  * Auto-saves to local state continuously

**Visual Design:**

* Warmer colors indicating "work in progress"
* Dashed borders around planning area
* "Draft" watermark subtle in background
* Gentle animations for all changes

---

### **Stage 3: Submit Record (Commitment)**

*Mental Model: "Official course registration submission"*

**Purpose:** Clear transition from exploration to commitment, with appropriate friction to prevent accidental submission.

**Key Features:**

#### **A. Pre-Submission Review**

* **Transition Moment: "Ready to Submit?" Modal**
  * Appears when user clicks "Submit Registration"
  * Shows comprehensive summary:
    * Total courses & credits
    * Visual schedule preview (read-only)
    * List of all courses with details
    * Highlighted warnings (conflicts, overload, etc.)
* **Validation Checklist**
  * ✓ Credit requirements met (min/max)
  * ✓ No time conflicts
  * ✓ Prerequisites satisfied (simulated)
  * ⚠️ Warnings for attention (overload, evening classes, etc.)
* **Clear Call-to-Action Hierarchy**
  * Primary button: "Confirm & Submit Registration" (prominent)
  * Secondary button: "Back to Planning" (subtle)
  * Tertiary: "Save as Draft" (if needed)

#### **B. Submission Process**

* **Loading State with Progress**
  * "Submitting your registration..."
  * Simulated progress bar (3-4 seconds)
  * Micro-animations for engagement
* **Success Confirmation**
  * Celebratory animation (confetti or checkmark)
  * "Registration Submitted Successfully!" message
  * Display submission timestamp
  * Confirmation number (generated mock ID)
  * Summary card of submitted courses

#### **C. Post-Submission State**

* **"My Registration" View (Locked State)**
  * Different visual design from planning:
    * Solid borders instead of dashed
    * Muted colors (blues/grays) instead of warm
    * Lock icons on course blocks
    * "Submitted" badge with timestamp
* **Read-Only Schedule Display**
  * Same calendar view but non-interactive
  * Course blocks are static (no drag-drop)
  * "Official Registration" header
  * Downloadable as PDF/image

**Visual Design:**

* Deliberate friction elements:
  * Modal requires scrolling to see button
  * Checkbox: "I have reviewed my schedule"
  * 2-second delay on submit button activation
* Color shift: Blue/green (official, secure)
* Heavier borders, more structured layout
* Clear "point of no return" visual cue

---

### **Stage 4: Modification of Submitted Record**

*Mental Model: "Course add/drop period" with additional safeguards*

**Purpose:** Allow changes to submitted registration while clearly communicating this is a significant action.

**Key Features:**

#### **A. Entry Point (Intentional Friction)**

* **"Modify Registration" Button**
  * Located in corner (not prominent)
  * Requires hover to reveal full text
  * Warning icon next to it
* **Confirmation Modal (Two-Step)**
  * **Step 1:** "Are you sure you want to modify your submitted registration?"
    * Explanation: "This will reopen your registration for changes."
    * Warnings about potential consequences (mock)
    * Button: "Yes, I want to modify"
  * **Step 2:** "Enter your reason for modification"
    * Dropdown: Add course / Drop course / Swap course / Adjust schedule
    * Optional text area for notes
    * Button: "Proceed to Modification"

#### **B. Modification Mode**

* **Visual Distinction from Planning Stage**
  * Orange/amber accent colors (caution)
  * Banner at top: "⚠️ Modification Mode - Changes will affect your submitted registration"
  * Current submitted courses have special styling:
    * Slightly faded background
    * "Original" label
    * Strikethrough if being removed
* **Side-by-Side Comparison**
  * Left panel: Original submitted schedule (read-only preview)
  * Right panel: Modified schedule (editable)
  * Visual diff highlighting changes:
    * Green: Added courses
    * Red: Removed courses
    * Yellow: Time changes
* **Change Summary Panel**
  * Running list of all modifications:
    * "➕ Added: Advanced Calculus II"
    * "➖ Removed: Intro to Philosophy"
    * Credits delta: +3 credits
  * Real-time validation of new schedule

#### **C. Re-Submission Process**

* **"Submit Modified Registration" Button**
  * Different color from original submit (orange vs. blue)
  * Shows badge: "3 changes"
* **Review Changes Modal**
  * Detailed before/after comparison
  * Highlighted risk factors
  * Final confirmation checkbox: "I understand these changes will update my official registration"
  * Button: "Confirm Modification"
* **Success State**
  * "Registration Updated Successfully"
  * New confirmation number
  * Email-style update summary
  * New timestamp

**Visual Design:**

* Warning colors throughout (amber/orange)
* More explicit labels and instructions
* Comparison views to emphasize changes
* Heavier confirmation dialogs
* "Last modified: [timestamp]" always visible

---

## 🎨 Overall Visual System

### **Color Strategy**

* **Exploration (Stage 1):** Soft pastels, light grays - inviting
* **Planning (Stage 2):** Warm accent colors (teal, coral) - creative
* **Submitted (Stage 3):** Cool blues, greens - official, secure
* **Modification (Stage 4):** Amber/orange warnings - caution

### **Typography Hierarchy**

* **Headers:** Bold, clear sans-serif (e.g., Inter, Noto Sans TC)
* **Body:** Readable 16px base size
* **Course names:** Medium weight, larger (18px)
* **Meta info:** Lighter weight, smaller (14px)

### **Iconography**

* Consistent icon family (e.g., Lucide React)
* Meaningful icons for actions:
  * 🔍 Search/Browse
  * 📅 Calendar/Planning
  * ✓ Submit/Confirm
  * ✏️ Edit/Modify
  * 🗑️ Remove
  * ⚠️ Warning

### **Animations & Transitions**

* **Micro-interactions:** Hover effects, button presses (150ms)
* **State changes:** Fade transitions between stages (300ms)
* **Course additions:** Slide-in from source to calendar (400ms)
* **Success states:** Celebratory bounces, checkmarks (500ms)
* **Loading states:** Skeleton screens, progress indicators

---

## 🏗️ Component Architecture

### **Core Components**

1. **AppShell**
   * Navigation header (stage indicators)
   * Main content area
   * Global state management
2. **CourseCatalog** (Stage 1)
   * FilterPanel
   * CourseCard / CourseListItem
   * SearchBar
   * PaginationControls
3. **PlanningWorkspace** (Stage 2)
   * WeeklyCalendar
   * CourseBlock (draggable)
   * PlanningListPanel
   * ScheduleTabs (multiple scenarios)
   * ConflictDetector
   * CreditCounter
4. **SubmitReview** (Stage 3)
   * ReviewModal
   * ValidationChecklist
   * SubmitButton with loading state
   * SuccessConfirmation
5. **SubmittedView** (Stage 3 result)
   * LockedCalendarView
   * RegistrationSummaryCard
   * ExportButton
   * ModifyEntryButton
6. **ModificationMode** (Stage 4)
   * ModificationConfirmationModal
   * ComparisonView (before/after)
   * ChangesSummaryPanel
   * ResubmitButton

### **State Management Structure**

```javascript
{
  // Current stage
  currentStage: 'browse' | 'planning' | 'submitted' | 'modification',
  
  // Available courses (mock data)
  courseCatalog: [...],
  
  // User's planning area (Stage 2)
  planningSchedules: {
    'plan-a': [...],
    'plan-b': [...],
    activePlan: 'plan-a'
  },
  
  // Submitted registration (Stage 3)
  submittedRegistration: {
    courses: [...],
    timestamp: '2025-03-15T10:30:00',
    confirmationNumber: 'NTU-2025-A1B2C3',
  },
  
  // Modification tracking (Stage 4)
  modification: {
    original: [...],
    current: [...],
    changes: [...],
    isModifying: false,
  },
  
  // UI state
  filters: {...},
  selectedCourse: null,
  toast: null,
}
```

---

## 🔄 User Flow Diagram

```
START → Browse Courses (Stage 1)
           ↓ (Add to Planning)
       Planning Mode (Stage 2)
           ↓ (Experiment, adjust)
       Planning Mode ← → Planning Mode (iterate)
           ↓ (Ready to submit)
       Review Modal
           ↓ (Confirm)
       Submit Loading
           ↓
       Success! → Submitted View (Stage 3)
                      ↓ (Need to modify?)
                  Modification Confirmation
                      ↓ (Proceed)
                  Modification Mode (Stage 4)
                      ↓ (Make changes)
                  Review Changes
                      ↓ (Confirm)
                  Resubmit Loading
                      ↓
                  Updated Success → Submitted View
                                        ↓
                                       END
```

---

## 🎭 Key UX Principles

1. **Progressive Commitment:** Each stage requires increasing deliberation
2. **Visual Differentiation:** Clear visual language for each stage's significance
3. **Reversibility with Friction:** Easy to experiment, harder to commit
4. **Transparent State:** Always show where user is in the process
5. **Contextual Help:** Inline guidance without overwhelming
6. **Celebration & Confirmation:** Positive feedback for completion
7. **Error Prevention:** Validate before allowing submission
8. **Comparison Affordance:** Make it easy to see changes in modification mode

---

## 📱 Responsive Considerations

* **Desktop (1280px+):** Full side-by-side layout, calendar + list
* **Tablet (768-1279px):** Stacked layout with tabs, collapsible panels
* **Mobile (< 768px):**
  * Single column flow
  * Calendar shows one day at a time with swipe
  * Filters in drawer/modal
  * Simplified planning list

---

## 🚀 Technical Implementation Notes

* **Framework:** React with TypeScript
* **Styling:** Tailwind CSS for rapid development
* **State:** React hooks (useState, useReducer for complex state)
* **Data Storage:** Browser memory (no localStorage as per restrictions)
* **Icons:** Lucide React
* **Animations:** CSS transitions + Tailwind animation utilities
* **Mock Data:** 30-50 courses with realistic NTU-style data
* **Course times:** Taiwanese academic schedule (Monday classes as "Mon 3,4")

---

## 🎬 Ending Design

**Final State after Submission/Modification:**

A clean "Registration Complete" dashboard showing:

* ✅ Confirmed course schedule (calendar view)
* 📋 Course list with details
* 🎯 Total credits earned
* 📅 Important dates (semester start, add/drop deadline - mock)
* 💾 Export options (Download as PNG, Print schedule)
* 🏠 "Start New Registration" button (resets app)

**Celebratory Element:**

* Success badge with semester info: "2025 Spring Semester"
* Encouraging message: "準備好迎接新學期了！Good luck with your courses!"

---

This plan creates a comprehensive UX that respects the cognitive and emotional aspects of course registration while providing practical tools for decision-making. Would you like me to implement this as a working React application?
