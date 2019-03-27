# Main python libs
import os, time, json, math, calendar, time, random

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
from event_access import get_events_catalog

# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

PRINT_EVENT_STRUCTURE = False

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

def printEventFields(event):
    print('-' * 80)
    for arg in dir(event):
        if arg[0] != '_':
            print('%s: %s' % (arg, getattr(event, arg)))
    print('-' * 80)

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

def createTrivialProducer(cellTypes = []):
    polyData = vtkPolyData()
    polyData.SetPoints(vtkPoints())
    for cellType in cellTypes:
        fnSet = getattr(polyData, 'Set%s' % cellType)
        fnSet(vtkCellArray())
        # fnGet = getattr(polyData, 'Get%s' % cellType)
        # fnGet().SetNumberOfCells(0)

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

def createPicturePipeline(basePath, config, translate):
    source = simple.Plane()
    source.Origin = [config['origin'][0] + translate[0], config['origin'][1] + translate[1], config['origin'][2] + translate[2]]
    source.Point1 = [config['point1'][0] + translate[0], config['point1'][1] + translate[1], config['point1'][2] + translate[2]]
    source.Point2 = [config['point2'][0] + translate[0], config['point2'][1] + translate[1], config['point2'][2] + translate[2]]

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

def createLinePipeline(basePath, config, translate):
    reader = simple.OpenDataFile(os.path.join(basePath, config['file']))
    source = simple.Transform(Input=reader)
    source.Transform = 'Transform'
    source.Transform.Translate = translate

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

def createSensorPipeline(basePath, config, translate):
    reader = simple.OpenDataFile(os.path.join(basePath, config['file']))
    source = simple.Transform(Input=reader)
    source.Transform = 'Transform'
    source.Transform.Translate = translate

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

def createSensorCSVPipeline(basePath, config, translate):
    source = createTrivialProducer(['Verts'])
    polyData = source.GetClientSideObject().GetOutputDataObject(0)
    points = polyData.GetPoints()
    points.SetNumberOfPoints(0)
    cellArray = polyData.GetVerts().GetData()
    cellArray.SetNumberOfTuples(0)
    cellArray.InsertNextValue(0)
    direction = polyData.GetPointData().GetArray('direction')
    if not direction:
        direction = vtkFloatArray()
        direction.SetName('direction')
        direction.SetNumberOfComponents(3)
        polyData.GetPointData().SetVectors(direction)
    direction.SetNumberOfTuples(0)

    with open(os.path.join(basePath, config['file']), 'r') as csv:
        header = None
        for line in csv:
            if header:
                # process station
                tokens = line[:-1].split(',')
                # Try to use x3 first and fallback to x1 if not available
                if len(tokens[header['dx']]):
                    x = float(tokens[header['x']]) + translate[0]
                    y = float(tokens[header['y']]) + translate[1]
                    z = float(tokens[header['z']]) + translate[2]
                    dx = -float(tokens[header['dx']])
                    dy = -float(tokens[header['dy']])
                    dz = -float(tokens[header['dz']])
                    cellArray.InsertNextValue(points.GetNumberOfPoints())
                    points.InsertNextPoint(x, y, z)
                    direction.InsertNextTuple3(dx, dy, dz)
                elif len(tokens[header['dx_']]):
                    x = float(tokens[header['x']]) + translate[0]
                    y = float(tokens[header['y']]) + translate[1]
                    z = float(tokens[header['z']]) + translate[2]
                    dx = -float(tokens[header['dx_']])
                    dy = -float(tokens[header['dy_']])
                    dz = -float(tokens[header['dz_']])
                    cellArray.InsertNextValue(points.GetNumberOfPoints())
                    points.InsertNextPoint(x, y, z)
                    direction.InsertNextTuple3(dx, dy, dz)
            else:
                # process header
                header = {}
                tokens = line[:-1].split(',')
                header['x'] = tokens.index('Easting')
                header['y'] = tokens.index('Northing')
                header['z'] = tokens.index('Elev')

                header['dx'] = tokens.index('x3')
                header['dy'] = tokens.index('y3')
                header['dz'] = tokens.index('z3')

                header['dx_'] = tokens.index('x1')
                header['dy_'] = tokens.index('y1')
                header['dz_'] = tokens.index('z1')

    size = points.GetNumberOfPoints()
    cellArray.SetValue(0, size)
    polyData.GetVerts().SetNumberOfCells(1)

    representation = simple.GetRepresentation(source)
    representation.SetRepresentationType('3D Glyphs')

    representation.Orient = 1
    representation.GlyphType = 'Cone'
    representation.GlyphType.Resolution = 12
    representation.GlyphType.Height = 20
    representation.GlyphType.Radius = 10
    representation.GlyphType.Capping = 1

    representation.Visibility = config['visibility']

    # No color, wider width and looks like tubes
    # representation.DiffuseColor = config['color']

    polyData.Modified()
    source.MarkModified(source)

    return {
        'label': config['label'],
        'source': source,
        'representation': representation
    }

