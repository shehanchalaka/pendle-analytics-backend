import BigNumber from "bignumber.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export function toUTC(timestamp) {
  return dayjs(timestamp).unix();
}

export function fillMissingValues(data, value, startTime, endTime) {
  const map = data.reduce((a, b) => {
    if (!a[b.time]) {
      a[b.time] = b;
    }
    return a;
  }, {});

  const result = [...data];

  const end = dayjs(endTime);
  let time = dayjs(startTime);

  while (time.isBefore(end)) {
    let key = dayjs(time).format("YYYY-MM-DD");

    if (!map[key]) {
      result.push({ ...value, time: key });
    }

    time = time.add(1, "day");
  }

  return result.sort(
    (a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf()
  );
}

export function pow10(n) {
  return new BigNumber(10).pow(n);
}

export function pushMissingDatesWithNet(array) {
  if (!array || array.length === 0) return [];

  const startDate = dayjs(array[0].date);
  const endDate = dayjs(array[array.length - 1].date);

  const map = {};

  array.forEach((item) => {
    const date = item.date;
    const _in = item?.in ?? 0;
    const _out = item?.out ?? 0;

    if (!map[date]) {
      map[date] = { date, in: _in, out: _out };
    } else {
      map[date].in += _in;
      map[date].out += _out;
    }
  });

  let currentDate = dayjs(startDate);
  let net = 0;

  while (!currentDate.isAfter(endDate)) {
    const date = currentDate.format("YYYY-MM-DD");

    if (!map[date]) {
      map[date] = { date, in: 0, out: 0, net };
    } else {
      net += map[date].in - map[date].out;
      map[date].net = net;
    }

    currentDate = currentDate.add(1, "day");
  }

  const r = Object.values(map).sort(
    (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
  );

  return r;
}
