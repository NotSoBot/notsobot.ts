FROM node:24-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS deps
# 2026.10.23, node 24.22.1

WORKDIR /notsobot.ts

COPY package.json package-lock.json ./
# without the scripts: `prepare` builds and the source isn't here, none of the dependencies has an install script
RUN npm ci --ignore-scripts


# compiles the source. Running it copies the result into the volume the bot runs from (docker-compose.yml), so a type
# error fails the build before any of the running bot's files change
FROM deps AS build

# replaces each changed file with a rename (a cluster starting meanwhile never reads half of one) and removes the
# deleted ones
RUN apt-get update && apt-get install -y --no-install-recommends rsync && rm -rf /var/lib/apt/lists/*

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

CMD ["rsync", "--archive", "--checksum", "--delete", "lib/", "/lib-volume/"]


# what the bot runs in: only node and the dependencies, the compiled source is mounted and the settings come from the
# environment. This image (and so the bot's container) only changes with package-lock.json
FROM deps AS bot

USER node
CMD ["node", "lib/run"]
