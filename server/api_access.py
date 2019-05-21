import hashlib
import json
import os
import shutil
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
    def __init__(self, ray_dict):
        for key in ray_dict.keys():
            setattr(self, key, ray_dict[key])

        self.num_nodes = len(self.nodes)


def get_events_catalog(api_base_url, access_info, start_time, end_time):
    """
    return a list of events
    :param api_base_url:
    :param start_time:
    :param end_time:
    :return:
    """
    token = access_info['token']
    url = '{0}/v1/catalog'.format(api_base_url)

    # request work in UTC, time will need to be converted from whatever
    # timezone to UTC before the request is built.

    querystring = {"start_time": start_time, "end_time": end_time}
    headers = {"Authentication": "Token {0}".format(token)}

    print('retrieve events from {0}'.format(url))

    response = requests.request("GET", url, params=querystring, headers=headers).json()

    events = []
    for event in response:
        events.append(Event(event))

    return events


def get_rays_for_event(api_base_url, access_info, event_resource_id):
    token = access_info['token']
    url = '{0}/v1/rays'.format(api_base_url)
    headers = {"Authentication": "Token {0}".format(token)}
    params = {"event_id": event_resource_id}
    response = requests.request("GET", url, params=params, headers=headers).json()

    rays = []
    for ray_json in response:
        if 'nodes' in ray_json and ray_json['nodes']:
            rays.append(Ray(ray_json))

    return rays


def get_stations(api_base_url, site_code, network_code):
    # the v1 api endpoint for this doesn't work
    mod_url = api_base_url.replace('v1', 'v2')

    url = mod_url + 'site'
    url = '{0}/{1}/network/{2}/inventory/stations'.format(
        url, site_code, network_code)

    print('Fetching station locations from: {0}'.format(url))

    return requests.request("GET", url).json()


def get_mine_plan(api_base_url, access_info, root_directory):
    # the v1 api endpoint for this doesn't work
    token = access_info['token']
    site_code = str(access_info['siteCode'])
    network_code = str(access_info['networkCode'])

    url = '{0}/v1/mineplan'.format(api_base_url)
    headers = {"Authentication": "Token {0}".format(token)}
    params = {"site_code": site_code, "network_code": network_code}

    print('Fetching mine plan from: {0}'.format(url))
    print('  request headers: {0}'.format(headers))
    print('  request params: {0}'.format(params))

    response = requests.request("GET", url, headers=headers, params=params)

    print('Got response:')
    print(response)

    plan_list = response.json()
    mine_root = os.path.join(
    root_directory, 'Site_{0}_Network_{1}'.format(site_code, network_code))

    if not plan_list:
        return None

    # We expect there will be just one in the list
    plan_obj = plan_list[0]

    index = {
        'description': plan_obj['description'],
        'boundaries': plan_obj['boundaries'],
        'categories': plan_obj['categories'],
        'rootPath': mine_root,
    }

    pieces = []

    # Make the directory to house the index.json and pieces
    if not os.path.exists(mine_root):
        os.makedirs(mine_root)

    piece_keys = ['id', 'mineplan', 'category', 'type', 'label', 'visibility', 'sha']

    for idx, piece in enumerate(plan_obj['pieces']):
        index_piece = {}

        # Get the easy parts
        for pk in piece_keys:
            index_piece[pk] = piece[pk]

        # Download the file and store just the name in the piece
        piece_url = piece['file']
        piece_file_name = os.path.basename(piece_url)
        piece_file_path = os.path.join(mine_root, piece_file_name)

        index_piece['originalFileName'] = piece_file_name
        index_piece['fileExtension'] = piece_file_name[piece_file_name.rindex('.'):]

        index_piece['url'] = piece_url
        index_piece['path'] = piece_file_path

        if 'extra_json_attributes' in piece and piece['extra_json_attributes']:
            extra_attrs = piece['extra_json_attributes']
            for extra_key in extra_attrs:
                index_piece[extra_key] = extra_attrs[extra_key]

        new_file_name = piece['sha'] + index_piece['fileExtension']
        index_piece['file'] = os.path.join(mine_root, new_file_name)

        pieces.append(index_piece)

    index['pieces'] = pieces

    # Now write index as a json file into planDirectory
    index_path = os.path.join(mine_root, 'index.json')
    with open(index_path, 'w') as fd:
        fd.write(json.dumps(index))

    return index


def download_piece(url, save_path):
    print('Fetch mine piece from {0}'.format(url))
    r = requests.get(url, stream=True)
    with open(save_path, 'wb') as f:
        shutil.copyfileobj(r.raw, f)


def download_mine_pieces(mine_plan):
    """
    Download all the mine pieces in a json mine plan

    :param mine_plan: previously fetched (via get_mine_plan) mine plan
    """
    pieces = mine_plan['pieces']
    mine_root = mine_plan['rootPath']

    # Now that we know what the pieces are, we can iterate through them,
    # download each one (if necessary), compute its checksum, rename the
    # piece file to that checksum, update its checksum in the list and
    # re-write the index file.
    for idx, piece in enumerate(pieces):
        piece_url = piece['url']
        piece_file_path = piece['path']
        piece_ext = piece['fileExtension']
        piece_checksum = None

        if 'sha' in piece and piece['sha']:
            piece_checksum = piece['sha']

            piece_file_name_sha = os.path.join(mine_root, piece_checksum + piece_ext)

            print('piece {0} has checksum already, looking for file: {1}'.format(
                piece['label'], piece_file_name_sha))
            if os.path.exists(piece_file_name_sha) and os.path.isfile(piece_file_name_sha):
                print('found file: {0}'.format(piece_file_name_sha))
                continue
        else:
            print('Refusing to download piece without sha {0}'.format(piece['label']))

        # Assume that we don't have the file already if we got here, which
        # may not be true if we're not getting checksums from the server in
        # the mineplan index.
        download_piece(piece_url, piece_file_path)

        # Open the file we just downloaded so we can compute the hash
        with open(piece_file_path, 'rb') as fd:
            # FIXME: When the files get big, we may need some chunking instead
            data = fd.read()
            checksum = hashlib.sha256(data).hexdigest()

        if piece_checksum and checksum != piece_checksum:
            print('WARNING: advertised checksum does not match computed')
            print('  for file: {0}'.format(piece['originalFileName']))
            print('    received checksum: {0}'.format(piece_checksum))
            print('    computed checksum: {0}'.format(checksum))
            os.remove(piece_file_path)
            continue

        # Now rename the file with the checksum
        piece_new_file_name = checksum + piece_ext
        piece_file_name_sha = os.path.join(mine_root, piece_new_file_name)
        shutil.move(piece_file_path, piece_file_name_sha)


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

