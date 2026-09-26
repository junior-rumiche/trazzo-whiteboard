export type Tool =
  | "select"
  | "hand"
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "arrow"
  | "line"
  | "pencil"
  | "text"
  | "image"
  | "eraser"
  | "frame"
  | "embed"
  | "draw-to-shape"
  | "laser"
  | "bucket"
  | "lasso";

export type FillStyle = "none" | "solid" | "hachure" | "cross-hatch";
export type StrokeStyle = "solid" | "dashed" | "dotted";
export type TextAlign = "left" | "center" | "right";

export interface Point {
  x: number;
  y: number;
}

export type AnchorPosition = "n" | "s" | "e" | "w" | "center";

export interface PointBinding {
  elementId: string;
  anchor: AnchorPosition;
}

export interface BaseElement {
  id: string;
  type: Tool;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;
  opacity: number;
  angle?: number;
  seed?: number;
  isDeleted?: boolean;
  link?: string;
  startBinding?: PointBinding | null;
  endBinding?: PointBinding | null;
}

export interface RectangleElement extends BaseElement {
  type: "rectangle";
}

export interface DiamondElement extends BaseElement {
  type: "diamond";
}

export interface EllipseElement extends BaseElement {
  type: "ellipse";
}

export interface LineElement extends BaseElement {
  type: "line";
  points?: [Point, Point];
}

export interface ArrowElement extends BaseElement {
  type: "arrow";
  points?: [Point, Point];
}

export interface PencilElement extends BaseElement {
  type: "pencil";
  points: Point[];
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  textAlign?: TextAlign;
}

export interface TextDraft {
  sessionKey: string;
  id?: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  strokeColor: string;
  textAlign?: TextAlign;
  anchorCenterX?: number;
  anchorCenterY?: number;
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  aspectRatio?: number;
}

export interface FrameElement extends BaseElement {
  type: "frame";
  name?: string;
}

export interface EmbedElement extends BaseElement {
  type: "embed";
  url: string;
  title?: string;
}

export type TrazzoElement =
  | RectangleElement
  | DiamondElement
  | EllipseElement
  | LineElement
  | ArrowElement
  | PencilElement
  | TextElement
  | ImageElement
  | FrameElement
  | EmbedElement;

export interface ViewTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface Board {
  id: string;
  name: string;
  elements: TrazzoElement[];
  viewTransform: ViewTransform;
  backgroundColor: string;
  gridEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TrazzoFileFormat {
  type: "trazzo/file";
  version: 1;
  app: "Trazzo";
  createdAt: number;
  boards?: Board[];
  board?: Board;
  elements?: TrazzoElement[];
}

export interface ToolProperties {
  strokeColor: string;
  fillColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  textAlign: TextAlign;
}

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "start" | "end";


