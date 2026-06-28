export function ageQuip(age: number | null): string {
  if (age === null) return "";
  if (age >= 100) return "showing off";
  if (age >= 95) return "spite-powered";
  if (age >= 90) return "still here, somehow";
  if (age >= 80) return "frankly impressive";
  if (age >= 70) return "against all odds";
  if (age >= 60) return "getting interesting";
  if (age >= 50) return "statistically fine";
  return "plenty of time, probably";
}

export function deadQuip(age: number | null): string {
  if (age === null) return "finally";
  if (age >= 100) return "an era ends";
  if (age >= 90) return "had a good run";
  if (age >= 80) return "at last";
  if (age >= 70) return "finally";
  return "unexpected";
}

export function formatDiedAt(diedAt: string): string {
  return new Date(diedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
