declare module "@mapbox/mapbox-gl-draw" {
  import { IControl } from "mapbox-gl";
  import { Feature, FeatureCollection, Geometry } from "geojson";

  interface MapboxDrawOptions {
    displayControlsDefault?: boolean;
    controls?: {
      point?: boolean;
      line?: boolean;
      polygon?: boolean;
      trash?: boolean;
      combine_features?: boolean;
      uncombine_features?: boolean;
    };
    defaultMode?: string;
    styles?: Record<string, unknown>[];
    [key: string]: unknown;
  }

  interface DrawGetAllResult {
    type: "FeatureCollection";
    features: Feature<Geometry>[];
  }

  export default class MapboxDraw implements IControl {
    constructor(options?: MapboxDrawOptions);
    add(geojson: Feature<Geometry> | FeatureCollection): string[];
    get(id: string): Feature<Geometry> | undefined;
    getAll(): DrawGetAllResult;
    set(geojson: Feature<Geometry> | FeatureCollection): string[];
    delete(id: string): void;
    deleteAll(): void;
    getFeatureIdsAt(point: { x: number; y: number }): string[];
    onAdd(map: mapboxgl.Map): HTMLElement;
    onRemove(map: mapboxgl.Map): void;
    trash(): void;
    combineFeatures(): void;
    uncombineFeatures(): void;
    setFeatureProperty(featureId: string, property: string, value: unknown): void;
    getMode(): string;
    changeMode(mode: string, options?: Record<string, unknown>): void;
  }
}
