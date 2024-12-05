import * as React from 'react';
import { ActionsColumn, IAction, Td, Tr } from '@patternfly/react-table';
import { useNavigate } from 'react-router-dom';
import { PipelineRunKF, RuntimeStateKF } from '~/concepts/pipelines/kfTypes';
import { CheckboxTd } from '~/components/table';
import {
  RunCreated,
  RunDuration,
  RunStatus,
} from '~/concepts/pipelines/content/tables/renderUtils';
import { usePipelinesAPI } from '~/concepts/pipelines/context';
import PipelineRunTableRowTitle from '~/concepts/pipelines/content/tables/pipelineRun/PipelineRunTableRowTitle';
import useNotification from '~/utilities/useNotification';
import usePipelineRunVersionInfo from '~/concepts/pipelines/content/tables/usePipelineRunVersionInfo';
import { PipelineVersionLink } from '~/concepts/pipelines/content/PipelineVersionLink';
import { PipelineRunType } from '~/pages/pipelines/global/runs';
import { RestoreRunModal } from '~/pages/pipelines/global/runs/RestoreRunModal';
import { compareRunsRoute, duplicateRunRoute } from '~/routes';
import { ArchiveRunModal } from '~/pages/pipelines/global/runs/ArchiveRunModal';
import PipelineRunTableRowExperiment from '~/concepts/pipelines/content/tables/pipelineRun/PipelineRunTableRowExperiment';
import {
  ExperimentContext,
  useContextExperimentArchivedOrDeleted,
} from '~/pages/pipelines/global/experiments/ExperimentContext';
import { getDashboardMainContainer } from '~/utilities/utils';
import usePipelineRunExperimentInfo from '~/concepts/pipelines/content/tables/usePipelineRunExperimentInfo';

type PipelineRunTableRowProps = {
  checkboxProps: Omit<React.ComponentProps<typeof CheckboxTd>, 'id'>;
  onDelete?: () => void;
  run: PipelineRunKF;
  customCells?: React.ReactNode;
  hasRowActions?: boolean;
  runType?: PipelineRunType;
};

const PipelineRunTableRow: React.FC<PipelineRunTableRowProps> = ({
  hasRowActions = true,
  checkboxProps,
  customCells,
  onDelete,
  run,
  runType,
}) => {
  const { experiment: contextExperiment } = React.useContext(ExperimentContext);
  const { namespace, api, refreshAllAPI } = usePipelinesAPI();
  const notification = useNotification();
  const navigate = useNavigate();
  const { version, loaded: isVersionLoaded, error: versionError } = usePipelineRunVersionInfo(run);
  const {
    experiment,
    loaded: isExperimentLoaded,
    error: experimentError,
  } = usePipelineRunExperimentInfo(run);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = React.useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = React.useState(false);
  const { isExperimentArchived, isExperimentDeleted } =
    useContextExperimentArchivedOrDeleted(experiment);

  const actions: IAction[] = React.useMemo(() => {
    const duplicateAction: IAction = {
      title: 'Duplicate',
      onClick: () => {
        navigate(duplicateRunRoute(namespace, run.run_id, contextExperiment?.experiment_id));
      },
    };

    if (runType === PipelineRunType.ARCHIVED) {
      return [
        {
          title: 'Restore',
          onClick: () => setIsRestoreModalOpen(true),
          isAriaDisabled: isExperimentArchived || isExperimentDeleted,
          ...((isExperimentArchived || isExperimentDeleted) && {
            tooltipProps: {
              content: isExperimentArchived
                ? 'Archived runs cannot be restored until its associated experiment is restored.'
                : 'Archived runs cannot be restored because its associated experiment is deleted.',
            },
          }),
        },
        ...(!version ? [] : [duplicateAction]),
        {
          isSeparator: true,
        },
        {
          title: 'Delete',
          onClick: () => {
            onDelete?.();
          },
        },
      ];
    }

    return [
      {
        title: 'Stop',
        isDisabled: run.state !== RuntimeStateKF.RUNNING,
        onClick: () => {
          api
            .stopPipelineRun({}, run.run_id)
            .then(refreshAllAPI)
            .catch((e) => notification.error('Unable to stop the pipeline run.', e.message));
        },
      },
      {
        title: 'Compare runs',
        onClick: () => {
          navigate(compareRunsRoute(namespace, [run.run_id], contextExperiment?.experiment_id));
        },
      },
      ...(!version ? [] : [duplicateAction]),
      {
        isSeparator: true,
      },
      {
        title: 'Archive',
        onClick: () => setIsArchiveModalOpen(true),
      },
    ];
  }, [
    contextExperiment?.experiment_id,
    runType,
    run.state,
    run.run_id,
    version,
    navigate,
    namespace,
    isExperimentArchived,
    isExperimentDeleted,
    onDelete,
    api,
    refreshAllAPI,
    notification,
  ]);

  return (
    <Tr>
      <CheckboxTd id={run.run_id} {...checkboxProps} />
      <Td
        dataLabel="Name"
        {...(contextExperiment &&
          customCells && {
            isStickyColumn: true,
            hasRightBorder: true,
            stickyMinWidth: '200px',
            stickyLeftOffset: '45px',
          })}
      >
        <PipelineRunTableRowTitle run={run} />
      </Td>
      <Td modifier="truncate" dataLabel="Pipeline">
        <PipelineVersionLink version={version} error={versionError} loaded={isVersionLoaded} />
      </Td>
      {!contextExperiment && (
        <Td modifier="truncate" dataLabel="Experiment">
          <PipelineRunTableRowExperiment
            experiment={experiment}
            error={experimentError}
            loaded={isExperimentLoaded}
          />
        </Td>
      )}
      <Td dataLabel="Created">
        <RunCreated run={run} />
      </Td>
      <Td dataLabel="Duration">
        <RunDuration run={run} />
      </Td>
      <Td dataLabel="Status">
        <RunStatus run={run} />
      </Td>
      {customCells}
      {hasRowActions && (
        <Td isActionCell dataLabel="Kebab">
          <ActionsColumn
            data-testid="pipeline-run-table-row-actions"
            items={actions}
            popperProps={{ appendTo: getDashboardMainContainer, position: 'right' }}
          />
          {isRestoreModalOpen ? (
            <RestoreRunModal runs={[run]} onCancel={() => setIsRestoreModalOpen(false)} />
          ) : null}
          {isArchiveModalOpen ? (
            <ArchiveRunModal runs={[run]} onCancel={() => setIsArchiveModalOpen(false)} />
          ) : null}
        </Td>
      )}
    </Tr>
  );
};

export default PipelineRunTableRow;
