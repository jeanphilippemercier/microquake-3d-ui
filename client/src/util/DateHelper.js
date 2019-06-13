const TIME_UNITS = [
  { label: 'month', labelPlurial: 'months', base: 730 },
  { label: 'week', labelPlurial: 'weeks', base: 168 },
  { label: 'day', labelPlurial: 'days', base: 24 },
];

let OFFSET_IN_MS = 0;
const UTC_OFFSET = new Date().getTimezoneOffset() * 60000;

function pad(number) {
  if (number < 10) {
    return `0${number}`;
  }
  return `${number}`;
}

function getDateFromNow(nbHours = 0) {
  const localTS =
    nbHours < 24 ? new Date() : new Date(Date.now() - nbHours * 3600000);
  const utcTS = new Date(localTS.getTime() + UTC_OFFSET);

  return dateToString(utcTS);
}

function dateToString(date) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}:00.0`;
}

function toMineTime(str) {
  const mineDate = new Date(OFFSET_IN_MS + new Date(str).getTime());
  return dateToString(mineDate);
}

function getShortTimeLabel(value) {
  if (value < 24) {
    return 'now';
  }
  let remain = value;
  const strBuffer = [];
  for (let i = 0; i < TIME_UNITS.length; i++) {
    const { label, labelPlurial, base } = TIME_UNITS[i];
    if (remain >= base) {
      strBuffer.push(Math.floor(remain / base));
      strBuffer.push(remain / base >= 2 ? labelPlurial : label);
      remain %= base;
    }
  }
  return strBuffer.join(' ');
}

function getHoursFromNow(strDate) {
  const deltaHours = Math.round(
    (Date.now() - new Date(`${strDate}T00:00:00.0`)) / 3600000
  );
  return deltaHours;
}

function formatEpochTime(epoch) {
  if (Number.isNaN(epoch)) {
    return 'N/A';
  }
  const isoStr = new Date(OFFSET_IN_MS + epoch / 1000000)
    .toISOString()
    .split('T');
  return `${isoStr[1].split('.')[0]}`;
}

function formatEpochDate(epoch) {
  if (Number.isNaN(epoch)) {
    return 'N/A';
  }
  const isoStr = new Date(OFFSET_IN_MS + epoch / 1000000)
    .toISOString()
    .split('T');
  return `${isoStr[0].replace(/-/g, '/')}`;
}

function setTimeZone(strOffset) {
  const [hours, min] = strOffset.split(':').map(Number);
  const sign = hours < 0 ? -1 : +1;
  OFFSET_IN_MS = 0;
  OFFSET_IN_MS += min * 60000;
  OFFSET_IN_MS += Math.abs(hours) * 60 * 60000;
  OFFSET_IN_MS *= sign;
}

export default {
  getDateFromNow,
  getShortTimeLabel,
  formatEpochTime,
  formatEpochDate,
  getHoursFromNow,
  setTimeZone,
  toMineTime,
};
