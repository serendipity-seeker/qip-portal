import React, { useEffect, useRef, useState } from "react";
import QRCode, { type QRCodeToDataURLOptions } from "qrcode";
import { cn } from "@/utils";

export interface QRCodeStyleOptions {
  // Size options
  size?: number;
  margin?: number;

  // Color options
  color?: {
    dark?: string;
    light?: string;
  };

  // Quality options
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  type?: "image/png" | "image/jpeg" | "image/webp";
  quality?: number;

  // Style options
  rounded?: boolean;
  roundedCorners?: number;
  logo?: string;
  logoSize?: number;
  logoOpacity?: number;

  // Border and shadow
  border?: boolean;
  borderColor?: string;
  borderWidth?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;

  // Background
  backgroundColor?: string;
  backgroundPattern?: "dots" | "gradient" | "none";
  gradientColors?: [string, string];
}

export interface QRCodeProps {
  value: string;
  className?: string;
  style?: React.CSSProperties;
  options?: QRCodeStyleOptions;
  onGenerated?: (dataUrl: string) => void;
  onError?: (error: Error) => void;
}

export const StyledQRCode: React.FC<QRCodeProps> = ({
  value,
  className,
  style,
  options = {},
  onGenerated,
  onError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultOptions: QRCodeStyleOptions = {
    size: 256,
    margin: 4,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
    type: "image/png",
    quality: 0.92,
    rounded: false,
    roundedCorners: 8,
    logoSize: 0.2,
    logoOpacity: 1,
    border: false,
    borderColor: "#000000",
    borderWidth: 2,
    shadow: false,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowBlur: 10,
    backgroundColor: "transparent",
    backgroundPattern: "none",
    gradientColors: ["#667eea", "#764ba2"],
  };

  const mergedOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current || !value) return;

      setIsLoading(true);
      setError(null);

      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");

        // Set canvas size
        const size = mergedOptions.size!;
        canvas.width = size;
        canvas.height = size;

        // Generate base QR code
        const qrCodeDataUrl = await QRCode.toDataURL(value, {
          width: size,
          margin: mergedOptions.margin,
          color: mergedOptions.color,
          errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
          type: mergedOptions.type,
          quality: mergedOptions.quality,
        } as QRCodeToDataURLOptions);

        // Load the QR code image
        const qrImage = new Image();
        qrImage.onload = async () => {
          // Clear canvas
          ctx.clearRect(0, 0, size, size);

          // Apply background
          await applyBackground(ctx, size, mergedOptions);

          // Draw QR code
          if (mergedOptions.rounded) {
            drawRoundedQR(ctx, qrImage, size, mergedOptions.roundedCorners!);
          } else {
            ctx.drawImage(qrImage, 0, 0, size, size);
          }

          // Apply logo if provided
          if (mergedOptions.logo) {
            await applyLogo(ctx, mergedOptions.logo, size, mergedOptions);
          }

          // Apply border and shadow
          applyBorderAndShadow(ctx, size, mergedOptions);

          // Get final data URL
          const finalDataUrl = canvas.toDataURL(mergedOptions.type, mergedOptions.quality);
          onGenerated?.(finalDataUrl);
          setIsLoading(false);
        };

        qrImage.onerror = () => {
          throw new Error("Failed to load QR code image");
        };

        qrImage.src = qrCodeDataUrl;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to generate QR code";
        setError(errorMessage);
        onError?.(new Error(errorMessage));
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [value, mergedOptions, onGenerated, onError]);

  const applyBackground = async (ctx: CanvasRenderingContext2D, size: number, options: QRCodeStyleOptions) => {
    if (options.backgroundColor && options.backgroundColor !== "transparent") {
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, size, size);
    }

    if (options.backgroundPattern === "dots") {
      applyDotsPattern(ctx, size);
    } else if (options.backgroundPattern === "gradient") {
      applyGradientBackground(ctx, size, options.gradientColors!);
    }
  };

  const applyDotsPattern = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    const dotSize = 2;
    const spacing = 8;
    for (let x = 0; x < size; x += spacing) {
      for (let y = 0; y < size; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  };

  const applyGradientBackground = (ctx: CanvasRenderingContext2D, size: number, colors: [string, string]) => {
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  };

  const drawRoundedQR = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, size: number, radius: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.clip();
    ctx.drawImage(image, 0, 0, size, size);
    ctx.restore();
  };

  const applyLogo = async (
    ctx: CanvasRenderingContext2D,
    logoSrc: string,
    size: number,
    options: QRCodeStyleOptions,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const logo = new Image();
      logo.onload = () => {
        const logoSize = size * options.logoSize!;
        const x = (size - logoSize) / 2;
        const y = (size - logoSize) / 2;

        // Apply logo opacity
        ctx.globalAlpha = options.logoOpacity!;

        // Draw white background circle for logo
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, logoSize / 2 + 4, 0, 2 * Math.PI);
        ctx.fill();

        // Draw logo
        ctx.drawImage(logo, x, y, logoSize, logoSize);
        ctx.globalAlpha = 1;
        resolve();
      };
      logo.onerror = () => reject(new Error("Failed to load logo"));
      logo.crossOrigin = "anonymous";
      logo.src = logoSrc;
    });
  };

  const applyBorderAndShadow = (ctx: CanvasRenderingContext2D, size: number, options: QRCodeStyleOptions) => {
    if (options.shadow) {
      ctx.shadowColor = options.shadowColor!;
      ctx.shadowBlur = options.shadowBlur!;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    if (options.border) {
      ctx.strokeStyle = options.borderColor!;
      ctx.lineWidth = options.borderWidth!;
      if (options.rounded) {
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, options.roundedCorners!);
        ctx.stroke();
      } else {
        ctx.strokeRect(0, 0, size, size);
      }
    }

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  if (error) {
    return (
      <div className={cn("flex items-center justify-center rounded-lg bg-red-50 p-4 text-red-600", className)}>
        <span className="text-sm">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={style}>
      <canvas
        ref={canvasRef}
        className={cn("h-auto max-w-full", isLoading && "opacity-50", mergedOptions.shadow && "drop-shadow-lg")}
        style={{
          width: mergedOptions.size,
          height: mergedOptions.size,
        }}
      />
      {isLoading && (
        <div className="bg-opacity-75 absolute inset-0 flex items-center justify-center rounded-lg bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default StyledQRCode;
