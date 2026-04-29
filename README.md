# 🎯 Algo Visualizer

![Backend CI](https://github.com/TON_USER/algo-visualizer/actions/workflows/backend-ci.yml/badge.svg)
![Frontend CI](https://github.com/TON_USER/algo-visualizer/actions/workflows/frontend-ci.yml/badge.svg)
![Java](https://img.shields.io/badge/Java-26-orange)
![Angular](https://img.shields.io/badge/Angular-19-red)
![License](https://img.shields.io/badge/license-MIT-green)

> Visualiseur interactif d'algorithmes de tri et de pathfinding
> avec système de progression XP.
> Backend Java Spring Boot · Frontend Angular · WebSocket temps réel

![demo](docs/demo.gif)  <-- à ajouter semaine 2

## 🚀 Lancer en une commande

\`\`\`bash
git clone https://github.com/TON_USER/algo-visualizer.git
cd algo-visualizer
docker compose up --build
\`\`\`
→ http://localhost:4200

## 🧠 Algorithmes

| Algo         | Complexité moy. | Pire cas  |
|--------------|-----------------|-----------|
| Bubble Sort  | O(n²)           | O(n²)     |
| Quick Sort   | O(n log n)      | O(n²)     |
| Merge Sort   | O(n log n)      | O(n log n)|
| Dijkstra     | O(V + E log V)  | —         |
| A*           | O(E)            | O(V)      |

## 🏗 Architecture

\`\`\`
Angular (WebSocket) ←→ Spring Boot (STOMP) ←→ PostgreSQL
                              ↓
                    Strategy Pattern (algos)
\`\`\`

## 🛠 Stack
- Java 26 · Spring Boot 3.4 · WebSocket STOMP
- Angular 19 · NgRx · Canvas API
- PostgreSQL 16 · Docker Compose