# -----------------------------------------------------------------------------

MINE_PIECES = {
    'picture': createPicturePipeline,
    'lines': createLinePipeline,
    'sensors': createSensorCSVPipeline,
}

# -----------------------------------------------------------------------------

class ParaViewQuake(pv_protocols.ParaViewWebProtocol):
    def __init__(self, mineBasePath = None, **kwargs):
        super(pv_protocols.ParaViewWebProtocol, self).__init__()

        self.showRay = False
        self.uncertaintyScaling = 1.0

        self.focusQuakeProxy = createTrivialProducer(['Verts'])
        self.focusBlastProxy = createTrivialProducer(['Verts'])
        self.historicalProxy = createTrivialProducer(['Verts'])
        self.rayProxy = createTrivialProducer(['Lines']) # , 'Lines'

        self.focusQuakeRepresentation = simple.Show(self.focusQuakeProxy)
        self.focusBlastRepresentation = simple.Show(self.focusBlastProxy)
        self.historicalRepresentation = simple.Show(self.historicalProxy)
        self.rayRepresentation = simple.Show(self.rayProxy)

        # custom ray rendering
        self.rayRepresentation.Visibility = 0
        # self.rayRepresentation.LineWidth = 2.0
        # self.rayRepresentation.RenderLinesAsTubes = 1

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
        self.translate = [0, 0, 0]
        self.mineCategories = []
        self.minePieces = []
        self.minePiecesByCategory = {}
        if mineBasePath:
            filepath = os.path.join(mineBasePath, 'index.json')
            with open(filepath, 'r') as mineFileMeta:
                mine = json.load(mineFileMeta)
                self.mineBounds = mine['boundaries']
                self.translate[0] = -0.5 * (self.mineBounds[0] + self.mineBounds[1])
                self.translate[1] = -0.5 * (self.mineBounds[2] + self.mineBounds[3])
                # Do not affect Z as it is small and we want to keep it untouch for picking info (depth)
                # Actually translating so the ground show up as 0
                # self.translate[2] = -0.5 * (self.mineBounds[4] + self.mineBounds[5])
                self.translate[2] = -self.mineBounds[5]
                self.mineCategories = mine['categories']
                for piece in mine['pieces']:
                    category = piece['category']
                    if category not in self.minePiecesByCategory:
                        self.minePiecesByCategory[category] = []
                    pipelineItem = MINE_PIECES[piece['type']](mineBasePath, piece, self.translate)

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

        # ---------------------------------------------------------------------
        # Fields available on polydata / picking
        # ---------------------------------------------------------------------

        mag = polydata.GetPointData().GetArray('magnitude')
        if not mag:
            mag = vtkFloatArray()
            mag.SetName('magnitude')
            polydata.GetPointData().AddArray(mag)
        mag.SetNumberOfTuples(size)

        timeArray = polydata.GetPointData().GetArray('time')
        if not timeArray:
            timeArray = vtkUnsignedLongArray()
            timeArray.SetName('time')
            polydata.GetPointData().AddArray(timeArray)
        timeArray.SetNumberOfTuples(size)

        idArray = polydata.GetPointData().GetArray('id')
        if not idArray:
            idArray = vtkUnsignedIntArray()
            idArray.SetName('id')
            polydata.GetPointData().AddArray(idArray)
        idArray.SetNumberOfTuples(size)

        uncertaintyArray = polydata.GetPointData().GetArray('uncertainty')
        if not uncertaintyArray:
            uncertaintyArray = vtkFloatArray()
            uncertaintyArray.SetName('uncertainty')
            polydata.GetPointData().AddArray(uncertaintyArray)
        uncertaintyArray.SetNumberOfTuples(size)

        uncertaintyDirectionArray = polydata.GetPointData().GetArray('direction')
        if not uncertaintyDirectionArray:
            uncertaintyDirectionArray = vtkFloatArray()
            uncertaintyDirectionArray.SetName('uncertainty_direction')
            uncertaintyDirectionArray.SetNumberOfComponents(3)
            polydata.GetPointData().AddArray(uncertaintyDirectionArray)
        uncertaintyDirectionArray.SetNumberOfTuples(size)

        # ---------------------------------------------------------------------

        points = polydata.GetPoints()
        points.SetNumberOfPoints(size)

        verts = polydata.GetVerts().GetData()
        verts.SetNumberOfTuples(size + 1)
        verts.SetValue(0, size)
        polydata.GetVerts().SetNumberOfCells(1 if size else 0);

        # DEBUG show event fields + values
        if PRINT_EVENT_STRUCTURE and len(filteredList):
            printEventFields(filteredList[0])

        for i in range(size):
            event = filteredList[i]
            points.SetPoint(i, event.x + self.translate[0], event.y + self.translate[1], event.z + self.translate[2])
            verts.SetValue(i + 1, i)
            mag.SetValue(i, event.magnitude)
            timeArray.SetValue(i, event.time_epoch)
            idArray.SetValue(i, len(self.idList))

            # Not all events have the uncertainty

            if 'uncertainty' in dir(event) and event.uncertainty:
                value = float(event.uncertainty)
                if value > 100.0:
                  uncertaintyArray.SetValue(i, 0)
                else:
                  uncertaintyArray.SetValue(i, value)
                # FIXME the data should have such info
                print('uncertainty_vector(%s, %s, %s) - mag(%s)' % (event.uncertainty_vector_x, event.uncertainty_vector_y, event.uncertainty_vector_z, value))
                uncertaintyDirectionArray.SetTuple3(i, random.random(), random.random(), random.random())
            else:
                uncertaintyArray.SetValue(i, 0.0)
                uncertaintyDirectionArray.SetTuple3(i, 0, 0, 1)


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


    def showEventsUncertainty(self, showUncertainty):
        if showUncertainty:
            # Use glyph mapper
            for representation in [self.focusQuakeRepresentation, self.focusBlastRepresentation]:
                representation.SetRepresentationType('3D Glyphs')

                representation.Orient = 1
                representation.SelectOrientationVectors = 'uncertainty_direction'

                representation.Scaling = 1
                representation.ScaleMode = 'Magnitude'
                representation.SelectScaleArray = 'uncertainty'
                representation.ScaleFactor = self.uncertaintyScaling

                representation.GlyphType = 'Arrow'
                representation.GlyphType.TipResolution = 12
                representation.GlyphType.TipRadius = 0.1
                representation.GlyphType.ShaftResolution = 12
                representation.GlyphType.ShaftRadius = 0.03
        else:
            # Use point gaussian
            self.focusQuakeRepresentation.SetRepresentationType('Point Gaussian')
            self.focusBlastRepresentation.SetRepresentationType('Point Gaussian')


    def updateRay(self, event):
        if 'id' in event:
            polydata = self.rayProxy.GetClientSideObject().GetOutputDataObject(0)
            coords = event['worldPosition']

            idArray = polydata.GetPointData().GetArray('id')
            if not idArray:
                idArray = vtkUnsignedIntArray()
                idArray.SetName('id')
                polydata.GetPointData().AddArray(idArray)

            idArray.SetNumberOfTuples(2)
            idArray.SetValue(0, 1)
            idArray.SetValue(0, 2)

            points = polydata.GetPoints()
            points.SetNumberOfPoints(2)
            points.SetPoint(0, 1, 2, 1000)
            points.SetPoint(1, 3, 4, -1000)
            # points.SetPoint(1, coords[0], coords[1], coords[2])

            lines = polydata.GetLines()
            lines.SetNumberOfCells(0)
            lines.InsertNextCell(2)
            lines.InsertCellPoint(0)
            lines.InsertCellPoint(1)

            # verts = polydata.GetVerts()
            # verts.SetNumberOfCells(0)
            # verts.InsertNextCell(2)
            # verts.InsertCellPoint(0)
            # verts.InsertCellPoint(1)

            # verts = polydata.GetVerts().GetData()
            # verts.SetNumberOfTuples(3)
            # verts.SetValue(0, 2)
            # verts.SetValue(1, 0)
            # verts.SetValue(2, 1)
            # polydata.GetVerts().SetNumberOfCells(1);


            polydata.Modified()
            self.rayProxy.MarkModified(self.rayProxy)

            self.rayRepresentation.Visibility = 1
        else:
            self.rayRepresentation.Visibility = 0


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


    @exportRpc("paraview.quake.scale.uncertainty")
    def updateUncertaintyScaling(self, scaling):
        self.uncertaintyScaling = scaling

        self.focusQuakeRepresentation.ScaleFactor = self.uncertaintyScaling
        self.focusBlastRepresentation.ScaleFactor = self.uncertaintyScaling

        self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.quake.data.update")
    def updateData(self, now, focusTime, historicalTime):
        events_in_focus = get_events_catalog(API_URL, focusTime, now)
        historic_events = get_events_catalog(API_URL, historicalTime, focusTime)

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

        # Show ray of the picked data
        self.showRay = 'ray' in visibilityMap and visibilityMap['ray']

        # Show event 'uncertainty' or magnitude+time
        self.showEventsUncertainty('uncertainty' in visibilityMap and visibilityMap['uncertainty'])

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
      found = self.view.SelectSurfacePoints([int(x), int(y), int(x), int(y)], selectedRepresentations, selectionSources)
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

        # Handle ray if needed
        if self.showRay:
            self.updateRay(output)

        return output

      # No selection found
      self.rayRepresentation.Visibility = 0
      return None


    @exportRpc("paraview.quake.event.id")
    def getEventId(self, idx):
        return self.idList[idx]

    @exportRpc("paraview.quake.color.preset")
    def updatePreset(self, presetName):
        lutProxy = simple.GetColorTransferFunction('time')
        lutProxy.ApplyPreset(presetName, True)
        self.getApplication().InvokeEvent('UpdateEvent')
