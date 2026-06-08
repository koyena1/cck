export type CategoryField = {
  header: string;
  column: string;
  required?: boolean;
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'specs';
  defaultValue?: string | number | boolean | string[] | null;
};

export type CategoryUploadConfig = {
  label: string;
  table: string;
  fields: CategoryField[];
};

const commonTailFields: CategoryField[] = [
  { header: 'HSN Code', column: 'hsn_code', defaultValue: null },
  { header: 'Price', column: 'price', required: true, type: 'number' },
  { header: 'Original Price', column: 'original_price', type: 'number' },
  { header: 'Product Image', column: 'image', defaultValue: '' },
  { header: 'Specifications', column: 'specs', type: 'specs', defaultValue: [] },
  { header: 'Rating', column: 'rating', type: 'number', defaultValue: 4.5 },
  { header: 'Reviews Count', column: 'reviews', type: 'integer', defaultValue: 0 },
  { header: 'Active', column: 'is_active', type: 'boolean', defaultValue: true },
];

const comboFields: CategoryField[] = [
  { header: 'Product Name', column: 'name', required: true },
  { header: 'Brand', column: 'brand', required: true },
  { header: 'Channels', column: 'channels', required: true, type: 'integer' },
  { header: 'Camera Type', column: 'camera_type', required: true },
  { header: 'Resolution', column: 'resolution', required: true },
  { header: 'Hard Disk', column: 'hdd', required: true },
  { header: 'Cable Length', column: 'cable', required: true },
  { header: 'DVR', column: 'dvr', type: 'boolean', defaultValue: false },
  { header: 'NVR', column: 'nvr', type: 'boolean', defaultValue: false },
  ...commonTailFields,
];

const cameraBaseFields: CategoryField[] = [
  { header: 'Product Name', column: 'name', required: true },
  { header: 'Brand', column: 'brand', required: true },
  { header: 'Resolution', column: 'resolution', required: true },
];

export const CATEGORY_UPLOAD_CONFIGS: Record<string, CategoryUploadConfig> = {
  'hd-combo': {
    label: 'HD Combo',
    table: 'hd_combo_products',
    fields: comboFields,
  },
  'ip-combo': {
    label: 'IP Combo',
    table: 'ip_combo_products',
    fields: comboFields,
  },
  'wifi-camera': {
    label: 'WiFi Camera',
    table: 'wifi_camera_products',
    fields: [
      ...cameraBaseFields,
      { header: 'Connectivity', column: 'connectivity', required: true },
      { header: 'Night Vision', column: 'night_vision', type: 'boolean', defaultValue: false },
      ...commonTailFields,
    ],
  },
  '4g-sim-camera': {
    label: '4G SIM Camera',
    table: 'sim_4g_camera_products',
    fields: [
      ...cameraBaseFields,
      { header: 'SIM Support', column: 'sim_support', required: true },
      { header: 'Battery', column: 'battery', defaultValue: '' },
      ...commonTailFields,
    ],
  },
  'solar-camera': {
    label: 'Solar Camera',
    table: 'solar_camera_products',
    fields: [
      ...cameraBaseFields,
      { header: 'Solar Panel', column: 'solar_panel', defaultValue: '' },
      { header: 'Battery', column: 'battery', defaultValue: '' },
      ...commonTailFields,
    ],
  },
  'body-worn-camera': {
    label: 'Body Worn Camera',
    table: 'body_worn_camera_products',
    fields: [
      ...cameraBaseFields,
      { header: 'Battery Life', column: 'battery_life', defaultValue: '' },
      { header: 'Storage', column: 'storage', defaultValue: '' },
      ...commonTailFields,
    ],
  },
  'hd-camera': {
    label: 'HD Camera',
    table: 'hd_camera_products',
    fields: [
      { header: 'Product Name', column: 'name', required: true },
      { header: 'Brand', column: 'brand', required: true },
      { header: 'Camera Type', column: 'camera_type', required: true },
      { header: 'Resolution', column: 'resolution', required: true },
      { header: 'Lens', column: 'lens', defaultValue: '' },
      ...commonTailFields,
    ],
  },
  'ip-camera': {
    label: 'IP Camera',
    table: 'ip_camera_products',
    fields: [
      { header: 'Product Name', column: 'name', required: true },
      { header: 'Brand', column: 'brand', required: true },
      { header: 'Camera Type', column: 'camera_type', required: true },
      { header: 'Resolution', column: 'resolution', required: true },
      { header: 'POE', column: 'poe', type: 'boolean', defaultValue: false },
      ...commonTailFields,
    ],
  },
};

export function getCategoryUploadConfig(category: string) {
  return CATEGORY_UPLOAD_CONFIGS[category];
}
