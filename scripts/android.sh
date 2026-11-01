#!/usr/bin/env bash
# Lance Gradle sur le projet Android avec un JDK accepté par le plugin Android.
#
# Le système peut avoir un Java plus récent par défaut (27 ici), qu'AGP refuse.
# On privilégie un JDK 21 connu, sinon on laisse JAVA_HOME tel quel.
set -euo pipefail

if [ -z "${JAVA_HOME:-}" ] || [ ! -d "${JAVA_HOME:-}" ]; then
  for candidate in /usr/lib/jvm/java-21-openjdk /usr/lib/jvm/java-21-openjdk-amd64 \
    /usr/lib/jvm/temurin-21-jdk-amd64 /opt/homebrew/opt/openjdk@21 \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home"; do
    if [ -x "$candidate/bin/java" ]; then
      JAVA_HOME="$candidate"
      break
    fi
  done
fi

if [ -z "${JAVA_HOME:-}" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "Aucun JDK 21 trouvé. Installe-le ou exporte JAVA_HOME." >&2
  exit 1
fi

export JAVA_HOME
cd "$(dirname "$0")/../android"
exec ./gradlew "$@"
