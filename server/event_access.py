import sys

# Try handle virtual env if provided
if '--virtual-env' in sys.argv:
  virtualEnvPath = sys.argv[sys.argv.index('--virtual-env') + 1]
  virtualEnv = virtualEnvPath + '/bin/activate_this.py'
  execfile(virtualEnv, dict(__file__=virtualEnv))


import requests


class Event:
    def __init__(self, ev_dict):
        for key in ev_dict.keys():
            if 'time' in key:
                if key == 'timezone':
                    continue
                if type(ev_dict[key]) is not str:
                    setattr(self, key, ev_dict[key])
                    continue
                print('!!! Need UTCDateTime class for {0} -> {1} !!!'.format(key, ev_dict[key]))
                # setattr(self, key, UTCDateTime(parser.parse(ev_dict[key])))
            else:
                setattr(self, key, ev_dict[key])


class Ray:
    def __init__(self, nodes, ray_length, travel_time):
        self.nodes = nodes
        self.num_nodes = len(self.nodes)
        self.ray_length = ray_length
        self.travel_time = travel_time


def get_events_catalog(api_base_url, start_time, end_time):
    """
    return a list of events
    :param api_base_url:
    :param start_time:
    :param end_time:
    :return:
    """
    url = api_base_url + "catalog"

    # request work in UTC, time will need to be converted from whatever
    # timezone to UTC before the request is built.

    querystring = {"start_time": start_time, "end_time": end_time}

    print('retrieve events from {0}'.format(url))

    response = requests.request("GET", url, params=querystring).json()

    events = []
    for event in response:
        events.append(Event(event))

    return events


def parse_ray(ray_data):
    if ('nodes' in ray_data and ray_data['nodes'] and
        'ray_length' in ray_data and 'travel_time' in ray_data):
        return Ray(ray_data['nodes'], ray_data['ray_length'], ray_data['travel_time'])
    return None


def get_rays_for_event(api_base_url, event_resource_id):
    url = api_base_url + "events"
    url = '{0}/events/{1}/rays'.format(api_base_url, event_resource_id)

    response = requests.request("GET", url).json()

    rays = []
    for ray_json in response:
        ray = parse_ray(ray_json)
        if ray:
            rays.append(ray)

    return rays


#----------------------------------------------------------------------------
# Simple test
#----------------------------------------------------------------------------
if __name__ == '__main__':
    api_base_url = 'http://api.microquake.org/api/v1/'
    start_time = '2018-11-08T10:21:00.0'
    end_time = '2018-11-09T10:21:00.0'
    # -----------------------------------------------

    request_event_list = get_events_catalog(api_base_url, start_time, end_time)

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

