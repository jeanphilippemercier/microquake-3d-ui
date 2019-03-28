# microquake-3D-ui

3D visualization with ParaviewWeb

## Setup Python environment

The ParaViewWeb server will rely on a Python virtual-env to bring all the
external dependencies needed to fetch seismic events.

The guide below review the various steps to create that virtual environment.

```
$ virtualenv py-env-2
$ source py-env/bin/activate
$ pip install requests
```

## Building the Web client

This assume you have node and npm installed. If you need to install them using `nvm` is usually a better path.
Although this step is only required to build it. If already built, this can be skipped.

```
$ cd client
$ npm install
$ npm run build
```

For development purpose you can run the following command:

```
$ npm run build
```

## Running the ParaViewWeb application

```
$ export PV_HOME=/Applications/ParaView-5.6.0.app/Contents

$ $PV_HOME/bin/pvpython ./server/pvw-quake.py --port 1234 --virtual-env ../py-env-2/ --mine $PWD/mines/OyuTolgoi --content ./client/www

```

In another terminal

```
$ cd client
$ npm start

$ open http://localhost:4200/
```
