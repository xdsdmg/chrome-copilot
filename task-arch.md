# Development Task: [Project Name, e.g., Chrome Copilot Browser Assistant]

## 2. Project Overview
Briefly describe where the project comes from, its business goals, or the problem it aims to solve.

## 3. Overall Requirements

### 3.1 Core Features
- List the main functional requirements of the system. Categorize them by roles or modules (e.g., User, Admin, Core System).
- For each feature, provide a concise description including:
    - **Input**: What triggers the feature or what data it requires.
    - **Processing**: A brief description of the core logic.
    - **Output**: The expected result or data produced.

### 3.2 Non-Functional Requirements
- **Performance**: e.g., Response time, concurrent user capacity, resource usage (CPU/Memory).
- **Security**: e.g., Data encryption (in transit/at rest), access control mechanisms, privacy compliance.
- **Reliability**: e.g., System availability target (uptime), fault tolerance, backup and recovery procedures.
- **Maintainability**: e.g., Coding standards, logging requirements, monitoring and alerting setup.
- **Compatibility**: e.g., Supported browser versions (Chrome, Edge), supported operating systems.

## 4. Technology Stack

### 4.1 Core Technologies
- Specify the programming languages, frameworks, libraries, databases, message queues, etc.
- Include version requirements (e.g., Node.js 18+, React 18, TypeScript 5+).

### 4.2 Development Tools
- List the IDEs, version control systems (Git), package managers (npm, pnpm), build tools (Vite, Webpack), and debugging tools.
- Mention CI/CD tools (GitHub Actions) and testing frameworks (Jest, Playwright).

## 5. System Architecture

### 5.1 High-Level Architecture Diagram
- Describe the diagram that should be created. It should show system layers (e.g., Presentation, Application, Data), main modules, external dependencies (e.g., OpenAI API), and data flow between components.

### 5.2 Module Breakdown
- List all primary modules and their core responsibilities (e.g., Browser Extension UI, Background Service Worker, Configuration Manager, Backend API Server).

## 6. Module Structure

### 6.1 Project Directory Structure
- Define the source code repository organization. Provide an example:

```
src/
├── extension/          # Browser extension frontend code (Popup, Options pages)
├── server/             # Backend service code (if applicable)
├── shared/             # Code shared between frontend and backend (types, utilities)
├── config/             # Configuration files (environment variables, app settings)
└── docs/               # Project documentation
```

### 6.2 Module Details
*For each module identified in section 5.2, provide a detailed breakdown using the following sub-sections:*

#### [Module Name, e.g., Browser Extension Popup]

##### Module Goal
- Clearly state what this module is intended to achieve and why it is necessary.

##### Module Directory
- Specify the exact path for this module's code within the project structure (e.g., `src/extension/popup/`).
- List the expected files (e.g., `index.tsx`, `Popup.tsx`, `Popup.css`, `hooks.ts`).

##### Data Design
- **Data Models**: Define the core data structures used within the module (e.g., TypeScript interfaces/types).
- **Storage**: Specify where the module's data persists (e.g., Chrome Storage `local`/`sync`, IndexedDB, browser `cookies`, backend database).

##### Interface Definitions
- **External Interfaces**: Describe the interfaces this module exposes to other modules or external systems (e.g., REST API endpoints, browser extension message listeners, custom events).
- For **each interface**, provide:
    - **Name & Purpose**: What the interface does.
    - **Request Method**: HTTP method (GET, POST) or message type.
    - **Request Parameters**: List each parameter with its name, type (string, number, `CustomType`), required status, and description.
    - **Response Format**: Describe the structure for successful and failed responses, including error codes and their meanings.
    - **Processing Logic**: Briefly explain the internal flow or sequence of calls when this interface is invoked.

##### Page/UI Description (If Applicable)
- Describe the layout or content of the user interface. What data does it display to the user?
- List which of the defined interfaces (APIs/messages) are called to fetch or submit this data.

##### Configuration Items (If Applicable)
- List all configuration parameters specific to this module, including name, type, default value, and description.

### 6.3 Module Dependencies
- Describe the relationships between modules. Which modules call others? What data is shared?
- List all external service dependencies (e.g., OpenAI API, GitHub API) and the modules that depend on them.

## 7. Data Design
- **Global Data Structures**: Define any data structures that are shared across multiple modules.
- **Data Dictionary**: For database-backed modules, list all tables/collections and their fields with descriptions.
- **Caching Strategy**: Specify which data should be cached, the caching mechanism (e.g., browser cache, Redis), and invalidation rules.

## 8. Interface Specifications
- **General Conventions**: Define universal API rules like versioning strategy (URL path, header), authentication method (OAuth 2.0, API Key in header), standard error response format, and pagination parameters (`page`, `limit`).
- **Interface List**: Provide a complete list of all interfaces (APIs, messages) across all modules. This can reference the details in section 6.2 or be a separate consolidated list.

## 9. Implementation Order
- Define development phases (e.g., MVP, Iteration 1, Iteration 2) based on dependencies, risk, and business value.
- For each phase, list the modules and specific features to be implemented, and state their priority.

## 10. Development Workflow
- **Branching Strategy**: e.g., Git Flow, GitHub Flow (main/develop/feature branches).
- **Commit Convention**: e.g., Conventional Commits (`feat:`, `fix:`, `docs:`).
- **Code Review Process**: Who reviews? What is the review checklist (style, tests, logic)?
- **CI/CD**: Describe the automated build, test, and code scanning process on each push/PR.

## 11. Testing Methods
- **Unit Testing**: Specify the framework (Jest, Vitest) and the minimum code coverage target (e.g., 80%).
- **Integration Testing**: How are integration tests set up? How is test data managed?
- **End-to-End Testing**: Which critical user scenarios should be covered by E2E tests (e.g., Playwright scripts)?
- **Manual Testing**: Provide steps or areas that require manual testing due to complexity.
- **Performance Testing**: Mention the tools (Lighthouse, k6), test scenarios, and key metrics to measure.

## 12. Compilation and Deployment
- **Build Process**: Specify the build commands (e.g., `npm run build`) and describe the output artifacts (e.g., `dist/` folder with extension files).
- **Deployment Architecture**: Describe the target infrastructure (e.g., static hosting for extension, cloud server for backend), load balancing, and domain configuration.
- **Deployment Steps**: Outline the steps for a new release: environment setup, configuration updates, service start/restart.
- **Rollback Plan**: Describe the process for reverting to a previous version if a deployment fails, including database migration rollbacks.

## 13. Deliverables
- **Documentation List**: List all documents to be delivered (e.g., `API.md`, `DEPLOYMENT.md`, `USER_GUIDE.md`).
- **Test Report**: Provide a summary of test results and coverage reports.
