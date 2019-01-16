import { Component, OnInit } from "@angular/core";
import QuakeManager from "../QuakeManager";

const TIME_UNITS = [
  { label: 'm', base: 730 },
  { label: 'w', base: 168 },
  { label: 'd', base: 24 },
];

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
  advanceMode = false;
  expanded = true;
  picking = false;
  historicalPeriod = 2190; // in hours (3 months)
  focusPeriod = 2190; // in hours (3 months)
  minMagnitude = -3;
  maxMagnitude = 3;
  minSize = 0.1;
  maxSize = 1;
  focusTimeString = '';
  mineCategories = [];
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
    const historicalTime = getDateFromNow(Math.max(this.focusPeriod, this.historicalPeriod));
    this.focusTimeString = getDateFromNow(this.focusPeriod);
    QuakeManager.updateEvents(now, this.focusTimeString, historicalTime);
  }

  getShortTimeLabel(value) {
    let remain = value || this.focusPeriod;
    const strBuffer = [];
    for (let i = 0; i < TIME_UNITS.length; i++) {
      const { label, base } = TIME_UNITS[i];
      if (remain >= base) {
        strBuffer.push(Math.floor(remain / base));
        strBuffer.push(label);
        remain %= base;
      }
    }
    return strBuffer.join('');
  }

  visibilityChange() {
    const visibilityMap = {};
    this.events.forEach(e => {
      visibilityMap[NAME_MAPPING[e.name]] = e.checked;
    });
    QuakeManager.updateVisibility(visibilityMap);
  }

  mineVisibilityChange() {
    const visibilityMap = {};
    for (let i = 0; i < this.mineCategories.length; i++) {
      for (let j = 0; j < this.mineCategories[i].pieces.length; j++) {
        const piece = this.mineCategories[i].pieces[j];
        visibilityMap[piece.name] = piece.checked;
      }
    }
    QuakeManager.updateMineVisibility(visibilityMap);
  }

  scalingChange() {
    QuakeManager.updateScaleFunction([this.minMagnitude, this.maxMagnitude], [this.minSize, this.maxSize]);
  }

  toggleAdvanceMode() {
    this.advanceMode = !this.advanceMode;
  }

  ngOnInit() {
    const config =
      window.location.hostname === "localhost" &&
      window.location.port === "4200"
        ? { sessionURL: "ws://localhost:1234/ws" }
        : { application: "quake" };
    QuakeManager.connect(config).then(() => {
      // Update mine info
      QuakeManager.getMineDescription().then(mine => {
        this.mineCategories = mine;

        // Put mine in center
        QuakeManager.resetCamera();

        // Trigger event fetching
        this.periodChange();
        this.scalingChange();
      });
    });
  }
}
