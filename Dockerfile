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

# the build's id for sentry (src/sentry.ts reads it from lib, so a cluster respawned onto new code reports it without the
# bot's container changing). `GIT_COMMIT=$(git rev-parse --short HEAD) docker compose build` names it after the commit,
# otherwise it's a hash of what was compiled. after the build so a new commit doesn't recompile anything
ARG GIT_COMMIT=
RUN release="${GIT_COMMIT:-$( (find src -type f -print0 | sort -z | xargs -0 sha256sum; sha256sum package-lock.json tsconfig.json) | sha256sum | cut -c1-12)}" \
  && printf '{"release": "notsobot.ts@%s"}\n' "$release" > lib/release.json

CMD ["rsync", "--archive", "--checksum", "--delete", "lib/", "/lib-volume/"]


# what the bot runs in: only node and the dependencies, the compiled source is mounted and the settings come from the
# environment. This image (and so the bot's container) only changes with package-lock.json
FROM deps AS bot

# jemalloc instead of glibc's malloc, for the manager and every cluster (they inherit the environment). 2026-11-13 the
# 160 clusters held ~300 of the host's 310gb, ~400mb each outside the js heap in glibc's main heap, and the host stalled
# reclaiming memory long enough for the shards to miss heartbeats and burn the daily identifies (discord reset the
# token). background_thread gives freed pages back on a timer instead of only on the next malloc, narenas:2 instead of
# 4 per cpu (96 here) since a cluster only has a handful of threads. Compare notsobot_process_resident_memory_bytes
# minus heap_total and external per cluster before and after
RUN apt-get update && apt-get install -y --no-install-recommends libjemalloc2 && rm -rf /var/lib/apt/lists/* \
  && ln -s "$(dpkg -L libjemalloc2 | grep '/libjemalloc\.so\.2$')" /usr/local/lib/libjemalloc.so.2
ENV LD_PRELOAD=/usr/local/lib/libjemalloc.so.2
ENV MALLOC_CONF=background_thread:true,narenas:2

USER node
CMD ["node", "lib/run"]
