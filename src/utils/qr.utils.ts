import QRCode from "qrcode";
import type { QRCodeStyleOptions } from "@/components/composed/qr-code";

export interface QRCodeGenerationOptions extends QRCodeStyleOptions {
  format?: "png" | "jpeg" | "webp" | "svg";
  download?: boolean;
  filename?: string;
}

/**
 * Generate a styled QR code and return as data URL
 */
export const generateStyledQRCode = async (value: string, options: QRCodeGenerationOptions = {}): Promise<string> => {
  const {
    size = 256,
    margin = 4,
    color = { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel = "M",
    quality = 0.92,
  } = options;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(value, {
      width: size,
      margin,
      color,
      errorCorrectionLevel,
      rendererOpts: {
        quality,
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Generate QR code as SVG string
 */
export const generateQRCodeSVG = async (value: string, options: Partial<QRCodeStyleOptions> = {}): Promise<string> => {
  const { size = 256, margin = 4, color = { dark: "#000000", light: "#FFFFFF" }, errorCorrectionLevel = "M" } = options;

  try {
    const svgString = await QRCode.toString(value, {
      type: "svg",
      width: size,
      margin,
      color,
      errorCorrectionLevel,
    });

    return svgString;
  } catch (error) {
    throw new Error(`Failed to generate QR code SVG: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Download QR code as file
 */
export const downloadQRCode = (dataUrl: string, filename: string = "qrcode") => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Validate if a string can be encoded as QR code
 */
export const validateQRCodeData = (value: string): { isValid: boolean; error?: string } => {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: "QR code value cannot be empty" };
  }

  // QR code has a maximum capacity depending on error correction level and data type
  const maxLength = 4296; // Alphanumeric mode with L error correction
  if (value.length > maxLength) {
    return { isValid: false, error: `QR code value is too long (max ${maxLength} characters)` };
  }

  return { isValid: true };
};

/**
 * Get optimal error correction level based on use case
 */
export const getOptimalErrorCorrection = (useCase: "web" | "print" | "mobile" | "outdoor"): "L" | "M" | "Q" | "H" => {
  switch (useCase) {
    case "web":
      return "L"; // Low - good for clean display conditions
    case "print":
      return "M"; // Medium - good balance for print materials
    case "mobile":
      return "Q"; // Quartile - better for mobile scanning
    case "outdoor":
      return "H"; // High - best for damaged/dirty conditions
    default:
      return "M";
  }
};

/**
 * Predefined style presets for common use cases
 */
export const QRCodePresets = {
  minimal: {
    size: 200,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
    rounded: false,
    border: false,
  },
  modern: {
    size: 256,
    margin: 4,
    color: { dark: "#1f2937", light: "#f9fafb" },
    rounded: true,
    roundedCorners: 12,
    border: true,
    borderColor: "#e5e7eb",
    borderWidth: 1,
    shadow: true,
  },
  colorful: {
    size: 300,
    margin: 4,
    color: { dark: "#3b82f6", light: "#ffffff" },
    rounded: true,
    roundedCorners: 16,
    backgroundPattern: "gradient" as const,
    gradientColors: ["#dbeafe", "#ffffff"] as [string, string],
    shadow: true,
    shadowColor: "rgba(59, 130, 246, 0.3)",
  },
  branded: {
    size: 256,
    margin: 4,
    color: { dark: "#000000", light: "#ffffff" },
    rounded: true,
    roundedCorners: 8,
    logoSize: 0.15,
    border: true,
    borderColor: "#000000",
    borderWidth: 2,
    backgroundColor: "#ffffff",
  },
  neon: {
    size: 256,
    margin: 4,
    color: { dark: "#00ff88", light: "#001122" },
    rounded: true,
    roundedCorners: 8,
    shadow: true,
    shadowColor: "rgba(0, 255, 136, 0.5)",
    shadowBlur: 20,
    backgroundColor: "#001122",
  },
  walletConnect: {
    size: 216,
    margin: 3,
    color: { dark: "#000000", light: "#ffffff" },
    rounded: true,
    roundedCorners: 12,
    border: true,
    borderColor: "#e5e7eb",
    borderWidth: 1,
    shadow: true,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowBlur: 8,
    backgroundColor: "#ffffff",
    errorCorrectionLevel: "M" as const,
  },
} as const;

/**
 * Generate multiple QR codes with different styles
 */
export const generateQRCodeVariations = async (
  value: string,
  presets: (keyof typeof QRCodePresets)[] = ["minimal", "modern", "colorful"],
): Promise<Array<{ preset: string; dataUrl: string; options: QRCodeStyleOptions }>> => {
  const results = await Promise.allSettled(
    presets.map(async (presetName) => {
      const options = QRCodePresets[presetName] as QRCodeStyleOptions;
      const dataUrl = await generateStyledQRCode(value, options);
      return { preset: presetName, dataUrl, options };
    }),
  );

  return results
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<{
        preset: keyof typeof QRCodePresets;
        dataUrl: string;
        options: (typeof QRCodePresets)[keyof typeof QRCodePresets];
      }> => result.status === "fulfilled",
    )
    .map((result) => result.value);
};

/**
 * Calculate optimal QR code size based on intended viewing distance
 */
export const calculateOptimalSize = (viewingDistanceCm: number): number => {
  // Rule of thumb: QR code should be at least 10% of viewing distance
  const minSizeCm = viewingDistanceCm * 0.1;
  // Convert to pixels (assuming 96 DPI)
  const minSizePixels = (minSizeCm / 2.54) * 96;

  // Round to nearest power of 2 for clean scaling
  return Math.pow(2, Math.ceil(Math.log2(Math.max(minSizePixels, 128))));
};

/**
 * Extract QR code data for debugging
 */
export const analyzeQRCode = (value: string) => {
  const byteLength = new TextEncoder().encode(value).length;
  const charLength = value.length;

  return {
    value,
    charLength,
    byteLength,
    estimatedModules: Math.ceil(Math.sqrt(byteLength * 8)), // Rough estimate
    recommendedErrorCorrection: byteLength > 1000 ? "H" : byteLength > 500 ? "Q" : "M",
    dataType: detectDataType(value),
  };
};

/**
 * Detect the type of data in QR code
 */
const detectDataType = (value: string): string => {
  // URL detection
  if (/^https?:\/\//.test(value)) return "URL";

  // Email detection
  if (/^mailto:/.test(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email";

  // Phone detection
  if (/^tel:/.test(value) || /^\+?[\d\s\-()]{10,}$/.test(value)) return "Phone";

  // WiFi detection
  if (/^WIFI:/.test(value)) return "WiFi";

  // SMS detection
  if (/^sms:/.test(value)) return "SMS";

  // vCard detection
  if (/^BEGIN:VCARD/.test(value)) return "vCard";

  // Cryptocurrency detection
  if (/^bitcoin:|^ethereum:|^litecoin:/.test(value)) return "Cryptocurrency";

  // Numbers only
  if (/^\d+$/.test(value)) return "Numeric";

  // Alphanumeric
  if (/^[A-Z0-9 $%*+\-./:]*$/.test(value)) return "Alphanumeric";

  return "Text";
};
