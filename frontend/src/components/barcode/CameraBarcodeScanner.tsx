import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CameraDevice, Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, RefreshCw, X } from "lucide-react";
import { Button } from "../ui/Button";

const barcodeFormats = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128
];

interface CameraBarcodeScannerProps {
  onClose: () => void;
  onScan: (barcode: string) => void;
  continuous?: boolean;
  compact?: boolean;
}

export function CameraBarcodeScanner({ onClose, onScan, continuous = false, compact = false }: CameraBarcodeScannerProps) {
  const generatedId = useId().replace(/:/g, "");
  const readerId = `barcode-camera-${generatedId}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const lastBarcodeRef = useRef("");
  const lastBarcodeAtRef = useRef(0);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [status, setStatus] = useState("Preparing camera...");
  const [error, setError] = useState("");
  const [detectedBarcode, setDetectedBarcode] = useState("");

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;

    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      // The scanner may already be stopped while React is unmounting.
    }
  }, []);

  const loadCameras = useCallback(async () => {
    setError("");
    setStatus("Checking camera permission...");

    if (!window.isSecureContext) {
      setStatus("Camera unavailable");
      setError("Camera scanning requires localhost or HTTPS. Open the app on http://localhost:5173 on this computer.");
      return;
    }

    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);

      if (devices.length === 0) {
        setStatus("No camera found");
        setError("No camera was found. Connect a webcam or allow camera permission in the browser.");
        return;
      }

      setCameraId((current) => current || devices.find((device) => /back|rear|environment/i.test(device.label))?.id || devices[0].id);
    } catch (cameraError) {
      setStatus("Camera blocked");
      setError(cameraError instanceof Error ? cameraError.message : "Browser blocked camera access.");
    }
  }, []);

  useEffect(() => {
    void loadCameras();
  }, [loadCameras]);

  useEffect(() => {
    if (!cameraId) return;
    let cancelled = false;

    async function startScanner() {
      await stopScanner();
      hasScannedRef.current = false;
      setDetectedBarcode("");
      setError("");
      setStatus("Starting camera...");

      try {
        const scanner = new Html5Qrcode(readerId, {
          formatsToSupport: barcodeFormats,
          useBarCodeDetectorIfSupported: true,
          verbose: false
        });
        scannerRef.current = scanner;

        await scanner.start(
          cameraId,
          {
            fps: 30,
            qrbox: (viewfinderWidth, viewfinderHeight) => ({
              width: Math.floor(viewfinderWidth * (compact ? 0.9 : 0.98)),
              height: Math.floor(Math.min(viewfinderHeight * (compact ? 0.36 : 0.42), compact ? 140 : 260))
            }),
            aspectRatio: 1.777778,
            disableFlip: true
          },
          (decodedText) => {
            const scannedBarcode = decodedText.trim();
            if (!scannedBarcode) return;
            const now = Date.now();
            if (continuous) {
              if (lastBarcodeRef.current === scannedBarcode && now - lastBarcodeAtRef.current < 2500) return;
              lastBarcodeRef.current = scannedBarcode;
              lastBarcodeAtRef.current = now;
            } else {
              if (hasScannedRef.current) return;
              hasScannedRef.current = true;
            }
            setDetectedBarcode(scannedBarcode);
            setStatus(continuous ? "Barcode detected. Ready for next scan." : "Barcode detected");
            onScan(scannedBarcode);
          },
          undefined
        );

        if (!cancelled) setStatus("Camera ready. Point it at the barcode.");
      } catch (scanError) {
        if (cancelled) return;
        setStatus("Camera failed");
        setError(scanError instanceof Error ? scanError.message : "Camera scanner could not start.");
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [cameraId, compact, continuous, onScan, readerId, stopScanner]);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Camera size={18} />
          Camera barcode scanner
        </div>
        <Button type="button" className="h-9 bg-slate-700 px-3 hover:bg-slate-800" onClick={onClose}>
          <X size={16} />
          Close
        </Button>
      </div>

      <div className={`grid gap-2 ${compact ? "sm:grid-cols-[minmax(0,1fr)_auto]" : "sm:grid-cols-[1fr_auto]"}`}>
        <select
          className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950"
          value={cameraId}
          onChange={(event) => setCameraId(event.target.value)}
          disabled={cameras.length === 0}
        >
          {cameras.length === 0 && <option value="">No camera available</option>}
          {cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.label || `Camera ${camera.id}`}</option>)}
        </select>
        <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={() => void loadCameras()}>
          <RefreshCw size={16} />
          Retry
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-slate-950 dark:border-slate-700">
        <div id={readerId} className={`${compact ? "min-h-[150px] [&_video]:max-h-[180px]" : "min-h-[260px]"} w-full text-white [&_video]:w-full [&_video]:object-cover`} />
      </div>

      <p className={`${compact ? "text-xs" : "text-sm"} text-slate-600 dark:text-slate-300`}>{status}</p>
      {detectedBarcode && <p className={`${compact ? "text-xs" : "text-sm"} text-teal-700`}>Detected: {detectedBarcode}</p>}
      {error && <p className={`${compact ? "text-xs" : "text-sm"} text-red-600`}>{error}</p>}
    </div>
  );
}
