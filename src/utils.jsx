export const getEmptyCartMessage = () => {
  const now = new Date();
  const hour = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'Asia/Damascus',
  }).format(now);

  const h = Number(hour);

  if (hour >= 6 && hour < 11) {
    return { text: "وجبة خفيفة" };
  }

  if (hour >= 11 && hour < 17) {
    return { text: "وقت الغداء" };
  }

  return { text: "وجبة ليلية" };
};
