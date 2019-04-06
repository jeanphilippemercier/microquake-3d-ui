FROM registry.microquake.org/rio-tinto/microquake-3d-ui/base:latest

RUN mkdir -p /external/apps/quake
COPY ./mines /external/mines
COPY ./server /external/apps/quake/server
COPY ./client/www /external/apps/quake/www
