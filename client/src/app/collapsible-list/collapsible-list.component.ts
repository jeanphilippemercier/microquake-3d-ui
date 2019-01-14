import { Component, OnInit, TemplateRef, ContentChild, Input } from '@angular/core';

@Component({
  selector: 'app-collapsible-list',
  templateUrl: './collapsible-list.component.html',
  styleUrls: ['./collapsible-list.component.css']
})
export class CollapsibleListComponent implements OnInit {
  @Input()
  list: Array<any>;

  // The content child that is a ng-template with #item will end up
  // in this variable.
  @ContentChild('item')
  itemTemplate: TemplateRef<any>;

  collapsed = false;

  constructor() { }

  ngOnInit() {
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }
}
