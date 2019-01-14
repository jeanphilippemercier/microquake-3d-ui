# Main python libs
import os, time, json, math

# ParaViewWeb
from wslink import register as exportRpc
from paraview import simple, servermanager
from paraview.web import protocols as pv_protocols

from vtkmodules.vtkCommonDataModel import vtkPolyData, vtkCellArray
from vtkmodules.vtkCommonCore import vtkPoints, vtkFloatArray

# Debug stuff
from vtkmodules.vtkIOXML import vtkXMLPolyDataWriter

# Quake stuff
from spp.utils import seismic_client

# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

API_URL = 'http://api.microquake.org/api/v1/'

BLAST_SHADER = """
// This custom shader code define a gaussian blur
// Please take a look into vtkSMPointGaussianRepresentation.cxx
// for other custom shader examples

//VTK::Color::Impl

float distSq = dot(offsetVCVSOutput.xy, offsetVCVSOutput.xy);
float angle = atan(offsetVCVSOutput.y, offsetVCVSOutput.x);

float starFn = 1.0f - abs(sin(4 * angle));

float scaledMask = mix(0.0, 0.05, starFn);
if (distSq > starFn) {
    discard;
}
"""


BLAST_SHADER_BG = """
// This custom shader code define a gaussian blur
// Please take a look into vtkSMPointGaussianRepresentation.cxx
// for other custom shader examples

//VTK::Color::Impl

float distSq = dot(offsetVCVSOutput.xy, offsetVCVSOutput.xy);
float angle = atan(offsetVCVSOutput.y, offsetVCVSOutput.x);

float starFn = 1.0f - abs(sin(4 * angle));

if (distSq > 1.0f) {
    discard;
} else if (distSq > starFn) {
    ambientColor = vec3(0.0, 0.0, 0.0);
    diffuseColor = vec3(0.0, 0.0, 0.0);
}
"""

SHIFT = 2
MAX_MAGNITUDE = 2
GAUSSIAN_RADIUS = 10

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def extractCamera(view):
  if view:
    return {
      'centerOfRotation': tuple(view.CameraFocalPoint),
      'focalPoint': tuple(view.CameraFocalPoint),
      'position': tuple(view.CameraPosition),
      'viewUp': tuple(view.CameraViewUp),
    }
  return {
    'centerOfRotation': (0, 0, 0),
    'focalPoint': (0, 0, 0),
    'position': (0, 0, 1),
    'viewUp': (0, 1, 0),
  }

def createTrivialProducer():
    polyData = vtkPolyData()
    polyData.SetPoints(vtkPoints())
    polyData.SetVerts(vtkCellArray())

    trivialProducer = simple.TrivialProducer()
    trivialProducer.GetClientSideObject().SetOutput(polyData)

    return trivialProducer

# -----------------------------------------------------------------------------

def createPicturePipeline(basePath, config):
    source = simple.Plane()
    source.Origin = config['origin']
    source.Point1 = config['point1']
    source.Point2 = config['point2']

    texture = servermanager._getPyProxy(servermanager.CreateProxy('textures', 'ImageTexture'))
    texture.FileName = os.path.join(basePath, config['file'])
    servermanager.Register(texture)

    representation = simple.GetRepresentation(source)
    representation.Texture = texture
    representation.Visibility = config['visibility']

    return {
        'label': config['label'],
        'source': source,
        'representation': representation,
        'texture': texture,
    }


# -----------------------------------------------------------------------------

def createLinePipeline(basePath, config):
    source = simple.OpenDataFile(os.path.join(basePath, config['file']))
    representation = simple.GetRepresentation(source)
    representation.Visibility = config['visibility']

    # No color, wider width and looks like tubes
    # simple.ColorBy(representation, None)
    representation.LineWidth = 2.0
    representation.RenderLinesAsTubes = 1

    return {
        'label': config['label'],
        'source': source,
        'representation': representation
    }

# -----------------------------------------------------------------------------

def createSensorPipeline(basePath, config):
    source = simple.OpenDataFile(os.path.join(basePath, config['file']))
    representation = simple.GetRepresentation(source)
    representation.Visibility = config['visibility']

    # No color, wider width and looks like tubes
    representation.LineWidth = 2.0
    representation.RenderLinesAsTubes = 1
    representation.DiffuseColor = config['color']

    return {
        'label': config['label'],
        'source': source,
        'representation': representation
    }

