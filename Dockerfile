# Test image: Node (latest LTS by default) plus PlantUML with Java and Graphviz for rendering the example diagrams.
#   docker build -t openapi-transformer-test .
#   docker build --build-arg NODE_VERSION=22 -t openapi-transformer-test:22 .       # oldest supported Node line
#   docker run --rm openapi-transformer-test                                        # lint + tests with coverage
#   docker run --rm -v "$PWD/example:/app/example" openapi-transformer-test \
#     plantuml -tpng example/vehicle.plantuml example/vehicle-details.plantuml      # re-render the PNGs
ARG NODE_VERSION=26
FROM node:${NODE_VERSION}-trixie-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends default-jre-headless graphviz fontconfig fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

# Pinned PlantUML release; bump the version and checksum together.
ARG PLANTUML_VERSION=1.2026.10
ADD --checksum=sha256:e9bc9e6b2eb715e8c0c929f3dcb5fc1923be13f37599b09c293c66d354e88686 \
    https://github.com/plantuml/plantuml/releases/download/v${PLANTUML_VERSION}/plantuml-${PLANTUML_VERSION}.jar /opt/plantuml.jar
RUN printf '#!/bin/sh\nexec java -Djava.awt.headless=true -jar /opt/plantuml.jar "$@"\n' > /usr/local/bin/plantuml \
 && chmod 755 /usr/local/bin/plantuml /opt/plantuml.jar

# Unprivileged user; only the files the tests need are copied, and install scripts are not run.
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY --chown=node:node eslint.config.js README.md LICENSE ./
COPY --chown=node:node src ./src
COPY --chown=node:node test ./test
COPY --chown=node:node example ./example

CMD ["sh", "-c", "npm run lint && npm test"]
