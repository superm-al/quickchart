export type GraphvizEngine =
  | 'dot'
  | 'neato'
  | 'twopi'
  | 'circo'
  | 'fdp'
  | 'osage'
  | 'patchwork'
  | 'sfdp';

export interface GraphvizRenderRequest {
  graph: string;
  format: 'svg' | 'png';
  engine: GraphvizEngine;
  width?: number;
  height?: number;
}
