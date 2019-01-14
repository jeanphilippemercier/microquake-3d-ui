cd ../../..
ORIGINAL_PATH="$PWD"
cd apps/py-env

sed -i "s:$ORIGINAL_PATH:/external:g" bin/activate
sed -i "s:$ORIGINAL_PATH:/external:g" bin/activate.csh
sed -i "s:$ORIGINAL_PATH:/external:g" bin/activate.fish
sed -i "s:$ORIGINAL_PATH:/external:g" bin/avro
sed -i "s:$ORIGINAL_PATH:/external:g" bin/chardetect
sed -i "s:$ORIGINAL_PATH:/external:g" bin/easy_install
sed -i "s:$ORIGINAL_PATH:/external:g" bin/easy_install-2.7
sed -i "s:$ORIGINAL_PATH:/external:g" bin/f2py
sed -i "s:$ORIGINAL_PATH:/external:g" bin/fastavro
sed -i "s:$ORIGINAL_PATH:/external:g" bin/futurize
sed -i "s:$ORIGINAL_PATH:/external:g" bin/get_objgraph
sed -i "s:$ORIGINAL_PATH:/external:g" bin/iptest
sed -i "s:$ORIGINAL_PATH:/external:g" bin/iptest2
sed -i "s:$ORIGINAL_PATH:/external:g" bin/ipython
sed -i "s:$ORIGINAL_PATH:/external:g" bin/ipython2
sed -i "s:$ORIGINAL_PATH:/external:g" bin/MQ-autoprocess
sed -i "s:$ORIGINAL_PATH:/external:g" bin/MQ-import_ESG_SEGY
sed -i "s:$ORIGINAL_PATH:/external:g" bin/MQ-init_db
sed -i "s:$ORIGINAL_PATH:/external:g" bin/MQ-init_project
sed -i "s:$ORIGINAL_PATH:/external:g" bin/MQ-simulation
sed -i "s:$ORIGINAL_PATH:/external:g" bin/MQ-wave
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-dataless2resp
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-dataless2xseed
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-flinn-engdahl
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-indexer
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-mopad
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-mseed-recordanalyzer
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-plot
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-print
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-reftek-rescue
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-runtests
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-scan
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-sds-report
sed -i "s:$ORIGINAL_PATH:/external:g" bin/obspy-xseed2dataless
sed -i "s:$ORIGINAL_PATH:/external:g" bin/pasteurize
sed -i "s:$ORIGINAL_PATH:/external:g" bin/pathos_connect
sed -i "s:$ORIGINAL_PATH:/external:g" bin/pip
sed -i "s:$ORIGINAL_PATH:/external:g" bin/pip2
sed -i "s:$ORIGINAL_PATH:/external:g" bin/pip2.7
sed -i "s:$ORIGINAL_PATH:/external:g" bin/portpicker
sed -i "s:$ORIGINAL_PATH:/external:g" bin/pox
sed -i "s:$ORIGINAL_PATH:/external:g" bin/ppserver
sed -i "s:$ORIGINAL_PATH:/external:g" bin/pygmentize
sed -i "s:$ORIGINAL_PATH:/external:g" bin/python-config
sed -i "s:$ORIGINAL_PATH:/external:g" bin/undill
sed -i "s:$ORIGINAL_PATH:/external:g" bin/wheel

sed -i "s:$ORIGINAL_PATH:/external:g" lib/python2.7/site-packages/easy-install.pth
sed -i "s:$ORIGINAL_PATH:/external:g" lib/python2.7/site-packages/easy-install.pth
sed -i "s:$ORIGINAL_PATH:/external:g" lib/python2.7/site-packages/spp.egg-link
sed -i "s:$ORIGINAL_PATH:/external:g" lib/python2.7/site-packages/microquake.egg-link

# Replace file with proper encoding
cp $ORIGINAL_PATH/repos/microquake-3d-ui/docker/patches/flinnengdahl.py $ORIGINAL_PATH/apps/py-env/lib/python2.7/site-packages/obspy/geodetics/flinnengdahl.py
