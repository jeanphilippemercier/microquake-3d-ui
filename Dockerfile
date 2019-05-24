FROM registry.microquake.org/rio-tinto/microquake-3d-ui/base:latest

RUN mkdir -p /external/apps/quake
COPY ./server /external/apps/quake/server
COPY ./www /external/apps/quake/www
