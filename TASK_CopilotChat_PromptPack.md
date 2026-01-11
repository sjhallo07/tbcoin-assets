# Copilot Chat – Best Prompts Pack (Editor, CI, Devcontainers, Cost Optimization)

This document provides a curated collection of effective GitHub Copilot Chat prompts for common development workflows. Use these prompts to maximize productivity while keeping cloud costs minimal.

---

## General Code Assistance

### Code Explanation
```
Explain what this code does in simple terms
```

### Code Refactoring
```
Refactor this code to improve readability and maintainability
```

### Bug Fixing
```
This code has a bug. Help me identify and fix it
```

### Performance Optimization
```
How can I optimize this code for better performance?
```

---

## CI/CD Workflows

### Minimal CI Setup
```
Create a minimal GitHub Actions CI workflow for a static assets repository
```

### Cost-Effective CI
```
How can I reduce GitHub Actions minutes usage in my CI workflow?
```

### Workflow Debugging
```
This GitHub Actions workflow is failing. Help me debug it
```

### Conditional Steps
```
Add conditional steps to my CI workflow that only run when specific files change
```

---

## Devcontainer Configuration

### Basic Devcontainer
```
Create a minimal devcontainer configuration for [language/framework]
```

### Fast Devcontainer Build
```
How can I make my devcontainer build faster?
```

### Extension Selection
```
What VS Code extensions should I include in my devcontainer for [language/framework]?
```

### Multi-Stage Optimization
```
Optimize my devcontainer for faster builds using multi-stage approach
```

---

## Cost Optimization

### Resource Monitoring
```
What are the best practices for monitoring cloud resource usage?
```

### Caching Strategy
```
Implement caching in my CI workflow to reduce build times and costs
```

### Dependency Management
```
How can I optimize my dependency installation to reduce CI time?
```

### Efficient Testing
```
Design a test strategy that runs fast and uses minimal resources
```

---

## VS Code Settings

### Auto-Save Configuration
```
Configure auto-save settings for optimal workflow
```

### Format on Save
```
Set up automatic code formatting on save
```

### ESLint Integration
```
Configure ESLint to auto-fix issues on save
```

### Prettier Configuration
```
Set up Prettier with VS Code for consistent code formatting
```

---

## Best Practices

### 1. Be Specific
Instead of: "Fix my code"
Use: "Fix the TypeError in the user authentication function"

### 2. Provide Context
Include relevant file paths, error messages, and what you've already tried

### 3. Iterative Refinement
Start with a broad question, then ask follow-up questions to drill down

### 4. Use Code Selection
Select specific code blocks when asking for help with that code

### 5. Reference Documentation
Ask Copilot to reference official documentation for best practices

---

## Quick Tips

- Use `Cmd/Ctrl + I` to open Copilot Chat inline
- Use `@workspace` to ask about your entire codebase
- Use `/explain` for quick code explanations
- Use `/fix` for quick bug fixes
- Use `/tests` to generate test cases

---

## Cost-Conscious Development

### Principle: Do More with Less
- Prefer static assets over dynamic builds when possible
- Use caching aggressively in CI
- Run tests selectively (only affected tests)
- Choose lightweight base images for containers
- Implement concurrency cancellation in workflows

### Measuring Impact
- Monitor GitHub Actions usage in repository Insights
- Track devcontainer build times
- Review monthly usage reports
- Set up spending alerts if using paid services

---

## Additional Resources

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/learn-github-actions/best-practices-for-github-actions)
- [VS Code Devcontainers](https://code.visualstudio.com/docs/devcontainers/containers)

---

*Keep this document updated as you discover new effective prompts and patterns!*
