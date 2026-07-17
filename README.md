# Custom Agentic AI Framework

A lightweight, highly-typed, and flexible multi-agent orchestration framework written in plain TypeScript. Designed for Next.js applications (and general TS/Node environments), this framework provides a production-ready foundation for building complex multi-agent architectures without the overhead or design constraints of heavy external libraries like LangChain or CrewAI.

## Architecture Highlights

This framework follows **Clean Architecture**, **SOLID principles**, and **Strict TypeScript** safety guidelines (no `any` types).

```
src/
├── types/
│   └── agent.ts           # Interfaces, Enums, Event types, and Registry types
├── services/
│   ├── logger.ts          # Structured application logger
│   ├── event-emitter.ts   # Strongly typed Pub/Sub event emitter
│   └── index.ts
├── agents/
│   ├── base-agent.ts      # Abstract BaseAgent class with execution lifecycle hooks
│   ├── planner-agent.ts   # Topological Sort dependency resolver and planner
│   ├── registry.ts        # central Agent Registry implementation
│   └── index.ts
├── orchestrator/
│   ├── orchestrator.ts    # AgentOrchestrator orchestrating steps and events
│   └── index.ts
├── index.ts               # Core package exports
└── demo.ts                # End-to-end framework execution demonstration
```

---

## Core Components

### 1. Types & Interfaces (`src/types/agent.ts`)
- **`AgentStatus`**: Enum representing the lifecycle states of an agent (`WAITING`, `RUNNING`, `SUCCESS`, `FAILED`, `SKIPPED`).
- **`AgentContext`**: Generic, key-value data structure storing pipeline state. Includes a dedicated `memory` object for cross-agent state parameters and `metadata` for execution parameters.
- **`AgentResult`**: Structured output of agent execution, including reasoning summary, confidence score, execution duration, and dynamic routing recommendations.
- **`Agent`**: Base interface contract that all agents implement.
- **`ExecutionPlan`**: Sequence of steps determined by the planner.

### 2. Services (`src/services/`)
- **`Logger` & `ConsoleLogger`**: Unified logging interface providing clean terminal printouts with standard formatting, ISO timestamps, and contextual metadata.
- **`FrameworkEventEmitter`**: A lightweight, type-safe implementation of Node's EventEmitter that routes agent lifecycle events (`AgentStarted`, `AgentCompleted`, `AgentFailed`, `ContextUpdated`) to downstream channels (e.g. UI logs, telemetry).

### 3. Base Agent & Registry (`src/agents/`)
- **`BaseAgent`**: Abstract class implementing the `Agent` interface. Concrete agents only implement the `run()` method containing business or AI logic. The base class automates:
  - Strict input validation via the `validate()` hook (returning `SKIPPED` on failure).
  - Pre-execution setups via the `preExecute()` hook.
  - High-precision performance timing via `performance.now()`.
  - Structured try-catch block wrapping execution to capture runtime exceptions and output `FAILED` results cleanly.
  - Post-execution tear-down and diagnostics via the `postExecute()` hook.
- **`DefaultAgentRegistry`**: A central directory preventing duplicate registrations and resolving agents dynamically by ID, decoupling construction from the orchestration runtime.

### 4. Dependency-Aware Planner Agent (`src/agents/planner-agent.ts`)
- The `PlannerAgent` takes a high-level natural language goal, identifies which registered agents are required to fulfill it via description word-overlap matching, and resolves their dependencies.
- It implements a **Topological Sort algorithm with Cycle Detection** to compile a valid linear execution order, raising compile/planning time errors if cyclic blockades are found.

### 5. Agent Orchestrator (`src/orchestrator/orchestrator.ts`)
The `AgentOrchestrator` controls pipeline flow:
- **Planner-Driven Execution**: Runs the `PlannerAgent` to build an execution plan and hands it off to the execution loop.
- **Sequential Execution**: Runs a manual sequence of agent IDs.
- **Order Validation**: Asserts that no agent in a sequence runs before its dependencies are resolved.
- **State Redux**: Merges agent delta outputs into the shared context and fires the `ContextUpdated` event.
- **Dynamic Routing**: Monitors agent results for `nextAgent` signals, dynamically injecting runtime overrides at the head of the execution queue.
- **Failure Aborts**: Halts the execution chain immediately if an agent fails.
- **Execution Log Report**: Compiles a comprehensive final report detailing execution steps, status, timings, reasoning summaries, and context snapshots.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
Clone or copy the directory and install dependencies:
```bash
npm install
```

### Compile TS Code
To build the distribution bundle:
```bash
npm run build
```
Or to run type checks in strict mode:
```bash
npx tsc --noEmit
```

### Run the Demo
The demo showcases three execution scenarios (planner-driven routing, neutral execution, and out-of-order validation failure) accompanied by terminal logs showing event emitter milestones:
```bash
npm run demo
```
