import { K8sModelCommon } from '@openshift/dynamic-plugin-sdk-utils';

export const NotebookModel: K8sModelCommon = {
  apiVersion: 'v1',
  apiGroup: 'kubeflow.org',
  kind: 'Notebook',
  plural: 'notebooks',
};
