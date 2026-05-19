# Deploy & remote setup

## Push to GitHub (first time)

This repo has no `origin` yet. After creating a GitHub repository:

```bash
cd /Users/nancyfletcher/Documents/reit-assistant-fqe
git remote add origin https://github.com/YOUR_ORG/reit-assistant-fqe.git
git push -u origin main
```

## Run Beta locally

```bash
npm install
npm start
```

Demo login: `analyst@fletcherquill.com` + password (6+ characters).

## EAS preview build

```bash
npx eas-cli login
npx eas-cli build --profile preview
```

Profiles are defined in `eas.json` at the project root.
