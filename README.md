# Ticket Resolver - Mini Helpdesk

A modern support ticket management system built with Next.js, featuring real-time updates and a clean, responsive interface.

## Features

- Create and manage support tickets
- Real-time updates with WebSocket integration
- Priority-based ticket filtering
- Status tracking (Open, In Progress, Closed)
- Responsive design for mobile and desktop
- PostgreSQL database with Prisma ORM

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up your database:
```bash
npx prisma generate
npx prisma db push
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

Create a `.env` file with:
```
DATABASE_URL="your_postgresql_connection_string"
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_PORT=3001
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma
- **Real-time**: Socket.IO
- **Validation**: Zod
