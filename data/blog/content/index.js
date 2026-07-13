import { blogContentPipeline } from './pipeline.js';
import { blogContentSeed } from './seed.js';

export const blogContent = {
  ...blogContentSeed,
  ...blogContentPipeline,
};
