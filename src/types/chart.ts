export type OutputFormat = 'png' | 'svg' | 'webp' | 'pdf';

export interface ChartRenderRequest {
  chart: string;
  width: number;
  height: number;
  format: OutputFormat;
  backgroundColor: string;
  devicePixelRatio: number;
  encoding: 'url' | 'base64';
}
