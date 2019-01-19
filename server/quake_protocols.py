# Main python libs
import os, time, json, math, calendar, time

# ParaViewWeb
from wslink import register as exportRpc
from paraview import simple, servermanager
from paraview.web import protocols as pv_protocols

from vtkmodules.vtkCommonDataModel import vtkPolyData, vtkCellArray
from vtkmodules.vtkCommonCore import vtkPoints, vtkFloatArray, vtkUnsignedIntArray, vtkUnsignedLongArray

# Picking
from vtkmodules.vtkCommonCore import vtkCollection
from vtkmodules.vtkPVClientServerCoreRendering import vtkPVRenderView

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
  bounds = [-1, 1, -1, 1, -1, 1]
  if view:
    if view.GetClientSideView().GetClassName() == 'vtkPVRenderView':
      rr = view.GetClientSideView().GetRenderer()
      bounds = rr.ComputeVisiblePropBounds()
    return {
      'centerOfRotation': tuple(view.CameraFocalPoint),
      'focalPoint': tuple(view.CameraFocalPoint),
      'position': tuple(view.CameraPosition),
      'viewUp': tuple(view.CameraViewUp),
      'bounds': bounds,
    }
  return {
    'centerOfRotation': (0, 0, 0),
    'focalPoint': (0, 0, 0),
    'position': (0, 0, 1),
    'viewUp': (0, 1, 0),
    'bounds': bounds,
  }

def createTrivialProducer():
    polyData = vtkPolyData()
    polyData.SetPoints(vtkPoints())
    polyData.SetVerts(vtkCellArray())

    trivialProducer = simple.TrivialProducer()
    trivialProducer.GetClientSideObject().SetOutput(polyData)

    return trivialProducer

# -----------------------------------------------------------------------------

