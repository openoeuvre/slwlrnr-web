/** Shapes returned by the inference service (inference/server.py). */

export type SystemInfo = {
  key: string;
  name: string;
  description: string;
  premium: boolean;
};

export type SystemsResponse = {
  systems: SystemInfo[];
  min_sources: number;
  max_sources: number;
};

export type BlendResponse = {
  images: string[]; // data URIs
  system: string;
  seed: number;
  lowres: boolean;
  meta: Record<string, unknown>;
};
