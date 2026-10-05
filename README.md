# DevQuest

DevQuest is a personal web app for one job: turn "I can get an AI to build an app" into "I can explain, review, and defend that app."

You open it in a desktop browser. There is no phone app. Progress lives in PostgreSQL on the machine where you run it.

## What you can do in this version

- Sign in, pick a character, and edit the portrait.
- See rank, level, XP, streak, skill bars, and the next mission.
- Walk a world map. Six missions are playable. The other worlds are visible so the full curriculum has a place to land.
- Play six different kinds of challenge: trace a request, build a login, design a schema, debug an API, survive a production incident, and explain a design out loud.

The seeded account is `ada@devquest.local` / `devquest`.

## Run it

You need Node.js 22 and PostgreSQL 16.

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Postgres with Docker, app on the host:

```bash
docker compose up db
```

App and database together:

```bash
docker compose up --build
```

## Where to read next

- [ARCHITECTURE.md](ARCHITECTURE.md) is why the system is shaped this way.
- [LEARNING_THE_CODEBASE.md](LEARNING_THE_CODEBASE.md) walks one request from the button to the database row.

## Checks

```bash
npm test
npm run lint
npm run build
```
