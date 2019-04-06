FROM registry.microquake.org/rio-tinto/microquake-3d-ui/base:latest

RUN mkdir -p /external/apps/quake
COPY ./mines /external
COPY ./server /external/apps/quake
COPY ./client/www /external/apps/quake
