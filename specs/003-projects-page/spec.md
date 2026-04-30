# Feature Specification: Unified Projects Page

**Feature Branch**: `003-projects-page`
**Created**: 2026-04-30
**Status**: Draft
**Input**: User description: "Unified Projects Page with project creation and per-project dashboards"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Financial Project (Priority: P1)

A freelancer opens the app and wants to separate their work expenses from personal ones. They navigate to the "Projects" page from the sidebar and create a new project called "AWS & Dev Tools" of type "Freelance", set a monthly budget limit of 500 AED, assign it an icon, and link their business Visa card (last 4 digits: 4242).

**Why this priority**: This is the foundational action — without the ability to create a project, no other feature in this spec is possible. Delivers immediate value by letting users define their financial boundaries.

**Independent Test**: Can be tested by opening the app, going to the Projects page, clicking "New Project", filling out the form, and verifying the project appears in the projects list.

**Acceptance Scenarios**:

1. **Given** the Projects page is open and no projects exist, **When** the user clicks "New Project" and fills in name, icon, type, and budget limit, **Then** the project is created and appears as a card on the Projects page.
2. **Given** the project creation form is open, **When** the user submits without providing a name, **Then** an error message prompts the user to enter a project name.
3. **Given** the project creation form is open, **When** the user links a bank card by entering its last 4 digits, **Then** the card is associated with the project and shown in the project details.
4. **Given** a project already exists, **When** the user creates a second project with a different type (e.g., "Personal"), **Then** both projects appear on the Projects page independently.

---

### User Story 2 - View All Projects on a Unified Page (Priority: P2)

A small business owner opens the app and sees all their projects — Personal, Business, and Freelance — on a single "Projects" page without needing to switch between tabs or sections. Each project is shown as a card with its name, icon, type, and a summary of budget usage.

**Why this priority**: The unified view is the core UX improvement over the old separated layout. It directly addresses the problem of mixing and losing track of finances across different life contexts.

**Independent Test**: Can be tested with seeded mock data containing projects of different types — verify all appear on one page and no navigation to sub-sections is required.

**Acceptance Scenarios**:

1. **Given** multiple projects of different types exist, **When** the user navigates to the Projects page, **Then** all projects are displayed on a single page as cards.
2. **Given** projects are displayed, **When** the user views a project card, **Then** they can see the project name, icon, type label, and current spend relative to the budget limit.
3. **Given** no projects exist, **When** the user visits the Projects page, **Then** an empty state with a clear call-to-action to create a new project is shown.

---

### User Story 3 - View a Project's Independent Dashboard (Priority: P3)

A freelancer clicks on their "AWS & Dev Tools" project card and is taken to that project's dedicated dashboard. The dashboard shows only the P&L, cash flow, and insights that are tied to that project's transactions — completely separate from the "Netflix" personal project.

**Why this priority**: The per-project dashboard is the core value proposition — financial separation. Without it, creating projects has no analytical benefit.

**Independent Test**: Can be tested with a project containing seeded transactions — verify the dashboard shows only those transactions and their derived metrics (P&L, cash flow, insights).

**Acceptance Scenarios**:

1. **Given** a project has transactions assigned to it, **When** the user opens the project dashboard, **Then** P&L, cash flow, and insights sections reflect only that project's transactions.
2. **Given** two projects with different transactions, **When** the user views each project dashboard separately, **Then** the metrics shown are independent and do not include transactions from the other project.
3. **Given** a project has no transactions, **When** the user opens its dashboard, **Then** the dashboard shows empty states for each section with prompts to add transactions.

---

### User Story 4 - Assign a Transaction to a Project (Priority: P4)

A freelancer manually adds a transaction for an AWS bill. During creation, they select the "AWS & Dev Tools" project from a dropdown. Later, they add a Netflix charge and assign it to their "Personal" project. The two transactions appear in their respective project dashboards.

**Why this priority**: Transaction-to-project assignment is what enables financial separation. Without it, the per-project dashboard remains empty and the core success scenario cannot be achieved.

**Independent Test**: Can be tested by creating two projects and two transactions (one per project), then verifying each dashboard only shows its own transaction.

**Acceptance Scenarios**:

1. **Given** at least one project exists, **When** the user creates a new transaction, **Then** they are required to assign it to a project before saving.
2. **Given** a transaction is assigned to "Project A", **When** the user views "Project A" dashboard, **Then** the transaction appears in the dashboard.
3. **Given** a transaction is assigned to "Project A", **When** the user views "Project B" dashboard, **Then** the transaction does not appear.

---

### User Story 5 - Edit or Delete a Project (Priority: P5)

