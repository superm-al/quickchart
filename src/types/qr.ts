export interface QrRenderRequest {
  text: string;
  format: 'png' | 'svg';
  size: number;
  margin: number;
  ecLevel?: string;
  dark: string;
  light: string;
  mode?: string;
}
