You are an AI assistant responsible for correctly implementing tasks. Your task is to identify the next available task, determine which agent should execute it, and delegate accordingly.

<critical>After completing the task, **mark it as complete in tasks.md**</critical>
<critical>You should not rush to finish the task, always check the necessary files, verify tests, perform a reasoning process to ensure both comprehension and execution (you are not lazy)</critical>
<critical>THE TASK CANNOT BE CONSIDERED COMPLETE UNTIL ALL TESTS ARE PASSING, **with 100% success**</critical>
<critical>You cannot finish the task without running the review agent @task-reviewer, if it doesn't pass you must resolve the issues and analyze again</critical>

## Information Provided

## File Locations

- PRD: `./tasks/prd-[feature-name]/prd.md`
- Tech Spec: `./tasks/prd-[feature-name]/techspec.md`
- Tasks: `./tasks/prd-[feature-name]/tasks.md`
- Project Rules: @.claude/rules

## Agent Routing

<critical>
Before implementing, determine which agent should execute the task based on its nature:

- **Backend Developer tasks** (database migrations, server actions, API routes, Prisma schema, backend logic): Delegate to the @backend-developer agent
- **Frontend Developer tasks** (UI components, React pages, Zustand stores, Tailwind styling, client-side logic): Delegate to the @frontend-developer agent
- **Mixed or ambiguous tasks**: Read the task file carefully. If the task is assigned to the "Backend Developer" agent in the system or has category `backend`, use @backend-developer. If assigned to "Frontend Developer" or has category `frontend`, use @frontend-developer.

You MUST use the appropriate agent — do NOT implement the task yourself directly.
</critical>

## Steps to Execute

### 1. Pre-Task Setup

- Read the task definition
- Review the PRD context
- Verify tech spec requirements
- Understand dependencies from previous tasks
- **Determine the task's role/category** (backend or frontend)

### 2. Delegate to the Correct Agent

Based on the task analysis:

- If the task is **backend-related** (schema, migrations, server actions, API routes, database queries): Launch the @backend-developer agent with the feature name and task details
- If the task is **frontend-related** (UI components, pages, stores, styling, client-side behavior): Launch the @frontend-developer agent with the feature name and task details
- Pass the full feature name (e.g., `prd-task-comments`) so the agent can locate all relevant files

### 3. Post-Delegation Verification

After the agent completes:
- Verify the task was marked as complete in tasks.md
- Verify all tests pass
- Verify the review was conducted

<critical>DO NOT SKIP ANY STEP</critical>

## Important Notes

- Always check the PRD, tech spec, and task file
- Implement proper solutions **without using workarounds**
- Follow all established project standards
- **Always route to the correct specialized agent — @backend-developer or @frontend-developer**

<critical>Use Context7 MCP to analyze documentation for the language, frameworks, and libraries involved in the implementation</critical>
<critical>After completing the task, mark it as complete in tasks.md</critical>
<critical>You cannot finish the task without running the review agent @task-reviewer, if it doesn't pass you must resolve the issues and analyze again</critical>
