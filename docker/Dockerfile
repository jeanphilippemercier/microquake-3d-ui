# -----------------------------------------------------------------------------
# How to build the image
# -----------------------------------------------------------------------------
# sudo docker build -t pvw-micro-quake-v5.6.0 .
# -----------------------------------------------------------------------------

FROM kitware/paraviewweb:pvw-base-v5.6.0

# Copy the launcher config template
COPY config/launcher/launcher-template.json /opt/wslink-launcher/launcher-template.json

RUN ["/opt/paraviewweb/scripts/addEndpoints.sh", \
  "quake", "/external/apps/quake/www" \
]

# Setup env
ENV SPP_HOME=/external/repos/seismic-processing-platform
ENV SPP_CONFIG="$SPP_HOME/config"
ENV SPP_COMMON="$SPP_HOME/common"

# Start the container
ENTRYPOINT ["/opt/paraviewweb/scripts/start.sh"]
