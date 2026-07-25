<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Agent Rules
- **No Browser/Chrome Tools**: Do NOT invoke `browser_subagent` or open Chrome unless the user explicitly requests it.
- **No Unrequested Build/Git Commands**: Do NOT run build commands (e.g., `npm run build`) or git commands unless the user explicitly requests them.

