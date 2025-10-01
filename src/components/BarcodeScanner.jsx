"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Camera,
    X,
    Flashlight,
    FlashlightOff,
    ScanLine,
    Zap,
    CheckCircle,
} from "lucide-react";

// Dynamically import Scanner for Next.js compatibility
const Scanner = dynamic(
    () =>
        import("@yudiel/react-qr-scanner").then((mod) => ({
            default: mod.Scanner,
        })),
    { ssr: false }
);

export default function BarcodeScannerComponent({ onScan, onError, onClose }) {
    const [scannedData, setScannedData] = useState("");
    const [isScanning, setIsScanning] = useState(true); // Langsung mulai scanning
    const [isTorchOn, setIsTorchOn] = useState(false);

    const handleScan = (detectedCodes) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const scannedCode = detectedCodes[0].rawValue;
            setScannedData(scannedCode);
            setIsScanning(false);

            // Call parent callback if provided
            if (onScan) {
                onScan(scannedCode);
            }
        }
    };

    const handleError = (error) => {
        console.error("Barcode scanner error:", error);
        if (onError) {
            onError(error);
        }
    };

    const stopScanning = () => {
        setIsScanning(false);
        // Call parent onClose callback when scanner is closed
        if (onClose) {
            onClose();
        }
    };

    const toggleTorch = () => {
        setIsTorchOn(!isTorchOn);
    };

    return (
        <div className="barcode-scanner-container w-full max-w-md mx-auto">
            {isScanning && (
                <div className="fixed inset-0 z-50 bg-background">
                    {/* Top bar */}
                    <div className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur border-b">
                        <div className="p-4 pt-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-foreground text-xl font-semibold">
                                        Scanner
                                    </h2>
                                    <p className="text-muted-foreground text-sm">
                                        Position barcode in the frame
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        onClick={toggleTorch}
                                        variant="outline"
                                        size="icon"
                                    >
                                        {isTorchOn ? (
                                            <Flashlight className="h-4 w-4" />
                                        ) : (
                                            <FlashlightOff className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        onClick={stopScanning}
                                        variant="outline"
                                        size="icon"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scanner viewport */}
                    <div className="w-full h-full relative pt-20 pb-20">
                        <Scanner
                            onScan={handleScan}
                            onError={handleError}
                            formats={[
                                "qr_code",
                                "code_128",
                                "code_39",
                                "ean_13",
                                "ean_8",
                            ]}
                            scanDelay={100}
                            constraints={{
                                advanced: [{ torch: isTorchOn }],
                            }}
                            components={{
                                finder: false, // We'll use our custom overlay
                            }}
                            styles={{
                                container: { width: "100%", height: "100%" },
                                video: {
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                },
                            }}
                        />

                        {/* Scanning frame overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="relative">
                                <div className="w-64 h-40 border-2 rounded-lg relative border-gray-700">
                                    {/* Corner decorations */}
                                    <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                                    <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg"></div>

                                    {/* Scanning line */}
                                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                                        <div className="absolute w-full h-0.5 bg-primary animate-scan-line top-0"></div>
                                    </div>
                                </div>
                                <p className="text-foreground text-center mt-4 text-sm">
                                    Align barcode within the frame
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom controls */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur border-t">
                        <div className="p-6">
                            <div className="flex justify-center">
                                <Badge variant="secondary">
                                    <ScanLine className="mr-2 h-3 w-3" />
                                    Scanning...
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {scannedData && !isScanning && (
                <Card className="mt-4">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-3">
                            <div className="bg-primary/10 rounded-full p-2">
                                <CheckCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-foreground mb-1">
                                    Scan Successful
                                </h3>
                                <div className="bg-muted rounded-lg p-3 border">
                                    <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wide">
                                        Detected Code:
                                    </p>
                                    <p className="text-sm font-mono text-foreground">
                                        {scannedData}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Enhanced component with torch support
export function BarcodeScannerWithTorch({ onScan, onError, onClose }) {
    const [scannedData, setScannedData] = useState("");
    const [isScanning, setIsScanning] = useState(true); // Langsung mulai scanning
    const [isTorchOn, setIsTorchOn] = useState(false);

    const handleScan = (detectedCodes) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const scannedCode = detectedCodes[0].rawValue;
            setScannedData(scannedCode);
            setIsScanning(false);

            if (onScan) {
                onScan(scannedCode);
            }
        }
    };

    const handleError = (error) => {
        console.error("Barcode scanner error:", error);
        if (onError) {
            onError(error);
        }
    };

    const stopScanning = () => {
        setIsScanning(false);
        // Call parent onClose callback when scanner is closed
        if (onClose) {
            onClose();
        }
    };

    const toggleTorch = () => {
        setIsTorchOn(!isTorchOn);
    };

    return (
        <div className="barcode-scanner-container w-full max-w-md mx-auto">
            {isScanning && (
                <div className="fixed inset-0 z-50 bg-background">
                    {/* Top bar */}
                    <div className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur border-b">
                        <div className="p-4 pt-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-foreground text-xl font-semibold">
                                        Scanner
                                    </h2>
                                    <p className="text-muted-foreground text-sm">
                                        Position barcode in the frame
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        onClick={toggleTorch}
                                        variant="outline"
                                        size="icon"
                                    >
                                        {isTorchOn ? (
                                            <Flashlight className="h-4 w-4" />
                                        ) : (
                                            <FlashlightOff className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        onClick={stopScanning}
                                        variant="outline"
                                        size="icon"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scanner viewport */}
                    <div className="w-full h-full relative pt-20 pb-20">
                        <Scanner
                            onScan={handleScan}
                            onError={handleError}
                            formats={[
                                "qr_code",
                                "code_128",
                                "code_39",
                                "ean_13",
                                "ean_8",
                            ]}
                            scanDelay={500}
                            constraints={{
                                advanced: [{ torch: isTorchOn }],
                            }}
                            components={{
                                finder: false, // We'll use our custom overlay
                            }}
                            styles={{
                                container: { width: "100%", height: "100%" },
                                video: {
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                },
                            }}
                        />

                        {/* Scanning frame overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="relative">
                                <div className="w-64 h-40 border-2 border-primary rounded-lg relative">
                                    {/* Corner decorations */}
                                    <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                                    <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg"></div>

                                    {/* Scanning line */}
                                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                                        <div className="absolute w-full h-0.5 bg-primary animate-scan-line top-0"></div>
                                    </div>
                                </div>
                                <p className="text-foreground text-center mt-4 text-sm">
                                    Align barcode within the frame
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom controls */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur border-t">
                        <div className="p-6">
                            <div className="flex justify-center">
                                <Badge variant="secondary">
                                    <ScanLine className="mr-2 h-3 w-3" />
                                    Scanning...
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {scannedData && !isScanning && (
                <Card className="mt-4">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-3">
                            <div className="bg-primary/10 rounded-full p-2">
                                <CheckCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-foreground mb-1">
                                    Scan Successful
                                </h3>
                                <div className="bg-muted rounded-lg p-3 border">
                                    <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wide">
                                        Detected Code:
                                    </p>
                                    <p className="text-sm font-mono text-foreground">
                                        {scannedData}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
