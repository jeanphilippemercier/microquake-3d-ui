# -----------------------------------------------------------------------------
# How to build the image
# -----------------------------------------------------------------------------
# docker build -t pvw-micro-quake-v5.6.0 .
# -----------------------------------------------------------------------------

FROM kitware/paraviewweb:pvw-base-sys-python-v5.6.0

RUN pip install requests wslink[security] && \
    sed -i 's#/opt/paraview/install/lib/python2.7/site-packages/wslink/launcher.py#/usr/local/lib/python2.7/dist-packages/wslink/launcher.py#g' /opt/paraviewweb/scripts/start.sh

# Copy the launcher config template
COPY config/launcher/launcher-template.json /opt/wslink-launcher/launcher-template.json

ADD start.sh /opt/paraviewweb/scripts
RUN chmod +x /opt/paraviewweb/scripts/start.sh

RUN ["/opt/paraviewweb/scripts/addEndpoints.sh", \
  "DOCUMENT-ROOT-DIRECTORY", "/external/apps/quake/www" \
]

# Start the container
ENTRYPOINT ["/opt/paraviewweb/scripts/start.sh"]
