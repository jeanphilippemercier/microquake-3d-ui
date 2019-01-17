import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VtkViewComponent } from './vtk-view.component';

describe('VtkViewComponent', () => {
  let component: VtkViewComponent;
  let fixture: ComponentFixture<VtkViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VtkViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VtkViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
