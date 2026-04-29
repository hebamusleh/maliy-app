# Feature Specification: Project Management System

**Feature Branch**: `001-project-system`  
**Created**: 2026-04-29  
**Status**: Draft  
**Input**: User description: "Build the core project management system for ماليّ financial app.

Users can create multiple financial projects (personal, business, freelance).
Each project has: name, icon, type, budget limit, linked bank cards (last 4 digits).
Every transaction belongs to exactly one project.
Projects have independent dashboards with their own P&L, insights, and cash flow.

Users: freelancers and small business owners in MENA who mix personal and business finances.
Success: user can separate AWS bill (work) from Netflix (personal) automatically."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create Financial Project (Priority: P1)

As a freelancer or small business owner in MENA, I want to create a new financial project so I can organize my mixed personal and business finances separately.

**Why this priority**: This is the foundation for all other features, allowing users to establish the basic structure for financial separation.

**Independent Test**: Can be fully tested by creating a project with name, icon, type, and budget limit, and verifying it appears in the project list.

**Acceptance Scenarios**:

1. **Given** user is logged in, **When** user fills out project creation form with name, selects icon, chooses type (personal/business/freelance), sets budget limit, **Then** project is created and appears in user's project list.
2. **Given** user attempts to create project without required fields, **When** user submits form, **Then** validation errors are shown for missing fields.

---

### User Story 2 - Link Bank Card to Project (Priority: P1)

As a user with multiple bank cards, I want to link cards to specific projects so transactions from those cards are automatically assigned to the correct project.

**Why this priority**: Enables automatic transaction separation, which is a key success criterion for the app.

**Independent Test**: Can be fully tested by linking a card's last 4 digits to a project and verifying the association is stored.

**Acceptance Scenarios**:

1. **Given** project exists, **When** user enters last 4 digits of bank card and associates with project, **Then** card is linked and association is saved.
2. **Given** card is already linked to another project, **When** user tries to link it to a different project, **Then** system shows conflict and asks for confirmation to reassign.

---

### User Story 3 - View Project Dashboard (Priority: P1)

As a user managing multiple projects, I want to view an independent dashboard for each project showing its P&L, insights, and cash flow so I can track financial performance per project.

**Why this priority**: Provides the core value of project separation, allowing users to see financial metrics isolated per project.

**Independent Test**: Can be fully tested by viewing a project's dashboard and verifying it shows P&L, insights, and cash flow data specific to that project.

**Acceptance Scenarios**:

1. **Given** project has transactions, **When** user views project dashboard, **Then** dashboard displays profit & loss, key insights, and cash flow chart for that project only.
2. **Given** project has no transactions, **When** user views project dashboard, **Then** dashboard shows zero values and prompts to add first transaction.

---

### Edge Cases

- What happens when user tries to create more than 10 projects? System allows unlimited projects.
- How does system handle duplicate project names? Allows duplicates, as users may have multiple projects with same name.
- What if card last 4 digits are linked to multiple projects? System prevents this to ensure single project per transaction.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to create financial projects with name, icon, type (personal/business/freelance), and budget limit.
- **FR-002**: System MUST allow users to link bank cards (last 4 digits) to specific projects.
- **FR-003**: System MUST ensure every transaction belongs to exactly one project.
- **FR-004**: System MUST provide independent dashboards for each project showing P&L, insights, and cash flow.
- **FR-005**: System MUST automatically assign transactions to projects based on linked cards.

### Key Entities _(include if feature involves data)_

- **Project**: Represents a financial container with attributes like name, icon, type, budget limit, and associated user.
- **CardLink**: Represents association between a bank card (last 4 digits) and a project.
- **Transaction**: Financial transaction that belongs to exactly one project.

## Success Criteria

- Users can create and manage at least 5 different financial projects.
- 95% of transactions are automatically assigned to correct projects based on card linking rules.
- Users can view accurate profit & loss statements for each project independently.
- System supports freelancers and small business owners separating personal and business finances.

## Assumptions

- Transactions are imported from external sources (banks, cards).
- Users have access to their bank card last 4 digits.
- Budget limits are soft limits for tracking, not hard enforcement.
