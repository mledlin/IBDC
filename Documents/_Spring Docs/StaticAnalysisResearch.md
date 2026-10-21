# Static Analysis using ESLint and CI

## **Overview**

\-     For this project, we implemented static analysis using ESLint integrated into our GitHub Actions CI workflow. The goal is to automatically catch issues and keep the code consistent without relying only on manual review.

\-     This setup ensures that any code pushed to the repository is analyzed before being merged, reducing bugs and helping keep the project stable as changes are added.

## **Role of ESLint**

​	ESLint serves as the primary static analysis tool for this project. It analyzes JavaScript and TypeScript code without executing it and flags issues based on a defined set of rules.

ESLint is being used to:

\- Identify potential errors (unused variables, incorrect patterns)

\- Enforce consistent coding style across all contributors

\- Encourage best practices for React Native and Expo development

\- Improve overall readability and maintainability of the code

## **Static Analysis in CI**

Static analysis is not just run locally but fully integrated into the CI workflow using GitHub Actions.

**It runs:**

\- On pull requests

\- On pushes

**What it does:**

1. Checks out the repository
2. Installs dependencies inside IBDC-expo
3. Runs ESLint using Expo’s lint command
4. Fails the workflow if any linting errors are found

## Developer workflow

\- Write code

\- run locally: npx expo lint (optional but recommended)

\- Push changes / open PR

\- CI runs ESLint

\- Fix any errors before merging

## Summary

ESLint, combined with GitHub Actions, gives us a consistent way to check code quality automatically. It helps reinforce code quality, reduce defects, and supports a clean and maintainable codebase as development continues to scale.

 