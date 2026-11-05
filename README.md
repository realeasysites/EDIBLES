# Edibles Restaurant & Bar website

Node/Express + SQLite. Built by Real Easy Sites.

## Run locally
    npm install
    ADMIN_PASSWORD=pick-one npm start

Site: http://localhost:3000. Dashboard: /admin (password only).

## Swapping ordering or reservation systems
Nothing is hard-wired. Dashboard > Links & hours holds one link for reservations, ordering, rewards, gift cards and delivery. Change a link and every button follows. Empty gift card or delivery links hide themselves.

## What the owner can edit from /admin
Menus and prices, nightly features, hours, announcement bar, links, phone. Event inquiries live there too, with status and delete.

## Going live
1. Deploy with render.yaml. It includes a persistent disk: without one, menu edits and inquiries are wiped on each deploy.
2. Set ADMIN_PASSWORD. Login stays disabled until it is set.
3. Set NOTIFY_EMAIL and SMTP_* to email inquiries. Inquiries save to the dashboard either way.
4. Point the domain at Render. Old WordPress URLs (/lunch/, /dinner/, /wine/, /about-us/, /contact/) redirect automatically.

Menus, links and hours are seeded once from data/seed.json on first boot.
