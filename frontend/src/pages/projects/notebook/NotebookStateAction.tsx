import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { NotebookState } from './types';

type Props = {
  notebookState: NotebookState;
  onStart: () => void;
  onStop: () => void;
  isDisabled?: boolean;
};

const NotebookStateAction: React.FC<Props> = ({ notebookState, onStart, onStop, isDisabled }) => {
  const { isStarting, isRunning, isStopping } = notebookState;

  const actionDisabled = isDisabled || isStopping;

  return isStarting || isRunning ? (
    <Button
      data-testid="notebook-stop-action"
      variant="link"
      isInline
      isDisabled={actionDisabled}
      onClick={onStop}
    >
      Stop
    </Button>
  ) : (
    <Button
      data-testid="notebook-start-action"
      variant="link"
      isInline
      isDisabled={actionDisabled}
      onClick={onStart}
    >
      Start
    </Button>
  );
};

export default NotebookStateAction;
