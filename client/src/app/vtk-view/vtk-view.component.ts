import { Component, OnInit, ElementRef } from '@angular/core';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

import QuakeManager from '../../QuakeManager';

@Component({
  selector: 'app-vtk-view',
  templateUrl: './vtk-view.component.html',
  styleUrls: ['./vtk-view.component.css']
})
export class VtkViewComponent implements OnInit {
  vtkContainer = null;
  fullscreenWindow = null;
  pipeline = null;

  constructor(
    private el: ElementRef
  ) { }

  ngOnInit() {
    this.vtkContainer = this.el.nativeElement.querySelector('.vtk-view-container');
    this.fullscreenWindow = vtkFullScreenRenderWindow.newInstance({
      rootContainer: this.el.nativeElement,
      container: this.vtkContainer,
      containerStyle: {},
      background: [0, 0, 0, 0],
    });

    const renderer = this.fullscreenWindow.getRenderer();
    const renWindow = this.fullscreenWindow.getRenderWindow();
    const glRenderWindow = this.fullscreenWindow.getOpenGLRenderWindow();

    QuakeManager.bindRendering(renderer, renWindow, glRenderWindow);
  }

}
