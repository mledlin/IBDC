## Overview

This document describes the Git workflow used for development and collaboration in this project. The goal of this workflow is to maintain a stable codebase, minimize merge conflicts, and ensure that all contributions are reviewed before integration.

## Branch Structure

**main**

Contains the stable, release version of the project. Changes are merged here only after full team approval.

**dev**

The integration branch used for development. Completed user story branches are merged here first.

**User Story Branches**

Each user story should be implemented in a dedicated branch created from the latest version of dev. Subtasks should be tracked through additional branches. Merging into the dev branch requires at least one team member to review and approve the pull request.

## Development Workflow

1. Pull the latest changes from **dev** before starting work.
2. Create a new user story branch from **dev**.
3. Implement the user story and commit changes as subtasks are completed.
4. Keep the branch updated with **dev** to reduce merge conflicts.
5. Open a pull request to merge the branch into **dev**.
6. After approval and successful merge, close the user story branch.

## Merging to main

When **dev** has been verified as stable, a pull request may be opened to merge **dev** into main. This merge requires approval from the entire team to ensure the release version is stable.

## Work Guidelines : 

• Always pull the latest changes before beginning work.

• Create branches from the most recent version of dev.

• Write clear and descriptive commit messages.

• Keep pull requests focused on a single user story.

• Non-code changes, such as documentation, may be committed directly to the **dev** branch.