# -----------------------------------------------------------------------------

MINE_PIECES = {
    'picture': createPicturePipeline,
    'lines': createLinePipeline,
    'sensors': createSensorPipeline,
}

# -----------------------------------------------------------------------------

class ParaViewQuake(pv_protocols.ParaViewWebProtocol):
    def __init__(self, mineBasePath = None, **kwargs):
        super(pv_protocols.ParaViewWebProtocol, self).__init__()
        self.focusQuakeProxy = createTrivialProducer()
        self.focusBlastProxy = createTrivialProducer()
        self.historicalProxy = createTrivialProducer()

        self.focusQuakeRepresentation = simple.Show(self.focusQuakeProxy)
        self.focusBlastRepresentation = simple.Show(self.focusBlastProxy)
        self.historicalRepresentation = simple.Show(self.historicalProxy)
        self.view = simple.Render()

        # Green for earthquake and red for blast
        self.focusQuakeRepresentation.DiffuseColor = [0.0, 1.0, 0.0]
        self.focusBlastRepresentation.DiffuseColor = [1.0, 0.0, 0.0]
        self.historicalRepresentation.PointSize = 3

        # Earthquake representation
        self.focusQuakeRepresentation.SetRepresentationType('Point Gaussian')
        # simple.ColorBy(self.focusQuakeRepresentation, None)
        simple.ColorBy(self.focusQuakeRepresentation, ('POINTS', 'magnitude'))
        self.focusQuakeRepresentation.ScaleByArray = 1
        self.focusQuakeRepresentation.UseScaleFunction = 0

        # Explosion representation
        self.focusBlastRepresentation.SetRepresentationType('Point Gaussian')
        simple.ColorBy(self.focusBlastRepresentation, ('POINTS', 'magnitude'))
        # simple.ColorBy(self.focusBlastRepresentation, None)
        self.focusBlastRepresentation.ScaleByArray = 1
        self.focusBlastRepresentation.UseScaleFunction = 0
        # self.focusBlastRepresentation.GaussianRadius = 0.05
        self.focusBlastRepresentation.ShaderPreset = 'Custom'
        self.focusBlastRepresentation.CustomShader = BLAST_SHADER_BG

        # Hide scalar bar
        # self.focusQuakeRepresentation.SetScalarBarVisibility(self.view, False)
        # self.focusBlastRepresentation.SetScalarBarVisibility(self.view, False)

        # Load mine definition
        self.mineLabel = None
        self.minePieces = []
        if mineBasePath:
            filepath = os.path.join(mineBasePath, 'index.json')
            with open(filepath, 'r') as mineFileMeta:
                mine = json.load(mineFileMeta)
                self.mineLabel = mine['label']
                for piece in mine['pieces']:
                    self.minePieces.append(MINE_PIECES[piece['type']](mineBasePath, piece))


    def updateEventsPolyData(self, event_list, proxy, filterType = 0):
        polydata = proxy.GetClientSideObject().GetOutputDataObject(0)
        filteredList = event_list if filterType == 0 else []
        size = len(filteredList)

        if len(filteredList) == 0:
            targetType = 'earthquake' if filterType == 1 else 'explosion'
            for event in event_list:
                if event.event_type == targetType:
                    filteredList.append(event)
            size = len(filteredList)

        # Debug output
        print('updateEventsPolyData', filterType, len(filteredList), len(event_list))

        mag = polydata.GetPointData().GetArray('magnitude')
        if not mag:
            mag = vtkFloatArray()
            mag.SetName('magnitude')
            polydata.GetPointData().AddArray(mag)

        points = polydata.GetPoints()
        points.SetNumberOfPoints(size)

        verts = polydata.GetVerts().GetData()
        verts.SetNumberOfTuples(size + 1)
        verts.SetValue(0, size)

        mag.SetNumberOfTuples(size)

        for i in range(size):
            event = filteredList[i]
            points.SetPoint(i, event.x, event.y, event.z)
            verts.SetValue(i + 1, i)
            mag.SetValue(i, SHIFT + event.magnitude) # Shift scale

        polydata.Modified()
        proxy.MarkModified(proxy)

        if filterType == 1:
            writer = vtkXMLPolyDataWriter()
            writer.SetDataModeToAppended()
            writer.SetCompressorTypeToZLib()
            writer.SetInputData(polydata)
            writer.SetFileName('/Users/seb/Desktop/events.vtp')
            writer.Update()

    def getEventsForClient(self, event_list):
        return {
            'count': len(event_list),
        }


    # @exportRpc("paraview.quake.events.get")
    # def getEvents(self, start_time='2018-11-08T10:21:00.0', end_time='2018-11-09T10:21:00.0'):
    #     '''
    #     Update event sets to visualize on the server side and send the part the client can use
    #     '''
    #     event_list = seismic_client.get_events_catalog(API_URL, start_time, end_time)
    #     self.updateEventsPolyData(event_list, self.eventsProxy)
    #     return self.getEventsForClient(event_list)

    @exportRpc("paraview.quake.data.update")
    def updateData(self, now, focusTime, historicalTime):
        events_in_focus = seismic_client.get_events_catalog(API_URL, focusTime, now)
        historic_events = seismic_client.get_events_catalog(API_URL, historicalTime, focusTime)
        print('focus', focusTime, now)
        print('historical', historicalTime, focusTime)

        self.updateEventsPolyData(events_in_focus, self.focusQuakeProxy, 1)
        self.updateEventsPolyData(events_in_focus, self.focusBlastProxy, 2)
        self.updateEventsPolyData(historic_events, self.historicalProxy)

        self.focusQuakeRepresentation.GaussianRadius = GAUSSIAN_RADIUS
        self.focusBlastRepresentation.GaussianRadius = GAUSSIAN_RADIUS
        lut = simple.GetColorTransferFunction('magnitude')
        lut.RescaleTransferFunction(0.0, SHIFT + MAX_MAGNITUDE)
        # lut.RescaleTransferFunctionToDataRange(False, True)

        self.getApplication().InvokeEvent('UpdateEvent')

        return self.getEventsForClient(events_in_focus)


    @exportRpc("paraview.quake.visibility.update")
    def updateVisibility(self, visibilityMap):
        self.focusQuakeRepresentation.Visibility = 1 if 'quake' in visibilityMap and visibilityMap['quake'] else 0
        self.focusBlastRepresentation.Visibility = 1 if 'blast' in visibilityMap and visibilityMap['blast'] else 0
        self.historicalRepresentation.Visibility = 1 if 'historical' in visibilityMap and visibilityMap['historical'] else 0

        self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.quake.mine.visibility.update")
    def updateMineVisibility(self, visibilityMap):
        for piece in self.minePieces:
            piece['representation'].Visibility = 1 if visibilityMap[piece['label']] else 0

        self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.quake.mine.get")
    def getMineDescription(self):
        pieces = []
        for piece in self.minePieces:
            name = piece['label']
            checked = True if piece['representation'].Visibility == 1 else False
            pieces.append({ 'name': name, 'checked': checked })

        return {
            'label': self.mineLabel,
            'pieces': pieces
        }


    @exportRpc("paraview.quake.camera.reset")
    def resetCamera(self):
        simple.ResetCamera(self.view)
        try:
            self.view.CenterOfRotation = self.view.CameraFocalPoint
        except:
            pass

        self.getApplication().InvalidateCache(self.view.SMProxy)
        self.getApplication().InvokeEvent('UpdateEvent')

        return extractCamera(self.view)


    @exportRpc("paraview.quake.camera.snap")
    def snapCamera(self):
        vUp = tuple(self.view.CameraViewUp)
        majorAxis = 0
        axisIdx = -1
        for i in range(3):
            currentAxis = abs(vUp[i])
            if currentAxis > majorAxis:
                majorAxis = currentAxis
                axisIdx = i

        newViewUp = [0, 0, 0]
        newViewUp[axisIdx] = 1 if vUp[axisIdx] > 0 else -1

        self.view.CameraViewUp = newViewUp

        self.getApplication().InvalidateCache(self.view.SMProxy)
        self.getApplication().InvokeEvent('UpdateEvent')

        return extractCamera(self.view)


    @exportRpc("paraview.quake.render")
    def render(self):
        simple.Render(self.view)

        self.getApplication().InvalidateCache(self.view.SMProxy)
        self.getApplication().InvokeEvent('UpdateEvent')

        return extractCamera(self.view)
