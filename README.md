# microquake-3D-ui

3D visualization with ParaviewWeb

## Setup Python environment

The ParaViewWeb server will rely on a Python virtual-env to bring all the
external dependencies needed to fetch seismic events.

The guide below review the various steps to create that virtual environment.

```
$ virtualenv py-env
$ source py-env/bin/activate

$ cd /.../seismic-processing-platform
$ pip install -e .

$ cd /.../microquake
$ pip install -e .

$ pip install ipython

$ cd /.../microquake-3d-ui
```

Setup environment variables

```
export SPP_HOME=/.../seismic-processing-platform
export SPP_CONFIG="$SPP_HOME/config"
export SPP_COMMON="$SPP_HOME/common"

cp $SPP_HOME/config/settings.toml.example $SPP_HOME/config/settings.toml
```

Run the test to validate the event queue

```
$ python ./server/tests/spp_test.py
('event:', 651134.0, 4767540.0, -182.52, -0.701888904582125)
('event:', 651146.0, 4767340.0, -154.999, -0.476779429523073)
('event:', 651113.4, 4767553.6, -192.6, -1.1)
('event:', 651129.6, 4767341.3, -153.2, -0.8)
('event:', 651137.4, 4767550.3, -200.0, -0.3)
('event:', 651068.5, 4767557.8, -194.0, -1.1)
('event:', 651304.1, 4766351.7, -103.6, -1.1)
('event:', 651168.5, 4767563.1, -159.0, -0.8)
('event:', 651177.2, 4767542.2, -201.1, -0.9)
('event:', 651149.8, 4767536.7, -201.6, -1.1)
('event:', 651181.5, 4767546.7, -196.3, -0.8)
('event:', 651187.9, 4767575.8, -14.8, -0.7)
('event:', 651194.8, 4767550.3, -185.9, -1.1)
('event:', 651175.9, 4767565.7, -179.9, -0.9)
('event:', 651189.0, 4767530.4, -195.1, -1.1)
('event:', 651198.9, 4767546.0, -187.3, -0.1)
('event:', 651178.4, 4767546.9, -195.0, -0.7)
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
$ export SPP_HOME=$PWD/../seismic-processing-platform
$ export SPP_CONFIG="$SPP_HOME/config"
$ export SPP_COMMON="$SPP_HOME/common"

$ export PV_HOME=/Applications/ParaView-5.6.0.app/Contents

$ $PV_HOME/bin/pvpython ./server/pvw-quake.py --port 1234 --virtual-env ../py-env/
```

In another terminal

```
$ cd client
$ npm start

$ open http://localhost:4200/
```
