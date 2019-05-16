# -----------------------------------------------------------------------------
# How to build the image
# -----------------------------------------------------------------------------
# docker build -t pvw-micro-quake-v5.6.0 .
# -----------------------------------------------------------------------------

FROM kitware/paraviewweb:pvw-v5.6.0-egl

RUN pip install requests

# Copy the launcher config template
COPY config/launcher/config-template.json /opt/launcher/config-template.json

ADD start.sh /opt/paraviewweb/scripts
RUN chmod +x /opt/paraviewweb/scripts/start.sh

RUN ["/opt/paraviewweb/scripts/addEndpoints.sh", \
  "DOCUMENT-ROOT-DIRECTORY", "/external/apps/quake/www" \
]

# Start the container
ENTRYPOINT ["/opt/paraviewweb/scripts/start.sh"]