A user realizes they set the wrong budget limit on their "Business" project. They open the project from the Projects page, edit the budget limit, and save. Later, they decide to delete an unused "Side Hustle" project.

**Why this priority**: Projects will need maintenance over time; without edit/delete, users are locked in and may create duplicates, leading to data confusion.

**Independent Test**: Can be tested by creating a project, editing its name and budget, verifying changes persist, then deleting it and confirming it disappears from the projects list.

**Acceptance Scenarios**:

1. **Given** a project exists, **When** the user edits its name, icon, type, budget, or linked cards and saves, **Then** the updated details are reflected immediately on the Projects page and dashboard.
2. **Given** a project exists with transactions, **When** the user deletes the project, **Then** the project is removed from the Projects page and the user is informed about what happens to its transactions.
3. **Given** a project exists with no transactions, **When** the user deletes it, **Then** it is removed without additional warnings.

---

### Edge Cases

- What happens to transactions belonging to a deleted project? (See Assumptions)
- What if a user sets a budget limit of zero or leaves it blank?
- What if two projects are given the same name?
- What if a bank card (last 4 digits) is linked to more than one project?
- What happens if the user tries to create more than a reasonable number of projects (e.g., 50+)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a single unified "Projects" page accessible from the main sidebar navigation.
- **FR-002**: Users MUST be able to create a new project by providing: name (required), icon (required), type (required), and budget limit (optional).
- **FR-003**: Project type MUST support at minimum three options: Personal, Business, Freelance.
- **FR-004**: Users MUST be able to link one or more bank cards to a project by entering the card's last 4 digits.
- **FR-005**: Every transaction MUST be assigned to exactly one project; a transaction cannot exist without a project assignment.
- **FR-006**: Each project MUST have a dedicated dashboard page showing P&L, cash flow, and insights — scoped exclusively to that project's transactions.
- **FR-007**: The Projects page MUST display all projects as cards, each showing at minimum: name, icon, type, and budget utilization summary.
- **FR-008**: Users MUST be able to edit a project's name, icon, type, budget limit, and linked bank cards after creation.
- **FR-009**: Users MUST be able to delete a project from the Projects page.
- **FR-010**: The application MUST be fully accessible without any authentication, authorization, or login flow.
- **FR-011**: The Projects page MUST display an empty state with a "Create Project" call-to-action when no projects exist.
- **FR-012**: System MUST show a confirmation or notice when deleting a project that has associated transactions.

### Key Entities

- **Project**: Represents a financial context. Has a name, icon, type (Personal/Business/Freelance), optional budget limit, and a list of linked bank card identifiers (last 4 digits). Is the parent container for transactions and dashboards.
- **Bank Card Reference**: An identifier (last 4 digits) linking a card to one or more projects. Does not store full card details.
- **Transaction**: A financial record (amount, date, description, category). Belongs to exactly one project. Drives all dashboard metrics.
- **Project Dashboard**: A derived view scoped to one project. Contains three sections: Profit & Loss (P&L), Cash Flow, and Insights — all calculated from the project's transactions only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a new project from scratch in under 90 seconds.
- **SC-002**: All projects are visible on a single page — no tab switching or sub-navigation required to see projects of different types.
- **SC-003**: Each project's dashboard exclusively reflects its own transactions; no data leakage between project dashboards.
- **SC-004**: A user can successfully replicate the AWS (work) vs Netflix (personal) separation scenario using two projects and manually entered transactions.
- **SC-005**: Budget utilization for each project is visible at a glance on the Projects overview page without opening the project dashboard.
- **SC-006**: Any user can open the application and immediately begin creating projects and transactions without any sign-in or setup step.

## Assumptions

- No authentication or authorization is implemented; the application is open to any user without login.
- "Icon" refers to a selection from a predefined set of emojis or icon symbols — no custom image uploads.
- Bank cards are identified by last 4 digits only; no full card numbers or sensitive financial data are stored or displayed.
- Transactions are manually entered by the user; automatic bank import or card sync is out of scope for this feature.
- The application uses mock/seed data to pre-populate example projects and transactions for demonstration and testing purposes.
- When a project is deleted, its transactions are retained but become unassigned (orphaned); a future feature may handle reassignment.
- A single bank card (by last 4 digits) may be linked to multiple projects simultaneously — the user decides which project a transaction belongs to at the time of entry.
- Budget limit is an optional soft limit used for display/warning purposes only; it does not block transaction creation when exceeded.
- Currency display defaults to a single currency (e.g., AED) for this feature; multi-currency support is out of scope.
- The sidebar navigation item "Projects" replaces any previous separation of Personal/Business/Freelance sidebar links.
