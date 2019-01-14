from spp.utils import seismic_client

# -----------------------------------------------
# Environment variable expected
# -----------------------------------------------
# export SPP_HOME=/.../seismic-processing-platform
# export SPP_CONFIG="$SPP_HOME/config"
# export SPP_COMMON="$SPP_HOME/common"
# -----------------------------------------------

# -----------------------------------------------
# User settings
# -----------------------------------------------
api_base_url = 'http://api.microquake.org/api/v1/'
start_time = '2018-11-08T10:21:00.0'
end_time = '2018-11-09T10:21:00.0'
# -----------------------------------------------

request_event_list = seismic_client.get_events_catalog(api_base_url, start_time, end_time)

# The request_event object should contain all the information you need to display the event in Paraview
for request_event in request_event_list:
    '''
    evaluation_mode
    event_file
    event_resource_id
    event_type
    get_context
    get_event
    get_waveform
    keys
    magnitude
    magnitude_type
    npick
    select
    status
    uncertainty
    waveform_context_file
    waveform_file
    x
    y
    z
    '''
    x = request_event.x
    y = request_event.y
    z = request_event.z
    mag = request_event.magnitude
    print('event:', x, y, z, mag)

