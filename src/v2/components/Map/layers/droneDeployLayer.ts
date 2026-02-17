import GroupLayer from '@arcgis/core/layers/GroupLayer';

export function createDroneDeployLayer(options: {
  id?: string;
  visible?: boolean;
} = {}): GroupLayer {
  return new GroupLayer({
    id: options.id ?? 'v2-dataset-193',
    title: 'DroneDeploy Orthomosaics',
    visibilityMode: 'independent',
    visible: options.visible ?? true,
  });
}
