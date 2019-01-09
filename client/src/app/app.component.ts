import { Component, OnInit } from "@angular/core";
import QuakeManager from "../QuakeManager";

function pad(number) {
  if (number < 10) {
    return `0${number}`;
  }
  return `${number}`;
}

function getDateFromNow(nbHours = 0) {
  const timeStamp = new Date(Date.now() - nbHours * 3600000);
  const year = timeStamp.getFullYear();
  const month = pad(timeStamp.getMonth() + 1);
  const day = pad(timeStamp.getDate());
  const hours = pad(timeStamp.getHours());
  const minutes = pad(timeStamp.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}:00.0`;
}

const NAME_MAPPING = {
  Earthquake: "quake",
  Blastquake: "blast",
  Historical: "historical"
};

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  liveMonitoring = false;
  expanded = true;
  picking = false;
  historicalPeriod = 2190; // in hours (3 months)
  focusPeriod = 2190; // in hours (3 months)
  mineLabel: '';
  pieces = [];
  events = Object.keys(NAME_MAPPING).map(name => ({ name, checked: true }));

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  togglePicking() {
    this.picking = !this.picking;
  }

  orientCamera() {
    QuakeManager.snapCamera();
  }

  resetCamera() {
    QuakeManager.resetCamera();
  }

  periodChange() {
    const now = getDateFromNow();
    const historicalTime = getDateFromNow(this.historicalPeriod);
    const focusTime = getDateFromNow(this.focusPeriod);
    console.log("updateEvents (FIXME)", now, focusTime, historicalTime);
    QuakeManager.updateEvents(now, focusTime, historicalTime);
  }

  visibilityChange() {
    const visibilityMap = {};
    this.events.forEach((e) => {
      visibilityMap[NAME_MAPPING[e.name]] = e.checked;
    });
    console.log('visibilityChange', JSON.stringify(visibilityMap));
    QuakeManager.updateVisibility(visibilityMap);
  }

  mineVisibilityChange() {
    const visibilityMap = {};
    this.pieces.forEach((e) => {
      visibilityMap[e.name] = e.checked;
    });
    console.log('mineVisibilityChange', JSON.stringify(visibilityMap));
    QuakeManager.updateMineVisibility(visibilityMap);
  }

  toggleLive() {
    this.liveMonitoring = !this.liveMonitoring;
  }

  ngOnInit() {
    QuakeManager.connect({ sessionURL: "ws://localhost:1234/ws" }).then(() => {
      // Update mine info
      QuakeManager.getMineDescription().then((mine) => {
        this.mineLabel = mine.label;
        this.pieces = mine.pieces;

        // Put mine in center
        QuakeManager.resetCamera();

        // Trigger event fetching
        this.periodChange();
      });
    });
  }
}
