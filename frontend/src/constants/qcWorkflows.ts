// frontend/src/constants/qcWorkflows.ts
export const CATEGORY_STAGES: Record<string, string[]> = {
  Tablets: ['Dispensing', 'Granulation', 'Compression', 'Coating', 'Blistering', 'Packing'],
  Capsules: ['Dispensing', 'Blending', 'Encapsulation', 'Blistering', 'Packing'],
  PFS: ['Dispensing', 'Blending', 'Filling and Sealing', 'Packing'],
  Syrups: ['Dispensing', 'Sugar Preparation', 'Compounding', 'Liquid Filtration', 'Filling & Sealing', 'Labelling', 'Packing'],
  'ORS Saline': ['Dispensing', 'Blending', 'Sachet Filling and Sealing', 'Packing'],
  Derma: ['Dispensing', 'Mixing', 'Tube Filling and Sealing', 'Packing'],
};