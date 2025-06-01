# AI Development Observations

## Tools and Time
- **Tools used**: Cursor, agent mode. LLMs: auto, Claude Sonnet-4
- **Time spent**: ~8 hrs

## Project Structure and Code Quality
- Created a good initial project structure
- Code quality deteriorates quickly
- Requires constant maintenance
- Needs explicit requests to split logic into different components and layers
- Time-consuming to maintain proper code organization

## Context Management
- Struggles to maintain project context across different components
- May generate code in incorrect locations (e.g., UI code in Java folder despite separate UI folder)
- Requires direct addition of components to maintain proper context

## Database Design
- Not optimal at designing database relationships
- Initial code used @ManyToMany relationships causing:
  - Circular dependencies
  - StackOverflowError
- Important to check for potential n+1 issues

## LLM Performance
- Sonnet-4 produces better results than Cursor's "auto select LLM"
- Can successfully fix complex issues with minimal input
- Example: Resolved message history and receiver issues through multiple debugging iterations. Initial promt was: "Messages aren't shown in history after they're sent, also receiver don't get anything"

## Security Implementation
- Challenged by security layer implementation
- Couldn't solve depndencies properly, up to the point where it suggested to remove security "for a pure development experience"
- Manual backend security implementation might have been more efficient

## UI/UX Development
- Effective when using images as design references
- Good at fixing broken layouts
- AI tools perform well with UI components and styles

## Overall Assessment
- AI companion significantly speeds up development process
- Particularly valuable when building from scratch
- Achieved results that would be difficult to match within the timeframe
- More engaging and enjoyable than manual boilerplate code generation 