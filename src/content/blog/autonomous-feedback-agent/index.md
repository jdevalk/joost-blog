---
title: Building an Autonomous Feedback Agent
publishDate: 2026-02-14T00:00:00.000Z
excerpt: >-
  What if your users could submit a bug report and have a pull request ready for
  review before you’ve even seen the ticket? That’s what we built for Rondo
  Club, a
categories:
  - Development
featureImage:
  src: ./images/building-an-autonomous-feedback-agent-featured-scaled.webp
  alt: ''
---
What if your users could submit a bug report and have a pull request ready for review before you’ve even seen the ticket? That’s what we built for [Rondo Club](https://rondo.svawc.nl), a sports club management app. It’s a fully autonomous feedback processing pipeline (in my case powered by Claude Code).

This post walks through the entire system: how feedback gets submitted, how an AI agent picks it up and writes code, how PRs get reviewed automatically, and how it all runs unattended on a Mac Mini (but could run anywhere).

## Table of contents

- [The idea](#h-the-idea)
- [How it works](#h-how-it-works)
- [Stage 1: Feedback submission](#h-stage-1-feedback-submission)
- [Stage 2: Approval](#h-stage-2-approval)
- [Stage 3: The feedback agent](#h-stage-3-the-feedback-agent)
    - [Fetching work](#h-fetching-work)
    - [Running Claude Code](#h-running-claude-code)
    - [Status handling](#h-status-handling)
    - [Safety features](#h-safety-features)
- [Stage 4: Automated code review](#h-stage-4-automated-code-review)
- [Stage 5: Merge and deploy](#h-stage-5-merge-and-deploy)
- [Stage 6: Fixing errors from the server](#h-stage-6-fixing-errors-from-the-server)
- [Stage 7: Code optimization](#h-stage-7-code-optimization)
- [The conversation thread](#h-the-conversation-thread)
- [The things I learned](#h-the-things-i-learned)
    - [What works well](#h-what-works-well)
    - [What to watch for](#h-what-to-watch-for)
- [The stack](#h-the-stack)
- [Running it yourself](#h-running-it-yourself)
- [Tried this yourself? Have feedback?](#h-tried-this-yourself-have-feedback)

## The idea

Rondo Club is a WordPress-based application with a React frontend, used by my local football club to manage members, teams, and committees. As a solo developer, I wanted to shorten the loop between “user reports a problem” and “fix deployed to production”, without me being the bottleneck for every small bug or feature request.

The goal: users submit feedback in the app, I approve it with a click. Then an AI agent processes it, creates a PR, gets it reviewed, and merges it, all without further human intervention for straightforward changes.

## How it works

The system has six stages:

1. **Submission** — Users submit feedback through an in-app form.
2. **Approval** — An admin reviews and approves the feedback item.
3. **Processing** — A scheduled script picks up approved feedback and sends it to Claude Code.
4. **Review** — The resulting PR gets an automated code review.
5. **Resolution** — Clean PRs are merged and deployed automatically.
6. **Optimization** — When the feedback queue is empty, the agent reviews existing code for improvements.

Let’s walk through each stage.

## Stage 1: Feedback submission

Every logged-in user sees a feedback button in the app’s navigation. Clicking it opens a modal where they can submit either a **bug report** or a **feature request**.

For bugs, the form captures:

- Title and description
- Steps to reproduce
- Expected vs. actual behavior
- Optional screenshot attachments (drag-and-drop)
- Optional system info (browser, app version, current URL)

For feature requests:

- Title and description
- Use case

Users also select which project the feedback is for, as the system supports multiple repos (the main app, a sync service, and a marketing website).

On the backend, feedback items are stored as a WordPress custom post type with metadata for status, type, priority, and project. A REST API endpoints handles CRUD operations and supports filtering by status and type.

New feedback items start with status `new`.

## Stage 2: Approval

This is the only human gate in the process, and it’s an important one. An admin reviews each feedback item and sets it to `approved` when it’s ready for the agent to pick up. This prevents the agent from acting on vague, duplicate, or potentially malicious input. Without this step, any logged-in user could effectively instruct an AI agent to write and merge code into your codebase.

## Stage 3: The feedback agent

The heart of the system is a bash script that runs on a Mac Mini via `launchd`, scheduled every 5 minutes. It operates in loop mode: fetch the oldest approved item, process it, repeat until the queue is empty.

### Fetching work

Each iteration follows a priority order:

1. **In-review PRs first** — Check if any existing PRs have Copilot review feedback that needs addressing. Finish what’s already started before taking on new work.
2. **Approved feedback** — Pick up the oldest approved item from the API.
3. **Optimization** — Only when nothing else needs doing, review code for improvements.

### Running Claude Code

When the script picks up a feedback item, it:

1. Sets the item’s status to `in_progress` (so no other run picks it up)
2. Formats the feedback into a structured prompt with all context: description, steps to reproduce, conversation history, and system instructions
3. Passes it to Claude Code with `--print --dangerously-skip-permissions`
4. Monitors the process with a 10-minute timeout, logging progress every 2 minutes

The prompt ends with an agent instruction file (`.claude/agent-prompt.md`) that tells Claude exactly what to do:

- Create a `feedback/{id}-{slug}` branch
- Analyze the feedback and make changes
- Run `npm run build` to verify the frontend compiles
- Commit, push, and create a PR with the feedback ID in the title
- Output a structured status (`IN_REVIEW`, `NEEDS_INFO`, or `DECLINED`)

### Status handling

When Claude finishes, the script parses its output for a status line:

- **`IN_REVIEW`** — A PR was created. The script extracts the PR URL, stores it as metadata on the feedback item, and requests a Copilot code review.
- **`NEEDS_INFO`** — Claude couldn’t resolve the issue autonomously. The script posts Claude’s question as a comment on the feedback thread, visible to the user in the app.
- **`DECLINED`** — The feedback was evaluated and determined not actionable.

If Claude fails or times out, the status resets to `approved` so it re-enters the queue.

### Safety features

The script includes several safety mechanisms:

- **Lock file** prevents concurrent runs (launchd might trigger while a previous run is still going)
- **Signal handlers** catch SIGTERM/SIGINT and clean up — resetting feedback status and checking out `main`
- **Timeout enforcement** kills hung Claude processes after 10 minutes
- **Crash recovery** resets feedback status if the script exits unexpectedly
- **Git cleanup** returns to `main` and removes merged branches after each item

## Stage 4: Automated code review

After Claude creates a PR, the script requests a review from GitHub Copilot. On the next run, the PR review processor checks for responses:

- **Clean review (no inline comments)** — The PR is safe to merge. Proceed directly to Stage 4.
- **Review with comments** — The script checks out the PR branch, formats Copilot’s inline comments into a prompt, and runs Claude again with a review-fix instruction set (`.claude/review-fix-prompt.md`).

The review-fix prompt tells Claude to:

- Fix real bugs, consistency issues, and safety problems
- Skip stylistic nitpicks, test requests, and subjective suggestions
- Output whether the PR is `SAFE_TO_MERGE` after fixes

If Claude determines it’s safe to merge after fixing review comments, the PR proceeds to automatic merge (and if it fails, which can happen because other PRs have been merged since etc, Claude fixes the merge conflict). Otherwise, it gets assigned to the human developer for manual review.

## Stage 5: Merge and deploy

When a PR is deemed safe — either by a clean Copilot review or by Claude’s post-fix assessment — the script:

1. Squash-merges the PR via `gh pr merge --squash --delete-branch`
2. Pulls `main` with the merged changes
3. Runs the deploy script, which rsync’s the theme to production and clears caches
4. Updates the feedback item status to `resolved`

The feedback ID is extracted from the branch name (`feedback/1234-slug` → `1234`) to automatically close the right item.

## Stage 6: Fixing errors from the server

Once the feedback queue is empty and the reviewed PRs are handled, the agent starts looking at the server’s PHP error logs. If it finds errors it can fix, it’ll run the same flow for them as it does for feedback items.

## Stage 7: Code optimization

When the feedback queue is empty, all the PRs are handled and there are no errors on the server that need work, the agent enters optimization mode. It systematically works through every source file across all projects, reviewing each one for simplification opportunities: dead code removal, DRY violations, unnecessary complexity, performance wins. If it finds confident improvements, it creates an `optimize/` PR. If not, it moves on.

To avoid wasting API calls re-reviewing unchanged code, the tracker stores the git commit hash that last touched each file. On subsequent runs, it compares the stored hash against the current one — if they match, the file hasn’t changed and gets skipped. Only files with new commits are re-reviewed.

A tracker file prevents reviewing the same file twice and enforces daily limits (25 optimization runs, 10 PRs per day) to keep costs reasonable.

## The conversation thread

One of the more useful features is the back-and-forth capability. When Claude responds with `NEEDS_INFO`, its question gets posted as a comment on the feedback item. The user sees this in the app’s feedback detail page and can reply.

On the next processing run, the agent picks up the item again — this time with the full conversation history included in the prompt. Claude sees the original feedback plus all follow-up exchanges, giving it the context to resolve the issue.

This means some feedback items go through multiple rounds:

1. User submits bug report
2. Admin approves
3. Agent asks clarifying question
4. User responds
5. Admin approves again (to prevent injection of vile stuff)
6. Agent fixes the bug and creates a PR

## The things I learned

### What works well

- **Small, focused changes are reliable.** Claude handles targeted bug fixes and UI tweaks consistently well. The structured feedback format (steps to reproduce, expected/actual behavior) gives it enough context to work autonomously.
- **The priority system matters.** Finishing in-review PRs before starting new work prevents a pile-up of half-done items.
- **Timeouts are essential.** Claude occasionally gets stuck in an idle state. The 10-minute timeout with progress logging catches these cases automatically.
- **The human gate is important.** Having an admin approve feedback before it enters the queue filters out vague or duplicate reports that would waste agent time.

### What to watch for

- **Claude sometimes over-engineers.** The agent prompt explicitly says “keep changes minimal and focused” — without this, Claude tends to refactor surrounding code while fixing a bug.
- **Process monitoring needs visibility.** Early on, stuck processes were invisible. Adding progress logging every 2 minutes and structured log output made it much easier to diagnose issues remotely.
- **Git state management is tricky.** The script needs to handle dirty working directories, failed checkouts, and stale branches defensively. Every Claude session might leave the repo in an unexpected state.

## The stack

ComponentTechnologyFeedback storageWordPress custom post type + REST APIFeedback UIReact form with drag-and-drop attachmentsProcessing scriptBash (`get-feedback.sh`)AI agentClaude CodeCode reviewGitHub CopilotPR managementGitHub CLI (`gh`)SchedulingmacOS `launchd` (every 5 minutes)Deploymentrsync via bash scriptHostingMac Mini (agent) + WordPress## Running it yourself

The core pattern is transferable to any project:

1. **Build a feedback intake** — could be a form, a Slack bot, a GitHub issue template, whatever captures structured input.
2. **Write an agent prompt** — be very specific about what the agent should and shouldn’t do. Include rules about branch naming, commit messages, and PR format. Tell it to keep changes minimal.
3. **Wrap Claude Code in a monitoring script** — handle timeouts, cleanup, and status tracking. Don’t trust that the process will always complete cleanly.
4. **Add automated review** — a second pass catches issues the agent might introduce. This could be Copilot, another Claude session, or a linter.
5. **Automate the merge/deploy for safe changes** — but keep a human fallback for anything complex.

The full source is in the [Rondo Club repository](https://github.com/RondoHQ/rondo-club) — the agent script at `bin/get-feedback.sh` and the prompts in `.claude/`.

## Tried this yourself? Have feedback?

Let me know in the comments!
