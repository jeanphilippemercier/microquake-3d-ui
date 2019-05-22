import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';

// ----------------------------------------------------------------------------
// VTP Pipeline handler
// ----------------------------------------------------------------------------

function vtp({ url, piece, translate, renderer, getters }) {
  const pipeline = getters.LOCAL_PIPELINE_OBJECTS;
  const reader = vtkXMLPolyDataReader.newInstance();
  reader.setUrl(url).then(() => {
    const polydata = reader.getOutputData();
    const points = polydata.getPoints().getData();

    // Apply tranformation to the points coordinates
    vtkMatrixBuilder
      .buildFromRadian()
      .translate(...translate)
      .apply(points);

    polydata.getPoints().modified();

    const mapper = vtkMapper.newInstance();
    const actor = vtkActor.newInstance();
    actor.getProperty().setInterpolationToFlat();

    actor.setMapper(mapper);
    mapper.setInputData(polydata);

    renderer.addActor(actor);

    renderer.resetCamera();
    renderer.getRenderWindow().render();

    const pipelineObject = {
      getProp: () => actor,
      setVisibility: (visibility) => {
        actor.setVisibility(visibility);
        renderer.getRenderWindow().render();
      },
    };

    pipeline[piece.label] = pipelineObject;
  });
}

// ----------------------------------------------------------------------------
// jpg / Image texture
// ----------------------------------------------------------------------------

function jpg({ url, piece, translate, renderer, getters }) {
  const pipeline = getters.LOCAL_PIPELINE_OBJECTS;
  const origin = piece.extra_json_attributes.origin || [0, 0, 0];
  const point1 = piece.extra_json_attributes.point1 || [0, 0, 0];
  const point2 = piece.extra_json_attributes.point2 || [0, 0, 0];

  const planeSource = vtkPlaneSource.newInstance({
    xResolution: 1,
    yResolution: 1,
    origin: [
      origin[0] + translate[0],
      origin[1] + translate[1],
      origin[2] + translate[2],
    ],
    point1: [
      point1[0] + translate[0],
      point1[1] + translate[1],
      point1[2] + translate[2],
    ],
    point2: [
      point2[0] + translate[0],
      point2[1] + translate[1],
      point2[2] + translate[2],
    ],
  });

  const mapper = vtkMapper.newInstance();
  const actor = vtkActor.newInstance();

  // actor.getProperty().setRepresentation(Representation.WIREFRAME);
  mapper.setInputData(planeSource.getOutputData());
  actor.setMapper(mapper);

  renderer.addActor(actor);
  renderer.resetCamera();
  renderer.getRenderWindow().render();

  // Download and apply Texture
  const img = new Image();
  img.crossOrigin = 'https://3d.microquake.org';
  img.src = url;

  const texture = vtkTexture.newInstance();
  texture.setInterpolate(true);
  texture.setImage(img);
  actor.addTexture(texture);

  const pipelineObject = {
    getProp: () => actor,
    setVisibility: (visibility) => {
      actor.setVisibility(visibility);
      renderer.getRenderWindow().render();
    },
  };

  pipeline[piece.label] = pipelineObject;
}

// ----------------------------------------------------------------------------

export default {
  vtp,
  jpg,
};
