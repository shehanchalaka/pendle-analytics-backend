import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

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
