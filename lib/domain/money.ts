const DECIMAL_PATTERN = /^-?\d+([.,]\d+)?$/;

export function parseDecimalToMinorUnits(input: string, decimals: number): bigint {
  const normalized = input.trim().replace(",", ".");

  if (!normalized || !DECIMAL_PATTERN.test(normalized)) {
    throw new Error("Enter a valid amount.");
  }

  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [wholePart, fractionPart = ""] = unsigned.split(".");
  const paddedFraction = `${fractionPart}${"0".repeat(decimals)}`.slice(0, decimals);
  const minorUnits = BigInt(`${wholePart}${paddedFraction || ""}`);

  return negative ? -minorUnits : minorUnits;
}

export function formatMinorUnits(amount: bigint, code: string, decimals: number): string {
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const base = 10n ** BigInt(decimals);
  const whole = absolute / base;
  const fraction = absolute % base;
  const formattedFraction =
    decimals === 0 ? "" : `.${fraction.toString().padStart(decimals, "0")}`;

  return `${negative ? "-" : ""}${code} ${whole.toString()}${formattedFraction}`;
}

