#!/usr/bin/env bash

#
# Patches launcher configuration session url, as well as perhaps any
# additional arguments to pvpython, then restarts the apache webserver
# and starts the launcher in the foreground.  You can optionally pass a
# custom session root url (e.g: "wss://www.example.com") which will be
# used instead of the default.
#
# You can also pass extra arguments after the session url that will be
# provided as extra arguments to pvpython.  In this case, you must also
# pass the session url argument first.
#
# Examples
#
# To just accept the defaults of "ws://localhost":
#
#     ./start.sh
#
# To choose 'wss' and 'www.customhost.com':
#
#     ./start.sh "wss://www.customhost.com"
#
# Makes the assumption that there is a template launcher config where the
# "sessionURL" key/value looks like:
#
#     "sessionURL": "SESSION_URL_ROOT/proxy?sessionId=${id}&path=ws"
#
# Then, to add extra arguments to be passed to pvpython:
#
#     ./start.sh "ws://localhost" -dr "--mesa-swr"
#
# Alternatively, you can use environment variables *instead of* command line
# arguments.  To specify the session url root to be, e.g. "ws://myhost.com",
# provide the following environment variables before invoking this start
# script:
#
#    export SERVER_NAME="myhost.com"
#    export PROTOCOL="ws"
#
# In this scenario, you can also pass any extra args to pvpython in an
# environment variable as follows:
#
#    export EXTRA_PVPYTHON_ARGS="-dr,--mesa-swr"
#
# Note that all the extra args for pvpython are separated by commas, and no
# extra spaces are used.  In this case where you're communicating with the
# start script via environment variables, all command line arguments are
# ignored.
#

ROOT_URL="ws://localhost"
REPLACEMENT_ARGS=""

LAUNCHER_TEMPLATE_PATH=/opt/wslink-launcher/launcher-template.json
LAUNCHER_PATH=/opt/wslink-launcher/launcher.json

if [[ ! -z "${SERVER_NAME}" ]] && [[ ! -z "${PROTOCOL}" ]]
then
  ROOT_URL="${PROTOCOL}://${SERVER_NAME}"

  if [[ ! -z "${EXTRA_PVPYTHON_ARGS}" ]]
  then

    IFS=',' read -ra EXTRA_ARGS <<< "${EXTRA_PVPYTHON_ARGS}"
    for arg in "${EXTRA_ARGS[@]}"; do
      REPLACEMENT_ARGS="${REPLACEMENT_ARGS}\"$arg\", "
    done
  fi

elif [ "$#" -ge 1 ]
then
  ROOT_URL=$1
  shift

  while (($#))
  do
    REPLACEMENT_ARGS="${REPLACEMENT_ARGS}\"$1\", "
    shift
  done
fi

INPUT=$(<"${LAUNCHER_TEMPLATE_PATH}")
OUTPUT="${INPUT//"SESSION_URL_ROOT"/$ROOT_URL}"
OUTPUT="${OUTPUT//"EXTRA_PVPYTHON_ARGS"/$REPLACEMENT_ARGS}"
echo -e "$OUTPUT" > "${LAUNCHER_PATH}"

ln -sf /proc/self/fd/1 /var/log/apache2/access.log && \
ln -sf /proc/self/fd/1 /var/log/apache2/error.log
tail -n 0 -q -F /opt/wslink-launcher/log/*.txt >> /proc/1/fd/1 &

# Make sure the apache webserver is running
echo "Starting/Restarting Apache webserver"
service apache2 restart

# Run the pvw launcher in the foreground so this script doesn't end
echo "Starting the wslink launcher"
/opt/paraview/install/bin/pvpython /usr/local/lib/python2.7/dist-packages/wslink/launcher.py ${LAUNCHER_PATH}
