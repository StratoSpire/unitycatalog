# syntax=docker.io/docker/dockerfile:1.7-labs@sha256:b99fecfe00268a8b556fad7d9c37ee25d716ae08a5d7320e6d51c4dd83246894
ARG HOME="/home/unitycatalog"

# Spark the bundled Spark connector is cross-built against. The connector is
# built per Spark major.minor (project/CrossSparkVersions.scala), so this must
# match the SPARK_MAJOR_MINOR that consumers of the image look for. The default
# in project/spark-versions.json is 4.1.0, which would ship
# unitycatalog-spark_4.1_2.13 and leave the 4.2 kernel image with no connector.
ARG SPARK_VERSION="4.2.0"

# Skip the connector's Test-scope delta-spark dependency. It is Test-only, so the
# packaged connector is identical either way, but sbt still resolves it and asks
# for io.delta:delta-spark_4.2_2.13:${deltaVersion} — which does not exist (the
# _4.2 line starts at 4.4.0). Without this the build fails at dependency
# resolution. Passing -DdeltaVersion=4.4.1 instead would also work, but that
# value is shared with the `cli` module's runtime delta-kernel-* deps
# (build.sbt), so it would silently move the UC server's Delta Kernel version as
# a side effect.
ARG SKIP_DELTA_SPARK="true"

# Build stage, using Amazon Corretto jdk 17 on alpine with arm64 support
FROM amazoncorretto:17-alpine3.20-jdk@sha256:c045f0537bc890f9e61924f33f35e9667f696b4f372dad4a73861a9396b5d0b5 as base

# Dependencies are installed in $HOME/.cache by sbt
ARG HOME
# ARGs declared before the first FROM are outside every build stage, so they have
# to be re-declared here to be visible to the RUN below.
ARG SPARK_VERSION
ARG SKIP_DELTA_SPARK
ENV HOME=$HOME

# The JVM derives user.home from the passwd entry (/root for uid 0) and ignores
# HOME, so coursier would otherwise cache jars in /root/.cache, outside the tree
# the runtime stage copies. sbt bakes absolute jar paths into
# server/target/classpath, so this directory must resolve identically in both
# stages or the server starts with some classpath entries missing.
ENV COURSIER_CACHE=$HOME/.cache/coursier/v1

# Corporate Maven mirror for the sbt launcher / Ivy (see build/sbt).
# Pass at build time: --build-arg MAVEN_PROXY_URL=$MAVEN_PROXY_URL
ARG MAVEN_PROXY_URL
ENV MAVEN_PROXY_URL=${MAVEN_PROXY_URL}

WORKDIR $HOME

COPY --parents dev/ build/ project/ examples/ server/ api/ clients/ connectors/ version.sbt build.sbt ./

RUN apk add --no-cache bash && \
    ./build/sbt -info \
        -DsparkVersion=${SPARK_VERSION} \
        -DskipDeltaSpark=${SKIP_DELTA_SPARK} \
        clean package

# Small runtime image
FROM alpine:3.20@sha256:a4f4213abb84c497377b8544c81b3564f313746700372ec4fe84653e4fb03805 as runtime

# Specific JAVA_HOME from Amazon Corretto
ARG JAVA_HOME="/usr/lib/jvm/default-jvm"
ARG USER="unitycatalog"
ARG HOME

# Copy Java from base
COPY --from=base $JAVA_HOME $JAVA_HOME

ENV HOME=$HOME \
    JAVA_HOME=$JAVA_HOME \
    PATH="${JAVA_HOME}/bin:${PATH}"

# Copy build artifacts from base stage
COPY --from=base --parents \
    $HOME/examples/ \
    $HOME/server/ \
    $HOME/api/ \
    $HOME/clients/ \
    $HOME/connectors/ \
    $HOME/target/ \
    $HOME/.cache/ \
    /

# Create a service user with read and execute permissions and write permissions of the ./etc directory
RUN <<EOF
apk add --no-cache bash
addgroup -S $USER
adduser -S -G $USER $USER
chmod -R 550 $HOME
mkdir -p $HOME/etc/
chmod -R 770 $HOME/etc/
chown -R $USER:$USER $HOME
EOF

USER $USER

# Copy remaining directories here for caching optimization
COPY --chown=$USER:$USER --parents bin/ etc/ $HOME/

WORKDIR $HOME

CMD ["./bin/start-uc-server"]
