# Deploying the five Vercel projects

Since 18 November 2026 (Desmond's decision), nothing deploys automatically: `git.deploymentEnabled` is `false` in every
`apps/*/vercel.json`. Pushes and merges to `main` create no Vercel deployments at all. The Hobby plan allows 100
deployments a day across the team, and Vercel counted the skipped builds of unchanged sites toward that limit, so a
merge that changed one site still used five deployments.

## After every merge to main

1. List the apps the merge changed:

   ```bash
   bash scripts/changed-apps.sh <previous main sha> <new main sha>
   ```

   A change under `packages/`, `pnpm-lock.yaml`, `package.json` or `turbo.json` counts for every app.
2. Deploy only those projects to production, from the new `main` commit:
   - Vercel dashboard: Project, Deployments, the latest production deployment, Redeploy (uncheck "use existing build
     cache" only if needed), or
   - Vercel API / MCP: `create_deployment` with the project's last production `deploymentId`, `withLatestCommit: true`
     and `target: "production"`.
3. Check each deployment reaches READY.

| App folder | Vercel project | Address |
| --- | --- | --- |
| apps/lexta | lextagh | https://lextagh.vercel.app |
| apps/portal | lexta-portal | https://lexta-portal.vercel.app |
| apps/yazz | lexta-yazz | https://lexta-yazz-1773-hr-consultancy-and-marketing.vercel.app |
| apps/linzzy | lexta-linzzy | https://lexta-linzzy.vercel.app |
| apps/hooch | lexta-hooch | https://lexta-hooch.vercel.app |

When Lexta moves to Vercel Pro (proposal section 7), automatic deploys can be switched back on by setting
`"deploymentEnabled": { "**": false, "main": true }` in each `vercel.json`.
