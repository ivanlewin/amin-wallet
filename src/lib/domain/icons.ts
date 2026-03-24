export type ColorIcon = {
  type: "color";
  color: string;
  name: string;
};

export type ResourceIcon = {
  type: "resource";
  resource: string;
};

export type IconDefinition = ColorIcon | ResourceIcon;

const palette = ["#1f6feb", "#0f766e", "#a16207", "#9333ea", "#dc2626", "#1d4ed8"];

export function buildColorIcon(name: string, color: string): IconDefinition {
  return {
    type: "color",
    color,
    name: toInitials(name),
  };
}

export function buildWalletIcon(name: string): IconDefinition {
  return buildColorIcon(name, pickColor(name));
}

export function serializeIcon(icon: IconDefinition): string {
  return JSON.stringify(icon);
}

export function parseIcon(serializedIcon: string): IconDefinition {
  const parsed = JSON.parse(serializedIcon) as unknown;

  if (isColorIcon(parsed) || isResourceIcon(parsed)) {
    return parsed;
  }

  throw new Error("Invalid icon definition.");
}

export function pickColor(seed: string): string {
  const total = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[total % palette.length] ?? palette[0];
}

function toInitials(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "AM";
  }

  const segments = trimmed.split(/\s+/).filter(Boolean);
  const initials = segments.slice(0, 2).map((segment) => segment[0]?.toUpperCase() ?? "");
  const joined = initials.join("");

  return joined || trimmed.slice(0, 2).toUpperCase();
}

function isColorIcon(value: unknown): value is ColorIcon {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "color" &&
    "color" in value &&
    typeof value.color === "string" &&
    "name" in value &&
    typeof value.name === "string"
  );
}

function isResourceIcon(value: unknown): value is ResourceIcon {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "resource" &&
    "resource" in value &&
    typeof value.resource === "string"
  );
}
