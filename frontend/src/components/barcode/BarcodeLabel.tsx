import { useMemo } from "react";

const code128Patterns = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

const eanLeftOdd = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const eanLeftEven = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const eanRight = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
const eanParity = ["OOOOOO", "OOEOEE", "OOEEOE", "OOEEEO", "OEOOEE", "OEEOOE", "OEEEOO", "OEOEOE", "OEOEEO", "OEEOEO"];

interface BarcodeLabelProps {
  value: string;
  productName?: string;
  price?: string;
  className?: string;
}

function encodeCode128B(value: string) {
  const trimmedValue = value.trim();
  const characters = [...trimmedValue];

  if (!trimmedValue || characters.some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code > 126;
  })) {
    return null;
  }

  const values = characters.map((character) => character.charCodeAt(0) - 32);
  const checksum = values.reduce((sum, code, index) => sum + code * (index + 1), 104) % 103;
  return [104, ...values, checksum, 106].map((code) => code128Patterns[code]).join("");
}

function ean13CheckDigit(firstTwelveDigits: string) {
  const sum = [...firstTwelveDigits].reduce((total, digit, index) => {
    return total + Number(digit) * (index % 2 === 0 ? 1 : 3);
  }, 0);
  return String((10 - (sum % 10)) % 10);
}

function encodeEan13(value: string) {
  const trimmedValue = value.trim();
  if (!/^\d{13}$/.test(trimmedValue)) return null;
  if (ean13CheckDigit(trimmedValue.slice(0, 12)) !== trimmedValue[12]) return null;

  const firstDigit = Number(trimmedValue[0]);
  const parity = eanParity[firstDigit];
  const leftDigits = trimmedValue.slice(1, 7);
  const rightDigits = trimmedValue.slice(7);
  const leftPattern = [...leftDigits].map((digit, index) => {
    return parity[index] === "O" ? eanLeftOdd[Number(digit)] : eanLeftEven[Number(digit)];
  }).join("");
  const rightPattern = [...rightDigits].map((digit) => eanRight[Number(digit)]).join("");
  return `101${leftPattern}01010${rightPattern}101`;
}

export function BarcodeLabel({ value, productName, price, className = "" }: BarcodeLabelProps) {
  const encodedEan13 = useMemo(() => encodeEan13(value), [value]);
  const encodedCode128 = useMemo(() => encodeCode128B(value), [value]);
  const encodedPattern = encodedEan13 ?? encodedCode128;

  if (!encodedPattern) {
    return (
      <div className={`rounded-md border border-dashed border-line p-4 text-sm text-slate-500 dark:border-slate-700 ${className}`}>
        Generate or enter a barcode to preview it.
      </div>
    );
  }

  const moduleWidth = encodedEan13 ? 4 : 2;
  const barcodeHeight = encodedEan13 ? 108 : 88;
  const quietZone = encodedEan13 ? 44 : 24;
  const patternModules = encodedEan13 ? encodedPattern.length : [...encodedPattern].reduce((sum, width) => sum + Number(width), 0);
  const svgWidth = patternModules * moduleWidth + quietZone * 2;
  let x = quietZone;

  return (
    <div className={`barcode-print rounded-md border border-line bg-white p-4 text-center text-slate-950 ${className}`}>
      {productName && <div className="mb-2 truncate text-sm font-semibold">{productName}</div>}
      <svg viewBox={`0 0 ${svgWidth} ${barcodeHeight}`} className="mx-auto h-32 max-w-full" role="img" aria-label={`Barcode ${value}`}>
        <rect width={svgWidth} height={barcodeHeight} fill="white" />
        {encodedEan13 ? [...encodedPattern].map((bit, index) => {
          if (bit !== "1") return null;
          return <rect key={index} x={quietZone + index * moduleWidth} y="0" width={moduleWidth} height={barcodeHeight} fill="black" />;
        }) : [...encodedPattern].map((widthCharacter, index) => {
          const width = Number(widthCharacter) * moduleWidth;
          const currentX = x;
          x += width;
          if (index % 2 !== 0) return null;
          return <rect key={`${index}-${currentX}`} x={currentX} y="0" width={width} height={barcodeHeight} fill="black" />;
        })}
      </svg>
      <div className="mt-2 font-mono text-sm tracking-normal">{value.trim()}</div>
      {price && <div className="mt-1 text-sm font-semibold">{price}</div>}
    </div>
  );
}