def addPiecewisePoint(fn, scalar, size):
    fn.append(scalar)
    fn.append(size)
    fn.append(0.5)
    fn.append(0.0)

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
        simple.ColorBy(self.focusQuakeRepresentation, ('POINTS', 'time'))
        self.focusQuakeRepresentation.SetScaleArray = ['POINTS', 'magnitude']
        self.focusQuakeRepresentation.ScaleByArray = 1
        self.focusQuakeRepresentation.GaussianRadius = 1
        self.focusQuakeRepresentation.UseScaleFunction = 0
        self.focusQuakeRepresentation.ScaleTransferFunction.Points = [
            -3, 0.1, 0.5, 0,
            4, 1, 0.5, 0
        ]
        self.focusQuakeRepresentation.UseScaleFunction = 1

        # Explosion representation
        self.focusBlastRepresentation.SetRepresentationType('Point Gaussian')
        simple.ColorBy(self.focusBlastRepresentation, ('POINTS', 'time'))
        # simple.ColorBy(self.focusBlastRepresentation, None)
        self.focusBlastRepresentation.SetScaleArray = ['POINTS', 'magnitude']
        self.focusBlastRepresentation.ScaleByArray = 1
        self.focusBlastRepresentation.GaussianRadius = 1
        self.focusBlastRepresentation.ShaderPreset = 'Custom'
        self.focusBlastRepresentation.CustomShader = BLAST_SHADER_BG
        self.focusBlastRepresentation.UseScaleFunction = 0
        self.focusBlastRepresentation.ScaleTransferFunction.Points = [
            -3, 0.1, 0.5, 0,
            4, 1, 0.5, 0
        ]
        self.focusBlastRepresentation.UseScaleFunction = 1

        # Hide scalar bar
        # self.focusQuakeRepresentation.SetScalarBarVisibility(self.view, False)
        # self.focusBlastRepresentation.SetScalarBarVisibility(self.view, False)

        # Load mine definition
        self.mineBounds = [-1, 1, -1, 1, -1, 1]
        self.mineCategories = []
        self.minePieces = []
        self.minePiecesByCategory = {}
        if mineBasePath:
            filepath = os.path.join(mineBasePath, 'index.json')
            with open(filepath, 'r') as mineFileMeta:
                mine = json.load(mineFileMeta)
                self.mineBounds = mine['boundaries']
                self.mineCategories = mine['categories']
                for piece in mine['pieces']:
                    category = piece['category']
                    if category not in self.minePiecesByCategory:
                        self.minePiecesByCategory[category] = []
                    pipelineItem = MINE_PIECES[piece['type']](mineBasePath, piece)

                    self.minePiecesByCategory[category].append(pipelineItem)
                    self.minePieces.append(pipelineItem)

        # Selection part
        self.selection = simple.ExtractSelection()
        self.extractSelection = simple.MergeBlocks(Input=self.selection)

    def keepEvent(self, event, filterType = 0):
        if event.x < self.mineBounds[0] or event.x > self.mineBounds[1]:
            return False
        if event.y < self.mineBounds[2] or event.y > self.mineBounds[3]:
            return False
        if event.z < self.mineBounds[4] or event.z > self.mineBounds[5]:
            return False

        if filterType == 1:
            return event.event_type == 'earthquake'

        if filterType == 2:
            return event.event_type == 'explosion'

        return True

    def updateEventsPolyData(self, event_list, proxy, filterType = 0):
        polydata = proxy.GetClientSideObject().GetOutputDataObject(0)
        filteredList = []
        for event in event_list:
            if self.keepEvent(event, filterType):
                filteredList.append(event)
        size = len(filteredList)

        # Debug output
        print('updateEventsPolyData', filterType, len(filteredList), len(event_list))

        mag = polydata.GetPointData().GetArray('magnitude')
        if not mag:
            mag = vtkFloatArray()
            mag.SetName('magnitude')
            polydata.GetPointData().AddArray(mag)

        timeArray = polydata.GetPointData().GetArray('time')
        if not timeArray:
            timeArray = vtkUnsignedLongArray()
            timeArray.SetName('time')
            polydata.GetPointData().AddArray(timeArray)

        idArray = polydata.GetPointData().GetArray('id')
        if not idArray:
            idArray = vtkUnsignedIntArray()
            idArray.SetName('id')
            polydata.GetPointData().AddArray(idArray)

        points = polydata.GetPoints()
        points.SetNumberOfPoints(size)

        verts = polydata.GetVerts().GetData()
        verts.SetNumberOfTuples(size + 1)
        verts.SetValue(0, size)
        polydata.GetVerts().SetNumberOfCells(1 if size else 0);

        mag.SetNumberOfTuples(size)
        timeArray.SetNumberOfTuples(size)
        idArray.SetNumberOfTuples(size)

        for i in range(size):
            event = filteredList[i]
            # for arg in dir(event):
            #     print(arg)
            #     if arg[0] != '_':
            #         print('  %s' % getattr(event, arg))
            #     else:
            #         print('  skip')
            points.SetPoint(i, event.x, event.y, event.z)
            verts.SetValue(i + 1, i)
            mag.SetValue(i, event.magnitude)
            timeArray.SetValue(i, event.time_epoch)
            idArray.SetValue(i, len(self.idList))
            self.idList.append(event.event_resource_id)

        polydata.Modified()
        proxy.MarkModified(proxy)

        # print('Time range:', timeArray.GetRange())

        # if filterType == 1:
        #     writer = vtkXMLPolyDataWriter()
        #     writer.SetDataModeToAppended()
        #     writer.SetCompressorTypeToZLib()
        #     writer.SetInputData(polydata)
        #     writer.SetFileName('/Users/seb/Desktop/events.vtp')
        #     writer.Update()

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

    @exportRpc("paraview.quake.scale.range")
    def updateScaleFunction(self, linearRange, sizeRange):
        # Create new function
        fnPoints = []
        addPiecewisePoint(fnPoints, -100, sizeRange[0])
        addPiecewisePoint(fnPoints, linearRange[0], sizeRange[0])
        addPiecewisePoint(fnPoints, linearRange[1], sizeRange[1])
        addPiecewisePoint(fnPoints, 100, sizeRange[1])

        self.focusQuakeRepresentation.UseScaleFunction = 0
        self.focusBlastRepresentation.UseScaleFunction = 0
        self.focusQuakeRepresentation.ScaleTransferFunction.Points = fnPoints
        self.focusBlastRepresentation.ScaleTransferFunction.Points = fnPoints
        self.focusQuakeRepresentation.UseScaleFunction = 1
        self.focusBlastRepresentation.UseScaleFunction = 1

        self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.quake.data.update")
    def updateData(self, now, focusTime, historicalTime):
        events_in_focus = seismic_client.get_events_catalog(API_URL, focusTime, now)
        historic_events = seismic_client.get_events_catalog(API_URL, historicalTime, focusTime)
        print('focus', focusTime, now)
        print('historical', historicalTime, focusTime)

        # epoch range 2018-12-01T00:00:00.0
        realNowEpoch = calendar.timegm(time.gmtime())
        nowEpoch = calendar.timegm(time.strptime(now, '%Y-%m-%dT%H:%M:%S.0'))
        startEpoch = calendar.timegm(time.strptime(focusTime, '%Y-%m-%dT%H:%M:%S.0'))

        self.idList = []
        self.updateEventsPolyData(events_in_focus, self.focusQuakeProxy, 1)
        self.updateEventsPolyData(events_in_focus, self.focusBlastProxy, 2)
        self.updateEventsPolyData(historic_events, self.historicalProxy)

        self.focusQuakeRepresentation.GaussianRadius = GAUSSIAN_RADIUS
        self.focusBlastRepresentation.GaussianRadius = GAUSSIAN_RADIUS
        lut = simple.GetColorTransferFunction('time')
        lut.RescaleTransferFunction(startEpoch * 1000000000, nowEpoch * 1000000000)

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
            piece['representation'].Visibility = 1 if piece['label'] in visibilityMap and visibilityMap[piece['label']] else 0

        self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.quake.mine.get")
    def getMineDescription(self):
        response = []
        for category in self.mineCategories:
            pieces = []
            entry = { 'name': category['label'], 'pieces': pieces }
            response.append(entry)
            for piece in self.minePiecesByCategory[category['name']]:
                name = piece['label']
                checked = True if piece['representation'].Visibility == 1 else False
                pieces.append({ 'name': name, 'checked': checked })

        return response


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


    @exportRpc("paraview.quake.camera.get")
    def getCamera(self):
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


    @exportRpc("paraview.quake.view.interaction.mode")
    def updateInteraction(self, mode):
      # INTERACTION_MODE_UNINTIALIZED = -1,
      # INTERACTION_MODE_3D = 0,
      # INTERACTION_MODE_2D, // not implemented yet.
      # INTERACTION_MODE_SELECTION,
      # INTERACTION_MODE_ZOOM,
      # INTERACTION_MODE_POLYGON
      self.view.InteractionMode = vtkPVRenderView.INTERACTION_MODE_SELECTION if mode == 'Selection' else vtkPVRenderView.INTERACTION_MODE_3D


    @exportRpc("paraview.quake.view.pick.point")
    def pickPoint(self, x, y):
      output = {}
      selectedRepresentations = vtkCollection()
      selectionSources = vtkCollection()

      found = self.view.SelectSurfacePoints([x, y, x, y], selectedRepresentations, selectionSources)
      if selectedRepresentations.GetNumberOfItems() == selectionSources.GetNumberOfItems() and selectionSources.GetNumberOfItems() == 1:
        # We are good for selection
        representation = servermanager._getPyProxy(selectedRepresentations.GetItemAsObject(0))
        selection = servermanager._getPyProxy(selectionSources.GetItemAsObject(0))
        self.selection.Input = representation.Input
        self.selection.Selection = selection
        self.extractSelection.UpdatePipeline()
        selectedDataSet = self.extractSelection.GetClientSideObject().GetOutput()
        selectedData = selectedDataSet.GetPointData()
        nbArrays = selectedData.GetNumberOfArrays()
        for i in range(nbArrays):
          array = selectedData.GetAbstractArray(i)
          output[array.GetName()] = array.GetValue(0)

        # Add picked point world coordinates
        output['worldPosition'] = selectedDataSet.GetPoints().GetPoint(0)

        return output

      # No selection found
      return None


    @exportRpc("paraview.quake.event.id")
    def getEventId(self, idx):
        return self.idList[idx]

    @exportRpc("paraview.quake.color.preset")
    def updatePreset(self, presetName):
        lutProxy = simple.GetColorTransferFunction('time')
        lutProxy.ApplyPreset(presetName, True)
        self.getApplication().InvokeEvent('UpdateEvent')
