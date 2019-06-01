# DXF to VTP conversion

The 3d UI client cannot read `dxf` files in order to show the mine geometry, so those files need to be converted to the VTK xml polydata format (`.vtp`) before they can be served to the client.  For this purpose we have created a script which can be run as a command-line using the ParaView pvpython binary.

This document explains how to download the ParaView binary and use it to run the conversion script.  Then, when any new `dxf` file comes in that needs to be rendered by the 3d ui, it must first be processed into a `vtp` file using this conversion script.

The conversion script is located in this directory, and named `PythonDXFReader.py`.  In order to run it, you must first have the ParaView binary for your system untarred and ready to run, and you must also create a python virtual environment where you will install the `dxfgrabber` python module.

## Downloading the ParaView binary

To avoid any possible hardware incompatibilities, it is recommended to use the OSMesa version of ParaView, which does not require a graphics card or special drivers.  Go to `https://www.paraview.org/download/` and download the v5.6.0 release (osmesa) of ParaView for your system.  For linux, the following command should work:

```
curl -OL https://www.paraview.org/files/v5.6/ParaView-5.6.0-osmesa-MPI-Linux-64bit.tar.gz
```

Then untar the downloaded file into the location where you want ParaView to live, e.g.:

```
mkdir -p /opt/paraview
cd /opt/paraview
tar -zxvf ~/Downloads/ParaView-5.6.0-osmesa-MPI-Linux-64bit.tar.gz
```

## Virtual environment setup

Next create a virtual environment and activate it:

```
cd /opt/paraview
virtualenv pyenv
source /opt/paraview/pyenv/bin/activate
```

Now install the `dxfgrabber` module and then deactivate the virtual environment:

```
pip install dxfgrabber
deactivate
```

At this point, you should have everything you need to convert dxf files to vtp.

## Running the conversion script 

These next instructions assume your `microquake-3d-ui` repo is located at:

```
/home/user/projects/microquake-3d-ui
```

To convert a file such as `/home/user/data/lev1146.dxf` to a vtp file located, for example, in the `/home/user/data/vtp/` directory, run the following command:

```
/opt/paraview/ParaView-5.6.0-osmesa-MPI-Linux-64bit/bin/pvpython \
    /home/user/projects/microquake-3d-ui/scripts/convert/PythonDXFReader.py \
    --virtual-env /opt/paraview/pyenv \
    --input-file /home/user/data/lev1146.dxf \
    --output-file /home/user/data/vtp/lev1146.vtp
```
