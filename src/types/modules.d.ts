declare module 'chartjs-adapter-date-fns';
declare module 'qrcode/helper/to-sjis' {
  const toSJIS: (codePoint: number) => number;
  export default toSJIS;
}
declare module 'patternomaly' {
  export function draw(
    shapeType: string,
    backgroundColor: string,
    patternColor: string,
    size: number,
  ): CanvasPattern;
}
